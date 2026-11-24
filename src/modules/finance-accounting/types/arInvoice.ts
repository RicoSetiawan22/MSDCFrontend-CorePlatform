export type InvoiceStatus = "draft" | "posted" | "paid" | "partially_paid" | "void";

export interface ArInvoiceLine {
  description: string | null;
  quantity: number;
  unit_price: number;
  revenue_account_code?: string;
  revenue_account_id?: number;
}

export interface ArInvoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name: string;
  customer_code: string | null;
  invoice_date: string;
  due_date: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  status: InvoiceStatus;
  notes: string | null;
  outstanding_amount: number;
  is_overdue: boolean;
  days_overdue: number;
  /** Source tracking:
   * - reference_type = 'contract' → auto-created from billing contract (CRM trigger)
   * - reference_type = null → manually created by user */
  reference_type: string | null;
  reference_number: string | null;
  gl_journal_number: string | null;
  /** Email kontak utama (crm_customer_contact.is_primary) customer ini,
   * kalau ada - dipakai buat auto-isi field email di modal Kirim Reminder. */
  primary_contact_email?: string | null;
}

export interface ArInvoiceFormValues {
  customer_id: number;
  customer_name: string;
  customer_code?: string;
  invoice_date?: string;
  due_date: string;
  tax_amount?: number;
  notes?: string;
  /** Opsional - lini layanan mana pendapatan invoice ini masuk (mis.
   * Colocation, Dedicated Server) - dipakai Profit Center Report/
   * Comparison. Tanpa ini, invoice TIDAK akan pernah muncul di laporan
   * laba per layanan manapun. */
  profit_center_id?: number;
  lines: ArInvoiceLine[];
}

export interface ArInvoiceListParams {
  page?: number;
  per_page?: number;
  customer_id?: number;
  status?: InvoiceStatus;
  overdue_only?: boolean;
}
