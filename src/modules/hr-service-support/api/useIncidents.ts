import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { incidentApi } from "./incidentApi";
import type { IncidentListParams } from "../types/itil";

const incKeys = {
  all: ["hrIncidents"] as const,
  list: (p: IncidentListParams) => [...incKeys.all, "list", p] as const,
};

export function useIncidentList(params: IncidentListParams) {
  return useQuery({
    queryKey: incKeys.list(params),
    queryFn: () => incidentApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useIncident(id: number | undefined) {
  return useQuery({
    queryKey: [...incKeys.all, "detail", id ?? 0] as const,
    queryFn: () => incidentApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useUpdateIncidentStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      incidentApi.updateStatus(id, status).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: incKeys.all }),
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: incidentApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: incKeys.all }),
  });
}

export function useAssignIncident(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: number) =>
      incidentApi.assign(id, employeeId).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: incKeys.all }),
  });
}

export function useCreateFromAlarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alarmId, values }: { alarmId: number; values?: Record<string, unknown> }) =>
      incidentApi.createFromAlarm(alarmId, values as Parameters<typeof incidentApi.createFromAlarm>[1]),
    onSuccess: () => qc.invalidateQueries({ queryKey: incKeys.all }),
  });
}

export function useIncidentWorklogs(incidentId: number | null) {
  return useQuery({
    queryKey: ["incidentWorklogs", incidentId] as const,
    queryFn: () => incidentApi.worklogs(incidentId!).then((r) => r.data.data),
    enabled: incidentId != null,
  });
}

export function useAddWorklog(incidentId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: incidentApi.addWorklog.bind(null, incidentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidentWorklogs", incidentId] });
      qc.invalidateQueries({ queryKey: incKeys.all });
    },
  });
}
