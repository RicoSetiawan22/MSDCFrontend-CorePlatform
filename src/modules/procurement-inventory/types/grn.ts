export type GrnStatus = "draft" | "posted" | "cancelled";

/** Field-field ini HARUS cocok persis dengan GoodsReceiptLine entity
 * (Modules/ProcurementInventory/app/Entities/GoodsReceiptLine.php) - versi
 * sebelumnya (item_name/qty_order/qty_received/qty_rejected/unit/
 * warehouse_location) TIDAK ADA satupun yang cocok dengan backend asli. */
export interface GoodsReceiptLine {
  id: number;
  goods_receipt_id: number;
  purchase_order_line_id: number;
  quantity_received: number;
  unit_cost: number;
  condition: "good" | "damaged";
  site_id: number | null;
  device_type: string | null;
  /** Garansi TOKO/vendor - diisi Admin Gudang saat BAST diupload, dibaca
   * otomatis nanti oleh form Klaim Garansi (FGBG) - lihat
   * WarrantyClaimController::poReceiptItems(). */
  warranty_expiry: string | null;
  notes: string | null;
  purchase_order_line?: { id: number; description: string; quantity: number; uom: string; is_dc_asset?: boolean; item_id?: number | null; line_type?: "goods" | "service" } | null;
}

export interface GoodsReceipt {
  id: number;
  grn_number: string;
  purchase_order_id: number | null;
  warehouse_id: number | null;
  receipt_date: string;
  status: GrnStatus;
  received_by: number | null;
  /** hr_employee.id yang menerima barang - resolve otomatis dari received_by
   * (akun yang login saat draft GRN dibuat), lihat GoodsReceiptController::
   * storeDraft(). Dipakai Laporan Penerimaan Barang. */
  employee_id: number | null;
  ap_bill_id: number | null;
  bast_file_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lines?: GoodsReceiptLine[];
  purchase_order?: { id: number; po_number: string; vendor?: { id: number; vendor_name: string } | null } | null;
  bast_file?: { id: number; original_name: string; mime_type?: string | null } | null;
  employee?: { id: number; full_name: string } | null;
}

export interface GoodsReceiptListParams {
  page?: number;
  per_page?: number;
  status?: GrnStatus;
  purchase_order_id?: number;
  employee_id?: number;
}

export interface CreateGrnDraftValues {
  warehouse_id: number;
  receipt_date?: string;
  notes?: string;
  bast_file_id?: number;
  lines: Array<{
    purchase_order_line_id: number;
    quantity_received: number;
    unit_cost: number;
    condition?: "good" | "damaged";
    warranty_expiry?: string;
  }>;
}
