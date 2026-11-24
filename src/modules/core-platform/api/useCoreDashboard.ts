import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "./dashboardApi";

export const CORE_DASHBOARD_QUERY_KEY = ["core-platform", "dashboard", "summary"];

export function useCoreDashboardSummary() {
  return useQuery({
    queryKey: CORE_DASHBOARD_QUERY_KEY,
    queryFn: () => dashboardApi.getSummary().then((r) => r.data.data),
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

export function useRemindApprover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, approverUserId }: { instanceId: number; approverUserId?: number | null }) =>
      dashboardApi.remindApprover(instanceId, approverUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CORE_DASHBOARD_QUERY_KEY });
    },
  });
}
