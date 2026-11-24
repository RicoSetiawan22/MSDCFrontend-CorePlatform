export type AssetCategory =
  | "server"
  | "network"
  | "rack"
  | "cooling"
  | "power"
  | "ac"
  | "laptop"
  | "furniture"
  | "other"
  | string;

export type AssetStatus = "active" | "in_maintenance" | "retired";
export type MaintenanceType = "preventive" | "corrective";

export interface Asset {
  id: number;
  organization_id?: number;
  asset_number: string;
  asset_name: string;
  category: AssetCategory;
  site_id: number | null;
  device_id?: number | null;
  fixed_asset_id?: number | null;
  vendor_id?: number | null;
  vendor_name?: string | null;
  vendor?: { id: number; vendor_name: string } | null;
  goods_receipt_id?: number | null;
  status: AssetStatus;
  purchase_date: string | null;
  warranty_expiry: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  overdue_schedule_count?: number;
  site?: { id: number; site_name: string } | null;

  // Detail Aset Tambahan
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  condition?: string | null;
  specific_location?: string | null;
  pic_employee_id?: number | null;
  assigned_to_employee_id?: number | null;
  purchase_cost?: number | null;
  acquisition_cost?: number | null;
  maintenance_interval?: string | null;
  next_maintenance_date?: string | null;

  maintenance_schedules?: MaintenanceSchedule[];
  maintenance_logs?: MaintenanceLog[];
  /** Siapa yang SEDANG memegang aset ini (lahir dari FSTB) - null kalau
   * masih di gudang/tidak pernah diserahkan ke siapa pun. */
  assigned_to_employee?: { id: number; full_name: string; employee_number?: string } | null;
  /** Peminjaman AKTIF (draft s.d. on_loan) untuk aset ini - kosong kalau
   * tidak sedang dalam proses/status pinjam sama sekali. Dipakai badge
   * "Sedang Dipinjam" di daftar - lihat AssetMaintenanceController::index(). */
  loans?: Array<{
    id: number; loan_number: string; status: string; expected_return_date: string;
    borrower_employee?: { id: number; full_name: string } | null;
  }>;
}

export interface CreateAssetInput {
  asset_name: string;
  category: string;
  brand: string;
  model: string;
  serial_number: string;
  condition: string;
  site_id: number;
  specific_location?: string;
  pic_employee_id: number;
  assigned_to_employee_id?: number;
  purchase_date: string;
  purchase_cost: number;
  acquisition_cost?: number;
  warranty_expiry?: string;
  vendor_name?: string;
  vendor_id?: number;
  maintenance_interval?: string;
  next_maintenance_date?: string;
  notes?: string;
}

export interface UpdateAssetInput {
  asset_name?: string;
  category?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  condition?: string;
  site_id?: number;
  specific_location?: string | null;
  pic_employee_id?: number | null;
  assigned_to_employee_id?: number | null;
  purchase_date?: string | null;
  purchase_cost?: number | null;
  acquisition_cost?: number | null;
  warranty_expiry?: string | null;
  vendor_name?: string | null;
  vendor_id?: number | null;
  maintenance_interval?: string | null;
  next_maintenance_date?: string | null;
  notes?: string | null;
  status?: AssetStatus;
}

/** Jejak lengkap 1 aset - lihat AssetMaintenanceController::history(). */
export interface AssetHistory {
  asset: {
    id: number; asset_number: string; asset_name: string; category: AssetCategory; status: AssetStatus;
    purchase_date: string | null; warranty_expiry: string | null;
    assigned_to_employee: { id: number; full_name: string } | null;
  };
  origin: {
    purchase_order: { id: number; po_number: string } | null;
    goods_receipt: { id: number; grn_number: string } | null;
    goods_handover: { id: number; handover_number: string } | null;
    vendor: { id: number; vendor_name: string } | null;
  };
  warranty_claims: Array<{ id: number; claim_number: string; status: string; claim_date: string; issue_description: string }>;
  item_loans: Array<{
    id: number; loan_number: string; status: string; purpose: string;
    expected_return_date: string; actual_return_date: string | null;
    borrower_employee?: { id: number; full_name: string } | null;
  }>;
  damaged_returns: Array<{ id: number; return_number: string; status: string; return_date: string; received_date: string | null; damage_description: string }>;
}

export interface MaintenanceSchedule {
  id: number;
  asset_id: number;
  maintenance_type: MaintenanceType;
  title: string;
  frequency_days: number | null;
  last_maintenance_date: string | null;
  next_due_date: string;
  assigned_to: number | null;
  is_active: boolean;
  is_overdue: boolean;
  notes: string | null;
  asset?: { id: number; asset_name: string; asset_number: string } | null;
}

export interface MaintenanceLog {
  id: number;
  schedule_id: number | null;
  asset_id: number;
  maintenance_date: string;
  performed_by: number | null;
  findings: string | null;
  actions_taken: string | null;
  next_recommended_date: string | null;
}

export interface AssetListParams {
  page?: number;
  per_page?: number;
  status?: AssetStatus;
  category?: AssetCategory;
  site_id?: number;
}
