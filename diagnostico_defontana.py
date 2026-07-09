"""
Diagnóstico de autenticación con la API de Defontana.
Ya confirmado: el endpoint correcto es GET https://api.defontana.com/api/Auth
y requiere además de user/password los campos "client" y "company".

Este script prueba varios formatos del RUT como client/company para ver
cuál acepta la API (o qué error nuevo aparece).

Uso:
  python diagnostico_defontana.py
"""
import json
import getpass
import requests

email = input("Email Defontana: ").strip()
password = getpass.getpass("Password Defontana: ")
rut = input("RUT (como te lo dieron, ej. 77557072-5): ").strip()

url = "https://api.defontana.com/api/Auth"

variantes_rut = {
    "tal_cual": rut,
    "sin_guion": rut.replace("-", ""),
    "sin_guion_ni_puntos": rut.replace("-", "").replace(".", ""),
    "solo_numero_sin_dv": rut.split("-")[0].replace(".", "") if "-" in rut else rut,
}

def mostrar_respuesta(r):
    print(f"    HTTP {r.status_code}")
    try:
        data = r.json()
        if "authResult" in data and "access_token" in data.get("authResult", {}):
            data["authResult"]["access_token"] = data["authResult"]["access_token"][:15] + "...(recortado)"
        if "access_token" in data:
            data["access_token"] = data["access_token"][:15] + "...(recortado)"
        print("    Respuesta:", json.dumps(data, ensure_ascii=False, indent=2)[:1500])
    except Exception:
        print("    Respuesta (no-JSON, primeros 300 chars):", r.text[:300])

for nombre, valor in variantes_rut.items():
    print(f"\n=== client=company='{valor}' ({nombre}) ===")
    params = {"user": email, "password": password, "client": valor, "company": valor}
    try:
        r = requests.get(url, params=params, timeout=20)
    except Exception as e:
        print("  error de conexión:", e)
        continue
    mostrar_respuesta(r)
