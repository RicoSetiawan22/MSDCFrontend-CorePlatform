export type RackStatus = "active" | "reserved" | "maintenance" | "decommissioned";

export type RackAllocationStatus = "active" | "reserved" | "pending_release" | "released";

export interface RackAllocation {
  id: number;
  rack_id: number;
  customer_id: number | null;
  start_u: number;
  end_u: number;
  status: RackAllocationStatus;
  created_at: string;
}

export interface Rack {
  id: number;
  rack_code: string;
  rack_name: string | null;
  site_room_id: number | null;
  total_u: number;
  power_capacity_watt: string | number | null;
  status: RackStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  /** rack_code TIDAK unik global - cuma unik per Room - selalu tampilkan
   * ini di UI supaya rack "R01" di Room/Site yang beda tidak tertukar
   * (lihat RackController::index()). */
  site_room?: {
    id: number;
    room_code: string;
    room_name: string;
    floor?: string | number | null;
    zone?: string | null;
    site?: { id: number; site_code: string; site_name: string } | null;
  } | null;
  /** Sisa kapasitas U & Watt - dihitung bulk di RackController::index() (bukan
   * N+1), langsung nempel di listing supaya /dc/racks bisa jadi laporan sisa
   * kapasitas tanpa buka detail satu-satu. */
  used_u?: number;
  free_u?: number;
  used_watt?: number;
  free_watt?: number | null;
}

export interface RackDependentDevice {
  id: number;
  device_code: string;
  device_name: string;
  device_type: string;
  rack_position_u: number | null;
  rack_position_u_end: number | null;
}

export interface RackDependentAllocation {
  id: number;
  start_u: number;
  end_u: number;
  status: RackAllocationStatus;
  customer_id: number | null;
  contract_id: number | null;
  customer?: { id: number; company_name: string } | null;
  contract?: { id: number; contract_number: string; days_until_expiry?: number | null } | null;
}

/** Ringkasan device & alokasi yang menggantung di rack - dipakai halaman
 * detail rack supaya kelihatan APA yang menghalangi hapus, bukan cuma
 * pesan error 409 setelah diklik. Lihat RackService::getDependents(). */
export interface RackDependents {
  devices: RackDependentDevice[];
  allocations: RackDependentAllocation[];
  can_delete: boolean;
}

export interface RackRoomDetail {
  id: number;
  organization_id?: number | null;
  site_id?: number;
  room_code: string;
  room_name: string;
  floor?: string | number | null;
  zone?: string | null;
  room_type?: string | null;
  area_sqm?: string | number | null;
  created_at?: string;
  updated_at?: string;
  site?: {
    id: number;
    organization_id?: number | null;
    site_code: string;
    site_name: string;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    total_power_capacity_kw?: string | number | null;
    total_bandwidth_mbps?: string | number | null;
    status?: string | null;
    cost_center_id?: number | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  } | null;
}

export interface RackDetail extends Omit<Rack, "site_room"> {
  site_room?: RackRoomDetail | null;
  utilization?: {
    rack_code: string;
    total_u: number;
    used_u: number;
    free_u: number;
    utilization_pct: number;
    power_capacity_watt: string | number | null;
    used_watt: number;
    free_watt: number | null;
    power_utilization_pct: number | null;
  };
  dependents?: RackDependents;
}

export interface RackListParams {
  page?: number;
  per_page?: number;
  status?: RackStatus;
  site_room_id?: number;
  site_id?: number;
  search?: string;
}

export interface RackSlot {
  u: number;
  status: "available" | "booked";
  allocation_id?: number;
  customer_name?: string | null;
  /** Device fisik yang nempel di slot U ini (dari dc_device.rack_position_u) -
   * beda dari allocation_id yang cuma "reservasi ruang" customer. Lihat
   * RackService::occupancyMap(). */
  device_id?: number;
  device_code?: string;
  device_name?: string;
}

export interface RackOccupancy {
  rack_id: number;
  rack_code: string;
  total_u: number;
  slots: RackSlot[];
}
