export type MutationType = "deposit" | "withdrawal" | "transfer";
export type MutationStatus = "posted" | "void";

interface MutationAccountRef {
  id: number;
  account_code: string;
  account_name: string;
}

export interface CbMutation {
  id: number;
  mutation_number: string;
  mutation_type: MutationType;
  from_account: MutationAccountRef | null;
  to_account: MutationAccountRef | null;
  counter_account: MutationAccountRef | null;
  amount: number;
  mutation_date: string;
  reference_number: string | null;
  description: string | null;
  status: MutationStatus;
  gl_journal_number: string | null;
}

/** Field yang WAJIB diisi beda-beda per jenis mutasi - lihat
 * CbMutationController::validateMutation():
 * - deposit    -> to_account   + counter_account WAJIB (from tidak dipakai)
 * - withdrawal -> from_account + counter_account WAJIB (to tidak dipakai)
 * - transfer   -> from_account + to_account WAJIB (counter tidak dipakai)
 */
export interface CbMutationFormValues {
  amount: number;
  mutation_date?: string;
  reference_number?: string;
  description?: string;
  from_account_code?: string;
  to_account_code?: string;
  counter_account_code?: string;
}

export interface CbMutationListParams {
  page?: number;
  per_page?: number;
  mutation_type?: MutationType;
  status?: MutationStatus;
  date_from?: string;
  date_to?: string;
}
