/** withheld_by_us = "Pajak Vendor" - KITA yang motong PPh saat bayar
 * vendor. withheld_by_customer = "Pajak Customer" - CUSTOMER yang motong
 * PPh saat bayar KITA. 2 arah, 1 fitur yang sama (Bukti Potong). */
export type WithholdingDirection = "withheld_by_us" | "withheld_by_customer";
export type WithholdingStatus = "draft" | "issued";

export interface TaxWithholdingCertificate {
  id: number;
  certificate_number: string;
  external_number: string | null;
  tax_type: { id: number; code: string; name: string };
  direction: WithholdingDirection;
  reference_type: string | null;
  reference_number: string | null;
  counterparty_name: string;
  counterparty_npwp: string | null;
  period_month: number;
  period_year: number;
  gross_amount: number;
  rate: number | null;
  withheld_amount: number;
  status: WithholdingStatus;
  gl_journal_number: string | null;
  remitted_date: string | null;
  remittance_gl_journal_number: string | null;
  notes: string | null;
}

export interface TaxWithholdingFormValues {
  tax_type_id: number;
  direction: WithholdingDirection;
  reference_type?: string;
  reference_number?: string;
  counterparty_name: string;
  counterparty_npwp?: string;
  period_month: number;
  period_year: number;
  gross_amount: number;
  rate?: number;
  withheld_amount?: number;
  /** TRUE cuma berlaku untuk direction=withheld_by_us - posting jurnal
   * Dr Hutang Vendor / Cr Hutang PPh. */
  post_to_gl?: boolean;
  ap_account_code?: string;
  notes?: string;
}

export interface TaxWithholdingListParams {
  page?: number;
  per_page?: number;
  direction?: WithholdingDirection;
  period_month?: number;
  period_year?: number;
  unremitted_only?: boolean;
}
