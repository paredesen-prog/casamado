import requests
from bs4 import BeautifulSoup
import time
import json
import re
import os

WC_USER = "paredesen"
WC_PASS = "t99J MTPa Doa8 u2S8 Bwgc Fep2"
WC_BASE = "https://casamado.cl/wp-json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
}

session = requests.Session()
session.headers.update(HEADERS)

PRODUCTOS_URL = "https://raw.githubusercontent.com/paredesen-prog/casamado/claude/proyecto-i1a2xw/fasit_nuevos.json"

try:
    r = session.get(PRODUCTOS_URL, timeout=10)
    productos = r.json()
    print(f"Productos cargados desde GitHub: {len(productos)}")
except:
    print("No se pudo cargar desde GitHub, usando lista local...")
    productos = []

if not productos:
    print("ERROR: No se pudieron cargar los productos.")
    input("Presiona Enter para salir...")
    exit()

def get_fasit_data(url):
    try:
        r = session.get(url, timeout=15)
        soup = BeautifulSoup(r.text, "html.parser")
        sku = ""
        sku_el = soup.select_one(".product-info-stock-sku .value, [itemprop='sku'], .sku .value")
        if sku_el:
            sku = sku_el.get_text(strip=True)
        if not sku:
            for el in soup.select("[data-product-sku], [data-sku]"):
                sku = el.get("data-product-sku") or el.get("data-sku") or ""
                if sku: break
        if not sku:
            meta = soup.find("meta", {"property": "product:retailer_item_id"})
            if meta: sku = meta.get("content", "")
        img_url = ""
        img_el = soup.select_one(".fotorama__img, .gallery-placeholder img, img.gallery-image, [data-main-image]")
        if img_el:
            img_url = img_el.get("src") or img_el.get("data-src") or ""
        if not img_url:
            og = soup.find("meta", {"property": "og:image"})
            if og: img_url = og.get("content", "")
        return sku.strip(), img_url.strip()
    except:
        return "", ""

def upload_image(img_url, filename):
    try:
        img_data = session.get(img_url, timeout=20).content
        ext = img_url.split("?")[0].split(".")[-1].lower()
        if ext not in ["jpg","jpeg","png","webp"]: ext = "jpg"
        fname = re.sub(r'[^a-z0-9]', '-', filename.lower())[:50] + f".{ext}"
        ctype = {"jpg":"image/jpeg","jpeg":"image/jpeg","png":"image/png","webp":"image/webp"}.get(ext,"image/jpeg")
        r = requests.post(
            f"{WC_BASE}/wp/v2/media",
            auth=(WC_USER, WC_PASS),
            headers={"Content-Disposition": f'attachment; filename="{fname}"', "Content-Type": ctype},
            data=img_data, timeout=30
        )
        if r.status_code in (200, 201):
            return r.json()["id"]
    except:
        pass
    return None

def classify_category(name):
    n = name.upper()
    if any(x in n for x in ["JABON","JABÓN"]): return 364
    if "ALCOHOL GEL" in n: return 367
    if "CLORO" in n: return 351
    if "DESODORANTE AMBIENTAL" in n or "AROMATIZANTE" in n: return 356
    if "DISPENSADOR" in n: return 306
    if "BOLSAS DE BASURA" in n: return 336
    if "LAVALOZA" in n: return 348
    if "LIMPIADOR" in n: return 346
    if "DESENGRASANTE" in n: return 349
    if "CERA " in n: return 352
    if "MOPA" in n or "TRAPERO" in n or "PAÑO" in n or "PANO" in n: return 341
    if "ESCOBILLON" in n or "ESCOBILLÓN" in n or "ESCOBA" in n: return 339
    if "ESPONJA" in n or "FIBRA" in n: return 342
    if "GUANTE" in n: return 343
    if "CONTENEDOR DE BASURA" in n or "BASURERO" in n: return 337
    if "PAPEL HIGIENICO" in n or "PAPEL HIGIÉNICO" in n: return 304
    if "TOALLA DE PAPEL" in n: return 308
    if "SERVILLETA" in n: return 313
    if "CAFE " in n or "CAFÉ " in n or "CAPSULAS" in n: return 446
    if "TE " in n or "TÉ " in n: return 448
    if "AZUCAR" in n or "AZÚCAR" in n or "ENDULZANTE" in n: return 449
    if "GALLETA" in n: return 451
    if "LECHE" in n: return 450
    if "ACEITE" in n: return 460
    if "AGUA MINERAL" in n: return 452
    if "BEBIDA" in n: return 452
    if "VASO DESECHABLE" in n or "PLATO" in n: return 463
    if "HERVIDOR" in n: return 468
    if "PAPEL FOTOCOPIA" in n: return 379
    if "ARCHIVADOR" in n: return 389
    if "CARPETA" in n: return 390
    if "MARCADOR" in n: return 384
    if "LAPIZ" in n or "LÁPIZ" in n: return 383
    if "DESTACADOR" in n: return 384
    if "CINTA " in n: return 391
    if "MOUSE" in n: return 420
    if "TECLADO" in n: return 421
    if "PENDRIVE" in n: return 428
    if "TONER" in n or "TÓNER" in n or "TINTA" in n: return 430
    if "PILAS" in n or "PILA " in n: return 406
    if "SILLA" in n: return 442
    return 328

def create_product(nombre, precio, sku, media_id, cat_id):
    data = {
        "name": nombre,
        "sku": sku,
        "regular_price": str(precio),
        "status": "publish",
        "catalog_visibility": "visible",
        "categories": [{"id": cat_id}],
    }
    if media_id:
        data["images"] = [{"id": media_id}]
    try:
        r = requests.post(f"{WC_BASE}/wc/v3/products",
                          auth=(WC_USER, WC_PASS), json=data, timeout=30)
        if r.status_code == 201:
            return r.json()["id"]
        # SKU duplicado - producto ya existe, lo tomamos como OK
        if r.status_code == 400:
            resp = r.json()
            if resp.get("code") == "product_invalid_sku":
                existing_id = resp.get("data", {}).get("resource_id")
                if existing_id:
                    print(f"  -> Ya existía (ID:{existing_id}), marcando como OK")
                    return existing_id
        # Sin SKU, intentar crear sin SKU
        if sku:
            data2 = dict(data)
            del data2["sku"]
            r2 = requests.post(f"{WC_BASE}/wc/v3/products",
                               auth=(WC_USER, WC_PASS), json=data2, timeout=30)
            if r2.status_code == 201:
                return r2.json()["id"]
    except Exception as e:
        print(f"  -> Excepción: {e}")
    return None

# Progreso
progress_file = "fasit_progreso.json"
done_names = set()
if os.path.exists(progress_file):
    with open(progress_file) as f:
        done_names = set(json.load(f))
    print(f"Reanudando - ya importados: {len(done_names)}")

print(f"\n=== Importando {len(productos)} productos desde Fasit ===\n")

ok = sin_sku = sin_img = error = ya_existia = 0
pendientes = [p for p in productos if p["nombre"] not in done_names]
print(f"Pendientes: {len(pendientes)}\n")

for i, prod in enumerate(pendientes):
    nombre = prod["nombre"]
    precio = prod["precio"]
    url    = prod["url"]

    print(f"[{i+1}/{len(pendientes)}] {nombre[:55]}")

    sku, img_url = get_fasit_data(url)
    print(f"  SKU: {sku or '(sin SKU)'} | Imagen: {'sí' if img_url else 'no'}")

    media_id = None
    if img_url:
        media_id = upload_image(img_url, nombre)
        if not media_id:
            print(f"  -> Error subiendo imagen")
            sin_img += 1

    cat_id = classify_category(nombre)
    pid = create_product(nombre, precio, sku, media_id, cat_id)

    if pid:
        print(f"  -> OK (ID:{pid})")
        ok += 1
        done_names.add(nombre)
        with open(progress_file, "w") as f:
            json.dump(list(done_names), f)
    else:
        print(f"  -> Error al crear")
        error += 1

    if not sku: sin_sku += 1
    time.sleep(0.8)

print(f"\n=== RESUMEN ===")
print(f"Creados/OK: {ok}")
print(f"Sin SKU: {sin_sku}")
print(f"Sin imagen: {sin_img}")
print(f"Errores: {error}")
print(f"\n¡Listo! Recarga tu tienda para ver los nuevos productos.")
input("Presiona Enter para cerrar...")
