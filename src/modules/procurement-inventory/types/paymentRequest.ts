export type PaymentRequestType = "dp" | "pelunasan" | "full";

export type PaymentRequestStatus = "draft" | "submitted" | "approved" | "rejected" | "posted" | "cancelled";

export interface PaymentRequest {
  id: number;
  organization_id: number;
  payment_request_number: string;
  purchase_order_id: number;
  employee_id: number | null;
  payment_type: PaymentRequestType;
  percentage: number | null;
  amount: number;
  tax_withholding_amount: number;
  net_amount: number;
  payment_method: string | null;
  status: PaymentRequestStatus;
  workflow_instance_id: number | null;
  supporting_doc_notes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  purchase_order?: { id: number; po_number: string; vendor_id: number; vendor?: { id: number; vendor_name: string } } | null;
  employee?: { id: number; full_name: string } | null;
}

export interface PaymentRequestListParams {
  page?: number;
  per_page?: number;
  status?: PaymentRequestStatus;
  purchase_order_id?: number;
}
