export interface CashFlowCategory {
  category: string;
  inflow: number;
  outflow: number;
}

export interface CashFlowAccountRow {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: "cash" | "bank";
  opening_balance: number;
  total_inflow: number;
  total_outflow: number;
  closing_balance: number;
  by_category: CashFlowCategory[];
}

export interface CashFlowReport {
  date_from: string | null;
  date_to: string | null;
  accounts: CashFlowAccountRow[];
  grand_total: {
    opening_balance: number;
    total_inflow: number;
    total_outflow: number;
    closing_balance: number;
  };
}
