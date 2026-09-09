from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pymongo import MongoClient
from pwdlib import PasswordHash
from dotenv import load_dotenv

from datetime import datetime, timezone, timedelta
import hashlib
import secrets
import os


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


# =========================
# STATIC FILES
# =========================

app.mount(
    "/static",
    StaticFiles(directory=os.path.join(BASE_DIR, "static")),
    name="static"
)


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
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(days=30)
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