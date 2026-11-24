export type ItemLoanStatus = "draft" | "submitted" | "approved" | "rejected" | "on_loan" | "returned" | "cancelled";

export interface ItemLoan {
  id: number;
  organization_id: number;
  loan_number: string;
  asset_id: number;
  borrower_employee_id: number;
  lent_by_employee_id: number;
  purpose: string;
  loan_date: string;
  expected_return_date: string;
  actual_return_date: string | null;
  condition_out: string | null;
  condition_in: string | null;
  status: ItemLoanStatus;
  workflow_instance_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  asset?: { id: number; asset_number: string; asset_name: string } | null;
  borrower_employee?: { id: number; full_name: string } | null;
  lent_by_employee?: { id: number; full_name: string } | null;
}

export interface ItemLoanListParams {
  page?: number;
  per_page?: number;
  status?: ItemLoanStatus;
  search?: string;
}

export interface CreateItemLoanValues {
  asset_id: number;
  borrower_employee_id: number;
  lent_by_employee_id?: number;
  purpose: string;
  loan_date?: string;
  expected_return_date: string;
  condition_out?: string;
  notes?: string;
}

/** Aset yang BOLEH dipinjam (belum terikat peminjaman aktif lain) - lihat
 * ItemLoanController::availableAssets(). Hanya field yang perlu ditampilkan
 * di picker, BUKAN shape penuh Asset Maintenance. */
export interface AvailableAssetForLoan {
  id: number;
  asset_number: string;
  asset_name: string;
  category: string;
}
