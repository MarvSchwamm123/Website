from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def home():
    return FileResponse(os.path.join(BASE_DIR, "templates", "index.html"))


@app.get("/api/images")
def get_images():
    files = os.listdir("static/images")

    return [
        f"/static/images/{img}"
        for img in files
        if img.endswith((".png", ".jpg", ".jpeg", ".webp", ".JPG"))
    ]