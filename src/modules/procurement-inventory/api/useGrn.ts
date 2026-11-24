import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { grnApi } from "./grnApi";
import type { GoodsReceiptListParams, CreateGrnDraftValues } from "../types/grn";

const grnKeys = {
  all: ["goodsReceipts"] as const,
  list: (p: GoodsReceiptListParams) => [...grnKeys.all, "list", p] as const,
};

export function useGrnList(params: GoodsReceiptListParams) {
  return useQuery({
    queryKey: grnKeys.list(params),
    queryFn: () => grnApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useCreateGrnDraft(poId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateGrnDraftValues) => grnApi.createDraft(poId, values).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: grnKeys.all });
      qc.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
  });
}

export function usePostGrn(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values?: { item_links?: Array<{ purchase_order_line_id: number; item_id: number }> }) =>
      grnApi.post(id, values).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: grnKeys.all });
      qc.invalidateQueries({ queryKey: ["stockBalance"] });
      qc.invalidateQueries({ queryKey: ["stockMovements"] });
      qc.invalidateQueries({ queryKey: ["procItems"] });
    },
  });
}

export function useGrnDetail(id: number | undefined) {
  return useQuery({
    queryKey: [...grnKeys.all, "detail", id ?? 0] as const,
    queryFn: () => grnApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}
