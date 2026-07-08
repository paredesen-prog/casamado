"""
Corrige la imagen de una lista puntual de SKU (los que el usuario confirmó
manualmente que sí tienen foto en Fasit), reutilizando la misma lógica ya
probada de corregir_imagenes_fasit.py (búsqueda + verificación de SKU +
verificación del hash después de subir a WordPress).

Uso:
  python corregir_lista_manual.py 4001056 5001094 2001383 4001052 XTK-309S 36698 4001067 4001184
"""
import sys
import json

import corregir_imagenes_fasit as base


def buscar_producto_en_woocommerce(sku):
    """Si el SKU no está en productos_imagen_incorrecta.json (porque viene de
    un descubrimiento posterior), se busca directo en WooCommerce por SKU."""
    r = base.request_con_reintento(
        "get", f"{base.WC_BASE}/wc/v3/products",
        auth=(base.WC_USER, base.WC_PASS), params={"sku": sku},
    )
    if r is None or r.status_code != 200:
        return None
    resultados = r.json()
    if not resultados:
        return None
    p = resultados[0]
    return {"id": p["id"], "sku": p.get("sku", ""), "nombre": p["name"]}


def main():
    skus_objetivo = {s.strip() for s in sys.argv[1:]}
    if not skus_objetivo:
        print("Uso: python corregir_lista_manual.py SKU1 SKU2 ...")
        return

    with open(base.INPUT_FILE, encoding="utf-8") as f:
        productos = json.load(f)

    objetivo = [p for p in productos if p.get("sku") in skus_objetivo]
    encontrados_skus = {p["sku"] for p in objetivo}
    faltantes = skus_objetivo - encontrados_skus

    if faltantes:
        print(f"{len(faltantes)} SKU no estaban en {base.INPUT_FILE}, buscando directo en WooCommerce...")
        for sku in list(faltantes):
            prod = buscar_producto_en_woocommerce(sku)
            if prod:
                objetivo.append(prod)
                faltantes.discard(sku)
        if faltantes:
            print(f"AVISO: estos SKU no se encontraron ni en el archivo ni en WooCommerce: {faltantes}")

    print(f"Procesando {len(objetivo)} productos puntuales...\n")

    corregidos = quitados = errores = 0
    for i, p in enumerate(objetivo):
        pid, sku, nombre = p["id"], p["sku"], p["nombre"]
        print(f"[{i+1}/{len(objetivo)}] {nombre[:55]} (SKU: {sku})")

        img_url, motivo = base.buscar_producto_por_sku(sku)
        if not img_url:
            print(f"  -> No se encontró imagen verificada ({motivo}).")
            errores += 1
            continue

        img_data, resultado = base.descargar_y_verificar(img_url)
        if not img_data:
            print(f"  -> Imagen rechazada ({resultado}).")
            errores += 1
            continue

        media_id = base.subir_imagen(img_data, nombre, sku)
        if media_id and base.reemplazar_imagen_producto(pid, media_id):
            if base.imagen_final_es_valida(pid):
                print(f"  -> OK, imagen corregida y verificada por SKU {sku}")
                corregidos += 1
            else:
                print("  -> La imagen subida resultó ser un placeholder conocido tras subirla.")
                base.quitar_imagen_producto(pid)
                quitados += 1
        else:
            print("  -> Error subiendo/asignando la imagen en WooCommerce")
            errores += 1

    print("\n=== RESUMEN ===")
    print(f"Corregidos: {corregidos}")
    print(f"Rechazados/quitados: {quitados}")
    print(f"Errores/sin match: {errores}")


if __name__ == "__main__":
    main()
