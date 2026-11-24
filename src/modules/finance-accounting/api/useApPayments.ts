import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apPaymentApi } from "./apPaymentApi";
import type { ApPaymentFormValues, ApPaymentListParams } from "../types/apPayment";
import { useActiveOrgId } from "@shared/lib/organization-context";

const apPaymentKeys = {
  all: ["ap-payments"] as const,
  list: (activeOrgId: number, params: ApPaymentListParams) => [...apPaymentKeys.all, activeOrgId, "list", params] as const,
};

export function useApPaymentList(params: ApPaymentListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: apPaymentKeys.list(activeOrgId, params),
    queryFn: () => apPaymentApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateApPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ApPaymentFormValues) => apPaymentApi.create(values).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apPaymentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["ap-bills"] });
    },
  });
}

export function useVoidApPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => apPaymentApi.void(id, reason).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apPaymentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["ap-bills"] });
    },
  });
}
