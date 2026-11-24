import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cbAccountApi } from "./cbAccountApi";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import type { CbAccountFormValues, CbAccountListParams } from "../types/cbAccount";

const cbAccountKeys = {
  all: ["cb-accounts"] as const,
  list: (params: CbAccountListParams) => [...cbAccountKeys.all, "list", params] as const,
  mutations: (accountId: number, from?: string, to?: string) => ["cb-account-mutations", accountId, from, to] as const,
  pending: (accountId: number, asOf?: string) => ["cb-pending-reconciliation", accountId, asOf] as const,
};

export function useCbAccountList(params: CbAccountListParams) {
  return useQuery({
    queryKey: cbAccountKeys.list(params),
    queryFn: () => cbAccountApi.list(params).then((res) => res.data.data),
  });
}

export function useCreateCbAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CbAccountFormValues) => cbAccountApi.create(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cbAccountKeys.all }),
  });
}

/** accountId di sini adalah id AKUN COA (Account), BUKAN id baris
 * CbAccount - lihat catatan di cbAccountApi.ts. */
export function useCbAccountMutations(accountId: number | undefined, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: cbAccountKeys.mutations(accountId ?? 0, dateFrom, dateTo),
    queryFn: () => cbAccountApi.mutations(accountId!, dateFrom, dateTo).then((res) => res.data.data),
    enabled: !!accountId,
  });
}

export function useCbPendingReconciliation(accountId: number | undefined, asOfDate?: string) {
  return useQuery({
    queryKey: cbAccountKeys.pending(accountId ?? 0, asOfDate),
    queryFn: () => cbAccountApi.pendingReconciliation(accountId!, asOfDate).then((res) => res.data.data),
    enabled: !!accountId,
  });
}

export function useReconcileCbAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, statementDate, glJournalIds, statementEndingBalance }: { accountId: number; statementDate: string; glJournalIds: number[]; statementEndingBalance?: number }) =>
      cbAccountApi.reconcile(accountId, statementDate, glJournalIds, statementEndingBalance).then((res) => res.data.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cb-account-mutations", variables.accountId] });
      queryClient.invalidateQueries({ queryKey: ["cb-pending-reconciliation", variables.accountId] });
    },
  });
}

export function useCashFlowReport(dateFrom?: string, dateTo?: string, accountId?: number) {
  return useQuery({
    queryKey: ["cb-cash-flow", dateFrom, dateTo, accountId],
    queryFn: () => cbAccountApi.cashFlow(dateFrom, dateTo, accountId).then((res) => res.data.data),
  });
}

export function useDownloadCbAccountsPdf() {
  return useMutation({
    mutationFn: async (organizationId: number) => {
      try {
        const res = await cbAccountApi.printPdf(organizationId);
        return res.data; // Blob - pratinjau dulu, bukan langsung unduh
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}

export function useDownloadCashBookPdf() {
  return useMutation({
    mutationFn: async (params: { organizationId: number; accountId: number; date_from?: string; date_to?: string }) => {
      try {
        const res = await cbAccountApi.printCashBookPdf(params.organizationId, params);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}

export function useDownloadCashFlowPdf() {
  return useMutation({
    mutationFn: async (params: { organizationId: number; date_from?: string; date_to?: string }) => {
      try {
        const res = await cbAccountApi.printCashFlowPdf(params.organizationId, params);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}
