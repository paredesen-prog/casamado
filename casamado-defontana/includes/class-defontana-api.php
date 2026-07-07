<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class CD_Defontana_API {

    private string $base_url = 'https://api.defontana.com/api';

    private function get_token(): string {
        $cached = get_transient( 'cd_defontana_session_token' );
        if ( $cached ) {
            return $cached;
        }
        return $this->login();
    }

    private function login(): string {
        $email    = get_option( 'cd_defontana_email', '' );
        $password = get_option( 'cd_defontana_password', '' );

        $url = add_query_arg(
            [ 'userMail' => $email, 'userPassword' => $password ],
            $this->base_url . '/Auth/EmailLogin'
        );

        $response = wp_remote_get( $url, [ 'timeout' => 15 ] );

        if ( is_wp_error( $response ) ) {
            return '';
        }

        $data  = json_decode( wp_remote_retrieve_body( $response ), true );
        $token = $data['token'] ?? '';

        if ( $token ) {
            // Token válido por 50 minutos (Defontana expira en 60)
            set_transient( 'cd_defontana_session_token', $token, 50 * MINUTE_IN_SECONDS );
        }

        return $token;
    }

    private function request( string $method, string $endpoint, array $body = [], array $query = [] ): array {
        $url = $this->base_url . $endpoint;
        if ( $query ) {
            $url = add_query_arg( $query, $url );
        }

        $args = [
            'method'  => strtoupper( $method ),
            'headers' => [
                'Authorization' => 'Bearer ' . $this->get_token(),
                'Content-Type'  => 'application/json',
                'Accept'        => 'application/json',
            ],
            'timeout' => 30,
        ];

        if ( ! empty( $body ) ) {
            $args['body'] = wp_json_encode( $body );
        }

        $response = wp_remote_request( $url, $args );

        if ( is_wp_error( $response ) ) {
            return [ 'error' => $response->get_error_message() ];
        }

        $code = wp_remote_retrieve_response_code( $response );
        $data = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code >= 400 ) {
            return [ 'error' => $data['message'] ?? $data['Message'] ?? "HTTP $code" ];
        }

        return $data ?? [];
    }

    /** Obtiene productos con precios desde Defontana */
    public function get_products( int $page = 1, int $per_page = 100 ): array {
        return $this->request( 'GET', '/Sale/Getproducts', [], [
            'page'         => $page,
            'itemsPerPage' => $per_page,
        ] );
    }

    /** Obtiene detalle de precios de una lista de precios específica */
    public function get_price_list_detail( string $price_list_code ): array {
        return $this->request( 'GET', '/Sale/GetPriceListDetail', [], [
            'priceListCode' => $price_list_code,
        ] );
    }

    /** Obtiene las listas de precios disponibles */
    public function get_price_lists(): array {
        return $this->request( 'GET', '/Sale/GetPriceList' );
    }

    /** Busca un cliente por RUT en el SII */
    public function search_client_by_rut( string $rut ): array {
        return $this->request( 'GET', '/Sale/SearchClientByLegalCode', [], [
            'legalCode' => $rut,
        ] );
    }

    /** Registra un cliente en Defontana */
    public function save_client( array $client_data ): array {
        return $this->request( 'POST', '/Sale/SaveClient', $client_data );
    }

    /** Genera un documento de venta (boleta/factura electrónica) */
    public function save_sale( array $payload ): array {
        return $this->request( 'POST', '/Sale/SaveSale', $payload );
    }

    /** Descarga el PDF del DTE en base64 */
    public function get_sale_pdf( string $document_id ): array {
        return $this->request( 'GET', '/Sale/GetEcommercePDFDocumentBase64', [], [
            'documentID' => $document_id,
        ] );
    }

    public function test_connection(): bool {
        delete_transient( 'cd_defontana_session_token' );
        $token = $this->login();
        return ! empty( $token );
    }
}
