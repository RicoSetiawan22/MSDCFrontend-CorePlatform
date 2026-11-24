import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { glJournalApi } from "./glJournalApi";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import type { GlJournalFormValues, GlJournalListParams } from "../types/glJournal";
import { useActiveOrgId } from "@shared/lib/organization-context";

const glKeys = {
  all: ["gl-journals"] as const,
  list: (activeOrgId: number, params: GlJournalListParams) => [...glKeys.all, activeOrgId, "list", params] as const,
  detail: (activeOrgId: number, journalNumber: string) => [...glKeys.all, activeOrgId, "detail", journalNumber] as const,
  ledger: (activeOrgId: number, accountId: number, from?: string, to?: string) => ["gl-ledger", activeOrgId, accountId, from, to] as const,
  trialBalance: (activeOrgId: number, asOfDate?: string, dateFrom?: string, dateTo?: string) =>
    ["gl-trial-balance", activeOrgId, asOfDate, dateFrom, dateTo] as const,
};

export function useGlJournalList(params: GlJournalListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: glKeys.list(activeOrgId, params),
    queryFn: () => glJournalApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useGlJournal(journalNumber: string | undefined) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: glKeys.detail(activeOrgId, journalNumber ?? ""),
    queryFn: () => glJournalApi.show(journalNumber!).then((res) => res.data.data),
    enabled: !!journalNumber,
  });
}

export function useCreateGlJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: GlJournalFormValues) => glJournalApi.create(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: glKeys.all }),
  });
}

export function usePostGlJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (journalNumber: string) => glJournalApi.post(journalNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: glKeys.all });
    },
  });
}

export function useReverseGlJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ journalNumber, reason }: { journalNumber: string; reason?: string }) =>
      glJournalApi.reverse(journalNumber, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: glKeys.all });
    },
  });
}

export function useAccountLedger(accountId: number | undefined, dateFrom?: string, dateTo?: string) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: glKeys.ledger(activeOrgId, accountId ?? 0, dateFrom, dateTo),
    queryFn: () => glJournalApi.accountLedger(accountId!, dateFrom, dateTo).then((res) => res.data.data),
    enabled: !!accountId,
  });
}

export function useTrialBalance(asOfDate?: string, dateFrom?: string, dateTo?: string) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: glKeys.trialBalance(activeOrgId, asOfDate, dateFrom, dateTo),
    queryFn: () => glJournalApi.trialBalance(asOfDate, dateFrom, dateTo).then((res) => res.data.data),
  });
}

/**
 * BEDA dari hook lain di sini - ini bukan useQuery (tidak ada data untuk
 * di-render), murni mutation yang efek sampingnya "picu unduhan file di
 * browser". Dibuat Object URL sementara dari blob PDF yang diterima,
 * ditempel ke elemen <a> tersembunyi, diklik otomatis, lalu SEGERA
 * dibersihkan (revokeObjectURL) - pola standar unduh file lewat fetch/axios
 * (beda dari <a href="..." download> polos yang tidak bisa bawa token Bearer).
 */
export function useDownloadGeneralJournalPdf() {
  return useMutation({
    mutationFn: async ({ dateFrom, dateTo, organizationId, status }: { dateFrom: string; dateTo: string; organizationId: number; status?: string }) => {
      try {
        const res = await glJournalApi.generalJournalPdf(dateFrom, dateTo, organizationId, status);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}


export function useDownloadTrialBalancePdf() {
  return useMutation({
    mutationFn: async (params: { asOfDate?: string; dateFrom?: string; dateTo?: string; organizationId: number }) => {
      try {
        const res = await glJournalApi.trialBalancePdf(params);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}

export function useJournalSummary(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["journal-summary", dateFrom, dateTo],
    queryFn: () => glJournalApi.journalSummary(dateFrom, dateTo).then((r) => r.data.data),
    staleTime: 30_000,
  });
}
