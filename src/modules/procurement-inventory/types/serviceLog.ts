import type { PoStatus } from "./po";

export type ServiceProviderType = "vendor" | "internal";
export type ServiceResultStatus =
  | "completed"
  | "in_progress"
  | "pending_sparepart"
  | "scheduled"
  | "cancelled";
export type ServiceSlaStatus =
  | "on_time"
  | "within_sla"
  | "overdue"
  | "in_progress";
export type ServiceSourceType = "po" | "internal";

export interface ServiceAssetInfo {
  id: number;
  asset_name: string;
  asset_number: string;
  category?: string;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  specific_location?: string | null;
  site_name?: string | null;
}

/** Baris log servis (mendukung servis dari PO rekanan maupun servis internal non-PO) */
export interface ServiceLogLine {
  id: number;
  purchase_order_id?: number | null;
  description: string;
  quantity: number;
  uom: string;
  unit_price: number;
  discount_pct?: number;
  amount: number;
  
  // Field tambahan penghubung aset & operasional servis (sesuai requirement Section 19)
  source_type?: ServiceSourceType;
  service_number?: string;
  service_date?: string;
  provider_type?: ServiceProviderType;
  technician_name?: string;
  vendor_name?: string;
  asset_id?: number | null;
  asset?: ServiceAssetInfo | null;
  service_result?: ServiceResultStatus;
  service_notes?: string;
  ba_number?: string;
  ba_file_name?: string;
  sla_target?: string;
  sla_status?: ServiceSlaStatus;
  sla_duration?: string;
  created_at?: string;

  purchase_order?: {
    id: number;
    po_number: string;
    order_date: string;
    status: PoStatus;
    purchase_request_id: number | null;
    vendor?: { id: number; vendor_name: string } | null;
    purchase_request?: { id: number; pr_number: string } | null;
  } | null;
  goods_receipt_lines?: {
    id: number;
    quantity_received: number;
    goods_receipt?: {
      id: number;
      grn_number: string;
      status: "draft" | "posted" | "cancelled";
      receipt_date: string;
      ap_bill_id: number | null;
    } | null;
  }[];
}

export interface InternalServiceLogInput {
  asset_id: number;
  description: string;
  service_date: string;
  provider_type: ServiceProviderType;
  technician_name: string;
  vendor_name?: string;
  quantity: number;
  uom: string;
  unit_price: number;
  amount: number;
  service_result: ServiceResultStatus;
  service_notes?: string;
  ba_number?: string;
  ba_file_name?: string;
  sla_target?: string;
  sla_status: ServiceSlaStatus;
}

export interface ServiceLogListParams {
  page?: number;
  per_page?: number;
  vendor_id?: number;
  po_status?: PoStatus;
  source_type?: ServiceSourceType | "all";
  sla_status?: ServiceSlaStatus | "";
  service_result?: ServiceResultStatus | "";
  asset_id?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface ServiceLogSummary {
  total_lines: number;
  total_amount: number;
  received_count: number;
  internal_count?: number;
  on_time_sla_count?: number;
}

/** Satuan dinamis untuk Jasa / Service (sesuai poin #58 & #19 di update-procurement.md) */
export const SERVICE_UOM_OPTIONS = [
  { value: "paket", label: "Paket (Pkt)" },
  { value: "jam", label: "Jam (Hr)" },
  { value: "hari", label: "Hari (Day)" },
  { value: "kali", label: "Kali (X)" },
  { value: "kegiatan", label: "Kegiatan" },
  { value: "bulan", label: "Bulan" },
  { value: "unit", label: "Unit" },
] as const;

export const SERVICE_RESULT_LABELS: Record<ServiceResultStatus, string> = {
  completed: "Selesai Normal",
  in_progress: "Sedang Dikerjakan",
  pending_sparepart: "Menunggu Sparepart",
  scheduled: "Terjadwal",
  cancelled: "Dibatalkan",
};

export const SERVICE_RESULT_BADGES: Record<ServiceResultStatus, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200/80",
  pending_sparepart: "bg-amber-50 text-amber-700 border-amber-200/80",
  scheduled: "bg-purple-50 text-purple-700 border-purple-200/80",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200/80",
};

export const SERVICE_SLA_LABELS: Record<ServiceSlaStatus, string> = {
  on_time: "Sesuai SLA (On-Time)",
  within_sla: "Dalam Batas SLA",
  overdue: "Melebihi SLA (Overdue)",
  in_progress: "Sedang Berjalan",
};

export const SERVICE_SLA_BADGES: Record<ServiceSlaStatus, string> = {
  on_time: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  within_sla: "bg-teal-50 text-teal-700 border-teal-200/80",
  overdue: "bg-rose-50 text-rose-700 border-rose-200/80",
  in_progress: "bg-sky-50 text-sky-700 border-sky-200/80",
};
