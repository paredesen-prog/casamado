"""
Corrige imágenes incorrectas en productos de casamado.cl buscando la foto
real en Fasit por SKU, con verificación explícita de que el SKU de la
página encontrada coincide con el SKU del producto.

Por qué existe este script: los intentos anteriores (buscar_imagenes_por_nombre.py
y una v2 hecha aparte) asignaron la MISMA imagen genérica a cientos de
productos sin relación (confirmado: 354 productos con una foto de toallas
Elite, 20 con una foto de un ambientador Sani-Air, 11 con un ícono de
"cargando"). La causa: tomaban la primera imagen encontrada en la página de
resultados de Fasit sin confirmar que correspondiera al SKU buscado. Este
script no acepta ninguna imagen sin esa verificación.

Uso:
  python3 corregir_imagenes_fasit.py
  python3 corregir_imagenes_fasit.py --test 5   # prueba rápida, sin guardar progreso
"""
import os
import re
import sys
import json
import time
import hashlib
import requests
from bs4 import BeautifulSoup

WC_USER = os.environ.get("WC_USER", "paredesen")
WC_PASS = os.environ.get("WC_PASS", "t99J MTPa Doa8 u2S8 Bwgc Fep2")
WC_BASE = "https://casamado.cl/wp-json"

FASIT_BASE = "https://fasit.cl"

INPUT_FILE = "productos_imagen_incorrecta.json"
PROGRESS_FILE = "corregir_imagenes_progreso.json"
SIN_MATCH_FILE = "corregir_imagenes_sin_match.json"

# MD5 de las imágenes genéricas ya confirmadas como incorrectas. Si Fasit
# devolviera exactamente uno de estos archivos, lo rechazamos igual aunque
# el SKU "coincidiera" por error de la página.
HASHES_PROHIBIDOS = {
    "8b64d2a0729aaa4cc0265d72f8dfcf3d",  # foto de toallas de papel Elite
    "4eb8e89ce8b23a28e3fc3acc5c15cf1f",  # foto de ambientador Sani-Air
    "80275d1e8c3b068158444a9960228b0e",  # ícono de "cargando" (variante 1)
    "2abd5f35f34f27ce4afc50e0da8966df",  # ícono de "cargando" (variante 2, GIF animado)
}

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
})


def normalizar_sku(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def request_con_reintento(metodo, url, intentos=3, **kwargs):
    """Reintenta ante errores transitorios de red (SSL, conexión cortada, timeout)
    en vez de dejar que la excepción tumbe todo el script a mitad de la corrida."""
    for intento in range(intentos):
        try:
            return requests.request(metodo, url, timeout=kwargs.pop("timeout", 30), **kwargs)
        except Exception as e:
            if intento == intentos - 1:
                return None
            time.sleep(2 * (intento + 1))
    return None


def buscar_producto_por_sku(sku):
    """Busca en Fasit por SKU y devuelve la URL de imagen SOLO si confirma
    el SKU (o su SKU base, para variantes de talla/color tipo "8001055-L")
    en la página del producto encontrado. None si no hay match."""
    sku_base = sku.rsplit("-", 1)[0] if "-" in sku else sku
    skus_validos = {normalizar_sku(sku), normalizar_sku(sku_base)}

    urls_candidatas = []
    for termino in dict.fromkeys([sku, sku_base]):  # sku primero, sin duplicar si son iguales
        try:
            r = session.get(f"{FASIT_BASE}/catalogsearch/result/?q={termino}", timeout=20)
        except Exception as e:
            continue
        soup = BeautifulSoup(r.text, "html.parser")
        links = soup.select("a.product-item-link, .product-item-photo a, .product-item-info a")
        for a in links:
            href = a.get("href")
            if href and href not in urls_candidatas:
                urls_candidatas.append(href)
        if urls_candidatas:
            break

    if not urls_candidatas:
        return None, "sin resultados en la búsqueda"

    for url in urls_candidatas[:5]:
        try:
            pr = session.get(url, timeout=20)
        except Exception:
            continue
        psoup = BeautifulSoup(pr.text, "html.parser")

        sku_el = psoup.select_one(".product-info-stock-sku .value, [itemprop='sku'], .sku .value")
        page_sku = sku_el.get_text(strip=True) if sku_el else ""
        if not page_sku:
            meta = psoup.find("meta", {"property": "product:retailer_item_id"})
            page_sku = meta.get("content", "") if meta else ""

        if normalizar_sku(page_sku) not in skus_validos:
            continue  # esta página no es del SKU (ni de su variante base) que buscamos

        # og:image es un metadato server-rendered (para compartir en redes), no
        # depende de JavaScript. El visor de galería (.fotorama__img y similares)
        # en Fasit se rellena vía JS después de cargar, así que en el HTML estático
        # que vemos con requests solo contiene un ícono de "cargando" — por eso
        # og:image va primero, no como respaldo.
        img_url = ""
        og = psoup.find("meta", {"property": "og:image"})
        if og and og.get("content"):
            img_url = og.get("content")

        if not img_url:
            img_el = psoup.select_one(".fotorama__img, .gallery-placeholder img, img.gallery-image, [data-main-image]")
            if img_el:
                for attr in ("data-src", "data-original", "data-zoom-image", "data-large_image", "data-full", "src"):
                    val = img_el.get(attr)
                    if val and "loader" not in val and "loading" not in val:
                        img_url = val
                        break

        if img_url:
            return img_url, "ok"
        return None, f"SKU confirmado ({page_sku}) pero sin imagen en la página"

    return None, "ningún resultado tenía el SKU exacto"


def descargar_y_verificar(img_url):
    try:
        data = session.get(img_url, timeout=20).content
    except Exception as e:
        return None, f"error descargando: {e}"
    h = hashlib.md5(data).hexdigest()
    if h in HASHES_PROHIBIDOS:
        return None, "la imagen encontrada es una de las genéricas ya conocidas, se rechaza"
    return data, h


def subir_imagen(img_data, nombre_archivo, sku):
    ext = "jpg"
    fname = re.sub(r"[^a-z0-9]", "-", nombre_archivo.lower())[:50] + f"-sku-{sku}.{ext}"
    r = request_con_reintento(
        "post", f"{WC_BASE}/wp/v2/media",
        auth=(WC_USER, WC_PASS),
        headers={"Content-Disposition": f'attachment; filename="{fname}"', "Content-Type": "image/jpeg"},
        data=img_data,
    )
    if r is not None and r.status_code in (200, 201):
        return r.json()["id"]
    return None


def reemplazar_imagen_producto(product_id, media_id):
    r = request_con_reintento(
        "put", f"{WC_BASE}/wc/v3/products/{product_id}",
        auth=(WC_USER, WC_PASS),
        json={"images": [{"id": media_id}]},
    )
    return r is not None and r.status_code == 200


def imagen_final_es_valida(product_id):
    r = request_con_reintento(
        "get", f"{WC_BASE}/wc/v3/products/{product_id}",
        auth=(WC_USER, WC_PASS), params={"_": "nocache"},
    )
    if r is None or r.status_code != 200:
        return True  # no se pudo verificar, no bloquear por un error de red puntual
    imgs = r.json().get("images", [])
    if not imgs:
        return False
    ir = request_con_reintento("get", imgs[0]["src"])
    if ir is None:
        return True
    return hashlib.md5(ir.content).hexdigest() not in HASHES_PROHIBIDOS


def quitar_imagen_producto(product_id):
    r = request_con_reintento(
        "put", f"{WC_BASE}/wc/v3/products/{product_id}",
        auth=(WC_USER, WC_PASS),
        json={"images": []},
    )
    return r is not None and r.status_code == 200


def cargar_progreso():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return set(json.load(f))
    return set()


def guardar_progreso(hecho):
    with open(PROGRESS_FILE, "w") as f:
        json.dump(list(hecho), f)


def main():
    # Modo prueba: "python corregir_imagenes_fasit.py --test 5" corre solo los
    # primeros N productos y NO guarda progreso, para verificar rápido que la
    # extracción de imagen funciona antes de lanzar los 385 completos.
    modo_prueba = "--test" in sys.argv
    limite_prueba = None
    if modo_prueba:
        idx = sys.argv.index("--test")
        limite_prueba = int(sys.argv[idx + 1]) if len(sys.argv) > idx + 1 else 5

    with open(INPUT_FILE, encoding="utf-8") as f:
        productos = json.load(f)

    hecho = set() if modo_prueba else cargar_progreso()
    sin_match = []
    if not modo_prueba and os.path.exists(SIN_MATCH_FILE):
        with open(SIN_MATCH_FILE, encoding="utf-8") as f:
            sin_match = json.load(f)

    pendientes = [p for p in productos if str(p["id"]) not in hecho]
    if modo_prueba:
        pendientes = pendientes[:limite_prueba]
        print(f"MODO PRUEBA: procesando solo {len(pendientes)} productos, sin guardar progreso.\n")
    print(f"Total: {len(productos)} | Ya procesados: {len(hecho)} | Pendientes: {len(pendientes)}\n")

    corregidos = quitados = errores = 0

    for i, p in enumerate(pendientes):
        pid, sku, nombre = p["id"], p.get("sku", ""), p["nombre"]
        print(f"[{i+1}/{len(pendientes)}] {nombre[:55]} (SKU: {sku or '(sin SKU)'})")

        if not sku:
            print("  -> Sin SKU, no se puede verificar en Fasit. Se quita la imagen incorrecta.")
            if quitar_imagen_producto(pid):
                quitados += 1
            hecho.add(str(pid))
            if not modo_prueba:
                guardar_progreso(hecho)
            continue

        img_url, motivo = buscar_producto_por_sku(sku)
        if not img_url:
            print(f"  -> No se encontró imagen verificada ({motivo}). Se quita la imagen incorrecta.")
            quitar_imagen_producto(pid)
            quitados += 1
            sin_match.append({"id": pid, "sku": sku, "nombre": nombre, "motivo": motivo})
            with open(SIN_MATCH_FILE, "w", encoding="utf-8") as f:
                json.dump(sin_match, f, ensure_ascii=False, indent=2)
            hecho.add(str(pid))
            if not modo_prueba:
                guardar_progreso(hecho)
            time.sleep(0.5)
            continue

        img_data, resultado = descargar_y_verificar(img_url)
        if not img_data:
            print(f"  -> Imagen rechazada ({resultado}). Se quita la imagen incorrecta.")
            quitar_imagen_producto(pid)
            quitados += 1
            sin_match.append({"id": pid, "sku": sku, "nombre": nombre, "motivo": resultado})
            with open(SIN_MATCH_FILE, "w", encoding="utf-8") as f:
                json.dump(sin_match, f, ensure_ascii=False, indent=2)
            hecho.add(str(pid))
            if not modo_prueba:
                guardar_progreso(hecho)
            time.sleep(0.5)
            continue

        media_id = subir_imagen(img_data, nombre, sku)
        if media_id and reemplazar_imagen_producto(pid, media_id):
            # WordPress puede reprocesar/recomprimir la imagen al subirla (el hash
            # antes de subir no siempre coincide con el resultado final), así que
            # se vuelve a chequear el archivo YA subido antes de dar por bueno.
            if imagen_final_es_valida(pid):
                print(f"  -> OK, imagen corregida y verificada por SKU {sku}")
                corregidos += 1
            else:
                print("  -> La imagen subida resultó ser un placeholder conocido tras subirla. Se quita.")
                quitar_imagen_producto(pid)
                quitados += 1
                sin_match.append({"id": pid, "sku": sku, "nombre": nombre, "motivo": "placeholder tras subir a WordPress"})
                with open(SIN_MATCH_FILE, "w", encoding="utf-8") as f:
                    json.dump(sin_match, f, ensure_ascii=False, indent=2)
        else:
            print("  -> Error subiendo/asignando la imagen en WooCommerce")
            errores += 1

        hecho.add(str(pid))
        if not modo_prueba:
            guardar_progreso(hecho)
        time.sleep(0.8)

    print("\n=== RESUMEN ===")
    print(f"Corregidos con imagen verificada: {corregidos}")
    print(f"Sin match verificado (imagen quitada, queda para revisar manual): {quitados}")
    print(f"Errores: {errores}")
    print(f"\nRevisa '{SIN_MATCH_FILE}' para la lista de productos que quedaron sin imagen"
          f" por no encontrar el SKU exacto en Fasit.")


if __name__ == "__main__":
    main()
