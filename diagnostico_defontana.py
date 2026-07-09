"""
Diagnóstico de autenticación con la API de Defontana. Antes de correr
defontana_sync.py (que se escribió sin poder probar contra la API real,
por bloqueo de red en el entorno donde se escribió), esto confirma:
- si el endpoint /api/Auth existe y responde
- el formato real de la respuesta (access_token, jumpUsers, etc.)

Uso:
  python diagnostico_defontana.py
Pide el email y password por input() para no dejarlos escritos en el archivo.
"""
import json
import getpass
import requests

BASES_A_PROBAR = [
    "https://api.defontana.com",
    "https://onboardingcertificacionapi.defontana.com",
]

email = input("Email Defontana: ").strip()
password = getpass.getpass("Password Defontana: ")

for base in BASES_A_PROBAR:
    print(f"\n=== Probando base: {base} ===")
    for path in ["/api/Auth", "/Auth", "/api/auth", "/api/v1/Auth"]:
        url = f"{base}{path}"
        try:
            r = requests.post(url, json={"user": email, "password": password}, timeout=20)
        except Exception as e:
            print(f"  {path}: error de conexión ({e})")
            continue
        print(f"  {path}: HTTP {r.status_code}")
        if r.status_code != 404:
            try:
                data = r.json()
                # no imprimir el token completo por si acaso
                if "authResult" in data and "access_token" in data.get("authResult", {}):
                    data["authResult"]["access_token"] = data["authResult"]["access_token"][:15] + "...(recortado)"
                if "access_token" in data:
                    data["access_token"] = data["access_token"][:15] + "...(recortado)"
                print("   Respuesta:", json.dumps(data, ensure_ascii=False, indent=2)[:1500])
            except Exception:
                print("   Respuesta (no-JSON, primeros 300 chars):", r.text[:300])
