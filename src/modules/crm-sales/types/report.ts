// Bentuk response dari CrmReportController (Modules/CrmSales) - semua
// dihitung real-time dari data transaksional, bukan snapshot.

/** Filter yang didukung SEMUA endpoint laporan - yang tidak relevan untuk
 * suatu laporan diabaikan sendiri oleh backend (lihat CrmReportService),
 * bukan error. Dikirim sebagai query string. */
export interface CrmReportFilters {
  date_from?: string;
  date_to?: string;
  sales_id?: number;
  /** Monitoring Sales only: include all PIC roles instead of Sales-only HR. */
  include_all_pic?: 1;
  /** Validated Lead PIC identity (user:id or employee:id). */
  pic_choice?: string;
  customer_id?: number;
}

export interface CrmKpis {
  win_rate: number;
  avg_sales_cycle_days: number;
  open_pipeline_value: number;
  mrr_active: number;
  arr_active: number;
  quotation_approval_rate: number;
  contracts_expiring_90d: number;
}

export interface WinLossReport {
  won_count: number;
  lost_count: number;
  win_rate: number;
  revenue_won: number;
  lost_reasons: { reason: string; count: number }[];
  by_sales: { user_id: number; name: string; won_count: number; lost_count: number; revenue_won: number }[];
  monthly_trend: { month: string; won: number; lost: number }[];
}

export interface SalesPerformanceReport {
  leaderboard: {
    choice_id?: string;
    user_id: number | null;
    employee_id: number | null;
    position_title?: string | null;
    target_source?: string | null;
    name: string;
    leads_count: number;
    leads_converted_count: number;
    opportunities_count: number;
    opportunities_won: number;
    opportunities_lost: number;
    win_rate: number;
    quotations_count: number;
    quotations_accepted_count: number;
    revenue_won: number;
    is_manual_pic?: boolean;
    target_won_count?: number | null;
    target_amount?: number | null;
    closing_achievement_pct?: number | null;
    amount_achievement_pct?: number | null;
  }[];
  unattributed_won_count?: number;
  unattributed_won_revenue?: number;
}

export interface QuotationSummaryReport {
  by_status: { status: string; count: number; total_value: number }[];
  total_count: number;
  approval_rate: number;
  avg_value: number;
  monthly_trend: { month: string; count: number; total_value: number }[];
}

export interface ExpiredQuotationsReport {
  count: number;
  avg_value: number;
  avg_days_since_expiry: number;
  list: {
    id: number;
    quotation_number: string;
    customer_name: string;
    valid_until: string;
    total_amount: number;
    status: string;
  }[];
}

export interface ContractAgingReport {
  expiring_30: number;
  expiring_60: number;
  expiring_90: number;
  mrr_at_risk: number;
  list: {
    id: number;
    contract_number: string;
    customer_name: string;
    end_date: string;
    days_until_expiry: number | null;
    monthly_value: number;
  }[];
}

export interface CustomerRevenueReport {
  total_mrr: number;
  total_arr: number;
  customers_with_active_contract: number;
  by_status: { status: string; count: number }[];
  top_customers: {
    customer_id: number;
    customer_name: string;
    status: string | null;
    mrr: number;
    contract_count: number;
  }[];
}