<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class CD_Defontana_API {

    private string $base_url = 'https://api.defontana.com/api';
    private string $token;

    public function __construct() {
        $this->token = get_option( 'cd_defontana_token', '' );
    }

    private function request( string $method, string $endpoint, array $body = [] ): array {
        $args = [
            'method'  => strtoupper( $method ),
            'headers' => [
                'Authorization' => 'Bearer ' . $this->token,
                'Content-Type'  => 'application/json',
                'Accept'        => 'application/json',
            ],
            'timeout' => 30,
        ];

        if ( ! empty( $body ) ) {
            $args['body'] = wp_json_encode( $body );
        }

        $response = wp_remote_request( $this->base_url . $endpoint, $args );

        if ( is_wp_error( $response ) ) {
            return [ 'error' => $response->get_error_message() ];
        }

        $code = wp_remote_retrieve_response_code( $response );
        $data = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code >= 400 ) {
            return [ 'error' => $data['message'] ?? "HTTP $code" ];
        }

        return $data ?? [];
    }

    public function get_products( int $page = 1, int $per_page = 100 ): array {
        return $this->request( 'GET', "/Sale/Item?page=$page&itemsPerPage=$per_page" );
    }

    public function create_document( array $payload ): array {
        return $this->request( 'POST', '/Sale/SaleDocument', $payload );
    }

    public function test_connection(): bool {
        $result = $this->request( 'GET', '/Sale/Item?page=1&itemsPerPage=1' );
        return ! isset( $result['error'] );
    }
}
