import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { integrationApi } from "./integrationApi";
import type { IntegrationPayrollListParams, IntegrationCertificationListParams } from "../types/integration";

export function useHrIntegrationList(params: IntegrationPayrollListParams) {
  return useQuery({
    queryKey: ["hrIntegration", "list", params] as const,
    queryFn: () => integrationApi.hrList(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function usePostHrIntegrationBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payrollRecordIds: number[]) => integrationApi.hrPostBatch(payrollRecordIds).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hrIntegration"] });
      qc.invalidateQueries({ queryKey: ["hrPayroll"] });
      qc.invalidateQueries({ queryKey: ["glJournal"] });
    },
  });
}

export function useHrCertificationIntegrationList(params: IntegrationCertificationListParams) {
  return useQuery({
    queryKey: ["hrIntegration", "certifications", params] as const,
    queryFn: () => integrationApi.hrCertificationsList(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function usePostHrCertificationBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeCertificationIds: number[]) =>
      integrationApi.hrPostCertificationsBatch(employeeCertificationIds).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hrIntegration"] });
      qc.invalidateQueries({ queryKey: ["hrEmployeeCertifications"] });
    },
  });
}
