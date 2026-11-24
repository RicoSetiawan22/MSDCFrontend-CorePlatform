import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesOrderApi } from "./salesOrderApi";
import type { ResourceRequirementInput, SalesOrderListParams, SalesOrderStatus } from "../types/salesOrder";

const soKeys = {
  all: ["salesOrders"] as const,
  lists: () => [...soKeys.all, "list"] as const,
  list: (params: SalesOrderListParams) => [...soKeys.all, "list", params] as const,
};

export function useSalesOrderList(params: SalesOrderListParams) {
  return useQuery({
    queryKey: soKeys.list(params),
    queryFn: () => salesOrderApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useSalesOrder(id: number | undefined) {
  return useQuery({
    queryKey: [...soKeys.all, "detail", id ?? 0] as const,
    queryFn: () => salesOrderApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateSalesOrderFromQuotation() {
  const qc = useQueryClient();
  return useMutation({
    // Quotation WAJIB sudah punya customer_id sebelum dipanggil (lihat
    // AssignCustomerModal.tsx buat alur convert Lead/buat Customer baru
    // kalau belum ada - jangan coba "auto-convert" di sini, quotation
    // tidak dikirim balik oleh endpoint ini jadi tidak ada lead_id yang
    // bisa dibaca di titik ini).
    mutationFn: (quotationId: number) => salesOrderApi.storeFromQuotation(quotationId).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: soKeys.lists() });
    },
  });
}

export function useUpdateSalesOrderStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: SalesOrderStatus) =>
      salesOrderApi.updateStatus(id, status).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: soKeys.lists() }),
  });
}

export function useConfirmSalesOrderWithFile(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: number) => salesOrderApi.confirmWithFile(id, fileId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: soKeys.lists() });
      qc.invalidateQueries({ queryKey: [...soKeys.all, "detail", id] });
    },
  });
}

function invalidateDetail(qc: ReturnType<typeof useQueryClient>, id: number) {
  qc.invalidateQueries({ queryKey: soKeys.lists() });
  qc.invalidateQueries({ queryKey: [...soKeys.all, "detail", id] });
}

export function useUpdateResourceRequirements(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, lines }: { siteId: number; lines: ResourceRequirementInput[] }) =>
      salesOrderApi.updateResourceRequirements(id, siteId, lines).then((r) => r.data.data),
    onSuccess: () => invalidateDetail(qc, id),
  });
}

export function useCheckResourceAvailability(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => salesOrderApi.checkResourceAvailability(id).then((r) => r.data.data),
    onSuccess: () => invalidateDetail(qc, id),
  });
}

export function useReserveResources(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => salesOrderApi.reserveResources(id).then((r) => r.data.data),
    onSuccess: () => invalidateDetail(qc, id),
  });
}
