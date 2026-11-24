import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { problemApi } from "./problemApi";

const prbKeys = {
  all: ["hrProblems"] as const,
  list: (p: Record<string, unknown>) => [...prbKeys.all, "list", p] as const,
};

export function useProblemList(params: { status?: string; search?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: prbKeys.list(params),
    queryFn: () => problemApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useProblem(id: number | undefined) {
  return useQuery({
    queryKey: [...prbKeys.all, "detail", id ?? 0] as const,
    queryFn: () => problemApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: problemApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: prbKeys.all }),
  });
}

export function useLinkIncidentToProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ problemId, incidentId }: { problemId: number; incidentId: number }) =>
      problemApi.linkIncident(problemId, incidentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: prbKeys.all }),
  });
}

export function useUpdateProblemStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      problemApi.updateStatus(id, status).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: prbKeys.all }),
  });
}
