"""
Diagnóstico de autenticación con la API de Defontana.
Confirmado: GET https://api.defontana.com/api/Auth con user/password/client/company.
Con client=company=RUT (varios formatos) dio "Login failed" (no error de
validación), así que se prueban más combinaciones de client/company.

Uso:
  python diagnostico_defontana.py
"""
import json
import getpass
import requests

email = input("Email Defontana: ").strip()
password = getpass.getpass("Password Defontana: ")
rut = input("RUT (ej. 77557072-5): ").strip()

url = "https://api.defontana.com/api/Auth"

rut_con_puntos = rut
rut_sin_guion = rut.replace("-", "").replace(".", "")
rut_con_puntos_formato = None
try:
    numero, dv = rut.replace(".", "").split("-")
    rut_con_puntos_formato = f"{int(numero):,}".replace(",", ".") + "-" + dv
except Exception:
    pass

combinaciones = [
    ("client=email, company=RUT", email, rut),
    ("client=RUT, company=email", rut, email),
    ("client=0, company=RUT", "0", rut),
    ("client=RUT sin guion, company=RUT sin guion", rut_sin_guion, rut_sin_guion),
]
if rut_con_puntos_formato:
    combinaciones.append(("client=company=RUT con puntos", rut_con_puntos_formato, rut_con_puntos_formato))

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

for nombre, client_val, company_val in combinaciones:
    print(f"\n=== {nombre} (client='{client_val}', company='{company_val}') ===")
    params = {"user": email, "password": password, "client": client_val, "company": company_val}
    try:
        r = requests.get(url, params=params, timeout=20)
    except Exception as e:
        print("  error de conexión:", e)
        continue
    mostrar_respuesta(r)
