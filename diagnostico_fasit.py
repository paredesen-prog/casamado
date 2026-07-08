"""
Diagnóstico: descarga la página de resultados de búsqueda de Fasit para un
SKU y muestra si el HTML estático (sin ejecutar JavaScript) trae o no el
producto, para saber por qué corregir_imagenes_fasit.py no lo encuentra.

Uso:
  python diagnostico_fasit.py 4001184
"""
import sys
import requests
from bs4 import BeautifulSoup

sku = sys.argv[1] if len(sys.argv) > 1 else "4001184"

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
})

url = f"https://fasit.cl/catalogsearch/result/?q={sku}"
r = session.get(url, timeout=20)
print("URL:", url)
print("Status:", r.status_code)
print("Largo del HTML:", len(r.text))
print()

soup = BeautifulSoup(r.text, "html.parser")

selectores = [
    "a.product-item-link",
    ".product-item-photo a",
    ".product-item-info a",
    ".product-item",
    "li.product-item",
    ".products-grid",
    ".search.results",
]
for sel in selectores:
    encontrados = soup.select(sel)
    print(f"{sel!r}: {len(encontrados)} elementos")

print()
print("--- Siguiendo los links de producto encontrados ---")
links = soup.select("a.product-item-link, .product-item-photo a, .product-item-info a")
urls_vistas = []
for a in links:
    href = a.get("href")
    if href and href not in urls_vistas:
        urls_vistas.append(href)

print(f"URLs de producto encontradas: {len(urls_vistas)}")
for url_prod in urls_vistas[:5]:
    print(f"\n--- {url_prod} ---")
    pr = session.get(url_prod, timeout=20)
    psoup = BeautifulSoup(pr.text, "html.parser")

    sku_el = psoup.select_one(".product-info-stock-sku .value, [itemprop='sku'], .sku .value")
    page_sku = sku_el.get_text(strip=True) if sku_el else "(no encontrado con esos selectores)"
    print("SKU detectado en la página:", repr(page_sku))

    meta_sku = psoup.find("meta", {"property": "product:retailer_item_id"})
    print("meta product:retailer_item_id:", meta_sku.get("content") if meta_sku else "(no existe)")

    og = psoup.find("meta", {"property": "og:image"})
    print("og:image:", og.get("content") if og else "(no existe)")

print()
print("--- Guardando el HTML de la búsqueda en fasit_debug.html para revisarlo ---")
with open("fasit_debug.html", "w", encoding="utf-8") as f:
    f.write(r.text)
print("Listo. Revisa si 'fasit_debug.html' contiene el nombre del producto buscando manualmente (Ctrl+F) el texto del producto.")
