export type OvertimeStatus = "draft" | "pending_approval" | "approved" | "rejected" | "sent_to_finance";

export interface OvertimeRecordDay {
  id: number;
  overtime_record_id: number;
  overtime_date: string;
  scheduled_hours: number | null;
  actual_hours: number | null;
  overtime_hours: number;
  notes: string | null;
}

/** Kandidat hari lembur - BELUM tersimpan, murni hasil hitung selisih jam
 * terjadwal vs actual attendance (lihat OvertimeReportingService::
 * getCandidateDays()). HRD pilih subset dari daftar ini untuk diajukan. */
export interface OvertimeCandidateDay {
  attendance_id: number;
  overtime_date: string;
  scheduled_hours: number | null;
  actual_hours: number | null;
  overtime_hours: number;
  shift_name: string | null;
}

export interface OvertimeRecord {
  id: number;
  employee_id: number;
  cost_center_id: number | null;
  period_month: number;
  period_year: number;
  overtime_hours: number;
  status: OvertimeStatus;
  gl_journal_id: number | null;
  sent_at: string | null;
  notes: string | null;
  submitted_by: number | null;
  submitted_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  employee?: { id: number; full_name: string };
  cost_center?: { id: number; cost_center_name: string };
  submitter?: { id: number; full_name: string } | null;
  approver?: { id: number; full_name: string } | null;
  days?: OvertimeRecordDay[];
}

export interface OvertimeListParams {
  page?: number;
  per_page?: number;
  employee_id?: number;
  status?: OvertimeStatus;
  period_month?: number;
  period_year?: number;
  [key: string]: number | string | undefined;
}
