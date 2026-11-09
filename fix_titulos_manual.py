"""
Corrige a mano los 40 titulos que fix_titulos_formato.py dejo para revision
manual (palabras del feed pegadas sin separador, imposibles de partir con
regex de forma segura). Mapeo id -> nombre final revisado uno por uno.
"""
import os
import requests

WC_USER = os.environ.get("WC_USER", "paredesen")
WC_PASS = os.environ.get("WC_PASS", "t99J MTPa Doa8 u2S8 Bwgc Fep2")
BASE_WC = "https://casamado.cl/wp-json/wc/v3"
AUTH = (WC_USER, WC_PASS)

CORRECCIONES = {
    2730: "Cafe 16 Capsulas Nescafe Americano",
    2729: "Cafe 16 Capsulas Nescafe Espresso Intenso",
    2728: "Cafe 16 Capsulas Nescafe Cappuccino",
    2659: "Mouse Pad Apoya Muneca Gel Con Base Antideslizante Negro",
    2658: "Keyboard Wrist Pad Apoya Muneca Gel Con Base Antideslizante Negro",
    2590: "Separador Cartulina Alfabetico Oficio",
    2589: "Separador Cartulina 10 Posiciones Oficio",
    2588: "Separador Cartulina 10 Posiciones Carta",
    2562: "Termolaminadora Plastificadora Vision G50 HD",
    2561: "Termolaminadora Plastificadora Vision G15 HD",
    2508: "Destacador Rosado",
    2507: "Destacador Verde",
    2506: "Destacador Amarillo",
    2505: "Destacador Pastel Naranjo",
    2500: "Destacador Verde",
    2499: "Destacador Amarillo",
    2450: "Caja de Archivo Americana",
    2449: "Caja de Archivo Standard",
    2448: "Caja de Archivo Intermedia",
    2226: "Alcohol Isopropilico Difem Profesional 70 Grados Con Gatillo 1 LT",
    2224: "Alcohol Desnaturalizado Difemcare 70 Grados 1 LT",
    2223: "Alcohol Desnaturalizado 95 Grados 1 LT",
    2169: "Dispensador Jabon Sachet Tork Elevation Plastico Negro",
    2168: "Dispensador Jabon Sachet Tork Elevation Plastico Blanco",
    2162: "Dispensador Sabanilla Metalico Blanco",
    2161: "Dispensador Servilleta Tork Xpressnap Signature Vertical Plastico Negro",
    2160: "Dispensador Servilleta Tork Xpressnap Signature Tabletop Plastico Negro",
    2159: "Dispensador Servilleta Tork Xpressnap Plastico Negro",
    2155: "Dispensador Servilleta Torre Interfoliada Plastico",
    2154: "Dispensador Servilleta Interfoliada Plastico",
    2153: "Dispensador Servilleta Express Plastico Negro",
    2141: "Dispensador Papel Higienico Alto Metraje Dynamic Plastico Negro",
    2140: "Dispensador Papel Higienico Alto Metraje Dynamic Plastico Blanco",
    2136: "Dispensador Toalla Interfoliada Acero Inoxidable",
    2135: "Dispensador Toalla Interfoliada Evolution Plastico Negro",
    2134: "Dispensador Toalla Interfoliada Evolution Plastico Blanco",
    2133: "Dispensador Toalla de Papel Corte Aut Tork Elevation Plastico Blanco",
    2130: "Dispensador Toalla de Papel Corte Manual C Palanca Plastico Blanco",
    2129: "Dispensador Toalla de Papel Corte Manual C Palanca Plastico Negro",
    2128: "Dispensador Toalla de Papel Corte Manual C Palanca Plastico Blanco",
}


def request_con_reintento(metodo, url, intentos=3, **kwargs):
    import time
    for i in range(intentos):
        try:
            return requests.request(metodo, url, auth=AUTH, timeout=30, **kwargs)
        except requests.exceptions.RequestException:
            if i == intentos - 1:
                raise
            time.sleep(2 * (i + 1))


for pid, nombre in CORRECCIONES.items():
    r = request_con_reintento("PUT", f"{BASE_WC}/products/{pid}", json={"name": nombre})
    if r.status_code == 200:
        print(f"OK {pid}: {r.json()['name']}")
    else:
        print(f"ERROR {pid}: {r.status_code}")
