import type { Employee } from "./employee";

export type PayrollStatus = "draft" | "sent_to_finance";

export interface PayrollRecord {
  id: number;
  employee_id: number;
  cost_center_id: number | null;
  period_month: number;
  period_year: number;
  base_salary: string;
  meal_allowance: string;
  overtime_amount: string;
  overtime_record_id: number | null;
  /** Status approval sumber lembur-nya - "draft"/"pending_approval" berarti
   * overtime_amount masih 0 nunggu di-approve Manager (lihat
   * PayrollService::resolveOvertimeForPeriod()), "rejected" berarti pernah
   * ditolak (overtime_amount otomatis di-reset ke 0). */
  overtime_record?: { id: number; status: string; overtime_hours: string } | null;
  total_amount: string;
  /** Rincian pajak & potongan sesuai PP 58/2023, PMK 168/2023, Perpres 64/2020, PP 45/2015 */
  ptkp_status?: string | null;
  ter_category?: "A" | "B" | "C" | null;
  ter_rate?: string | number | null;
  bpjs_kesehatan_deduction?: string | null;
  bpjs_jht_deduction?: string | null;
  bpjs_jp_deduction?: string | null;
  bpjs_ketenagakerjaan_deduction?: string | null;
  bpjs_deduction?: string | null;
  pph21_deduction?: string | null;
  kasbon_installment?: string | null;
  total_deduction?: string | null;
  net_amount?: string | null;
  calculated_at?: string | null;
  /** Menandakan payroll draft ini sudah diajukan/diupload oleh HR ke antrean Finance > HR Integration,
   * menunggu tim Finance klik "Posting Terpilih" untuk memposting ke Jurnal GL. */
  submitted_to_finance?: boolean;
  submitted_at?: string | null;
  /** Dokumen Bukti Potong Tahunan (Formulir 1721-A1) yang diupload pada Rekap Pajak Tahunan */
  tax_certificate_file_id?: number | null;
  tax_certificate_file_name?: string | null;
  tax_certificate_uploaded_at?: string | null;
  status: PayrollStatus;
  gl_journal_number: string | null;
  sent_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: Partial<Employee> & { id: number; full_name: string };
  cost_center?: { id: number; name: string };
}

export interface PayrollListParams {
  page?: number;
  per_page?: number;
  employee_id?: number;
  status?: PayrollStatus;
  period_month?: number;
  period_year?: number;
  [key: string]: number | string | undefined;
}

/** Master data gaji pokok per employee — dipakai sebagai default base_salary
 * tiap kali payroll record baru dibuat untuk employee itu. */
export interface EmployeeSalary {
  id: number;
  employee_number: string;
  full_name: string;
  base_salary: string | null;
}

export interface EmployeeSalaryListParams {
  page?: number;
  per_page?: number;
  search?: string;
  [key: string]: number | string | undefined;
}
