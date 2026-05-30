from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Static Dateien (CSS, Bilder, Languages)
app.mount("/static", StaticFiles(directory="static"), name="static")


# 🌍 GUI STARTSEITE
@app.get("/")
def home():
    return FileResponse("/static/templates/index.html")


# 🖼 Bilder API
@app.get("/api/images")
def get_images():

    files = os.listdir("static/images")

    return [
        f"/static/images/{img}"
        for img in files
        if img.endswith((".png", ".jpg", ".jpeg", ".webp"))
    ]