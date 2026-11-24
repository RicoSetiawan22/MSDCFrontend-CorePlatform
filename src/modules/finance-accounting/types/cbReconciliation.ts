/** 1 baris di "buku mutasi" akun - GET /cb/accounts/{id}/mutations. Ini
 * baris GL Journal, BUKAN baris CbMutation - satu CbMutation (deposit/
 * withdrawal/transfer) bisa saja bukan sumber baris ini (AR/AP payment
 * juga menyentuh akun kas/bank lewat GL langsung). */
export interface CbAccountMutationLine {
  gl_journal_id: number;
  journal_number: string;
  journal_date: string;
  description: string | null;
  source_module: string;
  reference_type: string;
  reference_number: string | null;
  debit: number;
  credit: number;
  running_balance: number;
  is_reconciled: boolean;
  bank_statement_date: string | null;
}

export interface CbAccountMutations {
  account: { id: number; account_code: string; account_name: string };
  ending_balance: number;
  mutations: CbAccountMutationLine[];
}

/** GET /cb/accounts/{id}/pending-reconciliation - kandidat baris yang
 * BISA dipilih untuk ditandai clear di request reconcile(). */
export interface CbPendingReconciliationLine {
  gl_journal_id: number;
  journal_number: string;
  journal_date: string;
  description: string | null;
  reference_type: string;
  reference_number: string | null;
  debit: number;
  credit: number;
}

export interface CbReconcileResult {
  account: { id: number; account_code: string; account_name: string };
  statement_date: string;
  lines_reconciled_this_run: number;
  book_balance: number;
  reconciled_balance: number;
  statement_ending_balance: number | null;
  difference: number | null;
}
