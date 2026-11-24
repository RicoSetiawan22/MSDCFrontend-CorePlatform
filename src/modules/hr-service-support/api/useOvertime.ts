import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { overtimeApi } from "./overtimeApi";
import type { OvertimeListParams } from "../types/overtime";

const otKeys = {
  all: ["hrOvertime"] as const,
  list: (p: Record<string, unknown>) => [...otKeys.all, "list", p] as const,
};

export function useOvertimeList(params: OvertimeListParams) {
  return useQuery({
    queryKey: otKeys.list(params),
    queryFn: () => overtimeApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useOvertimeRecord(id: number | undefined) {
  return useQuery({
    queryKey: [...otKeys.all, "detail", id ?? 0] as const,
    queryFn: () => overtimeApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useGenerateOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      overtimeApi.generate(month, year).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: otKeys.all }),
  });
}

export function usePostOvertimeToFinance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rate }: { id: number; rate: number }) =>
      overtimeApi.postToFinance(id, rate).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: otKeys.all }),
  });
}

// ── Alur pengajuan HRD -> approval Manager ────────────────────────────────

export function useOvertimeCandidates(employeeId: number | undefined, month: number, year: number) {
  return useQuery({
    queryKey: [...otKeys.all, "candidates", employeeId, month, year] as const,
    queryFn: () => overtimeApi.candidates(employeeId!, month, year).then((r) => r.data.data),
    enabled: !!employeeId,
  });
}

export function useSubmitOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: overtimeApi.submit,
    onSuccess: () => qc.invalidateQueries({ queryKey: otKeys.all }),
  });
}

/** Tarif lembur default (is_default=true) dari Master Data Core Platform -
 * dipakai kasih estimasi biaya (jam x rate) sebelum HRD submit, dan buat
 * prefill rate saat posting ke Finance. Fallback ke baris pertama kalau
 * belum ada yang ditandai default. */
export function useDefaultOvertimeRate() {
  return useQuery({
    queryKey: [...otKeys.all, "defaultRate"] as const,
    queryFn: () => overtimeApi.overtimeRates().then((r) => {
      const rates = r.data.data.filter((x) => x.is_active);
      return rates.find((x) => x.is_default) ?? rates[0] ?? null;
    }),
    staleTime: 5 * 60 * 1000,
  });
}
