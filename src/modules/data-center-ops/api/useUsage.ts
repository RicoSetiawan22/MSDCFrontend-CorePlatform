import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usageApi } from "./usageApi";
import type { UsageListParams } from "../types/usage";

const usageKeys = {
  all: ["dcUsageRecords"] as const,
  list: (params: UsageListParams) => [...usageKeys.all, "list", params] as const,
};

export function useUsageList(params: UsageListParams) {
  return useQuery({
    queryKey: usageKeys.list(params),
    queryFn: () => usageApi.list(params).then(r => r.data),
    placeholderData: prev => prev,
  });
}

export function useBillRemoteHands(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ratePerHour: number) =>
      usageApi.billRemoteHands(id, ratePerHour).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: usageKeys.all }),
  });
}

export function useGenerateUsage(month: number, year: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => usageApi.generateMonthly(month, year).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: usageKeys.all }),
  });
}
