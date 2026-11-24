

export type QuotationStatus =
  | "draft"
  | "waiting_approval"
  | "approved"
  | "sent"
  | "viewed"
  | "negotiation"
  | "accepted"
  | "rejected"
  | "lost"
  | "expired";

export interface QuotationLine {
  id: number;
  quotation_id: number;
  product_id: number | null;
  promo_package_id: number | null;
  service_type?: string;
  description: string;
  quantity: number;
  unit_price: string;
  discount_pct: string;
  tax_pct: string;
  line_total: string;
  billing_type?: "one_time" | "recurring";
  cc_source_location?: string | null;
  cc_destination_location?: string | null;
}

export interface Quotation {
  id: number;
  quotation_number: string;
  customer_id: number | null;
  lead_id: number | null;
  opportunity_id: number | null;
  quotation_date: string;
  valid_until: string;
  status: QuotationStatus;
  workflow_instance_id: number | null;

  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  notes: string | null;
  closer_id?: number | null;
  created_by: number | null;
  is_expired: boolean;

  // Penolakan approval internal.
  internal_rejected_at: string | null;
  internal_rejection_reason: string | null;
  can_resubmit_approval: boolean;

  // Quotation Lose: penawaran kalah atau ditolak client.
  // Opsional karena dukungan backend masih dalam pengerjaan.
  lost_reason?: string | null;
  lost_by?: number | null;
  lost_by_name?: string | null;
  lost_at?: string | null;

  created_at: string;
  updated_at: string;

  sales_orders_count?: number;

  // Alur: Quotation -> Contract -> Rack Lock -> Sales Order.
  contracts_count?: number;
}

/**
 * BARU: Data tanda tangan pembuat Quotation.
 * Marketing tidak menggunakan QR approval.
 */
export interface QuotationMarketingSignature {
  name: string;
  jabatan: string;
  date: string;
  signature_image_data_uri: string | null;
}

/**
 * BARU: Data persetujuan resmi dari Workflow Engine.
 * QR hanya tersedia jika approval berhasil diproses.
 */
export interface QuotationApprovalSignature {
  label: string;
  name: string;
  jabatan: string;
  date: string;
  qr_data_uri: string | null;
  signature_image_data_uri: string | null;
  approver_ref: string | null;
}

/**
 * Detail Quotation beserta customer, layanan,
 * tanda tangan Marketing dan approval Manager.
 */
export interface QuotationDetail extends Quotation {
  customer?: {
    id: number;
    company_name: string;
  } | null;

  lines?: Array<{
    id: number;
    description: string;
    quantity: string;
    unit_price: string;
    discount_pct: string;
    amount: string;
    product_id?: number | null;
    promo_package_id?: number | null;
    tax_pct?: string;
    billing_type?: "one_time" | "recurring";
    cc_source_location?: string | null;
    cc_destination_location?: string | null;
  }>;

  // BARU: Opsional agar tetap kompatibel dengan respons API server lama.
  marketing_signature?: QuotationMarketingSignature | null;
  approval_signatures?: QuotationApprovalSignature[];
}

/**
 * Data layanan dalam form Quotation.
 */
export interface QuotationLineFormValues {
  source_type: "product" | "promo_package";
  product_id: number | null;
  promo_package_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_pct?: number;
  tax_pct?: number;
  billing_type?: "one_time" | "recurring";
  cc_source_location?: string;
  cc_destination_location?: string;
}

/**
 * Data untuk membuat atau memperbarui Quotation.
 */
export interface QuotationFormValues {
  customer_id?: number | null;
  lead_id?: number | null;
  opportunity_id?: number | null;
  quotation_date?: string;
  valid_until?: string;
  notes?: string;
  closer_id?: number | null;
  lines: QuotationLineFormValues[];
}

/**
 * Parameter daftar Quotation, filter dan pagination.
 */
export interface QuotationListParams {
  page?: number;
  per_page?: number;
  status?: QuotationStatus;
  customer_id?: number;
  search?: string;
}