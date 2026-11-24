export type BudgetUtilizationStatus = "within_budget" | "near_limit" | "over_budget" | "no_budget";

export interface BgBudget {
  id: number;
  department: { id: number; code: string; name: string };
  account: { id: number; account_code: string; account_name: string };
  fiscal_year: number;
  amount: number;
  category: string | null;
  notes: string | null;
  /** Cuma ada di response show(), TIDAK ada di list(). */
  actual?: number;
  variance?: number;
  utilization_pct?: number | null;
}

export interface BgBudgetFormValues {
  department_id: number;
  account_id: number;
  fiscal_year: number;
  amount: number;
  category?: string;
  notes?: string;
}

export interface BgBudgetListParams {
  page?: number;
  per_page?: number;
  department_id?: number;
  fiscal_year?: number;
  account_id?: number;
}

/** 1 baris akun DALAM 1 departemen - bagian dari BudgetVsActualDepartmentRow. */
export interface BudgetVsActualLine {
  budget_id: number;
  account_code: string | null;
  account_name: string | null;
  category: string | null;
  budget: number;
  actual: number;
  variance: number;
  utilization_pct: number | null;
  status: BudgetUtilizationStatus;
}

export interface BudgetVsActualDepartmentRow {
  department_id: number;
  department_name: string;
  total_budget: number;
  total_actual: number;
  total_variance: number;
  utilization_pct: number | null;
  lines: BudgetVsActualLine[];
}

export interface BudgetVsActualReport {
  fiscal_year: number;
  as_of_date: string | null;
  departments: BudgetVsActualDepartmentRow[];
  grand_total: {
    total_budget: number;
    total_actual: number;
    total_variance: number;
  };
}
