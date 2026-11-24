export type JournalStatus = "draft" | "posted" | "reversed";
export type EntryType = "manual" | "automatic";

/** 1 baris jurnal (line) - lihat GlJournal::$fillable */
export interface GlJournalLine {
  id: number;
  line_number: number;
  account: { id: number; account_code: string; account_name: string };
  debit: number;
  credit: number;
  description: string | null;
}

/** Detail 1 jurnal LENGKAP (header + semua baris dengan journal_number
 * yang sama) - bentuk balasan GlJournalController::show() */
export interface GlJournalDetail {
  journal_number: string;
  journal_date: string;
  source_module: string;
  reference_type: string;
  reference_number: string | null;
  entry_type: EntryType;
  status: JournalStatus;
  reverses_journal_number: string | null;
  total_debit: number;
  total_credit: number;
  lines: GlJournalLine[];
}

/** 1 baris di list (GET /gl/journals) - masih level baris, BELUM
 * dikelompokkan per journal_number (beda dari GlJournalDetail). */
export interface GlJournalRow {
  id: number;
  journal_number: string;
  line_number: number;
  journal_date: string;
  account: { id: number; account_code: string; account_name: string };
  debit: number;
  credit: number;
  description: string | null;
  source_module: string;
  reference_type: string;
  reference_number: string | null;
  status: JournalStatus;
}

export interface GlJournalListParams {
  page?: number;
  per_page?: number;
  journal_number?: string;
  account_id?: number;
  source_module?: string;
  status?: JournalStatus;
  type?: "manual" | "automatic";
  date_from?: string;
  date_to?: string;
}

/** Baris input saat bikin jurnal manual - cocok validasi store() */
export interface GlJournalLineInput {
  account_id: number | null;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface GlJournalFormValues {
  journal_date?: string;
  description?: string;
  reference_number?: string;
  status?: "draft" | "posted";
  /** Opsional, berlaku untuk SEMUA baris jurnal ini (fallback level-data
   * di GeneralLedgerService::postJournal() - baris individual bisa
   * override kalau perlu, tapi form manual ini sengaja disederhanakan
   * jadi 1 nilai untuk seluruh jurnal). */
  cost_center_id?: number;
  profit_center_id?: number;
  lines: GlJournalLineInput[];
}

/** Ledger (buku besar) 1 akun - GET /gl/accounts/{id}/ledger */
export interface AccountLedgerLine {
  journal_number: string;
  journal_date: string;
  description: string | null;
  source_module: string;
  reference_type: string;
  reference_number: string | null;
  debit: number;
  credit: number;
  running_balance: number;
}

export interface AccountLedger {
  account: { id: number; account_code: string; account_name: string; normal_balance: "debit" | "credit" };
  ending_balance: number;
  lines: AccountLedgerLine[];
}

/** Trial Balance - GET /gl/trial-balance */
export interface TrialBalanceRow {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  normal_balance: "debit" | "credit";
  total_debit: number;
  total_credit: number;
  ending_balance_debit: number;
  ending_balance_credit: number;
  debit_col?: number;   // from grouped endpoint
  credit_col?: number;  // from grouped endpoint
}

export interface TrialBalanceGroup {
  type: string;
  label: string;
  group_debit_col: number;
  group_credit_col: number;
  accounts: TrialBalanceRow[];
}

export interface TrialBalance {
  as_of_date: string | null;
  groups?: TrialBalanceGroup[];
  accounts: TrialBalanceRow[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
}
