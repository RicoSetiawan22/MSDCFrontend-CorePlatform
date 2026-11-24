import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { prApi } from "./prApi";
import { apiClient } from "@shared/lib/api-client";
import type { PurchaseRequestListParams } from "../types/pr";

const prKeys = {
  all: ["purchaseRequests"] as const,
  list: (p: PurchaseRequestListParams) => [...prKeys.all, "list", p] as const,
};

export function usePrList(params: PurchaseRequestListParams) {
  return useQuery({
    queryKey: prKeys.list(params),
    queryFn: () => prApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function usePr(id: number | undefined) {
  return useQuery({
    queryKey: [...prKeys.all, "detail", id ?? 0] as const,
    queryFn: () => prApi.show(id!).then((r) => (r.data as { data?: unknown }).data ?? r.data),
    enabled: !!id,
  });
}

export function useCreatePr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: {
      purpose: string;
      employee_id?: number;
      department_id?: number;
      cost_center_id?: number;
      notes?: string;
      lines: Array<{
        item_id?: number;
        description: string;
        quantity: number;
        uom: string;
        estimated_unit_price?: number;
        channel?: string;
      }>;
    }) => prApi.create(values as Parameters<typeof prApi.create>[0]).then((r) => (r.data as { data?: unknown }).data ?? r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: prKeys.all }),
  });
}

export function useSubmitPr(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => prApi.submit(id).then((r) => (r.data as { data?: unknown }).data ?? r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: prKeys.all }),
  });
}

export function useCancelPr(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => prApi.cancel(id).then((r) => (r.data as { data?: unknown }).data ?? r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: prKeys.all }),
  });
}

export function useUpdatePr(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: {
      purpose?: string;
      department_id?: number;
      cost_center_id?: number;
      notes?: string;
    }) =>
      apiClient.put(`/v1/procurement-inventory/purchase-requests/${id}`, values).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: prKeys.all }),
  });
}

export function useUpdatePrLines(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lines: Array<{
      item_id?: number;
      description: string;
      quantity: number;
      uom: string;
      estimated_unit_price?: number;
      channel?: string;
    }>) =>
      apiClient
        .put(`/v1/procurement-inventory/purchase-requests/${id}/lines`, { lines })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: prKeys.all }),
  });
}

export function usePendingPoList() {
  return useQuery({
    queryKey: [...prKeys.all, "pending-po"] as const,
    queryFn: () =>
      apiClient
        .get<{ data: Array<{
          id: number; pr_number: string; purpose: string;
          requester: string; department: string;
          line_count: number; created_at: string;
        }> }>("/v1/procurement-inventory/purchase-requests/pending-po")
        .then(r => r.data.data),
  });
}
