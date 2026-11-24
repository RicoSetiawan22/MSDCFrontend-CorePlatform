export type PrStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "cancelled"
  | "converted_to_po";

export type PrLineType = "goods" | "service";
export type PrChannel = "offline" | "online";

export interface PurchaseRequestLine {
  id?: number;
  purchase_request_id?: number;
  item_id: number | null;
  item_name?: string | null;
  line_type: PrLineType;
  description: string;
  quantity: number;
  uom: string;
  estimated_unit_price: number;
  channel: PrChannel;
  justification?: string;
}

export type PrLineForm = Omit<PurchaseRequestLine, "id" | "purchase_request_id"> & {
  id?: number;
  purchase_request_id?: number;
  item_name?: string | null;
  justification?: string;
};

export interface PurchaseRequest {
  id: number;
  organization_id: number;
  pr_number: string;
  requested_by: number | null;
  employee_id: number | null;
  department_id: number | null;
  cost_center_id: number | null;
  purpose: string | null;
  notes: string | null;
  status: PrStatus;
  workflow_instance_id: number | null;
  required_date?: string | null;
  priority?: "normal" | "urgent" | null;
  justification?: string | null;
  need_type?: "restock" | "new_asset" | "consumable" | "service" | null;
  delivery_location?: string | null;
  preferred_vendor_id?: number | string | null;
  created_at: string;
  updated_at: string;
  lines?: PurchaseRequestLine[];
  requester?: { id: number; name: string } | null;
  employee?: { id: number; full_name: string } | null;
}

export interface PrFormValues {
  organization_id?: number;
  employee_id: number | string | null;
  employee_name?: string | null;
  department_id: number | string | null;
  cost_center_id: number | string | null;
  purpose: string | null;
  notes: string | null;
  required_date?: string;
  priority?: "normal" | "urgent";
  justification?: string;
  need_type?: "restock" | "new_asset" | "consumable" | "service";
  delivery_location?: string;
  preferred_vendor_id?: number | string | null;
  lines: PrLineForm[];
}

export interface PurchaseRequestListParams {
  page?: number;
  per_page?: number;
  status?: PrStatus;
  department_id?: number;
  search?: string;
}