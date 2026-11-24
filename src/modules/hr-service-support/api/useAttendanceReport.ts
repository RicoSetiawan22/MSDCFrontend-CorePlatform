import { useQuery } from "@tanstack/react-query";
import { attendanceReportApi } from "./attendanceReportApi";

const keys = {
  all: ["hrAttendanceReport"] as const,
  companySummary: (from: string, to: string) => [...keys.all, "companySummary", from, to] as const,
  employee: (id: number, from: string, to: string) => [...keys.all, "employee", id, from, to] as const,
};

export function useCompanyAttendanceSummary(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: keys.companySummary(dateFrom, dateTo),
    queryFn: () => attendanceReportApi.companySummary(dateFrom, dateTo).then((r) => r.data.data),
    enabled: !!dateFrom && !!dateTo,
  });
}

export function useEmployeeAttendanceReport(employeeId: number | undefined, dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: keys.employee(employeeId ?? 0, dateFrom, dateTo),
    queryFn: () => attendanceReportApi.employeeReport(employeeId!, dateFrom, dateTo).then((r) => r.data.data),
    enabled: !!employeeId && !!dateFrom && !!dateTo,
  });
}
