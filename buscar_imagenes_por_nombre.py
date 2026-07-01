import requests
from bs4 import BeautifulSoup
import time
import re

WC_USER = "paredesen"
WC_PASS = "t99J MTPa Doa8 u2S8 Bwgc Fep2"
WC_BASE = "https://casamado.cl/wp-json"

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"}
session = requests.Session()
session.headers.update(HEADERS)

def get_all_products_sin_imagen():
    products = []
    page = 1
    while True:
        r = requests.get(f"{WC_BASE}/wc/v3/products",
                         auth=(WC_USER, WC_PASS),
                         params={"per_page": 100, "page": page, "status": "publish"})
        batch = r.json()
        if not batch or not isinstance(batch, list): break
        for p in batch:
            if not p.get("images"):
                products.append({"id": p["id"], "name": p["name"], "sku": p.get("sku","")})
        if len(batch) < 100: break
        page += 1
    return products

def buscar_imagen_fasit(nombre, sku=""):
    # Try by SKU first
    if sku:
        url = f"https://fasit.cl/catalogsearch/result/?q={sku}"
        try:
            r = session.get(url, timeout=15)
            soup = BeautifulSoup(r.text, "html.parser")
            img = soup.select_one(".product-image-photo")
            if img:
                src = img.get("src") or img.get("data-src","")
                if src and "placeholder" not in src and "spacer" not in src and src.startswith("http"):
                    return src
        except: pass

    # Try by name (first 4 words)
    palabras = nombre.split()[:4]
    query = " ".join(palabras)
    url = f"https://fasit.cl/catalogsearch/result/?q={requests.utils.quote(query)}"
    try:
        r = session.get(url, timeout=15)
        soup = BeautifulSoup(r.text, "html.parser")
        imgs = soup.select(".product-image-photo")
        for img in imgs:
            src = img.get("src") or img.get("data-src","")
            if src and "placeholder" not in src and "spacer" not in src and src.startswith("http"):
                return src
    except: pass
    return None

def upload_image(img_url, filename):
    try:
        img_data = session.get(img_url, timeout=20).content
        ext = img_url.split("?")[0].split(".")[-1].lower()
        if ext not in ["jpg","jpeg","png","webp"]: ext = "jpg"
        fname = re.sub(r'[^a-z0-9]', '-', filename.lower())[:50] + f".{ext}"
        ctype = {"jpg":"image/jpeg","jpeg":"image/jpeg","png":"image/png","webp":"image/webp"}.get(ext,"image/jpeg")
        r = requests.post(f"{WC_BASE}/wp/v2/media",
                          auth=(WC_USER, WC_PASS),
                          headers={"Content-Disposition": f'attachment; filename="{fname}"', "Content-Type": ctype},
                          data=img_data, timeout=30)
        if r.status_code in (200, 201):
            return r.json()["id"]
    except: pass
    return None

def set_image(product_id, media_id):
    r = requests.put(f"{WC_BASE}/wc/v3/products/{product_id}",
                     auth=(WC_USER, WC_PASS),
                     json={"images": [{"id": media_id}]}, timeout=30)
    return r.status_code == 200

print("=== Buscando imágenes para productos sin imagen ===\n")
productos = get_all_products_sin_imagen()
print(f"Productos sin imagen: {len(productos)}\n")

ok = no_img = 0
for i, p in enumerate(productos):
    nombre = p["name"]
    sku    = p["sku"]
    pid    = p["id"]
    print(f"[{i+1}/{len(productos)}] {nombre[:55]}")

    img_url = buscar_imagen_fasit(nombre, sku)
    if not img_url:
        print(f"  -> Sin imagen en Fasit")
        no_img += 1
        time.sleep(0.5)
        continue

    media_id = upload_image(img_url, nombre)
    if not media_id:
        print(f"  -> Error subiendo imagen")
        no_img += 1
        continue

    if set_image(pid, media_id):
        print(f"  -> OK")
        ok += 1
    else:
        print(f"  -> Error asignando")
        no_img += 1

    time.sleep(1)

print(f"\n=== RESUMEN ===")
print(f"Imágenes asignadas: {ok}")
print(f"Sin imagen: {no_img}")
input("Presiona Enter para cerrar...")
