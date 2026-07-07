<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class CD_PriceSync {

    const CRON_HOOK = 'cd_price_sync_cron';

    public function __construct() {
        add_action( self::CRON_HOOK, [ $this, 'run' ] );

        if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
            $interval = get_option( 'cd_sync_interval', 'hourly' );
            wp_schedule_event( time(), $interval, self::CRON_HOOK );
        }
    }

    public function run(): void {
        $api             = new CD_Defontana_API();
        $price_list_code = get_option( 'cd_price_list_code', '' );
        $updated         = 0;

        if ( $price_list_code ) {
            $response = $api->get_price_list_detail( $price_list_code );
            $items    = $response['productList'] ?? $response['items'] ?? [];
            foreach ( $items as $item ) {
                $updated += $this->update_wc_product(
                    $item['productCode'] ?? $item['code'] ?? '',
                    $item['price'] ?? $item['salePrice'] ?? null
                );
            }
        } else {
            $page = 1;
            do {
                $response = $api->get_products( $page );
                $items    = $response['productList'] ?? $response['items'] ?? $response['data'] ?? [];

                foreach ( $items as $item ) {
                    $updated += $this->update_wc_product(
                        $item['productCode'] ?? $item['code'] ?? '',
                        $item['salePrice'] ?? $item['price'] ?? null
                    );
                }

                $total_pages = $response['totalPages'] ?? $response['pages'] ?? 1;
                $page++;
            } while ( $page <= $total_pages );
        }

        update_option( 'cd_last_sync', [
            'time'    => current_time( 'mysql' ),
            'updated' => $updated,
        ] );
    }

    private function update_wc_product( string $sku, $price ): int {
        if ( ! $sku || $price === null ) return 0;

        $product_id = wc_get_product_id_by_sku( $sku );
        if ( ! $product_id ) return 0;

        $product = wc_get_product( $product_id );
        if ( ! $product ) return 0;

        $product->set_regular_price( (string) $price );
        $product->save();
        return 1;
    }

    public static function clear_schedule(): void {
        $timestamp = wp_next_scheduled( self::CRON_HOOK );
        if ( $timestamp ) {
            wp_unschedule_event( $timestamp, self::CRON_HOOK );
        }
    }
}
