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
print("--- Guardando el HTML completo en fasit_debug.html para revisarlo ---")
with open("fasit_debug.html", "w", encoding="utf-8") as f:
    f.write(r.text)
print("Listo. Revisa si 'fasit_debug.html' contiene el nombre del producto buscando manualmente (Ctrl+F) el texto del producto.")
