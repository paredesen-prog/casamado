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
        $api  = new CD_Defontana_API();
        $page = 1;
        $updated = 0;

        do {
            $response = $api->get_products( $page );
            $items    = $response['items'] ?? $response['data'] ?? [];

            foreach ( $items as $item ) {
                $sku   = $item['code'] ?? $item['itemCode'] ?? '';
                $price = $item['salePrice'] ?? $item['price'] ?? null;

                if ( ! $sku || $price === null ) continue;

                $product_id = wc_get_product_id_by_sku( $sku );
                if ( ! $product_id ) continue;

                $product = wc_get_product( $product_id );
                if ( ! $product ) continue;

                $product->set_regular_price( (string) $price );
                $product->save();
                $updated++;
            }

            $total_pages = $response['totalPages'] ?? $response['pages'] ?? 1;
            $page++;
        } while ( $page <= $total_pages );

        update_option( 'cd_last_sync', [
            'time'    => current_time( 'mysql' ),
            'updated' => $updated,
        ] );
    }

    public static function clear_schedule(): void {
        $timestamp = wp_next_scheduled( self::CRON_HOOK );
        if ( $timestamp ) {
            wp_unschedule_event( $timestamp, self::CRON_HOOK );
        }
    }
}
