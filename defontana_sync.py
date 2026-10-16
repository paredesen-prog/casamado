"""
Sincronización Defontana <-> WooCommerce (casamado.cl).

ENDPOINTS VERIFICADOS (no adivinados): confirmados leyendo el código fuente de
un SDK PHP no oficial pero funcional de Defontana (github.com/LordNeoZ/
defontana-sdk-php, generado desde el OpenAPI spec real de Defontana). Este
entorno remoto bloquea las conexiones salientes a api.defontana.com (política
de red del sandbox), así que las rutas y payloads de abajo están verificados
contra ese SDK, pero el flujo completo (login + escritura real) no se ha
ejecutado todavía contra la cuenta real de Casamado. Antes de usarlo en
producción:

1. Correrlo una vez con DEFONTANA_DRY_RUN=1 (no hace POST, solo imprime lo
   que haría) desde una máquina con salida a internet (tu notebook, por
   ejemplo) para confirmar que el login funciona y que `get_products()` /
   `get_clients()` devuelven datos con la forma esperada.
2. Revisar especialmente `rubroId` en `upsert_customer` (es un ID interno de
   Defontana — consultar GET /api/Sale/GetRubro para los valores válidos de
   tu cuenta) y el código SII en `create_electronic_document` (33 = Factura
   Electrónica, 39 = Boleta Electrónica — son códigos estándar del SII, no
   específicos de Defontana, pero confírmalos en tu cuenta).

Credenciales por variables de entorno (no hardcodear):
  DEFONTANA_CLIENT, DEFONTANA_COMPANY, DEFONTANA_USER, DEFONTANA_PASSWORD
      (los 4 son obligatorios para el login — ver GET /api/Auth. "USER" es
      normalmente tu email de acceso a Defontana; CLIENT/COMPANY dependen de
      tu cuenta, confírmalos con tu ejecutivo Defontana si el login falla)
  DEFONTANA_BASE_URL   (default: https://api.defontana.com)
  DEFONTANA_DRY_RUN    (1 = no escribe nada en Defontana, solo imprime)
  WC_BASE_URL          (default: https://casamado.cl/wp-json)
  WC_CONSUMER_KEY, WC_CONSUMER_SECRET   (generadas en WooCommerce > Ajustes >
      Avanzado > REST API, dedicadas a esta integración — no reutilizar la
      Application Password de los scripts de importación)
"""
import os
import time
import requests

DEFONTANA_BASE_URL = os.environ.get("DEFONTANA_BASE_URL", "https://api.defontana.com")
DEFONTANA_DRY_RUN = os.environ.get("DEFONTANA_DRY_RUN") == "1"
WC_BASE_URL = os.environ.get("WC_BASE_URL", "https://casamado.cl/wp-json")

PROGRESS_FILE = "defontana_sync_progreso.json"

# Códigos de tipo de documento tributario electrónico (estándar SII Chile,
# no específicos de Defontana).
SII_FACTURA_ELECTRONICA = "33"
SII_BOLETA_ELECTRONICA = "39"


class DefontanaClient:
    """
    Rutas confirmadas contra el SDK real (src/Service/*.php del repo
    LordNeoZ/defontana-sdk-php):
      - Auth:      GET  /api/Auth                (query: client, company, user, password)
      - Clientes:  GET  /api/Sale/GetClients      (query: status, itemsPerPage, pageNumber, legalCode?, description?)
                   POST /api/Sale/SaveClient      (body: ClientInputData)
      - Productos: GET  /api/Sale/Getproducts     (query: status, itemsPerPage, pageNumber, code?, description?)
      - Documento: POST /api/Sale/ElectronicDocument (body: ElectronicDocumentInput)
    """

    def __init__(self):
        self.client = os.environ["DEFONTANA_CLIENT"]
        self.company = os.environ["DEFONTANA_COMPANY"]
        self.user = os.environ["DEFONTANA_USER"]
        self.password = os.environ["DEFONTANA_PASSWORD"]
        self.session = requests.Session()
        self._token = None
        self._token_expires_at = 0

    def _authenticate(self):
        r = self.session.get(
            f"{DEFONTANA_BASE_URL}/api/Auth",
            params={
                "client": self.client,
                "company": self.company,
                "user": self.user,
                "password": self.password,
            },
            timeout=30,
        )
        r.raise_for_status()
        data = r.json()
        if not data.get("success") or not data.get("access_token"):
            raise RuntimeError(f"Login Defontana falló: {data.get('message', data)}")
        self._token = data["access_token"]
        self._token_expires_at = time.time() + int(data.get("expires_in", 3600)) - 60

    def _token_valid(self):
        return self._token and time.time() < self._token_expires_at

    def _headers(self):
        if not self._token_valid():
            self._authenticate()
        return {"Authorization": f"Bearer {self._token}"}

    def _get_paginated(self, path, extra_params, items_per_page=100):
        """GetClients/Getproducts usan itemsPerPage/pageNumber. La forma exacta
        de la respuesta (lista plana vs {items:[...], total:N}) no se verificó
        en vivo; se prueban ambas formas."""
        page = 1
        while True:
            params = {"itemsPerPage": items_per_page, "pageNumber": page, **extra_params}
            r = self.session.get(f"{DEFONTANA_BASE_URL}{path}", params=params, headers=self._headers(), timeout=30)
            r.raise_for_status()
            data = r.json()
            batch = data
            if isinstance(data, dict):
                for key in ("items", "data", "result", "results"):
                    if isinstance(data.get(key), list):
                        batch = data[key]
                        break
            if not batch:
                return
            yield from batch
            if len(batch) < items_per_page:
                return
            page += 1

    def get_products(self, status=1):
        """status: 0=todos, 1=activos, 2=inactivos."""
        yield from self._get_paginated("/api/Sale/Getproducts", {"status": status})

    def get_clients(self, status=1):
        yield from self._get_paginated("/api/Sale/GetClients", {"status": status})

    def upsert_customer(self, rut, name, email, address="", district="", giro="", rubro_id=None):
        # Campos confirmados de ClientInputData. rubroId es un ID interno de
        # Defontana (ver GET /api/Sale/GetRubro) — sin valor por defecto seguro.
        payload = {
            "legalCode": rut,
            "name": name,
            "email": email,
            "address": address,
            "district": district,
            "giro": giro,
        }
        if rubro_id is not None:
            payload["rubroId"] = rubro_id
        if DEFONTANA_DRY_RUN:
            print(f"[DRY RUN] POST /api/Sale/SaveClient {payload}")
            return payload
        r = self.session.post(f"{DEFONTANA_BASE_URL}/api/Sale/SaveClient", json=payload,
                               headers=self._headers(), timeout=30)
        r.raise_for_status()
        return r.json()

    def create_electronic_document(self, sii_code, customer_rut, customer_name, items, order_reference,
                                    customer_email="", customer_address="", customer_giro=""):
        """sii_code: SII_FACTURA_ELECTRONICA ('33') o SII_BOLETA_ELECTRONICA ('39').
        items: lista de dicts {code, name, quantity, price}."""
        today = time.localtime()
        payload = {
            "electronicCode": sii_code,
            "externalDocumentID": order_reference,
            "emissionDate": {"day": today.tm_mday, "month": today.tm_mon, "year": today.tm_year},
            "clientData": {
                "legalCode": customer_rut,
                "name": customer_name,
                "email": customer_email,
                "address": customer_address,
                "giro": customer_giro,
            },
            "details": [
                {
                    "count": item["quantity"],
                    "price": item["price"],
                    "productData": {"code": item["code"], "name": item["name"]},
                }
                for item in items
            ],
        }
        if DEFONTANA_DRY_RUN:
            print(f"[DRY RUN] POST /api/Sale/ElectronicDocument {payload}")
            return payload
        r = self.session.post(f"{DEFONTANA_BASE_URL}/api/Sale/ElectronicDocument", json=payload,
                               headers=self._headers(), timeout=30)
        r.raise_for_status()
        return r.json()


class WooCommerceClient:
    def __init__(self):
        self.auth = (os.environ["WC_CONSUMER_KEY"], os.environ["WC_CONSUMER_SECRET"])
        self.base = f"{WC_BASE_URL}/wc/v3"

    def list_products(self, per_page=100):
        page = 1
        while True:
            r = requests.get(f"{self.base}/products", auth=self.auth,
                              params={"per_page": per_page, "page": page}, timeout=30)
            r.raise_for_status()
            batch = r.json()
            if not batch:
                return
            yield from batch
            if len(batch) < per_page:
                return
            page += 1

    def update_product_by_sku(self, sku, price=None, stock=None):
        r = requests.get(f"{self.base}/products", auth=self.auth, params={"sku": sku}, timeout=30)
        r.raise_for_status()
        matches = r.json()
        if not matches:
            return None
        product_id = matches[0]["id"]
        payload = {}
        if price is not None:
            payload["regular_price"] = str(price)
        if stock is not None:
            payload["manage_stock"] = True
            payload["stock_quantity"] = stock
        r = requests.put(f"{self.base}/products/{product_id}", auth=self.auth, json=payload, timeout=30)
        r.raise_for_status()
        return r.json()

    def list_paid_orders(self, per_page=50):
        page = 1
        while True:
            r = requests.get(f"{self.base}/orders", auth=self.auth,
                              params={"status": "processing", "per_page": per_page, "page": page}, timeout=30)
            r.raise_for_status()
            batch = r.json()
            if not batch:
                return
            yield from batch
            if len(batch) < per_page:
                return
            page += 1


def _load_progress():
    if os.path.exists(PROGRESS_FILE):
        import json
        with open(PROGRESS_FILE) as f:
            return set(json.load(f))
    return set()


def _save_progress(done_ids):
    import json
    with open(PROGRESS_FILE, "w") as f:
        json.dump(list(done_ids), f)


def sync_productos_y_precios(defontana: DefontanaClient, woo: WooCommerceClient):
    """Defontana -> WooCommerce: actualiza precio/stock por SKU (código de producto)."""
    actualizados = sin_match = 0
    for p in defontana.get_products():
        sku = p.get("code") or p.get("sku") or p.get("codigo")
        precio = p.get("price") or p.get("precio")
        stock = p.get("stock")
        if not sku:
            continue
        result = woo.update_product_by_sku(sku, price=precio, stock=stock)
        if result:
            actualizados += 1
        else:
            sin_match += 1
    print(f"Productos actualizados: {actualizados} | Sin match en WooCommerce: {sin_match}")


def sync_clientes_y_facturacion(defontana: DefontanaClient, woo: WooCommerceClient):
    """WooCommerce -> Defontana: por cada orden pagada, crea/actualiza cliente y emite el documento electrónico."""
    done = _load_progress()
    for order in woo.list_paid_orders():
        order_id = str(order["id"])
        if order_id in done:
            continue

        billing = order.get("billing", {})
        rut = billing.get("company") or billing.get("_billing_rut", "")
        nombre = f"{billing.get('first_name', '')} {billing.get('last_name', '')}".strip()
        email = billing.get("email", "")
        direccion = billing.get("address_1", "")

        defontana.upsert_customer(rut=rut, name=nombre, email=email, address=direccion)

        items = [{
            "code": li.get("sku", ""),
            "name": li["name"],
            "quantity": li["quantity"],
            "price": li["price"],
        } for li in order.get("line_items", [])]

        sii_code = SII_FACTURA_ELECTRONICA if rut else SII_BOLETA_ELECTRONICA
        defontana.create_electronic_document(
            sii_code=sii_code, customer_rut=rut, customer_name=nombre, items=items,
            order_reference=order_id, customer_email=email, customer_address=direccion,
        )

        tipo = "factura" if rut else "boleta"
        print(f"Orden {order_id}: cliente sincronizado, {tipo} generada")
        done.add(order_id)
        _save_progress(done)


if __name__ == "__main__":
    defontana = DefontanaClient()
    woo = WooCommerceClient()

    print("=== Sincronizando productos y precios (Defontana -> WooCommerce) ===")
    sync_productos_y_precios(defontana, woo)

    print("\n=== Sincronizando clientes y facturación (WooCommerce -> Defontana) ===")
    sync_clientes_y_facturacion(defontana, woo)
