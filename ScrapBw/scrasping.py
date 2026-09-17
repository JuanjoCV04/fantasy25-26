import requests
import json

# Reemplaza esta URL por la API exacta que encuentres en la pestaña Network
api_url = "https://cf.biwenger.com/api/v2/rounds/la-liga/4903?score=1&lang=es&v=631"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

response = requests.get(api_url, headers=headers)

if response.status_code == 200:
    data = response.json()  # Convierte la respuesta directamente a un diccionario de Python

    # Guardar en archivo JSON
    with open("biwenger_jornada.json", "w", encoding="utf-8") as f:
        json.dump(
            data, f, ensure_ascii=False, indent=4
        )  # indent=4 le da formato legible

    print("¡Archivo JSON guardado con éxito!")
else:
    print(f"Error {response.status_code}: No se pudo obtener la información")