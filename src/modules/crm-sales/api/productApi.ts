import { apiClient } from "@shared/lib/api-client";
import type { ProductCategory, Product, PromoPackage, PromoPackageItem, CustomerProductPrice } from "../types/product";

// ── Product Categories ──
export const productCategoryApi = {
  list: (params?: { search?: string; is_active?: boolean }) =>
    apiClient.get<{ success: boolean; data: ProductCategory[] }>("/v1/crm-sales/product-categories", { params }),
  show: (id: number) =>
    apiClient.get<{ success: boolean; data: ProductCategory }>(`/v1/crm-sales/product-categories/${id}`),
  create: (data: Partial<ProductCategory>) =>
    apiClient.post<{ success: boolean; data: ProductCategory }>("/v1/crm-sales/product-categories", data),
  update: (id: number, data: Partial<ProductCategory>) =>
    apiClient.put<{ success: boolean; data: ProductCategory }>(`/v1/crm-sales/product-categories/${id}`, data),
  delete: (id: number) =>
    apiClient.delete<{ success: boolean }>(`/v1/crm-sales/product-categories/${id}`),
};

// ── Products ──
export const productApi = {
  list: (params?: { search?: string; category_id?: number; is_active?: boolean; page?: number; per_page?: number }) =>
    apiClient.get<{ success: boolean; data: Product[] }>("/v1/crm-sales/products", { params }),
  show: (id: number) =>
    apiClient.get<{ success: boolean; data: Product }>(`/v1/crm-sales/products/${id}`),
  create: (data: Partial<Product>) =>
    apiClient.post<{ success: boolean; data: Product }>("/v1/crm-sales/products", data),
  update: (id: number, data: Partial<Product>) =>
    apiClient.put<{ success: boolean; data: Product }>(`/v1/crm-sales/products/${id}`, data),
  delete: (id: number) =>
    apiClient.delete<{ success: boolean }>(`/v1/crm-sales/products/${id}`),
};

// ── Promo Packages ──
export const promoPackageApi = {
  list: (params?: {
    search?: string; status?: string; date_from?: string; date_to?: string;
    page?: number; per_page?: number;
  }) =>
    apiClient.get<{ success: boolean; data: unknown[]; current_page?: number; last_page?: number; total?: number }>(
      "/v1/crm-sales/promo-packages", { params }
    ),
  active: () =>
    apiClient.get<{ success: boolean; data: PromoPackage[] }>("/v1/crm-sales/promo-packages/active"),
  show: (id: number) =>
    apiClient.get<{ success: boolean; data: PromoPackage }>(`/v1/crm-sales/promo-packages/${id}`),
  create: (data: {
    name: string; description?: string; image_file_ids?: number[];
    status?: string;
    normal_price?: number; promo_price?: number; discount_pct?: number;
    start_date?: string; end_date?: string;
    requires_approval?: boolean; approval_type?: string; approval_threshold_pct?: number;
    items: PromoPackageItem[];
  }) =>
    apiClient.post<{ success: boolean; data: PromoPackage; message: string }>("/v1/crm-sales/promo-packages", data),
  update: (id: number, data: {
    name?: string; description?: string; image_file_ids?: number[];
    status?: string;
    normal_price?: number; promo_price?: number; discount_pct?: number;
    start_date?: string; end_date?: string;
    requires_approval?: boolean; approval_type?: string; approval_threshold_pct?: number;
    items?: PromoPackageItem[];
  }) =>
    apiClient.put<{ success: boolean; data: PromoPackage; message: string }>(`/v1/crm-sales/promo-packages/${id}`, data),
  activate: (id: number) =>
    apiClient.post<{ success: boolean; data: PromoPackage }>(`/v1/crm-sales/promo-packages/${id}/activate`),
  delete: (id: number) =>
    apiClient.delete<{ success: boolean }>(`/v1/crm-sales/promo-packages/${id}`),
};

// ── Customer Product Prices ──
export const customerPriceApi = {
  list: (customerId: number) =>
    apiClient.get<{ success: boolean; data: CustomerProductPrice[] }>(
      `/v1/crm-sales/customers/${customerId}/product-prices`
    ),
  set: (customerId: number, data: Partial<CustomerProductPrice>) =>
    apiClient.post<{ success: boolean; data: CustomerProductPrice }>(
      `/v1/crm-sales/customers/${customerId}/product-prices`, data
    ),
  remove: (customerId: number, id: number) =>
    apiClient.delete<{ success: boolean }>(
      `/v1/crm-sales/customers/${customerId}/product-prices/${id}`
    ),
};
