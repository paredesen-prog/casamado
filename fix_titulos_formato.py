"""
Corrige el formato de titulos de producto heredados del feed del proveedor:
- MAYUSCULAS SIN ESPACIO entre numero/unidad y la variante ("AMBIENTAL360 ML" -> "Ambiental 360 Ml")
- Pasa todo a Title Case (consistente con el resto del catalogo)
- Corrige entidades HTML mal escapadas (&amp;Amp; -> &)
Deja en manos manuales los casos de dos palabras pegadas sin numero/unidad de por medio
(ej. "REPUESTOMANZANA"), listados aparte, porque separarlas a ciegas puede equivocarse.

Uso:
  python3 fix_titulos_formato.py --dry-run          # solo muestra cambios propuestos
  python3 fix_titulos_formato.py --category 356      # limita a una categoria
  python3 fix_titulos_formato.py                     # aplica a todo el catalogo publicado
"""
import os
import re
import sys
import json
import time
import requests

WC_USER = os.environ.get("WC_USER", "paredesen")
WC_PASS = os.environ.get("WC_PASS", "t99J MTPa Doa8 u2S8 Bwgc Fep2")
BASE_WC = "https://casamado.cl/wp-json/wc/v3"
AUTH = (WC_USER, WC_PASS)

UNIDADES = r"(ML|GR|LT|KG|UND|MM|CM|MTS?)"

# codigos de producto alfanumericos (ej. "BT5001") donde separar letra/numero
# los rompe en vez de arreglarlos; se dejan tal cual para revision manual.
IDS_EXCLUIR = {2685, 2684, 2683, 2682}


def request_con_reintento(metodo, url, intentos=3, **kwargs):
    for i in range(intentos):
        try:
            return requests.request(metodo, url, auth=AUTH, timeout=30, **kwargs)
        except requests.exceptions.RequestException:
            if i == intentos - 1:
                raise
            time.sleep(2 * (i + 1))


def es_todo_mayusculas(nombre):
    sin_entidades = re.sub(r"&[a-zA-Z]+;", "", nombre)
    # "x" suelta se usa como signo de multiplicar (ej. "250 MT x 2 ROLLOS"),
    # no cuenta para decidir si el resto del titulo esta en mayusculas
    sin_conectores = re.sub(r"\bx\b", "", sin_entidades)
    letras = re.sub(r"[^A-Za-zÁÉÍÓÚÑáéíóúñ]", "", sin_conectores)
    return len(letras) > 3 and letras == letras.upper()


def tiene_palabra_pegada(nombre_pre_title_case):
    # palabra suelta muy larga (sin espacios) suele ser dos palabras del feed
    # pegadas sin separador (ej. "AROMATICASBLANCO", "REPUESTOMANZANA")
    for palabra in nombre_pre_title_case.split():
        letras = re.sub(r"[^A-Za-zÁÉÍÓÚÑáéíóúñ]", "", palabra)
        if len(letras) > 14:
            return True
    return False


def _pre_procesar(nombre_mayus):
    # solo se llama sobre texto que YA se confirmo 100% mayusculas: aqui es
    # seguro asumir que cualquier "GR"/"ML" pegado a una palabra en mayusculas
    # es una unidad mal separada, no una palabra real que empiece igual.
    n = nombre_mayus
    n = re.sub(r"([A-ZÁÉÍÓÚÑ])(\d)", r"\1 \2", n)
    n = re.sub(r"(\d)([A-ZÁÉÍÓÚÑ])", r"\1 \2", n)
    # solo se separa la unidad si viene pegada justo despues de un numero
    # (ej. "190 GRMANZANA"); si no hay digito antes puede ser el inicio de
    # una palabra real ("GRAFITO", "GRANDE") y no se toca.
    n = re.sub(rf"(?<=\d ){UNIDADES}([A-ZÁÉÍÓÚÑ]{{2,}})", r"\1 \2", n)
    n = re.sub(r"\s+", " ", n).strip()
    return n


def corregir_titulo(nombre):
    n = re.sub(r"&amp;", "&", nombre, flags=re.IGNORECASE)

    if not es_todo_mayusculas(n):
        return n

    n = _pre_procesar(n)
    n = n.title()
    n = re.sub(r"\bY\b", "y", n)
    n = re.sub(r"\bDe\b", "de", n)
    n = re.sub(r"\bDel\b", "del", n)
    n = re.sub(r"\bX\b", "x", n)
    n = re.sub(rf"\b({UNIDADES})\b".title(), lambda m: m.group(0).upper(), n)
    for u in ["Ml", "Gr", "Lt", "Kg", "Und", "Mm", "Cm", "Mt", "Mts", "Hd", "Hs"]:
        n = re.sub(rf"\b{u}\b", u.upper(), n)

    return n


def palabras_pegadas_sospechosas(original, corregido):
    sin_entidades = re.sub(r"&amp;", "&", original, flags=re.IGNORECASE)
    if not es_todo_mayusculas(sin_entidades):
        return False
    pre = _pre_procesar(sin_entidades)
    return tiene_palabra_pegada(pre)


def main():
    dry_run = "--dry-run" in sys.argv
    categoria = None
    if "--category" in sys.argv:
        categoria = sys.argv[sys.argv.index("--category") + 1]

    pagina = 1
    cambios = []
    revisar_manual = []
    while True:
        params = {"per_page": 100, "page": pagina, "status": "publish"}
        if categoria:
            params["category"] = categoria
        r = request_con_reintento("GET", f"{BASE_WC}/products", params=params)
        productos = r.json()
        if not productos:
            break
        for p in productos:
            if p["id"] in IDS_EXCLUIR:
                continue
            original = p["name"]
            nuevo = corregir_titulo(original)
            if nuevo == original:
                continue
            if palabras_pegadas_sospechosas(original, nuevo):
                revisar_manual.append({"id": p["id"], "original": original, "propuesto": nuevo})
                continue
            cambios.append({"id": p["id"], "original": original, "nuevo": nuevo})
            print(f"{p['id']:>6}  '{original}'  ->  '{nuevo}'")
            if not dry_run:
                resp = request_con_reintento(
                    "PUT", f"{BASE_WC}/products/{p['id']}", json={"name": nuevo}
                )
                if resp.status_code != 200:
                    print(f"   ERROR actualizando {p['id']}: {resp.status_code}")
        pagina += 1

    with open("titulos_corregidos.json", "w", encoding="utf-8") as f:
        json.dump(cambios, f, ensure_ascii=False, indent=2)
    with open("titulos_revisar_manual.json", "w", encoding="utf-8") as f:
        json.dump(revisar_manual, f, ensure_ascii=False, indent=2)

    print(f"\n{'(dry-run) ' if dry_run else ''}Titulos corregidos: {len(cambios)}")
    print(f"Titulos con palabras pegadas para revisar a mano: {len(revisar_manual)}")


if __name__ == "__main__":
    main()
