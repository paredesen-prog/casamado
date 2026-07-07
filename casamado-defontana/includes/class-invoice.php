<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class CD_Invoice {

    public function __construct() {
        $trigger = get_option( 'cd_invoice_trigger', 'processing' );
        add_action( 'woocommerce_order_status_' . $trigger, [ $this, 'send_to_defontana' ], 10, 2 );
    }

    public function send_to_defontana( int $order_id, WC_Order $order ): void {
        if ( $order->get_meta( '_cd_defontana_doc_id' ) ) {
            return; // ya fue enviada
        }

        $api     = new CD_Defontana_API();
        $payload = $this->build_payload( $order );
        $result  = $api->create_document( $payload );

        if ( isset( $result['error'] ) ) {
            $order->add_order_note( 'Defontana ERROR: ' . $result['error'] );
            return;
        }

        $doc_id = $result['id'] ?? $result['documentId'] ?? '';
        $order->update_meta_data( '_cd_defontana_doc_id', $doc_id );
        $order->update_meta_data( '_cd_defontana_folio', $result['folio'] ?? '' );
        $order->save();
        $order->add_order_note( sprintf( 'DTE generado en Defontana. Folio: %s', $result['folio'] ?? $doc_id ) );
    }

    private function build_payload( WC_Order $order ): array {
        $doc_type = $this->resolve_document_type( $order );

        $lines = [];
        foreach ( $order->get_items() as $item ) {
            /** @var WC_Order_Item_Product $item */
            $product = $item->get_product();
            $lines[] = [
                'itemCode'    => $product ? ( $product->get_sku() ?: (string) $product->get_id() ) : 'SIN-SKU',
                'description' => $item->get_name(),
                'quantity'    => $item->get_quantity(),
                'unitPrice'   => round( $item->get_subtotal() / $item->get_quantity(), 2 ),
            ];
        }

        $billing_rut = $order->get_meta( '_billing_rut' ) ?: $order->get_meta( 'billing_rut' );

        return [
            'documentTypeCode' => $doc_type,
            'issueDate'        => current_time( 'Y-m-d' ),
            'customer'         => [
                'legalName' => trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() ),
                'rut'       => $billing_rut ?: '',
                'email'     => $order->get_billing_email(),
                'address'   => $order->get_billing_address_1(),
                'city'      => $order->get_billing_city(),
            ],
            'lines'            => $lines,
            'observations'     => 'Pedido WooCommerce #' . $order->get_order_number(),
        ];
    }

    private function resolve_document_type( WC_Order $order ): string {
        $default = get_option( 'cd_default_doc_type', '39' ); // 39 = Boleta, 33 = Factura
        $rut     = $order->get_meta( '_billing_rut' ) ?: $order->get_meta( 'billing_rut' );

        // Si el cliente ingresó RUT de empresa y eligió factura, usar código 33
        $wants_invoice = $order->get_meta( '_billing_invoice_type' ) === 'factura';

        if ( $wants_invoice && $rut ) {
            return '33';
        }

        return $default;
    }
}
