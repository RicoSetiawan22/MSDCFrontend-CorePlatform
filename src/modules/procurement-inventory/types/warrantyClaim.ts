export type WarrantyClaimStatus = "draft" | "submitted" | "approved" | "rejected" | "sent_to_vendor" | "resolved" | "cancelled";

export interface WarrantyClaim {
  id: number;
  organization_id: number;
  claim_number: string;
  purchase_order_id: number;
  goods_receipt_id: number | null;
  asset_id: number | null;
  item_id: number | null;
  vendor_id: number;
  item_description: string;
  issue_description: string;
  purchase_date: string | null;
  warranty_expiry: string | null;
  claim_date: string;
  status: WarrantyClaimStatus;
  workflow_instance_id: number | null;
  requested_by_employee_id: number;
  resolution_notes: string | null;
  resolved_date: string | null;
  proof_file_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  purchase_order?: { id: number; po_number: string } | null;
  vendor?: { id: number; vendor_name: string } | null;
  requested_by_employee?: { id: number; full_name: string } | null;
  proof_file?: { id: number; original_name: string } | null;
}

/** Barang yang PERNAH DITERIMA (GRN posted) untuk 1 PO - dipakai form Klaim
 * Garansi baru supaya "Nama Barang" dan "Garansi s.d." bisa OTOMATIS
 * TERISI dari data penerimaan barang - lihat
 * WarrantyClaimController::poReceiptItems(). */
export interface PoReceiptItem {
  goods_receipt_line_id: number;
  description: string | null;
  item_id: number | null;
  asset_id: number | null;
  asset_number: string | null;
  warranty_expiry: string | null;
  receipt_date: string | null;
}

export interface WarrantyClaimListParams {
  page?: number;
  per_page?: number;
  status?: WarrantyClaimStatus;
  purchase_order_id?: number;
  search?: string;
}

export interface CreateWarrantyClaimValues {
  purchase_order_id: number;
  goods_receipt_id?: number;
  asset_id?: number;
  item_id?: number;
  item_description: string;
  issue_description: string;
  purchase_date?: string;
  warranty_expiry?: string;
  claim_date?: string;
  notes?: string;
}
