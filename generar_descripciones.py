"""
Reemplaza las descripciones genéricas/repetidas de producto (detectadas:
1101 de 1101 productos publicados compartían una de 6 frases plantilla)
por una descripción compuesta con datos reales de cada producto: nombre,
categoría (de WooCommerce), y marca/formato/categoría de la lista de
precios de Fasit cuando el SKU matchea.

No es una sola plantilla: cada producto elige entre varias variantes de
frase (según su SKU) para no volver a generar texto duplicado en masa.

Uso:
  python generar_descripciones.py            # aplica a todos
  python generar_descripciones.py --test 10  # prueba con 10 primero
"""
import os
import re
import sys
import json
import time
import requests

WC_USER = os.environ.get("WC_USER", "paredesen")
WC_PASS = os.environ.get("WC_PASS", "t99J MTPa Doa8 u2S8 Bwgc Fep2")
WC_BASE = "https://casamado.cl/wp-json/wc/v3"

with open("productos_descripcion_generica.json", encoding="utf-8") as f:
    PRODUCTOS = json.load(f)

with open("datos_fasit_mayo2026.json", encoding="utf-8") as f:
    DATOS_FASIT = json.load(f)

APERTURAS = [
    "{nombre} de {marca}, ideal para {uso}.",
    "{nombre}, un producto {categoria_frase} pensado para {uso}.",
    "{nombre} — presentación {formato}, de la marca {marca}.",
    "{nombre}: solución {categoria_frase} para {uso}.",
]
APERTURAS_SIN_MARCA = [
    "{nombre}, un producto {categoria_frase} pensado para {uso}.",
    "{nombre}: solución {categoria_frase} para {uso}.",
    "{nombre}, disponible en Casamado para {uso}.",
]

CIERRES = [
    "Disponible en Casamado para compra al por mayor y al detalle, con despacho a empresas e instituciones en todo Chile.",
    "En Casamado lo encuentras con stock permanente, precios mayoristas y despacho para empresas.",
    "Consulta stock, precio neto y despacho para tu empresa o institución en Casamado.",
    "Casamado distribuye este producto a empresas, instituciones y comercios en todo Chile.",
]

# palabras clave (con limite de palabra, se aplican solo al NOMBRE del
# producto) -> (frase de categoria, uso tipico). Ojo: palabras cortas o
# ambiguas en español (ej. "café" = bebida O color café/marrón) se dejaron
# fuera de aquí a propósito y solo se resuelven por categoría de WooCommerce.
CATEGORIAS_USO = [
    (["papel higienico", "papel higiénico", "toalla de papel", "servilleta", "papel tissue"],
     "de papel tissue", "el aseo diario de baños y áreas comunes en oficinas e instituciones"),
    (["cloro", "desinfectante", "lavaloza", "limpiador", "limpiavidrios", "desengrasante", "detergente"],
     "de aseo y limpieza profesional", "la limpieza y desinfección de superficies, pisos y ambientes"),
    (["trapero", "paño", "esponja", "mopa", "escobillon", "escobillón", "escoba"],
     "de limpieza e higiene", "las labores de aseo institucional y doméstico"),
    (["bolsas de basura", "basurero", "contenedor de basura"],
     "para el manejo de residuos", "la recolección y disposición de residuos en oficinas y empresas"),
    (["azucar", "azúcar", "chocolate", "endulzante", "nescafe", "nescafé"],
     "de cafetería", "abastecer la cafetería de tu oficina o empresa"),
    (["papel fotocopia", "archivador", "carpeta", "cinta adhesiva", "marcador", "lapiz", "lápiz", "destacador", "corchete", "notas adhesivas", "libreta"],
     "de oficina y librería", "el trabajo diario en oficinas, colegios e instituciones"),
    (["mouse", "teclado", "pendrive", "tinta", "toner", "tóner", "monitor", "cable", "audifono", "audífono"],
     "de tecnología y computación", "equipar puestos de trabajo y oficinas"),
    (["guante", "jabon", "jabón", "alcohol gel", "dispensador"],
     "de higiene y protección", "el cuidado e higiene personal en espacios de trabajo"),
]

# nombre de categoria de WooCommerce (coincidencia parcial, sin ambigüedad
# porque viene de la categoría asignada, no del texto libre del nombre)
# -> (frase de categoria, uso tipico). Esto se revisa ANTES que el nombre.
CATEGORIAS_WC_USO = [
    (["café", "cafe", "té", "te ", "chocolate", "azúcar", "azucar"], "de cafetería", "abastecer la cafetería de tu oficina o empresa"),
    (["papel tissue", "papel higiénico", "toalla de papel", "servilleta"], "de papel tissue", "el aseo diario de baños y áreas comunes en oficinas e instituciones"),
    (["aseo", "limpieza", "cloro", "desinfectante"], "de aseo y limpieza profesional", "la limpieza y desinfección de superficies, pisos y ambientes"),
    (["bolsas de basura"], "para el manejo de residuos", "la recolección y disposición de residuos en oficinas y empresas"),
    (["oficina", "librería", "libreria"], "de oficina y librería", "el trabajo diario en oficinas, colegios e instituciones"),
    (["computación", "computacion", "tecnología", "tecnologia"], "de tecnología y computación", "equipar puestos de trabajo y oficinas"),
    (["seguridad", "epp", "protección", "proteccion"], "de seguridad e higiene laboral", "proteger a tus colaboradores en el trabajo"),
    (["mobiliario", "silla"], "de mobiliario para oficina", "equipar oficinas y espacios de trabajo"),
]
DEFAULT_USO = ("de distribución Casamado", "abastecer a empresas, instituciones y comercios")


def normalizar(s):
    s = s.lower()
    s = re.sub(r"[áàä]", "a", s)
    s = re.sub(r"[éèë]", "e", s)
    s = re.sub(r"[íìï]", "i", s)
    s = re.sub(r"[óòö]", "o", s)
    s = re.sub(r"[úùü]", "u", s)
    return s


def limpiar_nombre(nombre):
    # separar numero pegado a palabra ("AZUCAR1 KG" -> "AZUCAR 1 KG")
    n = re.sub(r"([a-zA-ZÁÉÍÓÚáéíóú])(\d)", r"\1 \2", nombre)
    n = re.sub(r"\s+", " ", n).strip()
    n = n.title()
    n = re.sub(r"\bΜm\b", "µm", n)  # .title() rompe la unidad "µm" (micrómetros)
    return n


def contiene_palabra(texto, clave):
    return re.search(r"\b" + re.escape(clave.strip()) + r"\b", texto) is not None


def frase_categoria_uso(nombre, categorias_wc):
    texto_categorias = normalizar(" ".join(categorias_wc))
    for claves, frase, uso in CATEGORIAS_WC_USO:
        if any(clave in texto_categorias for clave in claves):
            return frase, uso

    texto_nombre = normalizar(nombre)
    for claves, frase, uso in CATEGORIAS_USO:
        if any(contiene_palabra(texto_nombre, clave) for clave in claves):
            return frase, uso

    return DEFAULT_USO


def generar_descripcion(producto):
    pid = producto["id"]
    sku = producto.get("sku", "")
    nombre = limpiar_nombre(producto["nombre"])
    categorias_wc = producto.get("categorias", [])
    datos_fasit = DATOS_FASIT.get(sku, {})
    marca = datos_fasit.get("marca", "").title()
    formato = datos_fasit.get("formato", "")
    categoria_frase, uso = frase_categoria_uso(nombre, categorias_wc)

    idx = pid % len(APERTURAS_SIN_MARCA if not marca else APERTURAS)
    if marca and formato:
        apertura = APERTURAS[idx % len(APERTURAS)].format(
            nombre=nombre, marca=marca, formato=formato, categoria_frase=categoria_frase, uso=uso
        )
    elif marca:
        apertura = f"{nombre} de la marca {marca}, {categoria_frase}, pensado para {uso}."
    else:
        apertura = APERTURAS_SIN_MARCA[idx % len(APERTURAS_SIN_MARCA)].format(
            nombre=nombre, categoria_frase=categoria_frase, uso=uso
        )

    cierre = CIERRES[pid % len(CIERRES)]
    sku_linea = f" SKU: {sku}." if sku else ""
    return f"{apertura} {cierre}{sku_linea}"


def actualizar_producto(pid, descripcion):
    for intento in range(3):
        try:
            r = requests.put(
                f"{WC_BASE}/products/{pid}",
                auth=(WC_USER, WC_PASS),
                json={"description": descripcion},
                timeout=30,
            )
            return r.status_code == 200
        except Exception:
            time.sleep(2)
    return False


def main():
    modo_prueba = "--test" in sys.argv
    limite = None
    if modo_prueba:
        idx = sys.argv.index("--test")
        limite = int(sys.argv[idx + 1]) if len(sys.argv) > idx + 1 else 10

    productos = PRODUCTOS[:limite] if modo_prueba else PRODUCTOS
    print(f"Generando descripciones para {len(productos)} productos...\n")

    ok = errores = 0
    for i, p in enumerate(productos):
        desc = generar_descripcion(p)
        print(f"[{i+1}/{len(productos)}] {p['nombre'][:50]}")
        print(f"  -> {desc[:140]}")
        if actualizar_producto(p["id"], desc):
            ok += 1
        else:
            errores += 1
            print("  -> ERROR al actualizar")
        time.sleep(0.3)

    print("\n=== RESUMEN ===")
    print(f"Actualizados: {ok}")
    print(f"Errores: {errores}")


if __name__ == "__main__":
    main()
