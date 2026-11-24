import type { DepreciationHistoryEntry } from "./fixedAsset";

export interface DepreciationProjectionEntry {
  period_date: string;
  depreciation_amount: number;
  accumulated_depreciation: number;
  book_value: number;
}

export interface DepreciationSchedule {
  asset_number: string;
  /** Yang SUDAH terjadi (sudah di-posting ke GL). */
  history: DepreciationHistoryEntry[];
  /** ESTIMASI ke depan sampai fully depreciated - BELUM di-posting,
   * murni proyeksi dihitung dari sisa umur pakai. */
  projection: DepreciationProjectionEntry[];
}

export type DepreciationRunSkipReason = { asset_number: string; reason: string };

export interface DepreciationRunEntry {
  asset_id: number;
  period_date: string;
  amount: number;
  accumulated_depreciation_after: number;
  book_value_after: number;
  gl_journal_number: string;
}

export interface RunDepreciationResult {
  period: string;
  journal_numbers: string[];
  total_depreciation: number;
  entries_created: number;
  entries: DepreciationRunEntry[];
  skipped: DepreciationRunSkipReason[];
}
