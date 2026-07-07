<?php
/**
 * Plugin Name: Casamado Defontana
 * Description: Integración entre WooCommerce y Defontana: facturación electrónica y sincronización de precios.
 * Version: 1.0.0
 * Requires Plugins: woocommerce
 * Text Domain: casamado-defontana
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'CD_VERSION', '1.0.0' );
define( 'CD_PATH', plugin_dir_path( __FILE__ ) );

require_once CD_PATH . 'includes/class-defontana-api.php';
require_once CD_PATH . 'includes/class-invoice.php';
require_once CD_PATH . 'includes/class-price-sync.php';
require_once CD_PATH . 'includes/class-admin.php';

function cd_init() {
    new CD_Admin();
    new CD_Invoice();
    new CD_PriceSync();
}
add_action( 'plugins_loaded', 'cd_init' );
