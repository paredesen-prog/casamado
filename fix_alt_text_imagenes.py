"""
Rellena el alt text de imagenes de producto que esten vacias.
Usa el nombre del producto (limpio) como alt, para SEO/accesibilidad
en las grillas de categoria (donde WooCommerce no usa fallback automatico).
"""
import os
import re
import time
import json
import requests

WC_USER = os.environ.get("WC_USER", "paredesen")
WC_PASS = os.environ.get("WC_PASS", "t99J MTPa Doa8 u2S8 Bwgc Fep2")
BASE_WC = "https://casamado.cl/wp-json/wc/v3"
BASE_WP = "https://casamado.cl/wp-json/wp/v2"
AUTH = (WC_USER, WC_PASS)


def limpiar_nombre_para_alt(nombre):
    n = nombre.strip()
    n = re.sub(r"\s+", " ", n)
    return n


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
    actualizados = []
    ya_ok = 0
    sin_imagen = 0
    while True:
        r = request_con_reintento(
            "GET",
            f"{BASE_WC}/products",
            params={"per_page": 100, "page": pagina, "status": "publish"},
        )
        productos = r.json()
        if not productos:
            break
        for p in productos:
            imagenes = p.get("images", [])
            if not imagenes:
                sin_imagen += 1
                continue
            for img in imagenes:
                if img.get("alt"):
                    ya_ok += 1
                    continue
                alt_nuevo = limpiar_nombre_para_alt(p["name"])
                media_id = img["id"]
                resp = request_con_reintento(
                    "POST",
                    f"{BASE_WP}/media/{media_id}",
                    json={"alt_text": alt_nuevo},
                )
                if resp.status_code == 200:
                    actualizados.append({"producto_id": p["id"], "media_id": media_id, "alt": alt_nuevo})
                    print(f"OK  producto {p['id']:>6} media {media_id:>6}  alt='{alt_nuevo}'")
                else:
                    print(f"ERR producto {p['id']:>6} media {media_id:>6}  status={resp.status_code}")
        print(f"--- pagina {pagina} procesada ({len(productos)} productos) ---")
        pagina += 1

    with open("alt_text_actualizados.json", "w", encoding="utf-8") as f:
        json.dump(actualizados, f, ensure_ascii=False, indent=2)

    print(f"\nListo. Alt text agregado a {len(actualizados)} imagenes.")
    print(f"Ya tenian alt: {ya_ok}. Productos sin imagen (omitidos): {sin_imagen}.")


if __name__ == "__main__":
    main()
