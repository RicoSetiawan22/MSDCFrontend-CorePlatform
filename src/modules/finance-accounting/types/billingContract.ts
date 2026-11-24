export type BillingContractStatus = "active" | "suspended" | "terminated";

export interface BiBillingContract {
  id: number;
  contract_number: string;
  /** NULL = kontrak billing lama yang dibuat manual sebelum penautan CRM
   * diwajibkan - "tidak terhubung ke CRM" di UI, bukan bug. */
  crm_contract_id: number | null;
  crm_contract: { id: number; contract_number: string; status: string; end_date: string | null } | null;
  customer_id: number;
  customer_name: string;
  customer_code: string | null;
  service_description: string;
  revenue_account: { id: number; account_code: string; account_name: string };
  profit_center: { id: number; code: string; name: string } | null;
  monthly_amount: number;
  tax_rate: number | null;
  billing_day: number | null;
  start_date: string;
  end_date: string | null;
  payment_term_days: number;
  status: BillingContractStatus;
  /** Periode TERAKHIR yang berhasil ditagih - dipakai backend sendiri
   * untuk cegah tagih dobel di periode yang sama (lihat runMonthlyBilling()
   * - kontrak yang last_billed_period-nya SUDAH sama dengan periode yang
   * dijalankan otomatis di-skip, bukan error). */
  last_billed_period: string | null;
  notes: string | null;
}

/** contract_number/customer_id/customer_name TIDAK LAGI diisi manual -
 * selalu diturunkan backend dari crm_contract_id (lihat
 * BiBillingContractController::store()) supaya tidak bisa menyimpang
 * dari data CRM asli. Dipakai HANYA untuk create (bukan update - lihat
 * BiBillingContractUpdateValues di bawah, field CRM tidak bisa diubah
 * lagi setelah kontrak billing dibuat). */
export interface BiBillingContractFormValues {
  crm_contract_id: number;
  service_description: string;
  profit_center_id?: number;
  revenue_account_id: number;
  monthly_amount: number;
  tax_rate?: number;
  billing_day?: number;
  start_date: string;
  end_date?: string;
  payment_term_days?: number;
  notes?: string;
}

export interface BiBillingContractUpdateValues {
  service_description?: string;
  profit_center_id?: number;
  monthly_amount?: number;
  tax_rate?: number;
  billing_day?: number;
  end_date?: string;
  payment_term_days?: number;
  notes?: string;
}

export interface BiBillingContractListParams {
  page?: number;
  per_page?: number;
  customer_id?: number;
  status?: BillingContractStatus;
}
