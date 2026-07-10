"""
Re-sincroniza el alt text de las imagenes de producto para que coincida con
el nombre YA corregido (a diferencia de fix_alt_text_imagenes.py, este
sobreescribe el alt aunque ya tenga un valor, porque la primera pasada se
hizo con los titulos viejos en mayusculas).
"""
import os
import time
import json
import requests

WC_USER = os.environ.get("WC_USER", "paredesen")
WC_PASS = os.environ.get("WC_PASS", "t99J MTPa Doa8 u2S8 Bwgc Fep2")
BASE_WC = "https://casamado.cl/wp-json/wc/v3"
BASE_WP = "https://casamado.cl/wp-json/wp/v2"
AUTH = (WC_USER, WC_PASS)


def request_con_reintento(metodo, url, intentos=3, **kwargs):
    for i in range(intentos):
        try:
            return requests.request(metodo, url, auth=AUTH, timeout=30, **kwargs)
        except requests.exceptions.RequestException:
            if i == intentos - 1:
                raise
            time.sleep(2 * (i + 1))


def main():
    pagina = 1
    actualizados = 0
    while True:
        r = request_con_reintento(
            "GET", f"{BASE_WC}/products",
            params={"per_page": 100, "page": pagina, "status": "publish"},
        )
        productos = r.json()
        if not productos:
            break
        for p in productos:
            nombre_actual = p["name"]
            for img in p.get("images", []):
                if img.get("alt") == nombre_actual:
                    continue
                resp = request_con_reintento(
                    "POST", f"{BASE_WP}/media/{img['id']}",
                    json={"alt_text": nombre_actual},
                )
                if resp.status_code == 200:
                    actualizados += 1
                    print(f"OK producto {p['id']:>6} media {img['id']:>6} alt='{nombre_actual}'")
        pagina += 1
    print(f"\nListo. Alt text re-sincronizado en {actualizados} imagenes.")


if __name__ == "__main__":
    main()
