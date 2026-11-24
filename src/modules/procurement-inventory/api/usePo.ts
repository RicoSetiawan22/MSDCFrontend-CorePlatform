import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { poApi } from "./poApi";
import { apiClient } from "@shared/lib/api-client";
import type { PurchaseOrderListParams } from "../types/po";

const poKeys = {
  all: ["purchaseOrders"] as const,
  list: (p: PurchaseOrderListParams) => [...poKeys.all, "list", p] as const,
};

export function usePoList(params: PurchaseOrderListParams) {
  return useQuery({
    queryKey: poKeys.list(params),
    queryFn: () => poApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function usePo(id: number | undefined) {
  return useQuery({
    queryKey: [...poKeys.all, "detail", id ?? 0] as const,
    queryFn: () => poApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function usePoHistory(id: number | undefined) {
  return useQuery({
    queryKey: [...poKeys.all, "history", id ?? 0] as const,
    queryFn: () => poApi.history(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreatePo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: poApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: poKeys.all }),
  });
}

export function useConvertFromPr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prId: number) => poApi.convertFromPr(prId).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: poKeys.all }),
  });
}

export function useSubmitPo(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => poApi.submit(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: poKeys.all }),
  });
}

export function useSendPoToVendor(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => poApi.sendToVendor(id).then((r) => (r.data as { data?: unknown }).data ?? r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: poKeys.all }),
  });
}

export function useSendPoEmail(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: { organization_id: number; email: string; subject?: string; message?: string }) =>
      poApi.sendEmail(id, values).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: poKeys.all }),
  });
}

export function useCancelPo(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => poApi.cancel(id).then((r) => (r.data as { data?: unknown }).data ?? r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: poKeys.all }),
  });
}

export function useUpdatePo(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: {
      vendor_id?: number;
      order_date?: string;
      expected_delivery_date?: string;
      tax_amount?: number;
      notes?: string;
    }) =>
      apiClient.put(`/v1/procurement-inventory/purchase-orders/${id}`, values)
        .then((r) => (r.data as { data?: unknown }).data ?? r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: poKeys.all }),
  });
}

export function useUpdatePoLines(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lines: Array<{
      item_id?: number;
      description: string;
      quantity: number;
      uom: string;
      unit_price: number;
      discount_pct?: number;
      is_dc_asset?: boolean;
    }>) =>
      apiClient.put(`/v1/procurement-inventory/purchase-orders/${id}/lines`, { lines })
        .then((r) => (r.data as { data?: unknown }).data ?? r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: poKeys.all }),
  });
}
