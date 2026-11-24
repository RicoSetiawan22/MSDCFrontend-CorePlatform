
export type WarehouseStatus = "active" | "inactive";

export const WAREHOUSE_TYPES = [
  "Gudang Utama",
  "Gudang Transit",
  "Gudang Retur",
  "Gudang Konsinyasi",
  "Gudang Bonded",
] as const;

export type WarehouseType = (typeof WAREHOUSE_TYPES)[number];

export interface Warehouse {
  id: number;
  warehouse_code: string;
  warehouse_name: string;
  warehouse_type?: string | null;
  type?: string | null;
  address: string | null;
  phone?: string | null;
  pic_employee_id?: number | null;
  pic_name?: string | null;
  pic_employee?: { id: number; full_name: string; employee_number?: string } | null;
  capacity?: number | null;
  notes?: string | null;
  city?: string | null;
  site_id?: number | null;
  is_active: boolean;
  status?: WarehouseStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWarehouseInput {
  warehouse_name: string;
  warehouse_type?: string;
  type?: string;
  address: string;
  phone?: string;
  pic_employee_id?: number | null;
  pic_name?: string;
  capacity?: number | null;
  notes?: string;
  site_id?: number | null;
}

export interface UpdateWarehouseInput {
  warehouse_name?: string;
  warehouse_type?: string;
  type?: string;
  address?: string | null;
  phone?: string | null;
  pic_employee_id?: number | null;
  pic_name?: string | null;
  capacity?: number | null;
  notes?: string | null;
  site_id?: number | null;
  is_active?: boolean;
}

