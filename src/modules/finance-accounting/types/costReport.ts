export interface CostReportAccountRow {
  account_code: string | null;
  account_name: string | null;
  amount: number;
}

export interface CostReportCostCenterRow {
  cost_center_id: number;
  code: string | null;
  name: string | null;
  amount: number;
}

/**
 * "Semua biaya dapat diketahui berasal dari mana" - 3 cara pandang
 * sekaligus: per AKUN beban (by_account), per COST CENTER asal-nya
 * SENDIRI (by_cost_center - relevan kalau lihat laporan cost center
 * INDUK dengan include_descendants=true, jadi kelihatan berapa dari
 * Surabaya DC sendiri vs dari sub-cost-center di bawahnya), dan per JENIS
 * ENTRI (manual vs automatic).
 */
export interface CostReport {
  cost_center: { id: number; code: string; name: string; type: string | null };
  includes_descendants: boolean;
  date_from: string | null;
  date_to: string | null;
  total_cost: number;
  by_account: CostReportAccountRow[];
  by_cost_center: CostReportCostCenterRow[];
  by_entry_type: { manual: number; automatic: number };
}
