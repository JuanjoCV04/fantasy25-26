import requests
import json

# Reemplaza esta URL por la API exacta que encuentres en la pestaña Network
api_url = "https://region1.analytics.google.com/g/collect?v=2&tid=G-NM22MFFYVP&gtm=45je6941v886710648za200zd886710648&_p=1788981685818&gcs=G111&gcd=13n3n3n2n5l1&npa=0&dma_cps=a&dma=1&tcfd=1075b&gdid=dMTc4Zm&_eu=AAAAAGQC&are=1&cid=1411221819.1788025092&frm=0&pscdl=noapi&rcb=19&sr=774x836&uaa=&uab=64&uafvl=Not%253DA%253FBrand%3B99.0.0.0%7COpera%2520GX%3B135.0.5973.94%7CChromium%3B151.0.7922.170&uam=Pixel%209&uamb=1&uap=Android&uapv=15&uaw=0&ul=es-ES&gaf=2&tag_exp=115616985~115938465~115938469~118897920~118897930~120213116~120385423~120469145~120469153&dl=https%3A%2F%2Fbiwenger.as.com%2Fla-liga%2Frounds%2F2026-2027%2Fjornada-3%2F4901&dt=Jornada%203&sid=1788979584&sct=14&seg=1&uid=4598291&_s=1&tfd=6236"

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