/** File/lampiran generik - bentuknya SAMA baik dari PrAttachment,
 * PoAttachment, FileRecord (vendor quotation) maupun BAST GRN, cukup 1
 * type dipakai bareng untuk semua tombol pratinjau di halaman History PO. */
export interface HistoryFile {
  id: number;
  original_name: string;
  mime_type: string;
  category?: string;
  uploader?: { id: number; name: string } | null;
}

export interface HistoryLine {
  id: number;
  description: string;
  quantity: number | string;
  uom: string;
  estimated_unit_price?: number | string;
  unit_price?: number | string;
  amount?: number | string;
  line_total?: number | string;
}

export interface HistoryPurchaseRequest {
  id: number;
  pr_number: string;
  purpose: string | null;
  status: string;
  requester_name: string | null;
  department: string | null;
  created_at: string;
  lines: HistoryLine[];
  attachments: HistoryFile[];
  workflow_instance_id: number | null;
}

export interface HistoryVendorQuotation {
  id: number;
  quotation_number: string;
  vendor_name: string | null;
  quotation_date: string | null;
  valid_until: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  lines: HistoryLine[];
  is_winner: boolean;
  files: HistoryFile[];
}

export interface HistoryVendorPicking {
  id: number;
  status: string;
  vendor_name: string | null;
  quotation_number: string | null;
  picked_by_name: string | null;
  notes: string | null;
  created_at: string;
  workflow_instance_id: number | null;
}

export interface HistoryPurchaseOrder {
  id: number;
  po_number: string;
  vendor_name: string | null;
  status: string;
  order_date: string;
  total_amount: number;
  lines: HistoryLine[];
  attachments: HistoryFile[];
  workflow_instance_id: number | null;
}

export interface HistoryGoodsReceipt {
  id: number;
  grn_number: string;
  status: string;
  receipt_date: string;
  received_by_name: string | null;
  bast_file: HistoryFile | null;
}

export interface HistoryPaymentRequest {
  id: number;
  payment_request_number: string;
  payment_type: string;
  status: string;
  amount: number;
  net_amount: number;
  employee_name: string | null;
  created_at: string;
  workflow_instance_id: number | null;
}

export interface PoHistoryData {
  purchase_request: HistoryPurchaseRequest | null;
  vendor_quotations: HistoryVendorQuotation[];
  vendor_picking: HistoryVendorPicking | null;
  purchase_order: HistoryPurchaseOrder;
  goods_receipts: HistoryGoodsReceipt[];
  payment_requests: HistoryPaymentRequest[];
}
