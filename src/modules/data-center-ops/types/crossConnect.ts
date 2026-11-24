export type CrossConnectStatus = "available" | "active" | "damaged";

export type CableType = "cat5e" | "cat6" | "cat6a" | "multimode_fiber" | "singlemode_fiber" | "coaxial" | "other";

/** Cross-Connect Inventory - aset fisik kabel yang menyambungkan 2 titik
 * (source/destination) untuk layanan Cross-Connect yang dijual lewat CRM.
 * Field-field ini HARUS cocok persis dengan CrossConnectController.php /
 * CrossConnect entity (tabel dc_cross_connect). */
export interface CrossConnect {
  id: number;
  tag_number: string | null;
  cable_type: CableType;
  status: CrossConnectStatus;
  source_location: string | null;
  source_port: string | null;
  destination_location: string | null;
  destination_port: string | null;
  /** Kalau ujung tujuan dicolok ke OTB yang terdaftar di sistem ini
   * (bukan carrier pihak ketiga) - FK asli ke dc_otb_port, dieksklusifkan
   * dengan destination_location/destination_port (teks bebas). */
  destination_otb_port_id: number | null;
  port_a_id: number | null;
  port_b_id: number | null;
  customer_id: number | null;
  /** Kontrak CRM langsung (lookup cepat) - terpisah dari contract_service_id
   * yang menunjuk baris layanan spesifik di dalam kontrak itu. */
  contract_id: number | null;
  contract_service_id: number | null;
  installed_date: string | null;
  terminated_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: { id: number; company_name: string } | null;
  contract?: { id: number; contract_number: string } | null;
  contract_service?: { id: number; contract_id: number; description: string } | null;
  destination_otb_port?: { id: number; otb_id: number; port_number: number; otb?: { id: number; tag_number: string } | null } | null;
}

export interface CrossConnectDetail extends CrossConnect {
  contract_service?: (CrossConnect["contract_service"] & { contract?: { id: number; contract_number: string } | null }) | null;
}

/** tag_number TIDAK ADA di sini - auto-generated dari Number Sequence
 * terpusat (Master Data > Number Sequence, module_code='cross_connect'),
 * immutable setelah dibuat, dan SEKARANG SELALU diisi (dulu opsional). */
export interface CrossConnectFormValues {
  cable_type?: CableType;
  source_location?: string;
  source_port?: string;
  destination_location?: string;
  destination_port?: string;
  destination_otb_port_id?: number | null;
  customer_id?: number | null;
  contract_id?: number | null;
  contract_service_id?: number | null;
  status?: CrossConnectStatus;
  installation_date?: string;
  notes?: string;
}

export interface CrossConnectListParams {
  page?: number;
  per_page?: number;
  status?: CrossConnectStatus;
  cable_type?: CableType;
  customer_id?: number;
  search?: string;
}
