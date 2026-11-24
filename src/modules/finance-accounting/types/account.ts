export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type NormalBalance = "debit" | "credit";

export interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  account_subgroup: string | null;
  parent_id: number | null;
  normal_balance: NormalBalance;
  is_postable: boolean;
  is_active: boolean;
  description: string | null;
}

export interface AccountFormValues {
  account_code: string;
  account_name: string;
  account_type: AccountType;
  account_subgroup?: string;
  parent_id?: number | null;
  description?: string;
}

export interface AccountListParams {
  page?: number;
  per_page?: number;
  account_type?: AccountType;
  is_active?: boolean;
  search?: string;
}
