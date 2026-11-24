import { apiClient } from "@shared/lib/api-client";
import type { ApiMessageResponse } from "@shared/types/api";
import type { Sla, SlaBreach, SlaBreachFormValues, SlaBreachStatus, SlaFormValues, SlaTemplate, SlaTemplateFormValues } from "../types/sla";

const BASE_PATH = "/v1/crm-sales";

export const slaApi = {
  // Endpoint ini TIDAK dipaginasi (Contract::slas()->with('breaches')->get())
  // - balikannya {data: Sla[]} polos, bukan PaginatedResponse.
  listByContract(contractId: number) {
    return apiClient.get<{ data: Sla[] }>(`${BASE_PATH}/contracts/${contractId}/slas`);
  },
  create(contractId: number, values: SlaFormValues) {
    return apiClient.post<ApiMessageResponse<Sla>>(`${BASE_PATH}/contracts/${contractId}/slas`, values);
  },
  reportBreach(slaId: number, payload: SlaBreachFormValues) {
    return apiClient.post<ApiMessageResponse<SlaBreach>>(`${BASE_PATH}/slas/${slaId}/breaches`, payload);
  },
  updateBreachStatus(breachId: number, status: SlaBreachStatus) {
    return apiClient.post<ApiMessageResponse<SlaBreach>>(`${BASE_PATH}/sla-breaches/${breachId}/status`, { status });
  },
  // Template SLA - global (bukan per-contract), dipakai untuk prefill form
  // "SLA Baru" (lihat CreateSlaModal di ContractSlaPage.tsx).
  listTemplates() {
    return apiClient.get<{ data: SlaTemplate[] }>(`${BASE_PATH}/sla-templates`);
  },
  createTemplate(values: SlaTemplateFormValues) {
    return apiClient.post<ApiMessageResponse<SlaTemplate>>(`${BASE_PATH}/sla-templates`, values);
  },
  deleteTemplate(templateId: number) {
    return apiClient.delete<ApiMessageResponse<null>>(`${BASE_PATH}/sla-templates/${templateId}`);
  },
};
