import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeApi } from "./changeApi";

const chgKeys = {
  all: ["hrChangeRequests"] as const,
  list: (p: Record<string, unknown>) => [...chgKeys.all, "list", p] as const,
};

export function useChangeList(params: { status?: string; search?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: chgKeys.list(params),
    queryFn: () => changeApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useChangeRequest(id: number | undefined) {
  return useQuery({
    queryKey: [...chgKeys.all, "detail", id ?? 0] as const,
    queryFn: () => changeApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: changeApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: chgKeys.all }),
  });
}

export function useSubmitChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: changeApi.submit,
    onSuccess: () => qc.invalidateQueries({ queryKey: chgKeys.all }),
  });
}

export function useSyncChangeApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: changeApi.syncApproval,
    onSuccess: () => qc.invalidateQueries({ queryKey: chgKeys.all }),
  });
}

export function useScheduleChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date }: { id: number; date: string }) =>
      changeApi.schedule(id, date).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: chgKeys.all }),
  });
}

export function useImplementChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: { successful: boolean; notes?: string } }) =>
      changeApi.implement(id, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: chgKeys.all }),
  });
}
