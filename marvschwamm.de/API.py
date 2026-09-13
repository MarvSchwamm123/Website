from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pymongo import MongoClient
from pwdlib import PasswordHash
from dotenv import load_dotenv

from bson import ObjectId
from datetime import datetime, timedelta
import hashlib
import secrets
import os
from typing import Optional


# =========================
# ENV
# =========================

load_dotenv(override=True)


# =========================
# FASTAPI
# =========================

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# =========================
# MONGODB
# =========================

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI fehlt in der .env")

client = MongoClient(MONGODB_URI)

db = client["marvschwamm"]

users_collection = db["User"]
sessions_collection = db["Sessions"]
foods_collection = db["Food"]
ingredients_collection = db["Ingredients"]
ingredient_requests_collection = db["IngredientRequests"]


# =========================
# PASSWORD HASHING
# =========================

password_hash = PasswordHash.recommended()


# =========================
# REQUEST MODELS
# =========================

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class IngredientCreate(BaseModel): 
    name: str
    category: str
    icon: str = "🥕"
    aliases: list[str] = []


class IngredientRequestCreate(BaseModel): 
    name: str 
    category: Optional[str] = None 
    icon: Optional[str] = None


class FoodCreate(BaseModel): 
    ingredient_id: str 
    amount: float 
    unit: str 
    expiry_date: str 
    price: Optional[float] = None 
    purchase_date: Optional[str] = None 
    source: str = "manual"


class ShoppingItemCreate(BaseModel): 
    ingredient_id: str 
    amount: float 
    unit: str


class RecipeIngredient(BaseModel): 
    ingredient_id: str 
    amount: float 
    unit: str


class RecipeCreate(BaseModel): 
    name: str 
    description: str 
    ingredients: list[RecipeIngredient] 
    steps: list[str] 
    servings: int 
    embedding: Optional[list[float]] = None


# =========================
# STATIC FILES
# =========================

app.mount(
    "/static",
    StaticFiles(directory=os.path.join(BASE_DIR, "static")),
    name="static"
)

def require_current_user(request: Request):
    session_token = request.cookies.get("session")

    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Nicht eingeloggt"
        )

    token_hash = hash_session_token(session_token)

    session = sessions_collection.find_one({
        "token_hash": token_hash
    })

    if not session:
        raise HTTPException(
            status_code=401,
            detail="Ungültige Session"
        )

    if session["expires_at"] < datetime.utcnow():
        sessions_collection.delete_one({
            "_id": session["_id"]
        })

        raise HTTPException(
            status_code=401,
            detail="Session abgelaufen"
        )

    user = users_collection.find_one({
        "_id": session["user_id"]
    })

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Benutzer nicht gefunden"
        )

    return user

# =========================
# PAGES
# =========================

@app.get("/")
def home():
    return FileResponse(
        os.path.join(BASE_DIR, "templates", "index.html")
    )


@app.get("/aboutme")
def aboutme():
    return FileResponse(
        os.path.join(BASE_DIR, "templates", "aboutme.html")
    )


@app.get("/api/images")
def get_images():
    files = os.listdir(
        os.path.join(BASE_DIR, "static", "images")
    )

    return [
        f"/static/images/{img}"
        for img in files
        if img.endswith(
            (".png", ".jpg", ".jpeg", ".webp", ".JPG")
        )
    ]


# =========================
# REGISTER
# =========================

@app.post("/api/register")
def register(data: RegisterRequest):

    # Username bereits vorhanden?
    if users_collection.find_one(
        {"username": data.username}
    ):
        raise HTTPException(
            status_code=400,
            detail="Username bereits vergeben"
        )

    # E-Mail bereits vorhanden?
    if users_collection.find_one(
        {"email": data.email}
    ):
        raise HTTPException(
            status_code=400,
            detail="E-Mail bereits registriert"
        )

    # Passwort hashen
    hashed_password = password_hash.hash(
        data.password
    )

    # Neuer Benutzer
    user = {
        "username": data.username,
        "email": data.email,
        "password_hash": hashed_password,

        # Berechtigungsstufe
        "rank": "user",

        # Freigeschaltete Features
        "allowed_features": []
    }

    users_collection.insert_one(user)

    return {
        "success": True,
        "message": "Account erfolgreich erstellt"
    }


# =========================
# SESSION HELPER
# =========================

def hash_session_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


# =========================
# LOGIN
# =========================
@app.post("/api/login")
def login(data: LoginRequest):
    print("LOGIN START")

    user = users_collection.find_one({"email": data.email})

    print("USER:", user is not None)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="E-Mail oder Passwort falsch"
        )

    password_ok = password_hash.verify(
        data.password,
        user["password_hash"]
    )

    print("PASSWORD:", password_ok)

    if not password_ok:
        raise HTTPException(
            status_code=401,
            detail="E-Mail oder Passwort falsch"
        )

    print("LOGIN OK - ERSTELLE SESSION")

    session_token = secrets.token_urlsafe(32)

    token_hash = hashlib.sha256(
        session_token.encode("utf-8")
    ).hexdigest()

    sessions_collection.insert_one({
        "user_id": user["_id"],
        "token_hash": token_hash,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=30)
    })

    print("SESSION GESPEICHERT")

    response = JSONResponse({
        "success": True,
        "username": user["username"],
        "rank": user["rank"]
    })

    response.set_cookie(
        key="session",
        value=session_token,
        max_age=60 * 60 * 24 * 30,
        httponly=True,
        samesite="lax",
        secure=False
    )

    print("COOKIE GESETZT")

    return response

# =========================
# CURRENT USER
# =========================

@app.get("/api/me")
def get_current_user(
    request: Request
):

    session_token = request.cookies.get(
        "session"
    )

    if not session_token:
        return {
            "logged_in": False
        }

    token_hash = hash_session_token(
        session_token
    )

    session = sessions_collection.find_one({
        "token_hash": token_hash
    })

    if not session:
        return {
            "logged_in": False
        }

    # Session abgelaufen?
    if session["expires_at"] < datetime.utcnow():

        sessions_collection.delete_one({
            "_id": session["_id"]
        })

        return {
            "logged_in": False
        }

    # Benutzer holen
    user = users_collection.find_one({
        "_id": session["user_id"]
    })

    if not user:
        return {
            "logged_in": False
        }

    return {
        "logged_in": True,
        "username": user["username"],
        "email": user["email"],
        "rank": user.get("rank", "user"),
        "allowed_features": user.get(
            "allowed_features",
            []
        )
    }


# =========================
# LOGOUT
# =========================

@app.post("/api/logout")
def logout(
    request: Request,
    response: Response
):

    session_token = request.cookies.get(
        "session"
    )

    if session_token:

        token_hash = hash_session_token(
            session_token
        )

        sessions_collection.delete_one({
            "token_hash": token_hash
        })

    # Cookie löschen
    response.delete_cookie(
        "session"
    )

    return {
        "success": True
    }


@app.get("/api/foods")
def get_foods(request: Request):

    user = require_current_user(request)

    foods = list(
        foods_collection.find({
            "user_id": user["_id"]
        })
    )

    for food in foods:

        ingredient = ingredients_collection.find_one({
            "_id": food["ingredient_id"]
        })

        food["_id"] = str(food["_id"])
        food["user_id"] = str(food["user_id"])
        food["ingredient_id"] = str(food["ingredient_id"])

        if ingredient:
            food["name"] = ingredient["name"]
            food["category"] = ingredient["category"]
            food["icon"] = ingredient["icon"]
        else:
            food["name"] = "Unbekannte Zutat"
            food["category"] = None
            food["icon"] = "🥕"

    return foods


@app.post("/api/foods")
def add_food(
    data: FoodCreate,
    request: Request
):

    user = require_current_user(request)

    try:
        ingredient_id = ObjectId(data.ingredient_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Ungültige Zutaten-ID"
        )

    ingredient = ingredients_collection.find_one({
        "_id": ingredient_id
    })

    if not ingredient:
        raise HTTPException(
            status_code=404,
            detail="Zutat nicht gefunden"
        )

    food = {
        "user_id": user["_id"],
        "ingredient_id": ingredient["_id"],
        "amount": data.amount,
        "unit": data.unit,
        "expiry_date": data.expiry_date,
        "price": data.price,
        "purchase_date": data.purchase_date,
        "source": data.source,
        "created_at": datetime.utcnow()
    }

    result = foods_collection.insert_one(food)

    return {
        "success": True,
        "food_id": str(result.inserted_id)
    }


@app.delete("/api/foods/{food_id}")
def delete_food(
    food_id: str,
    request: Request
):

    user = require_current_user(request)

    try:
        object_id = ObjectId(food_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Ungültige Lebensmittel-ID"
        )

    result = foods_collection.delete_one({
        "_id": object_id,
        "user_id": user["_id"]
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Lebensmittel nicht gefunden"
        )

    return {
        "success": True
    }


@app.get("/api/ingredients")
def get_ingredients():

    ingredients = list(
        ingredients_collection.find({})
    )

    for ingredient in ingredients:
        ingredient["_id"] = str(ingredient["_id"])

    return ingredients


@app.post("/api/admin/ingredients")
def create_ingredient(
    data: IngredientCreate,
    request: Request
):

    user = require_current_user(request)

    if user.get("rank") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Keine Berechtigung"
        )

    existing = ingredients_collection.find_one({
        "name": data.name
    })

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Diese Zutat existiert bereits"
        )

    ingredient = {
        "name": data.name,
        "category": data.category,
        "icon": data.icon,
        "aliases": data.aliases
    }

    result = ingredients_collection.insert_one(
        ingredient
    )

    return {
        "success": True,
        "ingredient_id": str(result.inserted_id)
    }


@app.post("/api/ingredient-requests")
def create_ingredient_request(
    data: IngredientRequestCreate,
    request: Request
):

    user = require_current_user(request)

    existing = ingredients_collection.find_one({
        "name": data.name
    })

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Diese Zutat existiert bereits"
        )

    ingredient_request = {
        "name": data.name,
        "category": data.category,
        "icon": data.icon,
        "suggested_by": user["_id"],
        "status": "pending",
        "created_at": datetime.utcnow(),
        "reviewed_by": None,
        "reviewed_at": None
    }

    result = ingredient_requests_collection.insert_one(
        ingredient_request
    )

    return {
        "success": True,
        "request_id": str(result.inserted_id)
    }


@app.get("/api/admin/ingredient-requests")
def get_ingredient_requests(
    request: Request
):

    user = require_current_user(request)

    if user.get("rank") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Keine Berechtigung"
        )

    requests = list(
        ingredient_requests_collection.find({
            "status": "pending"
        })
    )

    for ingredient_request in requests:
        ingredient_request["_id"] = str(
            ingredient_request["_id"]
        )
        ingredient_request["suggested_by"] = str(
            ingredient_request["suggested_by"]
        )

    return requests


# =========================
# OLD ENDPOINT
# =========================

@app.get("/gettext")
def returnText():
    pass

@app.get("/FridgeWise")
def fridgewise():
    return FileResponse(
        os.path.join(BASE_DIR, "templates", "FridgeWise.html")
    )


