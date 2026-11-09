# Integración Defontana ↔ Casamado (WooCommerce)

Script propio (`defontana_sync.py`, en la raíz del repo) que sincroniza
**productos y precios**, **clientes** y **facturación (boletas/facturas)**
entre Defontana y la tienda WooCommerce (`casamado.cl`).

## Estado actual

- **Lado WooCommerce: probado contra la tienda real.** `list_products()` y
  `list_paid_orders()` se corrieron contra `casamado.cl` y devuelven datos
  reales (incluye órdenes "processing" ya pendientes de facturar, ej. pedido
  #10238 "Edificio Eco Fusion" por $280.031). `update_product_by_sku()` usa el
  mismo patrón de autenticación ya probado, no se ejecutó en vivo para no
  tocar precios reales sin supervisión.
- **Lado Defontana: rutas y payloads verificados contra un SDK real, pero sin
  probar contra la cuenta de Casamado.** Este entorno remoto bloquea de forma
  permanente las conexiones salientes a `api.defontana.com` (es política de
  red del entorno, no un bug — confirmado con el estado del proxy: "gateway
  answered 403 to CONNECT"). Ninguna cantidad de reintentos lo va a destrabar
  desde aquí.

## Cómo se verificaron las rutas de Defontana

La versión anterior de este script tenía rutas **adivinadas** a partir de
documentación pública (`/api/Producto`, `/api/Cliente`, `/api/DocumentoVenta`)
que resultaron **incorrectas**. Esta versión usa las rutas reales, confirmadas
leyendo el código fuente de un SDK PHP no oficial pero funcional
([github.com/LordNeoZ/defontana-sdk-php](https://github.com/LordNeoZ/defontana-sdk-php)),
generado automáticamente desde el OpenAPI spec real de Defontana:

| Operación | Ruta real confirmada | Antes (incorrecto) |
|---|---|---|
| Login | `GET /api/Auth` (query: client, company, user, password) | `POST /api/Auth` (JSON: user, password) |
| Listar productos | `GET /api/Sale/Getproducts` | `GET /api/Producto` |
| Listar clientes | `GET /api/Sale/GetClients` | — |
| Crear/editar cliente | `POST /api/Sale/SaveClient` | `POST /api/Cliente` |
| Emitir boleta/factura | `POST /api/Sale/ElectronicDocument` | `POST /api/DocumentoVenta` |

El login en particular era un error importante: la versión anterior hacía
`POST` con `{user, password}` en JSON. La real es `GET` con 4 parámetros de
query (`client`, `company`, `user`, `password`) — los mismos 4 que ya probaba
`diagnostico_defontana.py` por intuición, así que ese diagnóstico iba por el
camino correcto.

## Qué falta para darlo por "listo" de verdad

No puedo completarlo desde este entorno porque no hay forma de hacer una sola
llamada real a `api.defontana.com`. Pasos para que alguien con acceso a
internet normal (tu notebook, por ejemplo) lo termine:

1. **Probar el login.** Correr `diagnostico_defontana.py` (ya estaba en el
   repo) con tu email y tu password de Defontana — te va a pedir también el
   RUT para probar combinaciones de `client`/`company`. Si no es RUT directo,
   pregúntale a tu ejecutivo Defontana cuáles son tus valores de `client` y
   `company` (son identificadores internos de la cuenta, no inventados).
2. **Confirmar `rubroId`.** `upsert_customer()` puede necesitar este campo
   (ID interno de "rubro"/giro en Defontana) — se obtiene con
   `GET /api/Sale/GetRubro` una vez que el login funcione. Sin este dato
   puede que Defontana rechace clientes nuevos.
3. **Correr con `DEFONTANA_DRY_RUN=1` primero.** El script nuevo soporta esta
   variable de entorno — con ella activa, no hace ningún POST real a
   Defontana, solo imprime qué mandaría. Así se valida la forma de los datos
   (¿`get_products()` trae `code`/`price` con esos nombres exactos? ¿las
   órdenes de WooCommerce traen el RUT en `billing.company`?) sin riesgo.
4. **Recién ahí, sacar el dry-run** y correrlo de verdad, idealmente primero
   con un solo producto/cliente de prueba antes de dejarlo corriendo con todo
   el catálogo.

## Paso 1 — Generar credenciales dedicadas en WooCommerce

1. Entrar al admin de WordPress → **WooCommerce > Ajustes > Avanzado > REST API**.
2. Click en **"Agregar clave" (Add key)**.
3. Descripción: `Defontana Sync` (o similar).
4. Permisos: **Lectura/Escritura**.
5. Guardar y copiar `Consumer Key` (`ck_...`) y `Consumer Secret` (`cs_...`) —
   el secret solo se muestra una vez. No reutilizar la Application Password
   que usan los scripts de importación de productos de este repo.

## Alternativa: Plugin Ecommerce oficial de Defontana

En vez de este script, Defontana ofrece un plugin oficial que se conecta
directo a WooCommerce sin necesidad de mantener código propio. Ventaja: no
depende de este script. Desventaja: requiere login interactivo de wp-admin
durante la configuración (no se puede hacer desde este entorno).

1. En Defontana ERP → módulo **Plugin E-Commerce** → "⋮" → **Configurar Plugin**.
2. **Autorizar** → login con tu usuario/contraseña de WordPress (o las
   Consumer Key/Secret del Paso 1, según la versión del panel).
3. Endpoint a registrar: `https://casamado.cl/wp-json/wc/v3`.
4. Activar los flujos que necesites: productos/precios, facturación,
   clientes.
5. Referencias: [Centro de Ayuda Defontana](https://intercom.help/defontanaerp/es/articles/8395409-configuracion-y-uso-plugin-ecommerce) ·
   [Integraciones Defontana](https://www.defontana.com/cl/integraciones/ecommerces)

## Notas de seguridad

- Credenciales de Defontana y WooCommerce solo por variable de entorno, nunca
  en el código (el script ya está así).
- Los scripts `importar_fasit_nuevos.py` y `buscar_imagenes_por_nombre.py`
  tienen una contraseña de WooCommerce en texto plano — rotarla y moverla a
  variable de entorno, independiente de esta integración.
