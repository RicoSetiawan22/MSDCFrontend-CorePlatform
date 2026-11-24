export type ShiftType = "day" | "night" | "swing" | "on_call";

export interface Shift {
  id: number;
  shift_code: string;
  shift_name: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  is_night_shift: boolean;
  /** false = diarsipkan - shift ini sudah punya jadwal/absensi jadi jamnya
   * tidak boleh diedit langsung lagi (lihat ShiftAttendanceService::updateShift()) */
  is_active: boolean;
}

export type ScheduleStatus = "scheduled" | "confirmed" | "swapped" | "cancelled" | "absent" | "day_off";

export interface ShiftSchedule {
  id: number;
  employee_id: number;
  employee?: { id: number; full_name: string };
  shift_id: number;
  shift?: Shift;
  site_id: number | null;
  schedule_date: string;
  status: ScheduleStatus;
  notes: string | null;
}

export type AttendanceStatus = "present" | "late" | "absent" | "leave" | "manual";

export interface Attendance {
  id: number;
  employee_id: number;
  employee?: { id: number; full_name: string };
  schedule_id: number | null;
  permission_request_id: number | null;
  permission_request?: {
    id: number; request_number: string; type: string; status: string;
    out_start_time?: string | null; out_end_time?: string | null;
  } | null;
  /** Dihitung backend per baris berdasarkan Work Hour Policy - lihat
   * ShiftAttendanceService::calculateOvertimeByPolicy(). Cuma ada kalau
   * check_in_at & check_out_at keduanya terisi. */
  work_hours?: {
    worked_hours: number;
    standard_hours: number;
    overtime_hours: number;
    is_overtime: boolean;
  };
  /** Kecocokan check-in/out ke jadwal shift-nya - lihat
   * ShiftAttendanceService::checkAgainstSchedule(). null kalau belum
   * check-in (mis. baris status 'leave' dari cuti). */
  schedule_check?: {
    has_schedule: boolean;
    shift_name: string | null;
    shift_start?: string;
    shift_end?: string;
    warnings: ("shift_tidak_cocok" | "terlambat" | "pulang_cepat")[];
  } | null;
  attendance_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: AttendanceStatus;
  notes: string | null;
  created_at: string;
}

/** Singleton - acuan jam kerja standar buat overtime (lihat WorkHourPolicyService). */
export interface WorkHourPolicy {
  id: number;
  weekday_hours: number;
  weekend_holiday_hours: number;
}
