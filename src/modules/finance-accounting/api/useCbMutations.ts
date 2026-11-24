import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cbMutationApi } from "./cbMutationApi";
import type { CbMutationFormValues, CbMutationListParams } from "../types/cbMutation";
import { useActiveOrgId } from "@shared/lib/organization-context";

const cbMutationKeys = {
  all: ["cb-mutations"] as const,
  list: (activeOrgId: number, params: CbMutationListParams) => [...cbMutationKeys.all, activeOrgId, "list", params] as const,
};

export function useCbMutationList(params: CbMutationListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: cbMutationKeys.list(activeOrgId, params),
    queryFn: () => cbMutationApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

// 3 hook TERPISAH (bukan 1 hook dengan parameter tipe) - supaya pemanggil
// jelas dari nama function-nya sendiri lagi bikin mutasi jenis apa, dan
// invalidateQueries konsisten di ketiganya (akun & cash flow ikut basi).
function useInvalidateAfterMutation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: cbMutationKeys.all });
    queryClient.invalidateQueries({ queryKey: ["cb-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["cb-account-mutations"] });
    queryClient.invalidateQueries({ queryKey: ["cb-cash-flow"] });
  };
}

export function useCreateCbDeposit() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: (values: CbMutationFormValues) => cbMutationApi.storeDeposit(values).then((res) => res.data.data),
    onSuccess: invalidate,
  });
}

export function useCreateCbWithdrawal() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: (values: CbMutationFormValues) => cbMutationApi.storeWithdrawal(values).then((res) => res.data.data),
    onSuccess: invalidate,
  });
}

export function useCreateCbTransfer() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: (values: CbMutationFormValues) => cbMutationApi.storeTransfer(values).then((res) => res.data.data),
    onSuccess: invalidate,
  });
}

export function useVoidCbMutation() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => cbMutationApi.void(id, reason).then((res) => res.data.data),
    onSuccess: invalidate,
  });
}
