import { apiClient } from "@shared/lib/api-client";

export interface DocTemplate {
  id: number;
  code: string;
  name: string;
  module: string | null;
  format: "text" | "html";
  content: string;
  is_active: boolean;
}

export interface DocTemplateFormValues {
  code: string;
  name: string;
  module?: string;
  format?: "text" | "html";
  content: string;
  is_active?: boolean;
}

const BASE = "/v1/core-platform/templates";

export const templateApi = {
  list(params?: { module?: string }) {
    return apiClient.get<{ data: DocTemplate[] }>(BASE, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: DocTemplate }>(`${BASE}/${id}`);
  },
  /** Upsert by code (lihat TemplateController::store()/TemplateService::setTemplate()). */
  save(values: DocTemplateFormValues) {
    return apiClient.post<{ data: DocTemplate; message: string }>(BASE, values);
  },
};
