import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contractApi } from "./contractApi";
import type { ContractDetail, ContractFormValues, ContractFromQuotationValues, ContractListParams } from "../types/contract";

const contractKeys = {
  all: ["contracts"] as const,
  lists: () => [...contractKeys.all, "list"] as const,
  list: (params: ContractListParams) => [...contractKeys.lists(), params] as const,
};

export function useContractList(params: ContractListParams) {
  return useQuery({
    queryKey: contractKeys.list(params),
    queryFn: () => contractApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useContract(id: number | undefined) {
  return useQuery({
    queryKey: [...contractKeys.all, "detail", id ?? 0] as const,
    queryFn: () => contractApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useContractRelated(id: number | undefined) {
  return useQuery({
    queryKey: [...contractKeys.all, "related", id ?? 0] as const,
    queryFn: () => contractApi.related(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ContractFormValues) =>
      contractApi.create(values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: contractKeys.lists() }),
  });
}

export function useCreateContractFromSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ salesOrderId, startDate, endDate, monthlyValue }: { salesOrderId: number; startDate?: string; endDate?: string; monthlyValue?: number }) =>
      contractApi.storeFromSalesOrder(salesOrderId, { start_date: startDate, end_date: endDate, monthly_value: monthlyValue }).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: contractKeys.lists() }),
  });
}

export function useTerminateContract(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => contractApi.terminate(id).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: contractKeys.lists() }),
  });
}

function invalidateDetail(qc: ReturnType<typeof useQueryClient>, id: number) {
  qc.invalidateQueries({ queryKey: contractKeys.lists() });
  qc.invalidateQueries({ queryKey: [...contractKeys.all, "detail", id] });
}

export function useSubmitContractApproval(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contract: ContractDetail) => contractApi.submitApproval(contract),
    onSuccess: () => invalidateDetail(qc, id),
  });
}

export function useConfirmSignedDocument(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: number) => contractApi.confirmSignedDocument(id, fileId).then((r) => r.data.data),
    onSuccess: () => invalidateDetail(qc, id),
  });
}

/** Alur BARU (Quotation -> Contract -> Rack Lock -> SO otomatis). */
export function useCreateContractFromQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ContractFromQuotationValues) =>
      contractApi.storeFromQuotation(values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: contractKeys.lists() }),
  });
}

export function useSetContractSite(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (siteId: number) => contractApi.setSite(id, siteId).then((r) => r.data.data),
    onSuccess: () => invalidateDetail(qc, id),
  });
}

export function useContractResourceStatus(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: [...contractKeys.all, "resource-status", id ?? 0] as const,
    queryFn: () => contractApi.resourceStatus(id!).then((r) => r.data.data),
    enabled: !!id && enabled,
  });
}

export function useIssueSalesOrderFromContract(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => contractApi.issueSalesOrder(id).then((r) => r.data.data),
    onSuccess: () => invalidateDetail(qc, id),
  });
}
