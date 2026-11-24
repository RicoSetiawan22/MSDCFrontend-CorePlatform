import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { arPaymentApi } from "./arPaymentApi";
import type { ArPaymentFormValues, ArPaymentListParams } from "../types/arPayment";
import { useActiveOrgId } from "@shared/lib/organization-context";

const arPaymentKeys = {
  all: ["ar-payments"] as const,
  list: (activeOrgId: number, params: ArPaymentListParams) => [...arPaymentKeys.all, activeOrgId, "list", params] as const,
};

export function useArPaymentList(params: ArPaymentListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: arPaymentKeys.list(activeOrgId, params),
    queryFn: () => arPaymentApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateArPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ArPaymentFormValues) => arPaymentApi.create(values).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: arPaymentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
    },
  });
}

export function useVoidArPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => arPaymentApi.void(id, reason).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: arPaymentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
    },
  });
}
