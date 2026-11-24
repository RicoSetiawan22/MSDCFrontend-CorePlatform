import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { goodsHandoverApi } from "./goodsHandoverApi";
import type { GoodsHandoverListParams, CreateGoodsHandoverValues } from "../types/goodsHandover";

const goodsHandoverKeys = {
  all: ["goodsHandovers"] as const,
  list: (p: GoodsHandoverListParams) => [...goodsHandoverKeys.all, "list", p] as const,
};

export function useGoodsHandoverList(params: GoodsHandoverListParams) {
  return useQuery({
    queryKey: goodsHandoverKeys.list(params),
    queryFn: () => goodsHandoverApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useAvailableGrnsForHandover(search: string) {
  return useQuery({
    queryKey: ["goodsReceiptsAvailableForHandover", search],
    queryFn: () => goodsHandoverApi.receiptsAvailableForHandover(search).then((r) => r.data.data),
  });
}

export function useHandoverAvailability(goodsReceiptId: number | undefined) {
  return useQuery({
    queryKey: ["goodsHandoverAvailability", goodsReceiptId ?? 0],
    queryFn: () => goodsHandoverApi.receiptAvailability(goodsReceiptId!).then((r) => r.data.data),
    enabled: !!goodsReceiptId,
  });
}

export function useCreateGoodsHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateGoodsHandoverValues) => goodsHandoverApi.create(values).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goodsHandoverKeys.all });
      qc.invalidateQueries({ queryKey: ["stockBalance"] });
      qc.invalidateQueries({ queryKey: ["stockMovements"] });
    },
  });
}
