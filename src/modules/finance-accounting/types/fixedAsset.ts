export type AssetCategory = "rack" | "ups" | "generator" | "server" | "switch" | "router" | "building" | "other";
export type DepreciationMethod = "straight_line" | "declining_balance";
export type AssetStatus = "in_service" | "disposed";

export interface AssetRelocation {
  id: number;
  from_location: string;
  to_location: string;
  relocation_date: string;
  reason: string | null;
}

export interface BookValueSummary {
  purchase_price: number;
  accumulated_depreciation: number;
  book_value: number;
  monthly_depreciation: number;
}

export interface FaAsset {
  id: number;
  asset_number: string;
  asset_name: string;
  asset_category: AssetCategory;
  asset_tag: string | null;
  location: string;
  cost_center_id: number | null;
  purchase_date: string;
  purchase_price: number;
  salvage_value: number;
  useful_life_months: number;
  depreciation_method: DepreciationMethod;
  asset_account: { id: number; account_code: string; account_name: string };
  status: AssetStatus;
  acquisition_gl_journal_number: string | null;
  disposal_date: string | null;
  disposal_proceeds: number | null;
  disposal_gl_journal_number: string | null;
  notes: string | null;
  /** DIHITUNG LANGSUNG dari fin_fa_depreciation_entry tiap request (bukan
   * kolom tersimpan) - lihat FixedAssetService::bookValue(). */
  book_value_summary: BookValueSummary;
  /** Cuma ada di response show(), TIDAK ada di list(). */
  depreciation_history?: DepreciationHistoryEntry[];
  relocations?: AssetRelocation[];
}

export interface DepreciationHistoryEntry {
  period_date: string;
  amount: number;
  accumulated_depreciation: number;
  book_value: number;
  gl_journal_number: string | null;
}

export interface FaAssetFormValues {
  asset_name: string;
  asset_category: AssetCategory;
  asset_tag?: string;
  location: string;
  cost_center_id?: number;
  purchase_date: string;
  purchase_price: number;
  salvage_value?: number;
  useful_life_months: number;
  depreciation_method?: DepreciationMethod;
  asset_account_code: string;
  /** TRUE = langsung posting jurnal akuisisi (Dr Aset / Cr counter_account)
   * saat itu juga. FALSE (default) = cuma daftarkan datanya, jurnal
   * akuisisi menyusul terpisah (mis. lewat GRN Procurement Team 5). */
  post_acquisition?: boolean;
  counter_account_code?: string;
  notes?: string;
}

export interface FaAssetListParams {
  page?: number;
  per_page?: number;
  asset_category?: AssetCategory;
  status?: AssetStatus;
  search?: string;
}
