<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class CD_Admin {

    public function __construct() {
        add_action( 'admin_menu', [ $this, 'add_menu' ] );
        add_action( 'admin_init', [ $this, 'register_settings' ] );
        add_action( 'admin_post_cd_test_connection', [ $this, 'handle_test_connection' ] );
        add_action( 'admin_post_cd_force_sync', [ $this, 'handle_force_sync' ] );
    }

    public function add_menu(): void {
        add_submenu_page(
            'woocommerce',
            'Defontana',
            'Defontana',
            'manage_woocommerce',
            'casamado-defontana',
            [ $this, 'render_page' ]
        );
    }

    public function register_settings(): void {
        register_setting( 'cd_settings', 'cd_defontana_email' );
        register_setting( 'cd_settings', 'cd_defontana_password' );
        register_setting( 'cd_settings', 'cd_invoice_trigger' );
        register_setting( 'cd_settings', 'cd_default_doc_type' );
        register_setting( 'cd_settings', 'cd_sync_interval' );
        register_setting( 'cd_settings', 'cd_price_list_code' );
    }

    public function render_page(): void {
        $last_sync = get_option( 'cd_last_sync' );
        ?>
        <div class="wrap">
            <h1>Casamado &mdash; Integración Defontana</h1>

            <?php settings_errors( 'cd_settings' ); ?>

            <form method="post" action="options.php">
                <?php settings_fields( 'cd_settings' ); ?>

                <h2>Credenciales Defontana</h2>
                <table class="form-table">
                    <tr>
                        <th>Email de acceso</th>
                        <td>
                            <input type="email" name="cd_defontana_email"
                                   value="<?php echo esc_attr( get_option( 'cd_defontana_email' ) ); ?>"
                                   class="regular-text" autocomplete="off" />
                            <p class="description">El mismo email con que ingresas a Defontana ERP.</p>
                        </td>
                    </tr>
                    <tr>
                        <th>Contraseña de acceso</th>
                        <td>
                            <input type="password" name="cd_defontana_password"
                                   value="<?php echo esc_attr( get_option( 'cd_defontana_password' ) ); ?>"
                                   class="regular-text" autocomplete="off" />
                            <p class="description">Contraseña de acceso al ERP (se guarda cifrada en la base de datos de WordPress).</p>
                        </td>
                    </tr>
                </table>

                <h2>Facturación electrónica</h2>
                <table class="form-table">
                    <tr>
                        <th>Generar DTE cuando el pedido pase a</th>
                        <td>
                            <select name="cd_invoice_trigger">
                                <option value="processing" <?php selected( get_option( 'cd_invoice_trigger', 'processing' ), 'processing' ); ?>>En procesamiento</option>
                                <option value="completed"  <?php selected( get_option( 'cd_invoice_trigger', 'processing' ), 'completed' ); ?>>Completado</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>Tipo de documento por defecto</th>
                        <td>
                            <select name="cd_default_doc_type">
                                <option value="39" <?php selected( get_option( 'cd_default_doc_type', '39' ), '39' ); ?>>Boleta electrónica (39)</option>
                                <option value="33" <?php selected( get_option( 'cd_default_doc_type', '39' ), '33' ); ?>>Factura electrónica (33)</option>
                            </select>
                        </td>
                    </tr>
                </table>

                <h2>Sincronización de precios</h2>
                <table class="form-table">
                    <tr>
                        <th>Lista de precios (código)</th>
                        <td>
                            <input type="text" name="cd_price_list_code"
                                   value="<?php echo esc_attr( get_option( 'cd_price_list_code' ) ); ?>"
                                   class="regular-text" placeholder="Ej: LISTA1" />
                            <p class="description">Código de lista de precios en Defontana. Si se deja vacío, se usan los precios del catálogo general.</p>
                        </td>
                    </tr>
                    <tr>
                        <th>Frecuencia de sincronización</th>
                        <td>
                            <select name="cd_sync_interval">
                                <option value="hourly"     <?php selected( get_option( 'cd_sync_interval', 'hourly' ), 'hourly' ); ?>>Cada hora</option>
                                <option value="twicedaily" <?php selected( get_option( 'cd_sync_interval', 'hourly' ), 'twicedaily' ); ?>>Dos veces al día</option>
                                <option value="daily"      <?php selected( get_option( 'cd_sync_interval', 'hourly' ), 'daily' ); ?>>Una vez al día</option>
                            </select>
                            <?php if ( $last_sync ) : ?>
                                <p class="description">
                                    Última sync: <?php echo esc_html( $last_sync['time'] ); ?>
                                    — <?php echo (int) $last_sync['updated']; ?> producto(s) actualizados.
                                </p>
                            <?php endif; ?>
                        </td>
                    </tr>
                </table>

                <?php submit_button( 'Guardar configuración' ); ?>
            </form>

            <hr>
            <h2>Herramientas</h2>
            <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:inline">
                <input type="hidden" name="action" value="cd_test_connection">
                <?php wp_nonce_field( 'cd_test_connection' ); ?>
                <?php submit_button( 'Probar conexión API', 'secondary', 'submit', false ); ?>
            </form>
            &nbsp;
            <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:inline">
                <input type="hidden" name="action" value="cd_force_sync">
                <?php wp_nonce_field( 'cd_force_sync' ); ?>
                <?php submit_button( 'Sincronizar precios ahora', 'secondary', 'submit', false ); ?>
            </form>
        </div>
        <?php
    }

    public function handle_test_connection(): void {
        check_admin_referer( 'cd_test_connection' );
        $api = new CD_Defontana_API();
        $ok  = $api->test_connection();
        $msg = $ok ? 'Conexión exitosa con Defontana.' : 'No se pudo conectar. Revisa el token.';
        $type = $ok ? 'updated' : 'error';
        wp_redirect( add_query_arg( [ 'page' => 'casamado-defontana', $type => urlencode( $msg ) ], admin_url( 'admin.php' ) ) );
        exit;
    }

    public function handle_force_sync(): void {
        check_admin_referer( 'cd_force_sync' );
        ( new CD_PriceSync() )->run();
        wp_redirect( add_query_arg( [ 'page' => 'casamado-defontana', 'updated' => urlencode( 'Sincronización completada.' ) ], admin_url( 'admin.php' ) ) );
        exit;
    }
}
