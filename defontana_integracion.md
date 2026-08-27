# Integración Defontana ↔ Casamado (WooCommerce)

Guía para activar el **Plugin Ecommerce oficial de Defontana**, que conecta
directamente con la tienda WooCommerce (`casamado.cl`) sin necesidad de
scripts custom. Cubre lo pedido: **productos y precios**, **facturación
(boletas/facturas)** y **clientes**.

## Cómo funciona

Defontana se conecta a WooCommerce vía su API REST (`/wp-json/wc/v3`) usando
credenciales **Consumer Key / Consumer Secret** (distintas de la contraseña
de aplicación `WC_PASS` que usan los scripts de este repo — esa es solo para
los scripts de importación de productos, no sirve para el plugin de
Defontana). El panel Ecommerce de Defontana sincroniza en base a las órdenes
con estado "pagada".

## Paso 1 — Generar credenciales en WooCommerce

1. Entrar al admin de WordPress → **WooCommerce > Ajustes > Avanzado > REST API**.
2. Click en **"Agregar clave" (Add key)**.
3. Descripción: `Defontana Ecommerce Plugin`.
4. Usuario: el usuario de WordPress que administrará la integración.
5. Permisos: **Lectura/Escritura** (necesario para actualizar stock/precios y
   leer clientes y pedidos).
6. Guardar y copiar `Consumer Key` (`ck_...`) y `Consumer Secret` (`cs_...`).
   El secret solo se muestra una vez.

## Paso 2 — Configurar el plugin en Defontana

1. En Defontana ERP, ir al módulo **Plugin E-Commerce**.
2. En los "⋮" (tres puntos) de la integración, elegir **Configurar Plugin**.
3. En el modal de autorización, click **Autorizar**.
4. Se redirige al login de WooCommerce/WordPress — ingresar usuario y
   contraseña del sitio (o pegar Consumer Key/Secret, según la versión del
   panel).
5. Endpoint a registrar: `https://casamado.cl/wp-json/wc/v3`.
6. Tras autenticar, vuelve al módulo de configuración con estado **Configurado**.

## Paso 3 — Activar los flujos de datos

Dentro de la configuración del plugin, habilitar:

- **Productos y precios**: sincroniza catálogo y precios entre Defontana y
  WooCommerce (definir cuál sistema es la fuente de verdad para evitar
  sobrescrituras cruzadas).
- **Facturación (boletas/facturas)**: emite automáticamente el documento
  tributario en Defontana cuando una orden de WooCommerce pasa a estado
  "pagada".
- **Clientes**: sincroniza los datos de clientes de WooCommerce hacia la
  ficha de cliente en Defontana.

## Notas de seguridad

- Genera una Consumer Key/Secret **dedicada** para Defontana (no reutilices
  la contraseña de aplicación `WC_PASS` de los scripts de importación).
- Los scripts `importar_fasit_nuevos.py` y `buscar_imagenes_por_nombre.py`
  tienen actualmente una contraseña de WooCommerce en texto plano dentro del
  código — se recomienda rotarla y moverla a variable de entorno antes de
  seguir usándolos, independiente de esta integración.
- Revisa en Defontana qué usuario queda con permisos de autorización, ya que
  esa cuenta queda vinculada a la sincronización.

## Referencias

- [Configuración y uso Plugin Ecommerce – Centro de Ayuda Defontana](https://intercom.help/defontanaerp/es/articles/8395409-configuracion-y-uso-plugin-ecommerce)
- [Integración de Ecommerce a software Defontana](https://www.defontana.com/cl/integraciones/ecommerces)
- [API REST Integración 1.0.0 – Defontana](https://defontana.atlassian.net/wiki/spaces/CDAV2/pages/1168244737)
- [Swagger API Defontana](https://api.defontana.com/swagger/index.html)

## Alternativa: script custom (`defontana_sync.py`)

En vez del plugin oficial, se optó por un script propio (`defontana_sync.py`,
en la raíz del repo) que sincroniza directamente vía las APIs REST de
WooCommerce y Defontana. Ventaja: no depende del login interactivo de
wp-admin. Desventaja: hay que mantenerlo.

**Importante — no verificado en vivo**: este entorno remoto bloquea las
conexiones salientes a `api.defontana.com` (política de red del sandbox), así
que el script se escribió a partir de la documentación pública de Defontana,
sin poder probar la autenticación ni los endpoints reales. Antes de usarlo:

1. Confirmar en `https://api.defontana.com/swagger/index.html` las rutas
   exactas marcadas como `TODO` en el script (auth, productos, cliente,
   documento de venta) — pueden diferir de las asumidas.
2. Probar primero contra el ambiente de certificación si está disponible
   (`https://onboardingcertificacionapi.defontana.com`).
3. Configurar las variables de entorno (`DEFONTANA_EMAIL`,
   `DEFONTANA_PASSWORD`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`, etc. — ver
   cabecera del script). Las credenciales **no están** guardadas en este
   repo.

## Pendiente (requiere acceso que no tengo en esta sesión)

No tengo credenciales de WordPress admin, y aunque se me compartieron las
credenciales de Defontana en el chat, no pude usarlas porque este entorno
bloquea la salida de red hacia `api.defontana.com`. El script queda listo
para que alguien lo ejecute y valide desde un entorno con acceso (por
ejemplo, localmente o ajustando la política de red del entorno remoto).
