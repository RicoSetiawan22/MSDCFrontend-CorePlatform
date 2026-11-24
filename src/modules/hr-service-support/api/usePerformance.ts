import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { performanceApi } from "./performanceApi";

const perfKeys = {
  all: ["hrPerformance"] as const,
  reviews: (p: Record<string, unknown>) => [...perfKeys.all, "reviews", p] as const,
  goals: (employeeId: number) => [...perfKeys.all, "goals", employeeId] as const,
  metrics: (employeeId: number) => [...perfKeys.all, "metrics", employeeId] as const,
  kpiProgress: (employeeId: number) => [...perfKeys.all, "kpiProgress", employeeId] as const,
};

export function usePerformanceReviews(params: { employee_id?: number; review_period?: string; status?: string; search?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: perfKeys.reviews(params),
    queryFn: () => performanceApi.listReviews(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function usePerformanceReview(id: number | undefined) {
  return useQuery({
    queryKey: [...perfKeys.all, "review", id ?? 0] as const,
    queryFn: () => performanceApi.showReview(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreatePerformanceReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, values }: {
      employeeId: number;
      values: { reviewer_id?: number; review_period: string; review_date?: string; comments?: string };
    }) => performanceApi.createReview(employeeId, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: perfKeys.all }),
  });
}

export function useSubmitPerformanceReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: { overall_score?: number; comments?: string } }) =>
      performanceApi.submitReview(id, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: perfKeys.all }),
  });
}

export function useAcknowledgePerformanceReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: performanceApi.acknowledgeReview,
    onSuccess: () => qc.invalidateQueries({ queryKey: perfKeys.all }),
  });
}

export function usePerformanceGoals(employeeId: number | undefined) {
  return useQuery({
    queryKey: perfKeys.goals(employeeId ?? 0),
    queryFn: () => performanceApi.listGoals(employeeId!).then((r) => r.data.data),
    enabled: !!employeeId,
  });
}

export function useCreatePerformanceGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, values }: {
      employeeId: number;
      values: { review_id?: number; goal_description: string; target_value?: number; weight_pct?: number };
    }) => performanceApi.createGoal(employeeId, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: perfKeys.all }),
  });
}

export function useUpdateGoalProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, values }: { goalId: number; values: { actual_value: number; status?: string } }) =>
      performanceApi.updateGoalProgress(goalId, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: perfKeys.all }),
  });
}

export function useCrossModuleMetrics(employeeId: number | undefined) {
  return useQuery({
    queryKey: perfKeys.metrics(employeeId ?? 0),
    queryFn: () => performanceApi.crossModuleMetrics(employeeId!).then((r) => r.data.data),
    enabled: !!employeeId,
  });
}

export function useKpiProgress(employeeId: number | undefined) {
  return useQuery({
    queryKey: perfKeys.kpiProgress(employeeId ?? 0),
    queryFn: () => performanceApi.kpiProgress(employeeId!).then((r) => r.data.data),
    enabled: !!employeeId,
  });
}
