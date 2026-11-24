import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { slaApi } from "./slaApi";
import type { SlaBreachFormValues, SlaBreachStatus, SlaFormValues, SlaTemplateFormValues } from "../types/sla";

const slaKeys = {
  byContract: (contractId: number) => ["contractSlas", contractId] as const,
  templates: () => ["slaTemplates"] as const,
};

export function useContractSlas(contractId: number | undefined) {
  return useQuery({
    queryKey: slaKeys.byContract(contractId ?? 0),
    queryFn: () => slaApi.listByContract(contractId!).then((r) => r.data.data),
    enabled: !!contractId,
  });
}

export function useCreateSla(contractId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SlaFormValues) => slaApi.create(contractId, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: slaKeys.byContract(contractId) }),
  });
}

export function useReportSlaBreach(contractId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slaId, values }: { slaId: number; values: SlaBreachFormValues }) =>
      slaApi.reportBreach(slaId, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: slaKeys.byContract(contractId) }),
  });
}

export function useUpdateSlaBreachStatus(contractId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ breachId, status }: { breachId: number; status: SlaBreachStatus }) =>
      slaApi.updateBreachStatus(breachId, status).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: slaKeys.byContract(contractId) }),
  });
}

export function useSlaTemplates() {
  return useQuery({
    queryKey: slaKeys.templates(),
    queryFn: () => slaApi.listTemplates().then((r) => r.data.data),
  });
}

export function useCreateSlaTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SlaTemplateFormValues) => slaApi.createTemplate(values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: slaKeys.templates() }),
  });
}

export function useDeleteSlaTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: number) => slaApi.deleteTemplate(templateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: slaKeys.templates() }),
  });
}
