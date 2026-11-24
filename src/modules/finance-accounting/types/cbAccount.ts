export type CbAccountType = "cash" | "bank";

export interface CbAccount {
  id: number;
  account: { id: number; account_code: string; account_name: string };
  account_type: CbAccountType;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  branch: string | null;
  currency: string;
  opening_balance: number;
  opening_balance_date: string | null;
  is_active: boolean;
  /** DIHITUNG LANGSUNG dari GL tiap request (bukan kolom tersimpan) -
   * lihat CashBankService::accountBalance() - SELALU akurat real-time,
   * tapi juga berarti TIDAK bisa di-cache lepas dari GL. */
  current_balance: number;
}

export interface CbAccountFormValues {
  account_id: number;
  account_type: CbAccountType;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  branch?: string;
  opening_balance?: number;
  opening_balance_date?: string;
  notes?: string;
}

export interface CbAccountListParams {
  account_type?: CbAccountType;
  is_active?: boolean;
}
