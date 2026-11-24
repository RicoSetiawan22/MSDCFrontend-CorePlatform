import type { Employee } from "../types/employee";
import type { PayrollRecord } from "../types/payroll";

/**
 * ============================================================================
 * MESIN PERHITUNGAN PAJAK PPh PASAL 21 & BPJS KETENAGAKERJAAN / KESEHATAN
 * Sesuai Ketentuan Perpajakan & Jaminan Sosial Pemerintah Republik Indonesia:
 * 1. PP No. 58 Tahun 2023 & PMK No. 168 Tahun 2023 (Tarif Efektif Rata-Rata / TER Bulanan Kategori A, B, C)
 * 2. UU No. 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan (UU HPP) Pasal 17 ayat (1) huruf a
 * 3. PMK No. 101/PMK.010/2016 (Penghasilan Tidak Kena Pajak / PTKP)
 * 4. Perpres No. 64 Tahun 2020 (BPJS Kesehatan)
 * 5. PP No. 45 Tahun 2015 & PP No. 46 Tahun 2015 (BPJS Ketenagakerjaan JHT, JP, JKK, JKM)
 * ============================================================================
 */

export type PtkpCode = "TK/0" | "TK/1" | "TK/2" | "TK/3" | "K/0" | "K/1" | "K/2" | "K/3";
export type TerCategory = "A" | "B" | "C";

/** Batas atas upah BPJS Kesehatan = Rp 12.000.000 (Perpres 64/2020) */
export const BPJS_KESEHATAN_CAP = 12_000_000;

/** Batas atas upah Jaminan Pensiun (JP) BPJS Ketenagakerjaan = Rp 10.042.300 */
export const BPJS_JP_CAP = 10_042_300;

/** Biaya Jabatan: 5% dari penghasilan bruto, maks Rp 500.000/bulan atau Rp 6.000.000/tahun */
export const BIAYA_JABATAN_RATE = 0.05;
export const BIAYA_JABATAN_MAX_PER_MONTH = 500_000;
export const BIAYA_JABATAN_MAX_PER_YEAR = 6_000_000;

/** PTKP Setahun (PMK 101/PMK.010/2016) */
export const PTKP_ANNUAL_MAP: Record<PtkpCode, number> = {
  "TK/0": 54_000_000,
  "TK/1": 58_500_000,
  "TK/2": 63_000_000,
  "TK/3": 67_500_000,
  "K/0": 58_500_000,
  "K/1": 63_000_000,
  "K/2": 67_500_000,
  "K/3": 72_000_000,
};

/** Pemetaan PTKP ke Kategori TER (PP No. 58 Tahun 2023) */
export const PTKP_TER_CATEGORY_MAP: Record<PtkpCode, TerCategory> = {
  "TK/0": "A",
  "TK/1": "A",
  "K/0": "A",
  "TK/2": "B",
  "TK/3": "B",
  "K/1": "B",
  "K/2": "B",
  "K/3": "C",
};

/**
 * Tabel Resmi Tarif Efektif Bulanan (TER) Kategori A, B, dan C
 * Lampiran PP No. 58 Tahun 2023 & PMK No. 168 Tahun 2023
 * Format: [Batas Atas Penghasilan Bruto Bulanan (Rp), Tarif Efektif (desimal)]
 */
export const TER_MONTHLY_TABLES: Record<TerCategory, [number, number][]> = {
  A: [
    [5_400_000, 0.0],
    [5_650_000, 0.0025],
    [5_950_000, 0.005],
    [6_300_000, 0.0075],
    [6_750_000, 0.01],
    [7_500_000, 0.0125],
    [8_550_000, 0.015],
    [9_650_000, 0.0175],
    [10_050_000, 0.02],
    [10_350_000, 0.0225],
    [10_700_000, 0.025],
    [11_050_000, 0.03],
    [11_600_000, 0.035],
    [12_500_000, 0.04],
    [13_750_000, 0.05],
    [15_100_000, 0.06],
    [16_950_000, 0.07],
    [19_750_000, 0.08],
    [24_150_000, 0.09],
    [26_450_000, 0.1],
    [28_000_000, 0.11],
    [30_050_000, 0.12],
    [32_400_000, 0.13],
    [35_400_000, 0.14],
    [39_100_000, 0.15],
    [43_850_000, 0.16],
    [47_800_000, 0.17],
    [51_400_000, 0.18],
    [56_300_000, 0.19],
    [62_200_000, 0.2],
    [68_600_000, 0.21],
    [77_500_000, 0.22],
    [89_000_000, 0.23],
    [103_000_000, 0.24],
    [125_000_000, 0.25],
    [157_000_000, 0.26],
    [206_000_000, 0.27],
    [337_000_000, 0.28],
    [454_000_000, 0.29],
    [550_000_000, 0.3],
    [695_000_000, 0.31],
    [910_000_000, 0.32],
    [1_400_000_000, 0.33],
    [Infinity, 0.34],
  ],
  B: [
    [6_200_000, 0.0],
    [6_500_000, 0.0025],
    [6_850_000, 0.005],
    [7_300_000, 0.0075],
    [9_200_000, 0.01],
    [10_750_000, 0.015],
    [11_250_000, 0.02],
    [11_600_000, 0.025],
    [12_600_000, 0.03],
    [13_600_000, 0.04],
    [14_950_000, 0.05],
    [16_400_000, 0.06],
    [18_450_000, 0.07],
    [21_850_000, 0.08],
    [26_000_000, 0.09],
    [27_700_000, 0.1],
    [29_350_000, 0.11],
    [31_450_000, 0.12],
    [33_950_000, 0.13],
    [37_100_000, 0.14],
    [41_100_000, 0.15],
    [45_800_000, 0.16],
    [49_500_000, 0.17],
    [53_800_000, 0.18],
    [58_500_000, 0.19],
    [64_000_000, 0.2],
    [71_000_000, 0.21],
    [80_000_000, 0.22],
    [93_000_000, 0.23],
    [109_000_000, 0.24],
    [129_000_000, 0.25],
    [163_000_000, 0.26],
    [211_000_000, 0.27],
    [374_000_000, 0.28],
    [459_000_000, 0.29],
    [555_000_000, 0.3],
    [704_000_000, 0.31],
    [957_000_000, 0.32],
    [1_405_000_000, 0.33],
    [Infinity, 0.34],
  ],
  C: [
    [6_600_000, 0.0],
    [6_950_000, 0.0025],
    [7_350_000, 0.005],
    [7_800_000, 0.0075],
    [8_850_000, 0.01],
    [9_800_000, 0.0125],
    [10_950_000, 0.015],
    [11_200_000, 0.0175],
    [12_050_000, 0.02],
    [12_950_000, 0.03],
    [14_150_000, 0.04],
    [15_550_000, 0.05],
    [17_050_000, 0.06],
    [19_500_000, 0.07],
    [22_700_000, 0.08],
    [26_600_000, 0.09],
    [28_100_000, 0.1],
    [30_100_000, 0.11],
    [32_600_000, 0.12],
    [35_400_000, 0.13],
    [38_900_000, 0.14],
    [43_000_000, 0.15],
    [47_400_000, 0.16],
    [51_200_000, 0.17],
    [55_800_000, 0.18],
    [60_400_000, 0.19],
    [66_700_000, 0.2],
    [74_500_000, 0.21],
    [83_200_000, 0.22],
    [95_600_000, 0.23],
    [110_000_000, 0.24],
    [134_000_000, 0.25],
    [169_000_000, 0.26],
    [221_000_000, 0.27],
    [390_000_000, 0.28],
    [463_000_000, 0.29],
    [561_000_000, 0.3],
    [709_000_000, 0.31],
    [965_000_000, 0.32],
    [1_419_000_000, 0.33],
    [Infinity, 0.34],
  ],
};

/**
 * Tarif Progresif Pasal 17 ayat (1) huruf a UU HPP (UU No. 7 Tahun 2021)
 */
export const PASAL_17_BRACKETS: { limit: number; rate: number; label: string }[] = [
  { limit: 60_000_000, rate: 0.05, label: "Lapis 1 (s.d. Rp 60.000.000) — 5%" },
  { limit: 250_000_000, rate: 0.15, label: "Lapis 2 (> Rp 60 jt s.d. Rp 250 jt) — 15%" },
  { limit: 500_000_000, rate: 0.25, label: "Lapis 3 (> Rp 250 jt s.d. Rp 500 jt) — 25%" },
  { limit: 5_000_000_000, rate: 0.30, label: "Lapis 4 (> Rp 500 jt s.d. Rp 5 Miliar) — 30%" },
  { limit: Infinity, rate: 0.35, label: "Lapis 5 (> Rp 5 Miliar) — 35%" },
];

export interface Pasal17Slice {
  label: string;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface MonthlyTaxAndBpjsBreakdown {
  grossSalary: number;
  /** Dasar pengenaan pajak PPh 21 (Hanya Gaji Pokok; Uang Makan & Lembur tidak dipotong pajak) */
  taxableSalary: number;
  baseSalary: number;
  mealAllowance: number;
  overtimeAmount: number;
  ptkpStatus: PtkpCode;
  ptkpSource: "employee_profile" | "family_dependents" | "default_tk0";
  terCategory: TerCategory;
  terRate: number;
  terRatePercent: string;
  /** Potongan Karyawan (Memotong Take-Home Pay) */
  bpjsKesehatanEmployee: number;
  bpjsJhtEmployee: number;
  bpjsJpEmployee: number;
  bpjsKetenagakerjaanEmployee: number;
  bpjsTotalEmployee: number;
  pph21Monthly: number;
  kasbonInstallment: number;
  totalEmployeeDeduction: number;
  netTakeHomePay: number;
  /** Iuran Pemberi Kerja (Ditanggung Perusahaan / Referensi Regulasi) */
  bpjsKesehatanEmployer: number;
  bpjsJhtEmployer: number;
  bpjsJpEmployer: number;
  bpjsJkkEmployer: number;
  bpjsJkmEmployer: number;
  totalEmployerContribution: number;
}

/**
 * Resolusi status PTKP dari data asli Employee di database:
 * 1. Field ptkp_status pada profil Employee
 * 2. Jika belum diisi, hitung otomatis dari tabel keluarga (hr_employee_family)
 * 3. Jika belum ada, default ke TK/0 (Rp 54.000.000/tahun) sesuai standar DJP
 */
export function resolveEmployeePtkp(
  emp?: Partial<Employee> | null,
  fallbackPtkp?: string | null
): { ptkp: PtkpCode; source: "employee_profile" | "family_dependents" | "default_tk0" } {
  const raw = (emp?.ptkp_status || fallbackPtkp || "").replace(/\s/g, "").toUpperCase();
  if (raw && raw in PTKP_ANNUAL_MAP) {
    return { ptkp: raw as PtkpCode, source: "employee_profile" };
  }

  const families = emp?.family_members ?? emp?.families ?? [];
  if (Array.isArray(families) && families.length > 0) {
    const hasSpouse = families.some(f => f.relationship === "spouse");
    const dependents = families.filter(f => f.is_dependent && f.relationship !== "spouse").length;
    const capped = Math.min(3, Math.max(0, dependents));
    const derived = `${hasSpouse ? "K" : "TK"}/${capped}` as PtkpCode;
    if (derived in PTKP_ANNUAL_MAP) {
      return { ptkp: derived, source: "family_dependents" };
    }
  }

  return { ptkp: "TK/0", source: "default_tk0" };
}

/**
 * Cari Tarif Efektif Bulanan (TER) sesuai PP 58/2023 & PMK 168/2023
 */
export function lookupTerRate(grossMonthly: number, category: TerCategory): number {
  if (grossMonthly <= 0) return 0;
  const table = TER_MONTHLY_TABLES[category] ?? TER_MONTHLY_TABLES.A;
  const found = table.find(([limit]) => grossMonthly <= limit);
  return found ? found[1] : 0.34;
}

/**
 * Hitung rincian potongan BPJS Kesehatan, BPJS Ketenagakerjaan (JHT + JP),
 * dan PPh Pasal 21 (TER PP 58/2023) untuk 1 periode payroll bulanan.
 */
export function calculateMonthlyPayrollDeductions(
  record: Pick<PayrollRecord, "base_salary" | "meal_allowance" | "overtime_amount" | "kasbon_installment" | "ptkp_status">,
  emp?: Partial<Employee> | null
): MonthlyTaxAndBpjsBreakdown {
  const baseSalary = Math.max(0, Number(record.base_salary) || 0);
  const mealAllowance = Math.max(0, Number(record.meal_allowance) || 0);
  const overtimeAmount = Math.max(0, Number(record.overtime_amount) || 0);
  const kasbonInstallment = Math.max(0, Number(record.kasbon_installment) || 0);
  const grossSalary = Math.round(baseSalary + mealAllowance + overtimeAmount);

  const { ptkp: ptkpStatus, source: ptkpSource } = resolveEmployeePtkp(emp, record.ptkp_status);
  const terCategory = PTKP_TER_CATEGORY_MAP[ptkpStatus] ?? "A";

  // Cek status aktif BPJS dari data karyawan (jika diset eksplisit "Non-Aktif", maka Rp 0)
  const bpjsKesInactive = (emp?.bpjs_kesehatan_status || "").toLowerCase() === "non-aktif";
  const bpjsTkInactive = (emp?.bpjs_ketenagakerjaan_status || "").toLowerCase() === "non-aktif";

  // 1. BPJS Kesehatan Porsi Karyawan (1% dari Gaji Pokok, batas upah maks Rp 12.000.000)
  const bpjsKesBase = Math.min(baseSalary, BPJS_KESEHATAN_CAP);
  const bpjsKesehatanEmployee = bpjsKesInactive ? 0 : Math.round(bpjsKesBase * 0.01);
  const bpjsKesehatanEmployer = bpjsKesInactive ? 0 : Math.round(bpjsKesBase * 0.04);

  // 2. BPJS Ketenagakerjaan Porsi Karyawan: JHT 2% + JP 1% (batas upah JP maks Rp 10.042.300)
  const bpjsJpBase = Math.min(baseSalary, BPJS_JP_CAP);
  const bpjsJhtEmployee = bpjsTkInactive ? 0 : Math.round(baseSalary * 0.02);
  const bpjsJpEmployee = bpjsTkInactive ? 0 : Math.round(bpjsJpBase * 0.01);
  const bpjsKetenagakerjaanEmployee = bpjsJhtEmployee + bpjsJpEmployee;
  const bpjsTotalEmployee = bpjsKesehatanEmployee + bpjsKetenagakerjaanEmployee;

  // Iuran BPJS Ketenagakerjaan Porsi Perusahaan (JHT 3,7%, JP 2%, JKK 0,24%, JKM 0,30%)
  const bpjsJhtEmployer = bpjsTkInactive ? 0 : Math.round(baseSalary * 0.037);
  const bpjsJpEmployer = bpjsTkInactive ? 0 : Math.round(bpjsJpBase * 0.02);
  const bpjsJkkEmployer = bpjsTkInactive ? 0 : Math.round(baseSalary * 0.0024);
  const bpjsJkmEmployer = bpjsTkInactive ? 0 : Math.round(baseSalary * 0.003);
  const totalEmployerContribution =
    bpjsKesehatanEmployer + bpjsJhtEmployer + bpjsJpEmployer + bpjsJkkEmployer + bpjsJkmEmployer;

  // 3. PPh Pasal 21 Bulanan (PP 58/2023 & PMK 168/2023 - Tarif Efektif Rata-Rata / TER)
  // Sesuai ketentuan kebijakan penggajian: Uang Makan (meal_allowance) dan Uang Lembur (overtime_amount)
  // TIDAK terhitung terpotong pajak. Pajak PPh 21 murni dihitung dari Gaji Pokok (base_salary) karyawan saja.
  const taxableSalary = Math.round(baseSalary);
  const terRate = lookupTerRate(taxableSalary, terCategory);
  const terRatePercent = `${(terRate * 100).toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`;
  const pph21Monthly = Math.round(taxableSalary * terRate);

  const totalEmployeeDeduction = bpjsTotalEmployee + pph21Monthly + kasbonInstallment;
  const netTakeHomePay = Math.max(0, grossSalary - totalEmployeeDeduction);

  return {
    grossSalary,
    taxableSalary,
    baseSalary,
    mealAllowance,
    overtimeAmount,
    ptkpStatus,
    ptkpSource,
    terCategory,
    terRate,
    terRatePercent,
    bpjsKesehatanEmployee,
    bpjsJhtEmployee,
    bpjsJpEmployee,
    bpjsKetenagakerjaanEmployee,
    bpjsTotalEmployee,
    pph21Monthly,
    kasbonInstallment,
    totalEmployeeDeduction,
    netTakeHomePay,
    bpjsKesehatanEmployer,
    bpjsJhtEmployer,
    bpjsJpEmployer,
    bpjsJkkEmployer,
    bpjsJkmEmployer,
    totalEmployerContribution,
  };
}

/**
 * Hitung PPh Pasal 21 Tahunan dengan Tarif Progresif Pasal 17 ayat (1) huruf a UU HPP
 * beserta rincian tiap lapisan PKP.
 */
export function calculatePasal17AnnualTax(pkp: number): { totalTax: number; slices: Pasal17Slice[] } {
  let remaining = Math.max(0, Math.floor(pkp / 1000) * 1000);
  let prevLimit = 0;
  let totalTax = 0;
  const slices: Pasal17Slice[] = [];

  for (const b of PASAL_17_BRACKETS) {
    if (remaining <= 0) break;
    const capacity = b.limit - prevLimit;
    const taxableAmount = Math.min(remaining, capacity);
    const taxAmount = Math.round(taxableAmount * b.rate);
    slices.push({
      label: b.label,
      rate: b.rate,
      taxableAmount,
      taxAmount,
    });
    totalTax += taxAmount;
    remaining -= taxableAmount;
    prevLimit = b.limit;
  }

  return { totalTax, slices };
}

