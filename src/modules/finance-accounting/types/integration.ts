/** AP/AR/HR Integration - antrean review bill/invoice/payroll DRAFT yang
 * datang dari modul lain (GRN Procurement, Remote Hands DataCenterOps,
 * Payroll HR Service Support yang sudah diajukan HR) - BELUM masuk hutang/
 * piutang/jurnal GL sampai Finance centang & Posting di sini. */

export interface IntegrationJournalLine {
  account_code: string;
  account_name: string | null;
  description: string;
  debit: number;
  credit: number;
}

export interface IntegrationJournalPreview {
  lines: IntegrationJournalLine[];
}

export interface IntegrationPostBatchResult {
  posted: number;
  failed: number;
  results: { id: number; label: string; success: boolean; message: string }[];
}

export interface IntegrationApBillLine {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  expense_account?: { id: number; account_code: string; account_name: string } | null;
}

export interface IntegrationApBill {
  id: number;
  bill_number: string;
  vendor_id: number;
  vendor_name: string;
  vendor_code: string | null;
  bill_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: "draft";
  reference_type: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  lines?: IntegrationApBillLine[];
  journal_preview: IntegrationJournalPreview | null;
  preview_error: string | null;
}

export interface IntegrationArInvoiceLine {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  revenue_account?: { id: number; account_code: string; account_name: string } | null;
}

export interface IntegrationArInvoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name: string;
  customer_code: string | null;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: "draft";
  reference_type: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  lines?: IntegrationArInvoiceLine[];
  journal_preview: IntegrationJournalPreview | null;
  preview_error: string | null;
}

export interface IntegrationListParams {
  page?: number;
  per_page?: number;
  reference_type?: string;
  search?: string;
}

export interface IntegrationPayrollRecord {
  id: number;
  employee_id: number;
  employee?: { id: number; full_name: string; employee_number: string } | null;
  cost_center?: { id: number; name: string } | null;
  period_month: number;
  period_year: number;
  base_salary: string;
  meal_allowance: string;
  overtime_amount: string;
  total_amount: string;
  ptkp_status?: string | null;
  ter_category?: "A" | "B" | "C" | null;
  ter_rate?: number | null;
  bpjs_kesehatan_deduction?: number | null;
  bpjs_ketenagakerjaan_deduction?: number | null;
  pph21_deduction?: number | null;
  total_deduction?: number | null;
  net_amount?: number | null;
  submitted_to_finance?: boolean;
  submitted_at?: string | null;
  overtime_record?: { id: number; status: string; overtime_hours: string } | null;
  status: "draft";
  notes: string | null;
  journal_preview: (IntegrationJournalPreview & { note?: string }) | null;
  preview_error: string | null;
}

export interface IntegrationPayrollListParams {
  page?: number;
  per_page?: number;
  period_month?: number;
  period_year?: number;
  search?: string;
}

export interface IntegrationCertificationRecord {
  id: number;
  employee_id: number;
  certification_id: number;
  employee?: {
    id: number;
    full_name: string;
    employee_number: string;
    position?: string;
    department?: { id: number; name: string } | null;
  } | null;
  certification?: {
    id: number;
    code: string;
    name: string;
    issuing_body: string | null;
    exam_fee?: number | string | null;
    renewal_fee?: number | string | null;
  } | null;
  cost_center?: { id: number; code?: string; name: string } | null;
  certificate_number: string | null;
  issued_date: string;
  expiry_date: string | null;
  status: string;
  funding_source: "COMPANY" | "SELF_FUNDED" | "REIMBURSEMENT" | null;
  reimbursement_status: "NOT_APPLICABLE" | "DRAFT" | "PENDING_FINANCE" | "POSTED_TO_GL" | "PAID" | "REJECTED" | null;
  cost_amount: number | string;
  gl_journal_number: string | null;
  sent_to_finance_at: string | null;
  notes: string | null;
  journal_preview: (IntegrationJournalPreview & { total_amount?: number; note?: string }) | null;
  preview_error: string | null;
}

export interface IntegrationCertificationListParams {
  page?: number;
  per_page?: number;
  reimbursement_status?: string;
  search?: string;
}
