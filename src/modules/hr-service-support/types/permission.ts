// Ijin (Permission Request) Types

export type PermissionRequestType =
  | "cuti_tahunan"
  | "cuti_melahirkan"
  | "sakit"
  | "tugas"
  | "lupa_check_in_out"
  | "salah_tekan_in_out"
  | "kurang_jam"
  | "absen_error"
  | "izin_keluar";

export type PermissionRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export const PERMISSION_REQUEST_TYPE_LABELS: Record<PermissionRequestType, string> = {
  cuti_tahunan: "Cuti Tahunan",
  cuti_melahirkan: "Cuti Melahirkan",
  sakit: "Sakit",
  tugas: "Tugas",
  lupa_check_in_out: "Lupa Check In/Out",
  salah_tekan_in_out: "Salah Tekan In/Out",
  kurang_jam: "Kurang Jam",
  absen_error: "Absen Error",
  izin_keluar: "Ijin Keluar Sementara",
};

/** Tipe yang berarti tidak masuk kerja - butuh rentang tanggal (start/end boleh beda). */
export const ABSENCE_TYPES: PermissionRequestType[] = ["cuti_tahunan", "cuti_melahirkan", "sakit", "tugas"];

/** Tipe koreksi absensi yang sudah ada - cuma 1 tanggal, boleh isi jam yang diminta. */
export const CORRECTION_TYPES: PermissionRequestType[] = ["lupa_check_in_out", "salah_tekan_in_out", "kurang_jam", "absen_error"];

/** Ijin keluar sementara (mis. seminar jam 7-9) - cuma numpang info di attendance, status TIDAK berubah. */
export const TEMPORARY_OUT_TYPES: PermissionRequestType[] = ["izin_keluar"];

export interface PermissionRequest {
  id: number;
  request_number: string;
  employee_id: number;
  employee?: { id: number; full_name: string };
  type: PermissionRequestType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  requested_check_in: string | null;
  requested_check_out: string | null;
  out_start_time: string | null;
  out_end_time: string | null;
  status: PermissionRequestStatus;
  approved_by: number | null;
  approver?: { id: number; full_name: string } | null;
  approved_at: string | null;
  rejection_reason: string | null;
  hr_notes: string | null;
  created_at: string;
}

export interface PermissionRequestListParams {
  page?: number;
  per_page?: number;
  employee_id?: number;
  type?: PermissionRequestType;
  status?: PermissionRequestStatus;
  date_from?: string;
  date_to?: string;
}

export interface PermissionRequestReportTypeRow {
  type: PermissionRequestType;
  label: string;
  count: number;
  percent: number;
}

export interface PermissionRequestReportStatusRow {
  status: PermissionRequestStatus;
  count: number;
  percent: number;
}

export interface PermissionRequestReportEmployeeRow {
  employee_id: number;
  employee_name: string;
  count: number;
  total_days: number;
  types: Record<string, number>;
}

export interface PermissionRequestReport {
  date_from: string;
  date_to: string;
  total_requests: number;
  total_days: number;
  by_type: PermissionRequestReportTypeRow[];
  by_status: PermissionRequestReportStatusRow[];
  by_employee: PermissionRequestReportEmployeeRow[];
}
