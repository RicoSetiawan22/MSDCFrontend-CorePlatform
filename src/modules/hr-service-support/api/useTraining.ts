import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trainingApi } from "./trainingApi";

const trKeys = {
  all: ["hrTraining"] as const,
  trainings: () => [...trKeys.all, "trainings"] as const,
  training: (id: number) => [...trKeys.all, "training", id] as const,
  certifications: () => [...trKeys.all, "certifications"] as const,
  certification: (id: number) => [...trKeys.all, "certification", id] as const,
  expiringSoon: () => [...trKeys.all, "expiringSoon"] as const,
};

export function useTrainings() {
  return useQuery({
    queryKey: trKeys.trainings(),
    queryFn: () => trainingApi.listTrainings().then((r) => r.data.data),
  });
}

export function useTraining(id: number | undefined) {
  return useQuery({
    queryKey: trKeys.training(id ?? 0),
    queryFn: () => trainingApi.showTraining(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trainingApi.createTraining,
    onSuccess: () => qc.invalidateQueries({ queryKey: trKeys.trainings() }),
  });
}

export function useUpdateTraining(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Parameters<typeof trainingApi.updateTraining>[1]) =>
      trainingApi.updateTraining(id, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: trKeys.all }),
  });
}

export function useDeleteTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => trainingApi.deleteTraining(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: trKeys.all }),
  });
}

export function useEnrollTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, trainingId }: { employeeId: number; trainingId: number }) =>
      trainingApi.enrollEmployee(employeeId, trainingId).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: trKeys.all }),
  });
}

export function useCompleteTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: { score: number; certificate_file_id?: number } }) =>
      trainingApi.completeTraining(id, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: trKeys.all }),
  });
}

export function useCertifications() {
  return useQuery({
    queryKey: trKeys.certifications(),
    queryFn: () => trainingApi.listCertifications().then((r) => r.data.data),
  });
}

export function useCertification(id: number | undefined) {
  return useQuery({
    queryKey: trKeys.certification(id ?? 0),
    queryFn: () => trainingApi.showCertification(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trainingApi.createCertification,
    onSuccess: () => qc.invalidateQueries({ queryKey: trKeys.certifications() }),
  });
}

export function useUpdateCertification(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Parameters<typeof trainingApi.updateCertification>[1]) =>
      trainingApi.updateCertification(id, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: trKeys.all }),
  });
}

export function useDeleteCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => trainingApi.deleteCertification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: trKeys.all }),
  });
}

export function useIssueCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, certId, values }: {
      employeeId: number; certId: number;
      values: Parameters<typeof trainingApi.issueCertification>[2];
    }) => trainingApi.issueCertification(employeeId, certId, values).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trKeys.all });
      qc.invalidateQueries({ queryKey: ["hrIntegration"] });
    },
  });
}

export function useSubmitCertificationToFinance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, costAmount }: { id: number; costAmount?: number }) =>
      trainingApi.submitCertificationToFinance(id, costAmount).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trKeys.all });
      qc.invalidateQueries({ queryKey: ["hrIntegration"] });
    },
  });
}

export function usePostCertificationToFinance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => trainingApi.postCertificationToFinance(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trKeys.all });
      qc.invalidateQueries({ queryKey: ["hrIntegration"] });
    },
  });
}

export function useRevokeCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trainingApi.revokeCertification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trKeys.all });
      qc.invalidateQueries({ queryKey: ["hrIntegration"] });
    },
  });
}

export function useExpiringSoonCertifications() {
  return useQuery({
    queryKey: trKeys.expiringSoon(),
    queryFn: () => trainingApi.expiringSoonCertifications().then((r) => r.data.data),
  });
}
