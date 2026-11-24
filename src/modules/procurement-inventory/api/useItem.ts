import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { itemApi, warehouseApi, stockApi } from "./itemApi";
import type { Item, ItemListParams, StockMovementListParams, Warehouse } from "../types/item";

const itemKeys = {
  all: ["procItems"] as const,
  list: (p: ItemListParams) => [...itemKeys.all, "list", p] as const,
};

export function useItemList(params: ItemListParams) {
  return useQuery({
    queryKey: itemKeys.list(params),
    queryFn: () => itemApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: itemApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.all }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Partial<Item> }) => itemApi.update(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.all }),
  });
}

export function useWarehouseList() {
  return useQuery({
    queryKey: ["procWarehouses"] as const,
    queryFn: () => warehouseApi.list().then((r) => r.data),
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: warehouseApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["procWarehouses"] }),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Partial<Warehouse> }) => warehouseApi.update(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["procWarehouses"] }),
  });
}

export function useStockBalance() {
  return useQuery({
    queryKey: ["stockBalance"] as const,
    queryFn: () => stockApi.allBalances().then((r) => r.data.data),
  });
}

export function useStockMovements(params: StockMovementListParams) {
  return useQuery({
    queryKey: ["stockMovements", params] as const,
    queryFn: () => stockApi.movements(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

function invalidateStock(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["stockBalance"] });
  qc.invalidateQueries({ queryKey: ["stockMovements"] });
}

export function useIssueStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stockApi.issue,
    onSuccess: () => invalidateStock(qc),
  });
}

export function useTransferStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stockApi.transfer,
    onSuccess: () => invalidateStock(qc),
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stockApi.adjust,
    onSuccess: () => invalidateStock(qc),
  });
}
