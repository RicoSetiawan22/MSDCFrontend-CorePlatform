import { apiClient } from "@shared/lib/api-client";
import type { CompanyAttendanceSummaryRow, EmployeeAttendanceReport } from "../types/attendanceReport";

const BASE = "/v1/hr-service-support";

export const attendanceReportApi = {
  companySummary(dateFrom: string, dateTo: string) {
    return apiClient.get<{ success: boolean; data: CompanyAttendanceSummaryRow[] }>(`${BASE}/attendance-report/company-summary`, {
      params: { date_from: dateFrom, date_to: dateTo },
    });
  },
  employeeReport(employeeId: number, dateFrom: string, dateTo: string) {
    return apiClient.get<{ success: boolean; data: EmployeeAttendanceReport }>(`${BASE}/attendance-report/${employeeId}`, {
      params: { date_from: dateFrom, date_to: dateTo },
    });
  },
};
