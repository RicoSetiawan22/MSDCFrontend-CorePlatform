/** Status ASLI dari kolom enum proc_purchase_order.status (backend) - lihat
 * migrasi create_proc_purchase_order_tables. Sebelumnya di sini ada
 * "confirmed"/"received" yang TIDAK PERNAH ada di backend (bikin tombol
 * "Kirim" tidak pernah muncul karena kondisinya cek status yang mustahil
 * terjadi) - sudah disamakan persis. */
export type PoStatus = "draft" | "submitted" | "approved" | "sent_to_vendor" | "partially_received" | "completed" | "cancelled" | "rejected";

/** 'service' = jasa/perbaikan - tidak masuk Item & Inventory saat GRN
 * di-post, meski GRN/AP Bill-nya sendiri tetap tercatat penuh. */
export type PoLineType = "goods" | "service";

export interface PurchaseOrderLine {
  id: number;
  purchase_order_id: number;
  item_id: number | null;
  line_type: PoLineType;
  description: string;
  quantity: number;
  uom: string;
  unit_price: number;
  discount_pct: number;
  is_dc_asset: boolean;
  capitalize_as_fixed_asset: boolean;
}

export interface PurchaseOrder {
  id: number;
  organization_id: number;
  po_number: string;
  purchase_request_id: number | null;
  vendor_id: number | null;
  order_date: string;
  expected_delivery_date: string | null;
  status: PoStatus;
  workflow_instance_id: number | null;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lines?: PurchaseOrderLine[];
  vendor?: {
    id: number; vendor_name: string; legal_name?: string | null;
    contacts?: { id: number; name: string; email: string | null; is_primary: boolean }[];
  } | null;
  purchase_request?: { id: number; pr_number: string } | null;
}

export interface PurchaseOrderListParams {
  page?: number;
  per_page?: number;
  status?: PoStatus;
  vendor_id?: number;
  search?: string;
}
