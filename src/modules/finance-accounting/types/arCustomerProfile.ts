export interface ArCustomerProfile {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_code: string | null;
  credit_limit: number;
  is_credit_hold: boolean;
  notes: string | null;
}

export interface ArCustomerProfileFormValues {
  customer_id: number;
  customer_name: string;
  customer_code?: string;
  credit_limit?: number;
  is_credit_hold?: boolean;
  notes?: string;
}

export interface ArCustomerProfileListParams {
  page?: number;
  per_page?: number;
  credit_hold_only?: boolean;
}

/** Hasil GET /ar/customers/{id} - gabungan credit limit + saldo piutang
 * berjalan customer itu, DIHITUNG LANGSUNG dari invoice outstanding, bukan
 * kolom tersimpan - lihat AccountsReceivableService::outstandingBalance(). */
export interface ArOutstandingBalance {
  customer_id: number;
  customer_name: string;
  credit_limit: number | null;
  is_credit_hold: boolean;
  outstanding_balance: number;
  available_credit: number | null;
  invoice_count: number;
  invoices: {
    id: number;
    invoice_number: string;
    due_date: string;
    total_amount: number;
    outstanding_amount: number;
    is_overdue: boolean;
    days_overdue: number;
  }[];
}
