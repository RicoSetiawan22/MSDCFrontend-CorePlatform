/** Field HARUS cocok persis dengan kolom cp_md_currency (dicek langsung ke
 * DB - field lama currency_code/currency_name/is_base TIDAK PERNAH ada,
 * bikin tabel Currency di Master Data selalu tampil kosong). Backend
 * (FinanceReferenceController) cuma balas Currency::get() APA ADANYA,
 * tanpa Resource transform - JSON persis nama kolom DB. */
export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string | null;
  decimal_places: number;
  is_active: boolean;
  created_at: string;
}

export interface CurrencyFormValues {
  code: string;
  name: string;
  symbol?: string;
  decimal_places?: number;
}

/** Field HARUS cocok persis dengan kolom cp_md_bank (dicek langsung ke DB -
 * field lama bank_code/bank_name TIDAK PERNAH ada). branch_name/account_number/
 * account_name ADA di DB walau tidak ada di migration manapun yang tercatat
 * (schema drift - lihat catatan proyek soal ini) - JANGAN dihapus dari sini
 * cuma karena tidak ketemu migration-nya. */
export interface Bank {
  id: number;
  code: string;
  name: string;
  branch_name: string | null;
  account_number: string | null;
  account_name: string | null;
  swift_code: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BankFormValues {
  code: string;
  name: string;
  swift_code?: string;
  branch_name?: string;
  account_number?: string;
  account_name?: string;
  is_active?: boolean;
}

/** Field HARUS cocok persis dengan kolom cp_md_holiday - field lama
 * holiday_type/year TIDAK PERNAH ada (kolom sebenarnya "type", dan tidak
 * ada kolom year sama sekali - dulu bikin tabel Holiday di Master Data
 * selalu tampil kosong di kolom Tipe & Tahun). */
export interface Holiday {
  id: number;
  date: string;
  name: string;
  type: "national" | "regional" | "company" | null;
  is_recurring_yearly: boolean;
  description: string | null;
  created_at: string;
}

export interface HolidayFormValues {
  date: string;
  name: string;
  type?: "national" | "regional" | "company";
  is_recurring_yearly?: boolean;
  description?: string;
}

export type NumberSequenceResetPeriod = "yearly" | "monthly" | "never";

// Field-nya sebelumnya TIDAK COCOK dengan backend sama sekali (module_name/
// suffix/next_number/digit_padding/description tidak pernah ada di
// Modules\CorePlatform\Entities\NumberSequence - tab Number Sequence di
// Master Data selalu render undefined). Ini bentuk ASLI dari API.
export interface NumberSequence {
  id: number;
  module_code: string;
  prefix: string;
  /** Token: {PREFIX} {YYYY} {MM} {DD} {SEQ:n} - mis. "{PREFIX}-{YYYY}{MM}-{SEQ:6}" -> "LEAD-202608-000001". */
  format: string;
  current_number: number;
  reset_period: NumberSequenceResetPeriod;
  last_reset_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NumberSequenceFormValues {
  module_code: string;
  prefix: string;
  format: string;
  reset_period: NumberSequenceResetPeriod;
  /** Nomor urut TERAKHIR yang sudah dipakai (bukan nomor berikutnya) -
   * opsional, default 0 (backend). Isi kalau sudah ada dokumen lama
   * dengan pola nomor ini sebelum sequence-nya didaftarkan, supaya
   * nomor berikutnya tidak mengulang dari 1. */
  current_number?: number;
}

/** Tarif lembur (Rp/jam) - acuan estimasi biaya di HrServiceSupport
 * (SubmitOvertimeModal: jam x rate) dan prefill saat posting ke Finance.
 * is_default menandai SATU baris yang otomatis dipakai (di-enforce di
 * OvertimeRateController - simpan is_default=true otomatis matikan yang lain). */
export interface OvertimeRate {
  id: number;
  code: string;
  name: string;
  rate_per_hour: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface OvertimeRateFormValues {
  code: string;
  name: string;
  rate_per_hour: number;
  is_default?: boolean;
  is_active?: boolean;
}

export type PostingRuleSide = "debit" | "credit";

/** Pemetaan akun GL per baris transaksi (mis. payroll) - dulu hardcode di
 * config file backend, sekarang diatur admin di sini. transaction_type/
 * line_key/side bersifat struktural (TIDAK bisa diubah lewat form ini) -
 * yang bisa diedit cuma account_code/label/is_active. Dibaca
 * PayrollService::postToFinance() lewat PostingRule::resolve(). */
export interface PostingRule {
  id: number;
  transaction_type: string;
  line_key: string;
  account_code: string;
  side: PostingRuleSide;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostingRuleFormValues {
  account_code: string;
  label: string;
  is_active?: boolean;
}
