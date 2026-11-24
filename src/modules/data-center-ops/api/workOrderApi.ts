import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { WorkOrder, WorkOrderItem, WorkOrderListParams, PendingSalesOrder } from "../types/workOrder";

const BASE = "/v1/data-center-ops";

export const workOrderApi = {
  list(params: WorkOrderListParams) {
    return apiClient.get<PaginatedResponse<PendingSalesOrder>>(`${BASE}/work-orders`, { params });
  },
  show(salesOrderId: number) {
    return apiClient.get<{ data: WorkOrder }>(`${BASE}/work-orders/${salesOrderId}`);
  },
  toggleItem(itemId: number, values: { is_completed: boolean; notes?: string }) {
    return apiClient.post<ApiMessageResponse<WorkOrderItem> & { contract: WorkOrder["contract"] }>(
      `${BASE}/work-order-items/${itemId}/toggle`, values
    );
  },
};
