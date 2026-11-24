export interface PcProfitCenter {
  id: number;
  code: string;
  name: string;
  parent: { id: number; code: string; name: string } | null;
  is_active: boolean;
  notes: string | null;
}

export interface PcProfitCenterFormValues {
  code: string;
  name: string;
  parent_id?: number;
  is_active?: boolean;
  notes?: string;
}

export interface PcProfitCenterListParams {
  parent_id?: number;
  is_active?: boolean;
  search?: string;
}
