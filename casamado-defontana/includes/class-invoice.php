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
        $result  = $api->save_sale( $payload );

        if ( isset( $result['error'] ) ) {
            $order->add_order_note( 'Defontana ERROR: ' . $result['error'] );
            return;
        }

        $doc_id = $result['documentID'] ?? $result['id'] ?? '';
        $folio  = $result['folio'] ?? $result['number'] ?? '';
        $order->update_meta_data( '_cd_defontana_doc_id', $doc_id );
        $order->update_meta_data( '_cd_defontana_folio', $folio );
        $order->save();
        $order->add_order_note( sprintf( 'DTE generado en Defontana. Folio: %s', $folio ?: $doc_id ) );
    }

    private function build_payload( WC_Order $order ): array {
        $doc_type    = $this->resolve_document_type( $order );
        $billing_rut = $order->get_meta( '_billing_rut' ) ?: $order->get_meta( 'billing_rut' );

        $details = [];
        foreach ( $order->get_items() as $item ) {
            /** @var WC_Order_Item_Product $item */
            $product   = $item->get_product();
            $unit_net  = round( $item->get_subtotal() / $item->get_quantity(), 2 );

            $details[] = [
                'productCode' => $product ? ( $product->get_sku() ?: (string) $product->get_id() ) : 'SIN-SKU',
                'detail'      => $item->get_name(),
                'quantity'    => $item->get_quantity(),
                'unitValue'   => $unit_net,
            ];
        }

        // Shipping como línea adicional si existe
        $shipping_total = (float) $order->get_shipping_total();
        if ( $shipping_total > 0 ) {
            $details[] = [
                'productCode' => 'DESPACHO',
                'detail'      => 'Despacho',
                'quantity'    => 1,
                'unitValue'   => $shipping_total,
            ];
        }

        return [
            'documentType' => (int) $doc_type,
            'issueDate'    => current_time( 'Y-m-d' ),
            'client'       => [
                'legalName'  => trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() ),
                'legalCode'  => $billing_rut ?: '66666666-6', // RUT genérico para boletas sin RUT
                'email'      => $order->get_billing_email(),
                'address'    => $order->get_billing_address_1(),
                'district'   => $order->get_billing_city(),
            ],
            'details'      => $details,
            'comment'      => 'Pedido WooCommerce #' . $order->get_order_number(),
        ];
    }

    private function resolve_document_type( WC_Order $order ): string {
        $default = get_option( 'cd_default_doc_type', '39' ); // 39 = Boleta, 33 = Factura
        $rut     = $order->get_meta( '_billing_rut' ) ?: $order->get_meta( 'billing_rut' );

        // Si el cliente ingresó RUT y eligió factura, usar código 33
        $wants_invoice = $order->get_meta( '_billing_invoice_type' ) === 'factura';

        if ( $wants_invoice && $rut ) {
            return '33';
        }

        return $default;
    }
}
