import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { damagedItemReturnApi } from "./damagedItemReturnApi";
import type { DamagedItemReturnListParams, CreateDamagedItemReturnValues } from "../types/damagedItemReturn";

const damagedItemReturnKeys = {
  all: ["damagedItemReturns"] as const,
  list: (p: DamagedItemReturnListParams) => [...damagedItemReturnKeys.all, "list", p] as const,
};

const returnableAssetsKey = ["returnableAssets"] as const;

export function useDamagedItemReturnList(params: DamagedItemReturnListParams) {
  return useQuery({
    queryKey: damagedItemReturnKeys.list(params),
    queryFn: () => damagedItemReturnApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useReturnableAssets(search: string) {
  return useQuery({
    queryKey: [...returnableAssetsKey, search] as const,
    queryFn: () => damagedItemReturnApi.returnableAssets(search).then((r) => r.data.data),
  });
}

export function useCreateDamagedItemReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateDamagedItemReturnValues) => damagedItemReturnApi.create(values).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: damagedItemReturnKeys.all });
      qc.invalidateQueries({ queryKey: returnableAssetsKey });
    },
  });
}

export function useSubmitDamagedItemReturn(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => damagedItemReturnApi.submit(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: damagedItemReturnKeys.all }),
  });
}

export function useCancelDamagedItemReturn(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => damagedItemReturnApi.cancel(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: damagedItemReturnKeys.all });
      qc.invalidateQueries({ queryKey: returnableAssetsKey });
    },
  });
}

export function useMarkDamagedItemReceived(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => damagedItemReturnApi.markAsReceived(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: damagedItemReturnKeys.all });
      qc.invalidateQueries({ queryKey: ["procAssets"] });
    },
  });
}
