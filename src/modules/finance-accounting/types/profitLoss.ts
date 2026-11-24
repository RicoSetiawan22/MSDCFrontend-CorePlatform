import type { FinancialSubgroup } from "./balanceSheet";

export interface ProfitLoss {
  date_from: string;
  date_to: string;
  revenue: FinancialSubgroup[];
  total_revenue: number;
  expense: FinancialSubgroup[];
  total_expense: number;
  net_income: number;
  /** null kalau total_revenue = 0 (hindari bagi nol). */
  net_margin_pct: number | null;
}

export interface ProfitLossParams {
  date_from: string;
  date_to: string;
  cost_center_id?: number;
  profit_center_id?: number;
}
