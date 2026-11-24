export type DeviceStatus = "active" | "spare" | "maintenance" | "decommissioned";
export type DeviceType = "server" | "switch" | "router" | "firewall" | "ups" | "pdu" | "storage" | "other";

export interface Device {
  id: number;
  device_code: string;
  device_name: string;
  device_type: DeviceType;
  site_id: number | null;
  site_room_id: number | null;
  rack_id: number | null;
  rack_position_u: number | null;
  /** Device >1U (mis. server 2U di slot 2-3) - null berarti device 1U
   * (dianggap sama dengan rack_position_u). Lihat RackService::occupancyMap(). */
  rack_position_u_end: number | null;
  /** Konsumsi daya device - dipakai RackService::utilization() buat laporan
   * sisa kapasitas daya rack. */
  power_watt: string | number | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  status: DeviceStatus;
  customer_id: number | null;
  contract_id: number | null;
  /** Baris layanan spesifik di kontrak (kontrak bisa punya beberapa baris
   * colocation/dedicated_server) - dipakai fitur Perintah Kerja DataCenterOps
   * untuk trace device balik ke item checklist yang mendaftarkannya. */
  contract_service_id: number | null;
  fixed_asset_id: number | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  rack?: {
    id: number;
    rack_code: string;
    rack_name?: string | null;
    total_u?: number;
    power_capacity_watt?: string | number | null;
    status?: string;
  } | null;
  site?: {
    id: number;
    site_code: string;
    site_name: string;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    total_power_capacity_kw?: string | number | null;
    status?: string;
  } | null;
  site_room?: {
    id: number;
    room_code: string;
    room_name: string;
    floor?: string | null;
    zone?: string | null;
    room_type?: string | null;
  } | null;
  customer?: {
    id: number;
    customer_code?: string;
    company_name?: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  contract?: {
    id: number;
    contract_number?: string;
    start_date?: string | null;
    end_date?: string | null;
    status?: string | null;
  } | null;
  fixed_asset?: {
    id: number;
    asset_code?: string;
    asset_name?: string;
  } | null;
  network_ports?: Array<{
    id: number;
    port_name: string;
    mac_address?: string | null;
    ip_address?: string | null;
    speed?: string | null;
    status?: string | null;
  }>;
}

export type DeviceDetail = Device;

export interface DeviceListParams {
  page?: number;
  per_page?: number;
  status?: DeviceStatus;
  device_type?: DeviceType;
  site_id?: number;
  customer_id?: number;
  contract_id?: number;
  search?: string;
}
