import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerApi } from "./customerApi";
import type { CustomerFormValues, CustomerListParams, CustomerStatus } from "../types/customer";

// Query key berjenjang - "['customers']" dipakai buat invalidasi SEMUA
// query terkait customer sekaligus (mis. setelah create/update), sedangkan
// "['customers', 'list', params]" spesifik ke 1 kombinasi filter/halaman.
const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params: CustomerListParams) => [...customerKeys.lists(), params] as const,
  detail: (id: number) => [...customerKeys.all, "detail", id] as const,
};

export function useCustomerList(params: CustomerListParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customerApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData, // halaman lama TETAP tampil selagi halaman baru loading - tidak "flash" kosong
  });
}

export function useCustomer(id: number | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? 0),
    queryFn: () => customerApi.show(id!).then((res) => res.data.data),
    enabled: !!id, // TIDAK dipanggil sama sekali kalau id belum ada (mis. form mode "create")
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CustomerFormValues) => customerApi.create(values).then((res) => res.data.data),
    onSuccess: () => {
      // Begitu berhasil bikin customer baru, SEMUA list yang sedang
      // di-cache (apapun filter/halamannya) ditandai basi - TanStack Query
      // otomatis fetch ulang yang sedang aktif ditampilkan.
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useUpdateCustomer(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CustomerFormValues) => customerApi.update(id, values).then((res) => res.data.data),
    onSuccess: (updatedCustomer) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.setQueryData(customerKeys.detail(id), updatedCustomer);
    },
  });
}

export function useSetCustomerStatus(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: CustomerStatus) => customerApi.setStatus(id, status).then((res) => res.data.data),
    onSuccess: (updatedCustomer) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.setQueryData(customerKeys.detail(id), updatedCustomer);
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => customerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}
