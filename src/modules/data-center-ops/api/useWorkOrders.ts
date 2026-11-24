import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workOrderApi } from "./workOrderApi";
import type { WorkOrderListParams } from "../types/workOrder";

const workOrderKeys = {
  all: ["dcWorkOrders"] as const,
  list: (params: WorkOrderListParams) => [...workOrderKeys.all, "list", params] as const,
  detail: (salesOrderId: number) => [...workOrderKeys.all, "detail", salesOrderId] as const,
};

export function useWorkOrderList(params: WorkOrderListParams) {
  return useQuery({
    queryKey: workOrderKeys.list(params),
    queryFn: () => workOrderApi.list(params).then(r => r.data),
    placeholderData: prev => prev,
  });
}

export function useWorkOrder(salesOrderId: number | undefined) {
  return useQuery({
    queryKey: workOrderKeys.detail(salesOrderId ?? 0),
    queryFn: () => workOrderApi.show(salesOrderId!).then(r => r.data.data),
    enabled: !!salesOrderId,
  });
}

/** Dipakai modal resource (Device/Cross-Connect/IPAM) di WorkOrderDetailPage
 * setelah berhasil simpan - refetchQueries (bukan cuma invalidateQueries)
 * supaya panel resource yang nested di WorkOrderItem PASTI kebaca ulang
 * segera, tanpa perlu reload manual, walau alurnya sempat 2 mutation
 * berurutan (mis. alokasi port OTB dulu baru buat Cross-Connect). */
export function useRefetchWorkOrder(salesOrderId: number) {
  const qc = useQueryClient();
  return () => qc.refetchQueries({ queryKey: workOrderKeys.detail(salesOrderId) });
}

export function useToggleWorkOrderItem(salesOrderId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, values }: { itemId: number; values: { is_completed: boolean; notes?: string } }) =>
      workOrderApi.toggleItem(itemId, values).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workOrderKeys.detail(salesOrderId) });
      qc.invalidateQueries({ queryKey: workOrderKeys.all });
      // Contract detail page (kalau lagi kebuka di tab lain) ikut refresh
      // tanggal instalasi barunya - "contracts" adalah query key root di
      // crm-sales/api/useContracts.ts.
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}
