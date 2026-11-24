import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { KbArticle, KbCategory } from "../types/kb";

const BASE = "/v1/hr-service-support";

export const kbApi = {
  list(params?: { status?: string; category_id?: number; search?: string; page?: number; per_page?: number }) {
    return apiClient.get<PaginatedResponse<KbArticle>>(`${BASE}/kb-articles`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: KbArticle }>(`${BASE}/kb-articles/${id}`);
  },
  search(q: string, related_device_type?: string) {
    return apiClient.get<{ data: KbArticle[] }>(`${BASE}/kb-articles/search`, { params: { q, related_device_type } });
  },
  categories() {
    return apiClient.get<{ data: KbCategory[] }>(`${BASE}/kb-categories`);
  },
  createCategory(values: { category_name: string; parent_id?: number }) {
    return apiClient.post<ApiMessageResponse<KbCategory>>(`${BASE}/kb-categories`, values);
  },
  createArticle(values: {
    category_id?: number; title: string; content: string;
    tags?: string[]; related_device_type?: string;
  }) {
    return apiClient.post<ApiMessageResponse<KbArticle>>(`${BASE}/kb-articles`, values);
  },
  updateArticle(id: number, values: {
    category_id?: number; title?: string; content?: string;
    tags?: string[]; related_device_type?: string;
  }) {
    return apiClient.put<ApiMessageResponse<KbArticle>>(`${BASE}/kb-articles/${id}`, values);
  },
  publish(id: number) {
    return apiClient.post<ApiMessageResponse<KbArticle>>(`${BASE}/kb-articles/${id}/publish`);
  },
  archive(id: number) {
    return apiClient.post<ApiMessageResponse<KbArticle>>(`${BASE}/kb-articles/${id}/archive`);
  },
};
