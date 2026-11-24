import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { arInvoiceApi } from "./arInvoiceApi";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import type { ArInvoiceFormValues, ArInvoiceListParams } from "../types/arInvoice";
import { useActiveOrgId } from "@shared/lib/organization-context";

const arInvoiceKeys = {
  all: ["ar-invoices"] as const,
  list: (activeOrgId: number, params: ArInvoiceListParams) => [...arInvoiceKeys.all, activeOrgId, "list", params] as const,
  detail: (activeOrgId: number, id: number) => [...arInvoiceKeys.all, activeOrgId, "detail", id] as const,
};

export function useArInvoiceList(params: ArInvoiceListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: arInvoiceKeys.list(activeOrgId, params),
    queryFn: () => arInvoiceApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useArInvoice(id: number | undefined) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: arInvoiceKeys.detail(activeOrgId, id ?? 0),
    queryFn: () => arInvoiceApi.show(id!).then((res) => res.data.data),
    enabled: !!id,
  });
}

export function useCreateArInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ArInvoiceFormValues) => arInvoiceApi.create(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: arInvoiceKeys.all }),
  });
}

export function useVoidArInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => arInvoiceApi.void(id).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: arInvoiceKeys.all }),
  });
}

export function useSendArInvoiceReminder() {
  return useMutation({
    mutationFn: ({ id, email }: { id: number; email: string }) => arInvoiceApi.sendReminder(id, email),
  });
}

export function useArAgingReport(asOfDate?: string) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: ["ar-aging-report", activeOrgId, asOfDate],
    queryFn: () => arInvoiceApi.agingReport(asOfDate).then((res) => res.data.data),
  });
}

export function useDownloadArInvoicePdf() {
  return useMutation({
    mutationFn: async ({ invoiceId, organizationId }: { invoiceId: number; organizationId: number }) => {
      try {
        const res = await arInvoiceApi.printPdf(invoiceId, organizationId);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}

export function useDownloadAgingArPdf() {
  return useMutation({
    mutationFn: async ({ asOfDate, organizationId }: { asOfDate: string; organizationId: number }): Promise<Blob> => {
      const res = await arInvoiceApi.agingArPdf(asOfDate, organizationId);
      return res.data as Blob;
    },
  });
}
