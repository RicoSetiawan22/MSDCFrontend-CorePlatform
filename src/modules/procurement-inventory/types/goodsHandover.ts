export type AssetCategory = "server" | "network" | "rack" | "cooling" | "power" | "other";

export interface GoodsHandoverLine {
  id: number;
  goods_handover_id: number;
  goods_receipt_line_id: number;
  item_id: number | null;
  description: string;
  quantity: number;
  uom: string;
  needs_asset_tag: boolean;
  asset_id: number | null;
  notes: string | null;
  asset?: { id: number; asset_number: string; asset_name: string } | null;
}

export interface GoodsHandover {
  id: number;
  organization_id: number;
  handover_number: string;
  goods_receipt_id: number;
  purchase_order_id: number;
  warehouse_id: number;
  handed_over_by_employee_id: number;
  received_by_employee_id: number;
  handover_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lines?: GoodsHandoverLine[];
  goods_receipt?: { id: number; grn_number: string } | null;
  purchase_order?: { id: number; po_number: string; vendor?: { id: number; vendor_name: string } | null } | null;
  warehouse?: { id: number; warehouse_name: string } | null;
  handed_over_by_employee?: { id: number; full_name: string } | null;
  received_by_employee?: { id: number; full_name: string } | null;
}

export interface GoodsHandoverListParams {
  page?: number;
  per_page?: number;
  purchase_order_id?: number;
  search?: string;
}

export interface HandoverAvailabilityLine {
  goods_receipt_line_id: number;
  description: string;
  uom: string;
  quantity_received: number;
  quantity_available: number;
  /** Sudah dicatat sejak BAST diupload (lihat form Terima Barang) - kalau
   * ada, otomatis diwariskan ke Aset saat baris ini ditandai Kode Barang. */
  warranty_expiry: string | null;
}

export interface HandoverAvailability {
  goods_receipt: { id: number; grn_number: string; warehouse: { id: number; warehouse_name: string } | null; purchase_order_id: number };
  suggested_receiver: { id: number; full_name: string; employee_number?: string } | null;
  lines: HandoverAvailabilityLine[];
}

export interface CreateGoodsHandoverValues {
  goods_receipt_id: number;
  received_by_employee_id: number;
  handed_over_by_employee_id?: number;
  handover_date?: string;
  notes?: string;
  lines: Array<{
    goods_receipt_line_id: number;
    quantity: number;
    needs_asset_tag?: boolean;
    asset_code?: string;
    asset_category?: AssetCategory;
    notes?: string;
  }>;
}

/** GRN 'posted' yang MASIH ADA sisa - dipakai picker FSTB baru, BEDA dari
 * GoodsReceipt penuh di types/grn.ts (cukup field buat ditampilkan di
 * dropdown, lihat GoodsHandoverController::receiptsAvailable()). */
export interface AvailableGrnForHandover {
  id: number;
  grn_number: string;
  purchase_order?: { id: number; po_number: string; vendor?: { id: number; vendor_name: string } | null } | null;
}
