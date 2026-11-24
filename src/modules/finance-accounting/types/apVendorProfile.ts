export interface ApVendorProfile {
  id: number;
  vendor_id: number;
  vendor_name: string;
  vendor_code: string | null;
  default_payment_term_days: number;
  is_hold: boolean;
  notes: string | null;
}

export interface ApVendorProfileFormValues {
  vendor_id: number;
  vendor_name: string;
  vendor_code?: string;
  default_payment_term_days?: number;
  is_hold?: boolean;
  notes?: string;
}

export interface ApVendorProfileListParams {
  page?: number;
  per_page?: number;
  hold_only?: boolean;
}

/** Hasil GET /ap/vendors/{id} - BEDA dari ArOutstandingBalance: TIDAK ADA
 * credit_limit/available_credit (konsep AP itu payment term & hold, bukan
 * batas kredit) - lihat AccountsPayableService::outstandingBalance(). */
export interface ApOutstandingBalance {
  vendor_id: number;
  vendor_name: string;
  is_hold: boolean;
  outstanding_balance: number;
  bill_count: number;
  bills: {
    bill_number: string;
    due_date: string;
    total_amount: number;
    outstanding_amount: number;
    is_overdue: boolean;
    days_overdue: number;
  }[];
}
