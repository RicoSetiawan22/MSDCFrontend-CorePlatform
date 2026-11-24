export type SiteStatus = "active" | "maintenance" | "decommissioned";

export interface SiteRoom {
  id: number;
  site_id?: number;
  room_code: string;
  room_name: string;
  floor: string | null;
  zone: string | null;
  room_type: string;
  area_sqm: number | null;
  site_code?: string;
  site_name?: string;
}

export interface SiteContractRef {
  id: number;
  contract_number: string;
  status: string;
  customer_id: number;
  days_until_expiry?: number | null;
  customer?: { id: number; company_name: string };
}

export interface SiteSalesOrderRef {
  id: number;
  so_number: string;
  status: string;
  customer_id: number;
  customer?: { id: number; company_name: string };
}

export interface SiteDependentDevice {
  id: number;
  device_code: string;
  device_name: string;
  customer_id: number | null;
  contract_id: number | null;
  customer?: { id: number; company_name: string } | null;
  contract?: { id: number; contract_number: string } | null;
}

export interface SiteDependentRackAllocation {
  id: number;
  rack_id: number;
  customer_id: number | null;
  contract_id: number | null;
  rack?: { id: number; rack_code: string } | null;
  customer?: { id: number; company_name: string } | null;
  contract?: { id: number; contract_number: string } | null;
}

/** Ringkasan data yang menggantung di bawah site - dipakai halaman detail
 * site untuk tahu apa saja yang perlu dibereskan sebelum site bisa dihapus.
 * rooms/racks/devices count di sini CUMA infrastruktur - kalau tidak ada
 * kontrak/SO/alokasi aktif/device-customer/rack-alokasi yang mengikat
 * customer, semuanya ikut dihapus otomatis (cascade) bareng site-nya -
 * lihat devices_with_customer & racks_with_active_allocation untuk detail
 * APA yang benar-benar memblokir. Lihat
 * DataCenterOps\Services\SiteService::getDependents()/deleteSite(). */
export interface SiteDependents {
  rooms_count: number;
  racks_count: number;
  devices_count: number;
  power_allocations_count: number;
  bandwidth_allocations_count: number;
  contracts: SiteContractRef[];
  sales_orders: SiteSalesOrderRef[];
  devices_with_customer: SiteDependentDevice[];
  racks_with_active_allocation: SiteDependentRackAllocation[];
  has_customer: boolean;
  can_delete: boolean;
}

export interface Site {
  id: number;
  organization_id?: number | null;
  site_code: string;
  site_name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  total_power_capacity_kw: string | number | null;
  total_bandwidth_mbps?: string | number | null;
  status: SiteStatus;
  cost_center_id: number | null;
  notes: string | null;
  rooms?: SiteRoom[];
  dependents?: SiteDependents;
  created_at: string;
  updated_at: string;
}

export interface SiteListParams {
  page?: number;
  per_page?: number;
  status?: SiteStatus;
  search?: string;
}
