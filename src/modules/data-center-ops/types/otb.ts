export type OtbStatus = "active" | "inactive";
export type OtbPortStatus = "available" | "allocated" | "damaged";

/** OTB (Optical Termination Box) - kotak fisik terminasi optik. Fields
 * HARUS cocok persis dengan OtbController.php / Otb entity (tabel dc_otb). */
export interface Otb {
  id: number;
  tag_number: string;
  location: string | null;
  port_count: number;
  status: OtbStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  allocated_ports_count?: number;
  available_ports_count?: number;
  damaged_ports_count?: number;
}

/** tag_number TIDAK ADA di sini - auto-generated dari Number Sequence
 * terpusat (Master Data > Number Sequence, module_code='otb'), immutable
 * setelah dibuat. */
export interface OtbFormValues {
  location?: string;
  port_count: number;
  status?: OtbStatus;
  notes?: string;
}

export interface OtbListParams {
  page?: number;
  per_page?: number;
  status?: OtbStatus;
  search?: string;
}

/** 1 port fisik individual di dalam 1 OTB - tabel dc_otb_port. */
export interface OtbPort {
  id: number;
  otb_id: number;
  port_number: number;
  status: OtbPortStatus;
  customer_id: number | null;
  contract_service_id: number | null;
  allocated_date: string | null;
  released_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: { id: number; company_name: string } | null;
  contract_service?: { id: number; contract_id: number; description: string } | null;
}

export interface OtbPortAllocateValues {
  customer_id?: number | null;
  contract_service_id?: number | null;
  notes?: string;
}

export interface OtbPortListParams {
  page?: number;
  per_page?: number;
  status?: OtbPortStatus;
  customer_id?: number;
  search?: string;
}
