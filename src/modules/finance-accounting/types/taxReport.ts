export interface PpnSummary {
  date_from: string;
  date_to: string;
  /** ppn_output - ppn_input. Positif = KITA yang harus setor selisihnya
   * ke negara. Negatif = lebih bayar (bisa dikompensasi/restitusi). */
  net_payable: number;
  ppn_output: number;
  ppn_output_from_gl: number;
  ppn_input: number;
  invoice_count: number;
  efaktur_issued_count: number;
  efaktur_pending_count: number;
  /** Breakdown per invoice */
  invoice_breakdown: PpnInvoiceRow[];
}

export interface PpnInvoiceRow {
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  nomor_faktur: string | null;
  efaktur_status: string | null;
}

export interface PphByTaxType {
  tax_type_code: string;
  tax_type_name: string;
  rate: number;
  withheld_by_us: number;
  withheld_by_customer: number;
  certificate_count: number;
  remitted_count: number;
  unremitted_count: number;
  unremitted_amount: number;
}

export interface PphCertificateRow {
  certificate_number: string;
  tax_type_code: string;
  tax_type_name: string;
  direction: string;
  direction_label: string;
  counterparty_name: string;
  counterparty_npwp: string | null;
  gross_amount: number;
  rate: number;
  withheld_amount: number;
  status: string;
  is_remitted: boolean;
  remitted_date: string | null;
  gl_journal_number: string | null;
}

export interface PphSummary {
  period_month: number;
  period_year: number;
  by_tax_type: PphByTaxType[];
  total_withheld_by_us: number;
  total_withheld_by_customer: number;
  unremitted_count: number;
  unremitted_amount: number;
  total_certificate_count: number;
  certificate_breakdown: PphCertificateRow[];
}
