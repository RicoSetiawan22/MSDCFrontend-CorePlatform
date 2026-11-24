import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apBillApi } from "./apBillApi";
import type { ApBillFormValues, ApBillListParams } from "../types/apBill";
import { useActiveOrgId } from "@shared/lib/organization-context";

const apBillKeys = {
  all: ["ap-bills"] as const,
  list: (activeOrgId: number, params: ApBillListParams) => [...apBillKeys.all, activeOrgId, "list", params] as const,
};

export function useApBillList(params: ApBillListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: apBillKeys.list(activeOrgId, params),
    queryFn: () => apBillApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateApBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ApBillFormValues) => apBillApi.create(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: apBillKeys.all }),
  });
}

export function useVoidApBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apBillApi.void(id).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: apBillKeys.all }),
  });
}

export function useApAgingReport(asOfDate?: string) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: ["ap-aging-report", activeOrgId, asOfDate],
    queryFn: () => apBillApi.agingReport(asOfDate).then((res) => res.data.data),
  });
}

export function useDownloadAgingApPdf() {
  return useMutation({
    mutationFn: async ({ asOfDate, organizationId }: { asOfDate: string; organizationId: number }): Promise<Blob> => {
      const res = await apBillApi.agingApPdf(asOfDate, organizationId);
      return res.data as Blob;
    },
  });
}
