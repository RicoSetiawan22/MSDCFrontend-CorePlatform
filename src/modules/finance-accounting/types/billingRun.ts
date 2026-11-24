export type BillingRunLogStatus = "success" | "skipped" | "failed";

/** 1 baris log per kontrak - bentuknya SEDIKIT beda tergantung status
 * (lihat BillingIntegrationService::runMonthlyBilling()): 'success' selalu
 * ada invoice_number, 'failed'/'skipped' selalu ada message, TIDAK ada
 * invoice_number. */
export interface BillingRunLogEntry {
  contract_number: string;
  status: BillingRunLogStatus;
  invoice_number?: string;
  message?: string;
}

export interface RunBillingResult {
  period: string;
  success: number;
  skipped: number;
  failed: number;
  logs: BillingRunLogEntry[];
}

export interface BillingHistoryEntry {
  period_date: string;
  status: BillingRunLogStatus;
  message: string | null;
  invoice: { id: number; invoice_number: string; total_amount: number; status: string } | null;
}
