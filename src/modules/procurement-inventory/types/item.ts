export type ItemType = "sparepart" | "consumable" | "asset" | "other";
export type TrackingType = "none" | "serial_number" | "batch";

export interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_type: ItemType;
  uom: string;
  reorder_point?: number | null; 
  reorder_qty?: number | null;  
  is_active: boolean;
  notes?: string | null;
  // Spesifikasi & Master Satuan
  category?: string;
  sub_category?: string;
  description?: string;
  is_asset?: boolean;
  tracking_type?: TrackingType;
  sku?: string;
  standard_price?: number;
  default_warehouse?: string;
  rack_location?: string;
  max_stock?: number;
  lead_time_days?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateItemInput {
  item_name: string;
  item_type: ItemType;
  uom: string;
  reorder_point?: number | null;
  reorder_qty?: number | null;
  notes?: string;
  category?: string;
  sub_category?: string;
  description?: string;
  is_asset?: boolean;
  tracking_type?: TrackingType;
  sku?: string;
  standard_price?: number;
  default_warehouse?: string;
  rack_location?: string;
  max_stock?: number;
  lead_time_days?: number;
}

export interface UpdateItemInput {
  item_name?: string;
  uom?: string;
  reorder_point?: number | null;
  reorder_qty?: number | null;
  is_active?: boolean;
  notes?: string;
  category?: string;
  sub_category?: string;
  description?: string;
  is_asset?: boolean;
  tracking_type?: TrackingType;
  sku?: string;
  standard_price?: number;
  default_warehouse?: string;
  rack_location?: string;
  max_stock?: number;
  lead_time_days?: number;
}

export interface ItemListParams {
  page?: number;
  per_page?: number;
  item_type?: ItemType;
  is_active?: boolean;
  search?: string;
}

export type { Warehouse } from "./warehouse";

interface ItemRef {
  id: number;
  item_code: string;
  item_name: string;
  uom: string;
  reorder_point?: number | null;
}

interface WarehouseRef {
  id: number;
  warehouse_code?: string;
  warehouse_name?: string;
}

export interface StockBalance {
  item_id: number;
  warehouse_id: number;
  item?: ItemRef | null;
  warehouse?: WarehouseRef | null;
  balance: number;
  below_reorder_point: boolean;
}

export type StockDirection = "in" | "out";
export type StockMovementType = "receipt" | "issue" | "adjustment" | "transfer" | string;

export interface StockMovement {
  id: number;
  item_id: number;
  warehouse_id: number;
  direction: StockDirection;
  movement_type: StockMovementType;
  quantity: number;
  unit_cost?: number | null;
  reference_type?: string | null;
  reference_number?: string | null;
  related_movement_id?: number | null;
  movement_date: string;
  notes?: string | null;
  performed_by?: number | null;
  employee_id?: number | null;
  created_at: string;
  item?: ItemRef | null;
  warehouse?: WarehouseRef | null;
  employee?: { id: number; full_name: string } | null;
}

export interface StockMovementListParams {
  page?: number;
  per_page?: number;
  item_id?: number;
  warehouse_id?: number;
  movement_type?: string;
  employee_id?: number;
}