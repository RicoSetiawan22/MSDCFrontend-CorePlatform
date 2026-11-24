import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { integrationApi } from "./integrationApi";
import type { IntegrationListParams } from "../types/integration";

export function useApIntegrationList(params: IntegrationListParams) {
  return useQuery({
    queryKey: ["apIntegration", "list", params] as const,
    queryFn: () => integrationApi.apList(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function usePostApIntegrationBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (apBillIds: number[]) => integrationApi.apPostBatch(apBillIds).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apIntegration"] }),
  });
}

export function useRejectApIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => integrationApi.apReject(id, reason).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apIntegration"] }),
  });
}

export function useArIntegrationList(params: IntegrationListParams) {
  return useQuery({
    queryKey: ["arIntegration", "list", params] as const,
    queryFn: () => integrationApi.arList(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function usePostArIntegrationBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arInvoiceIds: number[]) => integrationApi.arPostBatch(arInvoiceIds).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["arIntegration"] }),
  });
}

export function useRejectArIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => integrationApi.arReject(id, reason).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["arIntegration"] }),
  });
}
