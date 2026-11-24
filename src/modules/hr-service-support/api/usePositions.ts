import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { positionApi } from "./positionApi";
import type { PositionValues } from "./positionApi";

export function usePositions() {
  return useQuery({
    queryKey: ["positions"] as const,
    queryFn: () => positionApi.list().then((r) => r.data.data),
  });
}

export function useCreatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: PositionValues) => positionApi.create(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["positions"] }),
  });
}

export function useUpdatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: PositionValues }) => positionApi.update(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["positions"] }),
  });
}

export function useKpiMetrics() {
  return useQuery({
    queryKey: ["kpiMetrics"] as const,
    queryFn: () => positionApi.kpiMetrics().then((r) => r.data.data),
    staleTime: Infinity, // katalog tetap, tidak berubah selama sesi jalan
  });
}
