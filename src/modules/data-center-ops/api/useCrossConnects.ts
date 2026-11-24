import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crossConnectApi } from "./crossConnectApi";
import type { CrossConnectFormValues, CrossConnectListParams } from "../types/crossConnect";

const crossConnectKeys = {
  all: ["dcCrossConnects"] as const,
  list: (params: CrossConnectListParams) => [...crossConnectKeys.all, "list", params] as const,
  detail: (id: number) => [...crossConnectKeys.all, "detail", id] as const,
};

export function useCrossConnectList(params: CrossConnectListParams) {
  return useQuery({
    queryKey: crossConnectKeys.list(params),
    queryFn: () => crossConnectApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useCrossConnect(id: number | undefined) {
  return useQuery({
    queryKey: crossConnectKeys.detail(id ?? 0),
    queryFn: () => crossConnectApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: crossConnectKeys.all });
}

export function useCreateCrossConnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CrossConnectFormValues) => crossConnectApi.create(values).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateCrossConnect(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CrossConnectFormValues) => crossConnectApi.update(id, values).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useLockCrossConnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, installationDate }: { id: number; installationDate?: string }) => crossConnectApi.lock(id, installationDate).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useReleaseCrossConnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => crossConnectApi.release(id).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useMarkCrossConnectDamaged() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => crossConnectApi.markDamaged(id).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRepairCrossConnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => crossConnectApi.repair(id).then((r) => r.data.data),
    onSuccess: () => invalidateAll(qc),
  });
}
