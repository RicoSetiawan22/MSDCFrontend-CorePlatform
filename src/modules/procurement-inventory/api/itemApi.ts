import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type {
  Item, ItemListParams, Warehouse, StockBalance, StockMovement, StockMovementListParams,
} from "../types/item";
import type { CreateWarehouseInput, UpdateWarehouseInput } from "../types/warehouse";

const BASE = "/v1/procurement-inventory";

export const itemApi = {
  list(params: ItemListParams) {
    return apiClient.get<PaginatedResponse<Item>>(`${BASE}/items`, { params });
  },
  create(values: Partial<Item>) {
    return apiClient.post<ApiMessageResponse<Item>>(`${BASE}/items`, values);
  },
  update(id: number, values: Partial<Item>) {
    return apiClient.put<ApiMessageResponse<Item>>(`${BASE}/items/${id}`, values);
  },
};

export const warehouseApi = {
  list() {
    return apiClient.get<{ data: Warehouse[] }>(`${BASE}/warehouses`);
  },
  // warehouse_code TIDAK ADA di sini - auto-generated dari Number Sequence
  // terpusat (Master Data > Number Sequence, module_code='warehouse').
  create(values: CreateWarehouseInput | Partial<Warehouse>) {
    return apiClient.post<ApiMessageResponse<Warehouse>>(`${BASE}/warehouses`, values);
  },
  update(id: number, values: UpdateWarehouseInput | Partial<Warehouse>) {
    return apiClient.put<ApiMessageResponse<Warehouse>>(`${BASE}/warehouses/${id}`, values);
  },
};

export const stockApi = {
  movements(params: StockMovementListParams) {
    return apiClient.get<PaginatedResponse<StockMovement>>(`${BASE}/stock-movements`, { params });
  },
  allBalances() {
    return apiClient.get<{ data: StockBalance[] }>(`${BASE}/stock-movements/balances`);
  },
  issue(values: { item_id: number; warehouse_id: number; quantity: number; reference_type?: string; reference_number?: string; notes?: string }) {
    return apiClient.post<ApiMessageResponse<StockMovement>>(`${BASE}/stock-movements/issue`, values);
  },
  transfer(values: { item_id: number; from_warehouse_id: number; to_warehouse_id: number; quantity: number; notes?: string }) {
    return apiClient.post<ApiMessageResponse<{ out: StockMovement; in: StockMovement }>>(`${BASE}/stock-movements/transfer`, values);
  },
  adjust(values: { item_id: number; warehouse_id: number; direction: "in" | "out"; quantity: number; reason: string }) {
    return apiClient.post<ApiMessageResponse<StockMovement>>(`${BASE}/stock-movements/adjust`, values);
  },
};
