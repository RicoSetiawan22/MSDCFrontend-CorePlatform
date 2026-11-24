export type CostCenterType = "location" | "functional" | "other";

export interface CostCenter {
  id: number;
  code: string;
  name: string;
  type: CostCenterType;
  parent_id: number | null;
  parent: { id: number; code: string; name: string } | null;
  is_active: boolean;
  notes: string | null;
}

export interface CostCenterFormValues {
  code: string;
  name: string;
  type?: CostCenterType;
  parent_id?: number | null;
  notes?: string;
}

export interface CostCenterListParams {
  type?: CostCenterType;
  is_active?: boolean;
  search?: string;
  per_page?: number;
}
