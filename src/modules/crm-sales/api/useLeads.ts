import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leadApi } from "./leadApi";
import type { LeadFormValues, LeadListParams, LeadStatus } from "../types/lead";

const leadKeys = {
  all: ["leads"] as const,
  lists: () => [...leadKeys.all, "list"] as const,
  list: (params: LeadListParams) => [...leadKeys.lists(), params] as const,
};

export function useLeadList(params: LeadListParams) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: () => leadApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useLead(id: number | undefined) {
  return useQuery({
    queryKey: [...leadKeys.all, "detail", id ?? 0] as const,
    queryFn: () => leadApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: LeadFormValues) => leadApi.create(values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: leadKeys.lists() }),
  });
}

export function useUpdateLeadStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: LeadStatus) => leadApi.updateStatus(id, status).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: leadKeys.lists() }),
  });
}

export function useConvertLead(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => leadApi.convert(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: leadKeys.lists() }),
  });
}

/** Daftar PIC seluruh jabatan (terpisah dari Sales khusus untuk KPI). */
export function useCrmPicUsers() {
  return useQuery({
    queryKey: ["crmSales", "picUsers"] as const,
    queryFn: () => leadApi.picUsers().then(response => response.data.data),
    staleTime: 10_000,
    refetchOnMount: "always",
  });
}

/** Update otomatis ketika Employee/Jabatan HR berubah setelah kembali ke CRM. */
export function useCrmSalesEmployees() {
  return useQuery({
    queryKey: ["crmSales", "hrSalesEmployees"] as const,
    queryFn: () => leadApi.salesEmployees().then(response => response.data.data),
    staleTime: 10_000,
    refetchOnMount: "always",
  });
}