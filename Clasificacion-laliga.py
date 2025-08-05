import requests
from bs4 import BeautifulSoup
import json

url = "https://www.espn.com.co/futbol/posiciones/_/liga/esp.1"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"
}

# 1. Hacer la petición
response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, "html.parser")

# ---------- PARTE 1: POSICIONES, CÓDIGO Y CLUB ----------
tabla_principal = soup.find_all("table")[0]

equipos = []
for fila in tabla_principal.find_all("tr"):
    columnas = [col.get_text(strip=True) for col in fila.find_all(["td", "th"])]
    if not columnas:
        continue
    if len(columnas) == 1 and "/" in columnas[0]:  # fila con temporada
        continue

    # Separar posición, código y nombre del club
    valor = columnas[0]
    i = 0
    while i < len(valor) and valor[i].isdigit():
        i += 1
    posicion = valor[:i]
    codigo = valor[i:i+3]
    club = valor[i+3:]

    equipos.append({
        "posicion": posicion,
        "codigo": codigo,
        "club": club
    })

# ---------- PARTE 2: ESTADÍSTICAS ----------
stats_keys = ["J", "G", "E", "P", "GF", "GC", "DIF", "PTS"]
base_selector = (
    "#fittPageContainer > div.pageContent > div.page-container.cf > div > div > "
    "section > div > section > section > div.standings__table.InnerLayout__child--dividers "
    "> div > div.flex > div > div.Table__Scroller > table > tbody > "
    "tr:nth-child({x}) > td:nth-child({y}) > span"
)

estadisticas = []
for x in range(1, 21):  # 20 equipos
    fila_stats = {}
    for y in range(1, 9):  # 8 estadísticas
        selector = base_selector.format(x=x, y=y)
        span = soup.select_one(selector)
        valor = span.get_text(strip=True) if span else "0"
        fila_stats[stats_keys[y-1]] = valor
    estadisticas.append(fila_stats)

# ---------- PARTE 3: COMBINAR ----------
tabla_final = []
for i, equipo in enumerate(equipos):
    equipo["estadisticas"] = estadisticas[i]
    tabla_final.append(equipo)

# ---------- PARTE 4: GUARDAR EN JSON ----------
with open("clasificacion_laliga.json", "w", encoding="utf-8") as f:
    json.dump(tabla_final, f, ensure_ascii=False, indent=2)

print("✅ Datos combinados guardados en clasificacion_laliga.json")
