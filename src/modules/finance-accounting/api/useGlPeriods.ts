import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/api-client";

const BASE_PATH = "/v1/finance-accounting";

export interface GlPeriodRow {
  id: number;
  fiscal_year: number;
  month: number;
  period_name: string;
  start_date: string;
  end_date: string;
  status: "open" | "closed" | "reopened" | "locked";
  year_end_closing_done: boolean;
}

export function usePeriodList(fiscalYear: number) {
  return useQuery({
    queryKey: ["gl-periods", fiscalYear],
    queryFn: () =>
      apiClient
        .get<{ data: GlPeriodRow[] }>(`${BASE_PATH}/gl/periods`, {
          params: { fiscal_year: fiscalYear },
        })
        .then((r) => r.data.data),
    enabled: !!fiscalYear,
  });
}

export function useGeneratePeriods() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fiscalYear: number) =>
      apiClient.post(`${BASE_PATH}/gl/periods/generate`, { fiscal_year: fiscalYear }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gl-periods"] }),
  });
}

export function useClosePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodId: number) =>
      apiClient.post(`${BASE_PATH}/gl/periods/${periodId}/close`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gl-periods"] }),
  });
}

export function useReopenPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodId: number) =>
      apiClient.post(`${BASE_PATH}/gl/periods/${periodId}/reopen`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gl-periods"] }),
  });
}
