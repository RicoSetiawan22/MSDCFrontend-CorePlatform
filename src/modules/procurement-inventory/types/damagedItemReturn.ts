export type DamagedItemReturnStatus = "draft" | "submitted" | "approved" | "rejected" | "received" | "cancelled";

export interface DamagedItemReturn {
  id: number;
  organization_id: number;
  return_number: string;
  asset_id: number;
  returned_by_employee_id: number;
  received_by_employee_id: number | null;
  damage_description: string;
  return_date: string;
  received_date: string | null;
  status: DamagedItemReturnStatus;
  workflow_instance_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  asset?: { id: number; asset_number: string; asset_name: string } | null;
  returned_by_employee?: { id: number; full_name: string } | null;
  received_by_employee?: { id: number; full_name: string } | null;
}

export interface DamagedItemReturnListParams {
  page?: number;
  per_page?: number;
  status?: DamagedItemReturnStatus;
  search?: string;
}

export interface CreateDamagedItemReturnValues {
  asset_id: number;
  returned_by_employee_id?: number;
  damage_description: string;
  return_date?: string;
  notes?: string;
}

/** Aset yang BOLEH diajukan pengembalian rusak - HARUS sedang dipegang
 * seseorang (assigned_to_employee_id) - lihat
 * DamagedItemReturnController::returnableAssets(). */
export interface ReturnableAsset {
  id: number;
  asset_number: string;
  asset_name: string;
  category: string;
  assigned_to_employee_id: number | null;
  assigned_to_employee?: { id: number; full_name: string } | null;
}
