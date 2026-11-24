// Cocok dengan enum kolom crm_sales_order.status yang SEBENARNYA (lihat
// SalesOrderService::updateStatus()) - BUKAN draft/submitted/confirmed/
// completed, itu status yang tidak pernah ada di backend.
export type SalesOrderStatus = "pending" | "provisioning" | "active" | "cancelled";

export interface SalesOrderLine {
  id: number;
  sales_order_id: number;
  line_number: number;
  service_type: "colocation" | "dedicated_server" | "cloud" | "bandwidth" | "cross_connect" | "managed_service" | "other";
  description: string;
  quantity: string;
  unit_price: string;
  amount: string;
  // Kebutuhan resource fisik - diisi lewat SalesOrderResourceCard sebelum
  // cek/reservasi ketersediaan ke DataCenterOps.
  required_rack_u: number | null;
  /** 'unit' = ecer per-U (nyempil bareng tenant lain di 1 rack), 'whole_rack'
   * = borong 1 rack utuh - eksklusif, tidak peduli total_u rack yang kebagian. */
  rack_mode: "unit" | "whole_rack";
  required_ip_count: number | null;
  required_power_watt: string | null;
  required_bandwidth_mbps: number | null;
  requires_cross_connect: boolean;
}

export interface SalesOrder {
  id: number;
  so_number: string;
  quotation_id: number | null;
  /** Alur BARU - diisi kalau SO ini DITERBITKAN OTOMATIS dari Contract
   * (bukan langsung dari Quotation) - lihat SalesOrderService::createFromContract().
   * Kalau ada, halaman detail SO jadi VIEW-ONLY (lihat sourceContract di
   * bawah) - approval klien & rack sudah selesai di level Contract. */
  contract_id: number | null;
  customer_id: number | null;
  site_id: number | null;
  order_date: string;
  status: SalesOrderStatus;
  total_amount: string;
  notes: string | null;
  po_file_id: number | null;
  // Diisi otomatis begitu SEMUA baris berhasil direservasi lewat
  // DataCenterOps - gerbang wajib sebelum confirmWithFile() (upload
  // approval client) boleh jalan.
  resources_reserved_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

// Bentuk dari salesOrderApi.show() - eager load lines/customer/quotation/site/contracts.
export interface SalesOrderDetail extends SalesOrder {
  lines?: SalesOrderLine[];
  customer?: { id: number; company_name: string } | null;
  quotation?: { id: number; quotation_number: string } | null;
  site?: { id: number; site_code: string; site_name: string } | null;
  // 1 SO cuma boleh jadi 1 Contract (backend menolak dobel) - dipakai
  // buat sembunyikan tombol "Buat Contract" kalau sudah pernah dibuat.
  contracts?: Array<{ id: number; contract_number: string; status: string }>;
  /** Contract yang MENERBITKAN SO ini (arah kebalikan dari contracts[] di
   * atas) - null kalau SO ini dari alur LAMA (langsung dari Quotation). */
  source_contract?: { id: number; contract_number: string; status: string; signed_file_id: number | null } | null;
}

export interface SalesOrderListParams {
  page?: number;
  per_page?: number;
  status?: SalesOrderStatus;
  customer_id?: number;
  search?: string;
}

export type ResourceType = "rack" | "ip" | "power" | "bandwidth" | "cross_connect";

export interface ResourceCheckResult {
  line_id: number;
  service_type: string;
  resource: ResourceType;
  required: number;
  available: number;
  ok: boolean;
  detail: string;
}

export interface ResourceRequirementInput {
  id: number;
  required_rack_u?: number | null;
  rack_mode?: "unit" | "whole_rack";
  required_ip_count?: number | null;
  required_power_watt?: number | null;
  required_bandwidth_mbps?: number | null;
  requires_cross_connect?: boolean;
}
