import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { billingContractApi } from "./billingContractApi";
import type { BiBillingContractFormValues, BiBillingContractUpdateValues, BiBillingContractListParams } from "../types/billingContract";
import { useActiveOrgId } from "@shared/lib/organization-context";

const billingKeys = {
  all: ["billing-contracts"] as const,
  list: (activeOrgId: number, params: BiBillingContractListParams) => [...billingKeys.all, activeOrgId, "list", params] as const,
  detail: (activeOrgId: number, id: number) => [...billingKeys.all, activeOrgId, "detail", id] as const,
  history: (activeOrgId: number, id: number) => [...billingKeys.all, activeOrgId, "history", id] as const,
};

export function useBillingContractList(params: BiBillingContractListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: billingKeys.list(activeOrgId, params),
    queryFn: () => billingContractApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useBillingContract(id: number | undefined) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: billingKeys.detail(activeOrgId, id ?? 0),
    queryFn: () => billingContractApi.show(id!).then((res) => res.data.data),
    enabled: !!id,
  });
}

export function useBillingHistory(id: number | undefined) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: billingKeys.history(activeOrgId, id ?? 0),
    queryFn: () => billingContractApi.history(id!).then((res) => res.data.data),
    enabled: !!id,
  });
}

export function useCreateBillingContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: BiBillingContractFormValues) => billingContractApi.create(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billingKeys.all }),
  });
}

export function useUpdateBillingContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: BiBillingContractUpdateValues }) =>
      billingContractApi.update(id, values).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

function useContractStatusMutation(fn: (id: number) => ReturnType<typeof billingContractApi.suspend>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fn(id).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useSuspendBillingContract() {
  return useContractStatusMutation(billingContractApi.suspend);
}
export function useReactivateBillingContract() {
  return useContractStatusMutation(billingContractApi.reactivate);
}
export function useTerminateBillingContract() {
  return useContractStatusMutation(billingContractApi.terminate);
}

export function useRunBilling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ periodDate, contractId }: { periodDate: string; contractId?: number }) =>
      billingContractApi.run(periodDate, contractId).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.invalidateQueries({ queryKey: ["ar-invoices"] });
    },
  });
}
