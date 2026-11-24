import { apiClient } from "@shared/lib/api-client";

export interface DashboardKPI {
  revenue_this_month: { value: number; label: string; period?: string };
  outstanding_ar: { value: number; label: string };
  outstanding_ap: { value: number; label: string };
  cash_balance: { value: number; label: string };
  net_profit: { value: number; label: string; is_positive?: boolean };
}

export interface DashboardInvoiceMetrics {
  due_today: { count: number; label: string };
  overdue: { count: number; amount: number; label: string };
  pending: { count: number; amount: number; label: string };
}

export interface DashboardOperationalMetrics {
  budget_utilization: {
    percentage: number;
    total_budget: number;
    total_actual: number;
    remaining: number;
    fiscal_year: number;
  };
  operating_margin: {
    percentage: number;
    net_profit: number;
    revenue: number;
    fiscal_year: number;
  };
}

export interface BillingMetrics {
  active_contracts: number;
  recent_runs: Array<{
    id: number;
    contract_number: string | null;
    customer_name: string | null;
    invoice_number: string | null;
    invoice_amount: number | null;
    status: string;
    period_date: string | null;
    created_at: string;
  }>;
}

export interface CashAccount {
  account_id: number;
  account_code: string;
  account_name: string;
  total_debit: number;
  total_credit: number;
  net_balance: number;
}

export interface CashMetrics {
  accounts: CashAccount[];
  total_cash_balance: number;
  unreconciled_entries: number;
}

export interface DashboardResponse {
  data: {
    kpis: DashboardKPI;
    invoice_metrics: DashboardInvoiceMetrics;
    operational_metrics: DashboardOperationalMetrics;
    billing_metrics: BillingMetrics;
    cash_metrics: CashMetrics;
    generated_at: string;
  };
}

const BASE_PATH = "/v1/finance-accounting";

export const financeDashboardApi = {
  /** Fetch semua data dashboard dalam satu request. */
  index() {
    return apiClient.get<DashboardResponse>(`${BASE_PATH}/dashboard`);
  },
  printPdf(organizationId: number) {
    return apiClient.get<Blob>(`${BASE_PATH}/executive-summary/print-pdf`, { params: { organization_id: organizationId }, responseType: "blob" });
  },
};
