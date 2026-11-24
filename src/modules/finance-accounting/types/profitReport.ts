export interface ProfitReportAccountRow {
  account_code: string | null;
  account_name: string | null;
  amount: number;
}

export interface ProfitReport {
  profit_center: { id: number; code: string; name: string };
  includes_descendants: boolean;
  date_from: string | null;
  date_to: string | null;
  total_revenue: number;
  total_expense: number;
  net_profit: number;
  /** null kalau total_revenue = 0 (hindari bagi nol, BUKAN dianggap 0%). */
  margin_pct: number | null;
  revenue_by_account: ProfitReportAccountRow[];
  expense_by_account: ProfitReportAccountRow[];
}

/** 1 baris perbandingan - dipakai di ProfitComparison, bentuknya SUBSET
 * dari ProfitReport (cuma angka total, tanpa breakdown per akun). */
export interface ProfitComparisonRow {
  profit_center_id: number;
  code: string;
  name: string;
  total_revenue: number;
  total_expense: number;
  net_profit: number;
  margin_pct: number | null;
}

/**
 * "ERP dapat mengetahui laba masing-masing layanan" - dibandingkan
 * SEKALIGUS antar profit center top-level (Dedicated Server, Colocation,
 * Cloud, dst), diurutkan dari laba TERBESAR - lihat komentar
 * ProfitCenterService::profitComparison() di backend.
 */
export interface ProfitComparison {
  date_from: string | null;
  date_to: string | null;
  profit_centers: ProfitComparisonRow[];
  grand_total: {
    total_revenue: number;
    total_expense: number;
    net_profit: number;
  };
}
