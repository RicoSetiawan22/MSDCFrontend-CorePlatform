/** 'expiring_soon' PSEUDO-STATUS FRONTEND SAJA (dihitung client-side dari
 * days_until_expiry <= 30 && status==='active') - backend TIDAK PERNAH
 * balas literal ini, jangan dikirim sebagai query param filter status ke
 * server (akan cocok 0 baris). Alur approval baru: draft ->
 * pending_finance_approval -> pending_legal_approval -> sent_to_client ->
 * active (setelah klien upload dokumen tanda tangan) - lihat
 * ContractManagementService::updateStatus(). Ditolak Finance/Legal
 * manapun -> balik ke draft (bukan status 'rejected' tersendiri). */
export type ContractStatus =
  | "draft" | "pending_finance_approval" | "pending_legal_approval" | "sent_to_client"
  | "active" | "expiring_soon" | "expired" | "terminated";

export interface ContractService {
  id?: number;
  contract_id?: number;
  service_type: "colocation" | "dedicated_server" | "cloud" | "bandwidth" | "cross_connect" | "managed_service" | "other";
  description: string;
  quantity: number;
  unit_price: number;
  amount?: string;
  /** 'one_time' ditagih sekali (AR Invoice biasa saat Contract aktif),
   * 'recurring' (default) masuk Contract.monthly_value untuk billing
   * bulanan otomatis - lihat ContractManagementService::createFromQuotation(). */
  billing_type?: "one_time" | "recurring";
  cc_source_location?: string | null;
  cc_destination_location?: string | null;
}

export interface ContractAddendum {
  id: number;
  contract_id: number;
  addendum_number: string;
  description: string;
  effective_date: string;
  changes: Record<string, unknown> | null;
}

export interface ContractSla {
  id: number;
  contract_id: number;
  sla_name: string;
  uptime_target_pct: string;
  response_time_minutes: number;
  resolution_time_hours: number;
  compensation_type: string | null;
  compensation_value: string | null;
  notes: string | null;
}

export interface Contract {
  id: number;
  contract_number: string;
  customer_id: number | null;
  sales_order_id: number | null;
  contract_type: string;
  parent_contract_id: number | null;
  start_date: string;
  // Nullable - contract yang dibuat dari SO tanpa tanggal eksplisit
  // (sebelum CreateContractFromSoModal minta tanggal) bisa draft dengan
  // end_date kosong. Lihat ActivateContractModal.
  end_date: string | null;
  status: ContractStatus;
  /** Terisi begitu Contract diajukan approval (lihat
   * SetContractPendingFinanceApproval backend) - dipakai untuk resolve
   * breakdown approval per level (Finance/Legal/Manager) di PDF Kontrak. */
  workflow_instance_id: number | null;
  monthly_value: string;
  payment_term_days: number;
  auto_renew: boolean;
  notes: string | null;
  created_by: number | null;
  signed_file_id: number | null;
  sent_to_client_at: string | null;
  days_until_expiry: number | null;
  created_at: string;
  updated_at: string;
  /** Sekarang dieager-load juga di index() (bukan cuma show()) - dipakai
   * picker "Kontrak Baru" di Billing Integration. */
  customer?: { id: number; company_name: string } | null;
  // Alur BARU (Quotation -> Contract -> Rack Lock -> SO otomatis) - lihat
  // ContractManagementService::createFromQuotation()/setSite()/
  // lockResourcesAndIssueSalesOrder().
  site_id: number | null;
  quotation_id: number | null;
  resources_locked_at: string | null;
  /** Diisi OTOMATIS oleh DataCenterOps > Perintah Kerja begitu SEMUA item
   * checklist kategori terkait dicentang selesai (bukan field yang diedit
   * manual di form Contract) - lihat WorkOrderService::recomputeContractDates(). */
  device_installed_at: string | null;
  internet_installed_at: string | null;
  testing_completed_at: string | null;
}

/** Ringkasan kabel Cross-Connect yang ditautkan ke contract ini (lewat
 * contract_id di form Edit Kabel DataCenterOps) - lihat
 * ContractController::show()/related(). Tipe lengkapnya ada di
 * data-center-ops/types/crossConnect.ts, ini cuma subset field yang
 * dikirim di sini. */
export interface ContractCrossConnect {
  id: number;
  tag_number: string;
  cable_type: string;
  source_location: string | null;
  source_port: string | null;
  destination_location: string | null;
  destination_port: string | null;
  status: string;
  installed_date: string | null;
}

// Bentuk dari contractApi.show() - eager load customer/services/addenda/slas/salesOrder/crossConnects.
export interface ContractDetail extends Contract {
  customer?: { id: number; company_name: string } | null;
  services?: ContractService[];
  addenda?: ContractAddendum[];
  slas?: ContractSla[];
  sales_order?: { id: number; so_number: string } | null;
  /** Alur BARU - SO yang diterbitkan OTOMATIS dari contract ini (arah
   * kebalikan dari sales_order di atas). Lihat Contract::issuedSalesOrder(). */
  issued_sales_order?: { id: number; so_number: string; contract_id: number } | null;
  signed_file?: { id: number; original_name: string } | null;
  site?: { id: number; site_code: string; site_name: string } | null;
  quotation?: { id: number; quotation_number: string } | null;
  cross_connects?: ContractCrossConnect[];
}

/** Hasil ContractManagementService::resourceLockStatus() - dipakai
 * ContractDetailPage buat tampilkan progres kunci resource & aktif/nonaktif
 * tombol "Terbitkan SO". */
export interface ContractResourceLockStatus {
  required_unit_u: number;
  locked_unit_u: number;
  required_whole_racks: number;
  locked_whole_racks: number;
  ok: boolean;
}

export interface ContractFromQuotationValues {
  quotation_id: number;
  start_date?: string;
  end_date?: string;
  monthly_value?: number;
  payment_term_days?: number;
  auto_renew?: boolean;
  notes?: string;
}

export interface ContractFormValues {
  customer_id: number;
  sales_order_id?: number | null;
  contract_type?: string;
  start_date: string;
  end_date: string;
  payment_term_days?: number;
  auto_renew?: boolean;
  notes?: string;
  services?: ContractService[];
}

export interface ContractListParams {
  page?: number;
  per_page?: number;
  status?: ContractStatus;
  customer_id?: number;
  search?: string;
}
