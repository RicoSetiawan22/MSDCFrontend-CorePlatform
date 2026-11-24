export interface InventoryAlertItem {
  id: number;
  item_code: string;
  item_name: string;
  stock_quantity: number;
  min_stock: number;
  status: "out_of_stock" | "low_stock";
}

export interface DashboardSummary {
  purchase_requests: {
    total: number;
    by_status: Record<string, number>;
    pending_approval_count: number;
  };
  purchase_orders: {
    total: number;
    by_status: Record<string, { count: number; value: number }>;
    pending_approval_count: number;
    open_value: number;
  };
  rfq: {
    pending_epm_approval: number;
  };
  goods_receipts: {
    draft_count: number;
    posted_this_month_count: number;
  };
  inventory: {
    total_items: number;
    total_warehouses: number;
    below_reorder_point: number;
    out_of_stock_count?: number; 
    alerts?: InventoryAlertItem[]; 
  };
  vendors: {
    total_active: number;
  };
  assets: {
    total: number;
    overdue_maintenance: number;
  };
}

export interface ActivityItem {
  type: "purchase_request" | "purchase_order" | "goods_receipt";
  label: string;
  status: string;
  amount?: number;
  created_at: string;
}