import type { Contract, ContractService } from "./contract";

/** Tingkat urgensi perpanjangan - dihitung CLIENT-SIDE dari
 * Contract.days_until_expiry (backend tidak mengirim field ini). Batas hari
 * ada di utils/renewal.ts (URGENCY_LIMIT). */
export type RenewalUrgency = "darurat" | "peringatan" | "persiapan";

/** Satu baris di tabel "Daftar Kontrak Akan Berakhir". */
export interface RenewalRow {
  contract: Contract;
  daysLeft: number;
  urgency: RenewalUrgency;
  /** Kontrak perpanjangan (child, parent_contract_id = contract.id) yang
   * masih diproses (draft / approval / menunggu TTD klien). */
  renewal: Contract | null;
}

export interface RenewalKpis {
  within90: number;
  within60: number;
  within30: number;
  emergency: number;
  inProgress: number;
  renewed: number;
}

export interface RenewalData {
  rows: RenewalRow[];
  kpis: RenewalKpis;
  /** parent contract id -> kontrak perpanjangan terbaru yang relevan */
  childByParent: Map<number, Contract>;
}

/** Payload POST /v1/crm-sales/contracts/{id}/renew - backend membuat
 * Contract BARU (status 'draft', parent_contract_id = id kontrak lama,
 * contract_type 'renewal') yang lalu berjalan lewat alur approval yang sudah
 * ada: Finance -> Legal -> kirim ke klien -> klien TTD -> active. */
export interface ContractRenewValues {
  start_date: string;
  end_date: string;
  monthly_value: number;
  payment_term_days: number;
  auto_renew: boolean;
  notes?: string;
  services: Array<Pick<
    ContractService,
    "service_type" | "description" | "quantity" | "unit_price" | "billing_type" | "cc_source_location" | "cc_destination_location"
  >>;
}

export type ContractCloseReason =
  | "client_not_continuing"
  | "moved_vendor"
  | "service_discontinued"
  | "budget_issue"
  | "other";

/** Payload POST /v1/crm-sales/contracts/{id}/close - kontrak TIDAK
 * diperpanjang & diselesaikan pada effective_date (status -> 'expired'). */
export interface ContractCloseValues {
  reason: ContractCloseReason;
  effective_date: string;
  notes?: string;
}
