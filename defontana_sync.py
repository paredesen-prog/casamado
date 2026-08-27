"""
Sincronización Defontana <-> WooCommerce (casamado.cl).

NO VERIFICADO EN VIVO: este entorno remoto bloquea las conexiones salientes
a api.defontana.com (política de red del sandbox), así que este script se
escribió a partir de la documentación pública de Defontana (Confluence +
búsquedas), no probando contra la API real. Antes de usarlo en producción:
1. Confirmar en https://api.defontana.com/swagger/index.html las rutas
   exactas marcadas como TODO abajo (pueden diferir de las asumidas aquí).
2. Probar primero contra el ambiente de certificación
   (https://onboardingcertificacionapi.defontana.com) si está disponible.

Credenciales por variables de entorno (no hardcodear):
  DEFONTANA_EMAIL, DEFONTANA_PASSWORD
  DEFONTANA_BASE_URL   (default: https://api.defontana.com)
  DEFONTANA_CLIENT, DEFONTANA_COMPANY, DEFONTANA_USER   (opcionales, solo si
      la cuenta tiene acceso a más de un cliente/empresa/usuario y la API
      responde con "jumpUsers" pidiendo desambiguar)
  WC_BASE_URL          (default: https://casamado.cl/wp-json)
  WC_CONSUMER_KEY, WC_CONSUMER_SECRET   (generadas en WooCommerce > Ajustes >
      Avanzado > REST API, dedicadas a esta integración)
"""
import os
import time
import requests

DEFONTANA_BASE_URL = os.environ.get("DEFONTANA_BASE_URL", "https://api.defontana.com")
WC_BASE_URL = os.environ.get("WC_BASE_URL", "https://casamado.cl/wp-json")

PROGRESS_FILE = "defontana_sync_progreso.json"


class DefontanaClient:
    def __init__(self):
        self.email = os.environ["DEFONTANA_EMAIL"]
        self.password = os.environ["DEFONTANA_PASSWORD"]
        self.client = os.environ.get("DEFONTANA_CLIENT")
        self.company = os.environ.get("DEFONTANA_COMPANY")
        self.user = os.environ.get("DEFONTANA_USER")
        self.session = requests.Session()
        self._token = None
        self._token_expires_at = 0

    def _authenticate(self):
        # TODO: confirmar ruta exacta del endpoint de autenticación en Swagger.
        payload = {"user": self.email, "password": self.password}
        if self.client and self.company and self.user:
            payload.update({"client": self.client, "company": self.company, "userId": self.user})
        r = self.session.post(f"{DEFONTANA_BASE_URL}/api/Auth", json=payload, timeout=30)
        r.raise_for_status()
        data = r.json()

        if data.get("jumpUsers"):
            raise RuntimeError(
                "La cuenta tiene acceso a más de un cliente/empresa/usuario en Defontana. "
                "Define DEFONTANA_CLIENT, DEFONTANA_COMPANY y DEFONTANA_USER con uno de los "
                f"valores devueltos en jumpUsers: {data['jumpUsers']}"
            )

        auth_result = data.get("authResult", data)
        self._token = auth_result["access_token"]
        self._token_expires_at = time.time() + int(auth_result.get("expires_in", 3600)) - 60

    def _token_valid(self):
        return self._token and time.time() < self._token_expires_at

    def _headers(self):
        if not self._token_valid():
            self._authenticate()
        return {"Authorization": f"Bearer {self._token}"}

    def get_products(self):
        # TODO: confirmar ruta exacta (ej. /api/Producto o /api/Products) y
        # los nombres de campo de sku/precio/stock en la respuesta real.
        r = self.session.get(f"{DEFONTANA_BASE_URL}/api/Producto", headers=self._headers(), timeout=30)
        r.raise_for_status()
        return r.json()

    def upsert_customer(self, rut, name, email, address=""):
        # TODO: confirmar ruta y payload exactos (ej. /api/Cliente).
        payload = {"rut": rut, "name": name, "email": email, "address": address}
        r = self.session.post(f"{DEFONTANA_BASE_URL}/api/Cliente", json=payload, headers=self._headers(), timeout=30)
        r.raise_for_status()
        return r.json()

    def create_sales_document(self, doc_type, customer_rut, items, order_reference):
        """doc_type: 'boleta' o 'factura'."""
        # TODO: confirmar ruta y payload exactos (ej. /api/DocumentoVenta) y
        # el código que Defontana usa para distinguir boleta vs factura.
        payload = {
            "documentType": doc_type,
            "customerRut": customer_rut,
            "externalReference": order_reference,
            "items": items,
        }
        r = self.session.post(f"{DEFONTANA_BASE_URL}/api/DocumentoVenta", json=payload, headers=self._headers(), timeout=30)
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
    """Defontana -> WooCommerce: actualiza precio/stock por SKU."""
    productos = defontana.get_products()
    actualizados = sin_match = 0
    for p in productos:
        sku = p.get("sku") or p.get("codigo")
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
    """WooCommerce -> Defontana: por cada orden pagada, crea cliente y documento de venta."""
    done = _load_progress()
    for order in woo.list_paid_orders():
        order_id = str(order["id"])
        if order_id in done:
            continue

        billing = order.get("billing", {})
        rut = billing.get("company") or billing.get("_billing_rut", "")
        nombre = f"{billing.get('first_name', '')} {billing.get('last_name', '')}".strip()
        email = billing.get("email", "")

        defontana.upsert_customer(rut=rut, name=nombre, email=email,
                                   address=billing.get("address_1", ""))

        items = [{
            "sku": li.get("sku", ""),
            "name": li["name"],
            "quantity": li["quantity"],
            "price": li["price"],
        } for li in order.get("line_items", [])]

        doc_type = "factura" if rut else "boleta"
        defontana.create_sales_document(doc_type, rut, items, order_reference=order_id)

        print(f"Orden {order_id}: cliente sincronizado, {doc_type} generada")
        done.add(order_id)
        _save_progress(done)


if __name__ == "__main__":
    defontana = DefontanaClient()
    woo = WooCommerceClient()

    print("=== Sincronizando productos y precios (Defontana -> WooCommerce) ===")
    sync_productos_y_precios(defontana, woo)

    print("\n=== Sincronizando clientes y facturación (WooCommerce -> Defontana) ===")
    sync_clientes_y_facturacion(defontana, woo)
