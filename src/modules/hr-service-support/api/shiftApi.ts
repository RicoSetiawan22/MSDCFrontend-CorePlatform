import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Shift, ShiftSchedule, Attendance, WorkHourPolicy } from "../types/shift";

const BASE = "/v1/hr-service-support";

export const shiftApi = {
  // Shift master
  listShifts(params?: { include_inactive?: boolean }) {
    return apiClient.get<{ data: Shift[] }>(`${BASE}/shifts`, { params });
  },
  createShift(values: Partial<Shift>) {
    return apiClient.post<ApiMessageResponse<Shift>>(`${BASE}/shifts`, values);
  },
  /** Kalau shift ini sudah punya jadwal, backend TIDAK mengubahnya di
   * tempat - shift lama diarsipkan, shift baru dibuat dengan jam yang
   * diedit (response `versioned: true`). Lihat ShiftAttendanceService::
   * updateShift(). */
  updateShift(id: number, values: { shift_name: string; start_time: string; end_time: string }) {
    return apiClient.put<ApiMessageResponse<Shift> & { versioned: boolean }>(`${BASE}/shifts/${id}`, values);
  },

  // Shift schedules
  listSchedules(params: { employee_id?: number; site_id?: number; date_from?: string; date_to?: string; page?: number; per_page?: number }) {
    return apiClient.get<PaginatedResponse<ShiftSchedule>>(`${BASE}/shift-schedules`, { params });
  },
  createSchedule(employeeId: number, values: { shift_id: number; schedule_date: string; site_id?: number; notes?: string }) {
    return apiClient.post<ApiMessageResponse<ShiftSchedule>>(`${BASE}/employees/${employeeId}/shift-schedules`, values);
  },
  confirmSchedule(scheduleId: number) {
    return apiClient.post<ApiMessageResponse<ShiftSchedule>>(`${BASE}/shift-schedules/${scheduleId}/confirm`);
  },
  /** Geser jadwal ke employee/shift/tanggal lain - dipakai drag-and-drop
   * board (pindah chip antar sel UPDATE baris yang sama, bukan hapus+buat
   * baru). */
  moveSchedule(scheduleId: number, values: { employee_id?: number; shift_id?: number; schedule_date?: string; site_id?: number | null }) {
    return apiClient.put<ApiMessageResponse<ShiftSchedule>>(`${BASE}/shift-schedules/${scheduleId}`, values);
  },
  deleteSchedule(scheduleId: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/shift-schedules/${scheduleId}`);
  },

  // Attendance
  listAttendances(params: { employee_id?: number; date_from?: string; date_to?: string; page?: number; per_page?: number }) {
    return apiClient.get<PaginatedResponse<Attendance>>(`${BASE}/attendances`, { params });
  },
  checkIn(employeeId: number, values: { attendance_date?: string; check_in_at?: string; check_out_at?: string; notes?: string }) {
    return apiClient.post<ApiMessageResponse<Attendance>>(`${BASE}/employees/${employeeId}/check-in`, values);
  },
  checkOut(attendanceId: number) {
    return apiClient.post<ApiMessageResponse<Attendance & { overtime_hours: number }>>(`${BASE}/attendances/${attendanceId}/check-out`);
  },
  printAttendancePdf(organizationId: number, params?: { employee_id?: number; date_from?: string; date_to?: string }) {
    return apiClient.get<Blob>(`${BASE}/attendances/print-pdf`, {
      params: { organization_id: organizationId, ...params },
      responseType: "blob",
    });
  },

  // Work Hour Policy (acuan overtime)
  getWorkHourPolicy() {
    return apiClient.get<{ success: boolean; data: WorkHourPolicy }>(`${BASE}/work-hour-policy`);
  },
  updateWorkHourPolicy(values: { weekday_hours: number; weekend_holiday_hours: number }) {
    return apiClient.put<ApiMessageResponse<WorkHourPolicy>>(`${BASE}/work-hour-policy`, values);
  },
};
