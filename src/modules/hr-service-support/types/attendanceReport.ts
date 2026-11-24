// Laporan Absensi Employee - gabungan attendance + Ijin + sisa cuti tahunan.
// Lihat AttendanceReportService (backend) - hr_leave_balance dipakai sebagai
// sumber JATAH cuti tahunan, "terpakai" dihitung live dari PermissionRequest
// yang approved (bukan dari hr_leave_request, yang tidak lagi dipakai sejak
// pengajuan cuti pindah ke Ijin).

export interface LeaveBalanceSummary {
  year: number;
  quota_days: number;
  used_days: number;
  available_days: number;
}

export interface AttendanceReportSummary {
  hadir: number;
  terlambat: number;
  absen: number;
  cuti: number;
  manual: number;
}

export interface AttendanceReportRow {
  id: number;
  attendance_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: "present" | "late" | "absent" | "leave" | "manual";
  notes: string | null;
  work_hours?: { worked_hours: number; standard_hours: number; overtime_hours: number; is_overtime: boolean };
  permission_request?: {
    id: number; request_number: string; type: string; status: string;
    out_start_time?: string | null; out_end_time?: string | null;
  } | null;
}

export interface AttendanceReportPermissionRequest {
  id: number;
  request_number: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string;
  total_days: number;
  out_start_time: string | null;
  out_end_time: string | null;
  reason: string | null;
}

export interface EmployeeAttendanceReport {
  employee: { id: number; full_name: string; employee_number: string };
  date_from: string;
  date_to: string;
  summary: AttendanceReportSummary;
  leave_balance: LeaveBalanceSummary;
  attendance: AttendanceReportRow[];
  permission_requests: AttendanceReportPermissionRequest[];
}

export interface CompanyAttendanceSummaryRow {
  employee_id: number;
  employee_name: string;
  employee_number: string;
  hadir: number;
  terlambat: number;
  absen: number;
  cuti: number;
  available_leave_days: number;
}
