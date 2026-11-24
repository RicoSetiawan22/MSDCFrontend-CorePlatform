import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import { shiftApi } from "./shiftApi";

const shiftKeys = {
  all: ["hrShifts"] as const,
  shifts: (p?: Record<string, unknown>) => [...shiftKeys.all, "shifts", p ?? {}] as const,
  schedules: (p: Record<string, unknown>) => [...shiftKeys.all, "schedules", p] as const,
  attendances: (p: Record<string, unknown>) => [...shiftKeys.all, "attendances", p] as const,
};

export function useShifts(params?: { include_inactive?: boolean }) {
  return useQuery({
    queryKey: shiftKeys.shifts(params),
    queryFn: () => shiftApi.listShifts(params).then((r) => r.data.data),
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shiftApi.createShift,
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftKeys.all }),
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Parameters<typeof shiftApi.updateShift>[1] }) =>
      shiftApi.updateShift(id, values).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftKeys.all }),
  });
}

export function useShiftSchedules(params: { employee_id?: number; site_id?: number; date_from?: string; date_to?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: shiftKeys.schedules(params),
    queryFn: () => shiftApi.listSchedules(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, values }: { employeeId: number; values: Parameters<typeof shiftApi.createSchedule>[1] }) =>
      shiftApi.createSchedule(employeeId, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftKeys.all }),
  });
}

export function useConfirmSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shiftApi.confirmSchedule,
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftKeys.all }),
  });
}

export function useMoveSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, values }: { scheduleId: number; values: Parameters<typeof shiftApi.moveSchedule>[1] }) =>
      shiftApi.moveSchedule(scheduleId, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftKeys.all }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: number) => shiftApi.deleteSchedule(scheduleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftKeys.all }),
  });
}

export function useAttendances(params: { employee_id?: number; date_from?: string; date_to?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: shiftKeys.attendances(params),
    queryFn: () => shiftApi.listAttendances(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, values }: { employeeId: number; values: Parameters<typeof shiftApi.checkIn>[1] }) =>
      shiftApi.checkIn(employeeId, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftKeys.all }),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shiftApi.checkOut,
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftKeys.all }),
  });
}

export function useWorkHourPolicy() {
  return useQuery({
    queryKey: [...shiftKeys.all, "workHourPolicy"] as const,
    queryFn: () => shiftApi.getWorkHourPolicy().then((r) => r.data.data),
  });
}

export function useUpdateWorkHourPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: { weekday_hours: number; weekend_holiday_hours: number }) =>
      shiftApi.updateWorkHourPolicy(values).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftKeys.all }),
  });
}

export function useDownloadAttendancePdf() {
  return useMutation({
    mutationFn: async ({ organizationId, params }: { organizationId: number; params?: { employee_id?: number; date_from?: string; date_to?: string } }) => {
      try {
        const res = await shiftApi.printAttendancePdf(organizationId, params);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}
