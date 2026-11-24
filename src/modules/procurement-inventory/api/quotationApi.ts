import { apiClient } from "@shared/lib/api-client";

const BASE = "/v1/procurement-inventory";

export interface VendorQuotation {
  id: number;
  purchase_request_id: number;
  vendor_id: number;
  quotation_number: string;
  quotation_date: string | null;
  valid_until: string | null;
  status: "draft" | "submitted" | "accepted" | "rejected";
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  notes: string | null;
  payment_terms: string | null;
  delivery_terms: string | null;
  vendor?: { id: number; vendor_name: string; category: string };
  submitter?: { id: number; name: string };
  lines?: VendorQuotationLine[];
}

export interface VendorQuotationLine {
  id: number;
  quotation_id: number;
  pr_line_id: number | null;
  description: string;
  quantity: string;
  uom: string;
  unit_price: string;
  discount_pct: string;
  line_total: string;
}

export interface QuotationCompareResult {
  purchase_request: any;
  quotations: VendorQuotation[];
  comparison: QuotationCompareRow[];
  vendor_totals: VendorTotal[];
}

export interface QuotationCompareRow {
  pr_line_id: number;
  description: string;
  pr_qty: number;
  pr_uom: string;
  pr_est_price: number;
  quotes: QuoteItem[];
}

export interface QuoteItem {
  quotation_id: number;
  vendor_id: number;
  vendor_name: string;
  unit_price: number;
  discount_pct: number;
  line_total: number;
}

export interface VendorTotal {
  quotation_id: number;
  vendor_id: number;
  vendor_name: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  quotation_date: string | null;
  valid_until: string | null;
}

export interface PickingResult {
  id: number;
  purchase_request_id: number;
  picked_quotation_id: number;
  picked_vendor_id: number;
  status: string;
  notes: string | null;
  quotation?: VendorQuotation;
  vendor?: { id: number; vendor_name: string };
  purchase_request?: any;
}

export const quotationApi = {
  listByPr(prId: number) {
    return apiClient.get<{ data: VendorQuotation[] }>(`${BASE}/purchase-requests/${prId}/quotations`);
  },
  create(prId: number, values: Partial<CreateQuotationInput>) {
    return apiClient.post(`${BASE}/purchase-requests/${prId}/quotations`, values);
  },
  compare(prId: number) {
    return apiClient.get<{ data: QuotationCompareResult }>(`${BASE}/purchase-requests/${prId}/quotations/compare`);
  },
  pickVendor(prId: number, values: { quotation_id: number; line_picks?: number[]; notes?: string }) {
    return apiClient.post(`${BASE}/purchase-requests/${prId}/quotations/pick`, values);
  },
  listFiles(quotationId: number) {
    return apiClient.get(`${BASE}/vendor-quotations/${quotationId}/files`);
  },
};

export interface CreateQuotationInput {
  vendor_id: number;
  quotation_date?: string;
  valid_until?: string;
  tax_amount?: number;
  notes?: string;
  payment_terms?: string;
  delivery_terms?: string;
  file_ids?: number[];
  lines: Array<{
    pr_line_id?: number;
    description: string;
    quantity: number;
    uom: string;
    unit_price: number;
    discount_pct?: number;
    notes?: string;
  }>;
}
