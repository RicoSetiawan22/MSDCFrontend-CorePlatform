import type { Device } from "./device";
import type { CrossConnect } from "./crossConnect";
import type { IpAddress } from "./ipam";

export type ServiceType = "colocation" | "dedicated_server" | "cloud" | "bandwidth" | "cross_connect" | "managed_service" | "other";

export interface WorkOrderItem {
  id: number;
  work_order_id: number;
  contract_service_id: number | null;
  item_type: "service" | "testing";
  service_type: ServiceType | null;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: number | null;
  completed_by_user?: { id: number; name: string } | null;
  notes: string | null;
  contract_service?: {
    id: number;
    contract_id: number;
    quantity: string | number;
    unit_price: string | number;
    amount: string | number | null;
    required_rack_u: number | null;
    rack_mode: "unit" | "whole_rack" | null;
    required_ip_count: number | null;
    required_power_watt: string | number | null;
    required_bandwidth_mbps: number | null;
    requires_cross_connect: boolean;
    /** Resource yang SUDAH ditautkan lewat baris layanan ini - inilah yang
     * bikin item ini "one-stop": device fisik di rack, kabel cross-connect,
     * dan IP yang sudah dialokasikan, semua kebaca langsung di sini tanpa
     * buka menu Device/Cross-Connect/IPAM terpisah. */
    devices?: Device[];
    cross_connects?: CrossConnect[];
    ip_addresses?: IpAddress[];
  } | null;
}

export type WorkOrderStatus = "open" | "completed";

export interface WorkOrder {
  id: number;
  contract_id: number;
  sales_order_id: number | null;
  status: WorkOrderStatus;
  completed_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  items: WorkOrderItem[];
  contract?: {
    id: number;
    contract_number: string;
    status: string;
    device_installed_at: string | null;
    internet_installed_at: string | null;
    testing_completed_at: string | null;
  } | null;
  sales_order?: {
    id: number;
    so_number: string;
    order_date: string;
    customer?: { id: number; company_name: string } | null;
  } | null;
}

/** Baris di listing "Perintah Kerja" - SO yang belum selesai dipasang.
 * work_order null = belum pernah dibuka staf DC Ops sama sekali. */
export interface PendingSalesOrder {
  id: number;
  so_number: string;
  order_date: string;
  status: string;
  customer?: { id: number; company_name: string } | null;
  source_contract?: { id: number; contract_number: string; status: string } | null;
  contracts?: { id: number; contract_number: string; status: string }[];
  work_order?: { id: number; status: WorkOrderStatus; items: WorkOrderItem[] } | null;
}

export interface WorkOrderListParams {
  page?: number;
  per_page?: number;
  search?: string;
}
