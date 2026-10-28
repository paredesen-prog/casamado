"""
Genera un banner de "Producto de la Semana" para Instagram (1080x1350)
a partir de la plantilla plantilla_ig_template.html, usando datos reales
de un producto via API de WooCommerce.

Sistema definido por el equipo (diseño + redactor + redes-sociales):
- Formato 1080x1350 (vertical, prioridad de feed segun redes-sociales)
- 5 franjas fijas: top bar (logo+categoria), foto producto, nombre+copy,
  precio (siempre visible), CTA
- Maximo 3 bloques de texto: nombre, copy corto (<6 palabras), precio

Uso:
  python3 generar_banner_ig.py <product_id> "<copy corto>" "<CTA>" [salida.png]
"""
import os
import sys
import base64
import requests
from playwright.sync_api import sync_playwright

WC_USER = os.environ.get("WC_USER", "paredesen")
WC_PASS = os.environ.get("WC_PASS", "t99J MTPa Doa8 u2S8 Bwgc Fep2")
BASE_WC = "https://casamado.cl/wp-json/wc/v3"
AUTH = (WC_USER, WC_PASS)

PLANTILLA = os.path.join(os.path.dirname(__file__), "..", "scratchpad_no_usar")
TEMPLATE_PATH = "/tmp/claude-0/-home-user-casamado/a82680ba-8e56-5b1a-bff5-277dbb91fc98/scratchpad/plantilla_ig_template.html"


def formatear_precio(precio_str):
    valor = int(float(precio_str))
    return f"${valor:,}".replace(",", ".")


def main():
    if len(sys.argv) < 4:
        print("Uso: python3 generar_banner_ig.py <product_id> \"<copy corto>\" \"<CTA>\" [salida.png]")
        sys.exit(1)

    product_id = sys.argv[1]
    copy_corto = sys.argv[2]
    cta = sys.argv[3]
    salida = sys.argv[4] if len(sys.argv) > 4 else f"banner_ig_{product_id}.png"

    r = requests.get(f"{BASE_WC}/products/{product_id}", auth=AUTH)
    p = r.json()

    nombre = p["name"]
    precio = formatear_precio(p["price"])
    categoria = p["categories"][0]["name"].upper() if p.get("categories") else "PRODUCTO"
    foto_url = p["images"][0]["src"] if p.get("images") else ""
    foto = ""
    if foto_url:
        img_resp = requests.get(foto_url)
        b64 = base64.b64encode(img_resp.content).decode()
        ext = foto_url.rsplit(".", 1)[-1].lower()
        mime = "jpeg" if ext in ("jpg", "jpeg") else ext
        foto = f"data:image/{mime};base64,{b64}"

    with open(TEMPLATE_PATH, encoding="utf-8") as f:
        html = f.read()

    html = html.replace("__NOMBRE__", nombre)
    html = html.replace("__PRECIO__", precio)
    html = html.replace("__CATEGORIA__", categoria)
    html = html.replace("__FOTO__", foto)
    html = html.replace("__COPY__", copy_corto)
    html = html.replace("__CTA__", cta)

    tmp_html = "/tmp/claude-0/-home-user-casamado/a82680ba-8e56-5b1a-bff5-277dbb91fc98/scratchpad/_render_tmp.html"
    with open(tmp_html, "w", encoding="utf-8") as f:
        f.write(html)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        page = browser.new_page(viewport={"width": 1080, "height": 1350})
        page.goto(f"file://{tmp_html}")
        page.wait_for_timeout(500)
        page.screenshot(path=salida)
        browser.close()

    print(f"Generado: {salida}")


if __name__ == "__main__":
    main()
