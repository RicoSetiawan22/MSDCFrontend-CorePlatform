import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { itemLoanApi } from "./itemLoanApi";
import type { ItemLoanListParams, CreateItemLoanValues } from "../types/itemLoan";

const itemLoanKeys = {
  all: ["itemLoans"] as const,
  list: (p: ItemLoanListParams) => [...itemLoanKeys.all, "list", p] as const,
};

const availableAssetsKey = ["availableAssetsForLoan"] as const;

export function useItemLoanList(params: ItemLoanListParams) {
  return useQuery({
    queryKey: itemLoanKeys.list(params),
    queryFn: () => itemLoanApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useAvailableAssetsForLoan(search: string) {
  return useQuery({
    queryKey: [...availableAssetsKey, search] as const,
    queryFn: () => itemLoanApi.availableAssets(search).then((r) => r.data.data),
  });
}

export function useCreateItemLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateItemLoanValues) => itemLoanApi.create(values).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemLoanKeys.all });
      // Aset yang baru dipinjam langsung hilang dari picker FPBG baru.
      qc.invalidateQueries({ queryKey: availableAssetsKey });
    },
  });
}

export function useSubmitItemLoan(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => itemLoanApi.submit(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemLoanKeys.all }),
  });
}

export function useCancelItemLoan(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => itemLoanApi.cancel(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemLoanKeys.all });
      // Peminjaman dibatalkan - asetnya bisa dipinjam lagi.
      qc.invalidateQueries({ queryKey: availableAssetsKey });
    },
  });
}

export function useMarkItemLoaned(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => itemLoanApi.markAsLoaned(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemLoanKeys.all }),
  });
}

export function useMarkItemReturned(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: { condition_in?: string; actual_return_date?: string }) => itemLoanApi.markAsReturned(id, values).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemLoanKeys.all });
      // Barang sudah kembali - asetnya bisa dipinjam lagi.
      qc.invalidateQueries({ queryKey: availableAssetsKey });
    },
  });
}
