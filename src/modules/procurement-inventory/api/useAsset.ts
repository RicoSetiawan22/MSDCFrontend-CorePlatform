import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assetApi } from "./assetApi";
import type { AssetListParams } from "../types/asset";

const assetKeys = {
  all: ["procAssets"] as const,
  list: (p: AssetListParams) => [...assetKeys.all, "list", p] as const,
  detail: (id: number) => [...assetKeys.all, "detail", id] as const,
};

export function useAssetList(params: AssetListParams) {
  return useQuery({
    queryKey: assetKeys.list(params),
    queryFn: () => assetApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useAsset(id: number | undefined) {
  return useQuery({
    queryKey: assetKeys.detail(id ?? 0),
    queryFn: () => assetApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useAssetHistory(id: number | undefined) {
  return useQuery({
    queryKey: [...assetKeys.all, "history", id ?? 0] as const,
    queryFn: () => assetApi.history(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: assetKeys.all }),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Parameters<typeof assetApi.update>[1] }) =>
      assetApi.update(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: assetKeys.all }),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => assetApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: assetKeys.all }),
  });
}

export function useSetAssetStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => assetApi.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: assetKeys.all }),
  });
}

export function useCreateSchedule(assetId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Parameters<typeof assetApi.createSchedule>[1]) => assetApi.createSchedule(assetId, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.all });
      qc.invalidateQueries({ queryKey: ["overdueSchedules"] });
    },
  });
}

export function useCreateLog(assetId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Parameters<typeof assetApi.createLog>[1]) => assetApi.createLog(assetId, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.all });
      qc.invalidateQueries({ queryKey: ["overdueSchedules"] });
    },
  });
}

export function useOverdueSchedules() {
  return useQuery({
    queryKey: ["overdueSchedules"] as const,
    queryFn: () => assetApi.overdueSchedules().then((r) => r.data.data),
  });
}
