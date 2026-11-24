export interface FinancialAccountRow {
  account_code: string;
  account_name: string;
  amount: number;
}

export interface FinancialSubgroup {
  subgroup: string;
  subtotal: number;
  accounts: FinancialAccountRow[];
}

export interface BalanceSheet {
  as_of_date: string;
  assets: { groups: FinancialSubgroup[]; total: number };
  liabilities: { groups: FinancialSubgroup[]; total: number };
  equity: { groups: FinancialSubgroup[]; current_year_earnings: number; total: number };
  total_liabilities_and_equity: number;
  is_balanced: boolean;
}
