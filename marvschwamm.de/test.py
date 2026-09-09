import os
from urllib.parse import urlparse

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(override=True)

uri = os.getenv("MONGODB_URI")

if not uri:
    print("❌ MONGODB_URI wurde nicht gefunden")
    exit()

parsed = urlparse(uri)

print("Scheme:", parsed.scheme)
print("Username:", parsed.username)
print("Host:", parsed.hostname)
print("Passwort vorhanden:", bool(parsed.password))
print(parsed.password)

try:
    client = MongoClient(uri, serverSelectionTimeoutMS=10000)

    client.admin.command("ping")

    print("✅ MongoDB Login funktioniert!")

except Exception as e:
    print("❌ Fehler:")
    print(e)