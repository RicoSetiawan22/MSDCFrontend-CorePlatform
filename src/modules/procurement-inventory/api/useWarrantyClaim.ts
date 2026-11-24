import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { warrantyClaimApi } from "./warrantyClaimApi";
import type { WarrantyClaimListParams, CreateWarrantyClaimValues } from "../types/warrantyClaim";

const warrantyClaimKeys = {
  all: ["warrantyClaims"] as const,
  list: (p: WarrantyClaimListParams) => [...warrantyClaimKeys.all, "list", p] as const,
};

export function useWarrantyClaimList(params: WarrantyClaimListParams) {
  return useQuery({
    queryKey: warrantyClaimKeys.list(params),
    queryFn: () => warrantyClaimApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useCreateWarrantyClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateWarrantyClaimValues) => warrantyClaimApi.create(values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: warrantyClaimKeys.all }),
  });
}

export function useSubmitWarrantyClaim(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => warrantyClaimApi.submit(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: warrantyClaimKeys.all }),
  });
}

export function useCancelWarrantyClaim(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => warrantyClaimApi.cancel(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: warrantyClaimKeys.all }),
  });
}

export function useMarkWarrantyClaimSentToVendor(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => warrantyClaimApi.markSentToVendor(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: warrantyClaimKeys.all }),
  });
}

export function useResolveWarrantyClaim(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: { resolution_notes?: string; resolved_date?: string }) => warrantyClaimApi.resolve(id, values).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: warrantyClaimKeys.all }),
  });
}

export function usePoReceiptItems(purchaseOrderId: number | undefined) {
  return useQuery({
    queryKey: ["poReceiptItems", purchaseOrderId ?? 0],
    queryFn: () => warrantyClaimApi.poReceiptItems(purchaseOrderId!).then((r) => r.data.data),
    enabled: !!purchaseOrderId,
  });
}

export function useAttachWarrantyClaimProof(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proofFileId: number) => warrantyClaimApi.attachProof(id, proofFileId).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: warrantyClaimKeys.all }),
  });
}
