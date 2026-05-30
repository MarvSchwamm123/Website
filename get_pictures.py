import requests


url = input("Gib die URL des Bildes ein: ")
name = input("Gib den Namen für die Datei ein (inkl. Erweiterung, z.B. 'bild.png'): ")

response = requests.get(url)
with open(name, "wb") as f:
    f.write(response.content)

print("Fertig!")
