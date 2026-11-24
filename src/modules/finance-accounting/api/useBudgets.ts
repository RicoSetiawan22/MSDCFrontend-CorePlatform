import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetApi } from "./budgetApi";
import type { BgBudgetFormValues, BgBudgetListParams } from "../types/budget";
import { useActiveOrgId } from "@shared/lib/organization-context";

const budgetKeys = {
  all: ["budgets"] as const,
  list: (activeOrgId: number, params: BgBudgetListParams) => [...budgetKeys.all, activeOrgId, "list", params] as const,
  vsActual: (activeOrgId: number, year: number, deptId?: number, asOf?: string) => ["budget-vs-actual", activeOrgId, year, deptId, asOf] as const,
};

export function useBudgetList(params: BgBudgetListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: budgetKeys.list(activeOrgId, params),
    queryFn: () => budgetApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useSaveBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: BgBudgetFormValues) => budgetApi.save(values).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      queryClient.invalidateQueries({ queryKey: ["budget-vs-actual"] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      queryClient.invalidateQueries({ queryKey: ["budget-vs-actual"] });
    },
  });
}

export function useBudgetVsActual(fiscalYear: number, departmentId?: number, asOfDate?: string) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: budgetKeys.vsActual(activeOrgId, fiscalYear, departmentId, asOfDate),
    queryFn: () => budgetApi.vsActual(fiscalYear, departmentId, asOfDate).then((res) => res.data.data),
  });
}
