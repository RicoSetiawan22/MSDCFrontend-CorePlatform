import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeeApi } from "./employeeApi";
import type { Employee, EmployeeListParams } from "../types/employee";

const empKeys = {
  all: ["hrEmployees"] as const,
  list: (p: EmployeeListParams) => [...empKeys.all, "list", p] as const,
  stats: () => [...empKeys.all, "stats"] as const,
};

export function useEmployeeList(params: EmployeeListParams) {
  return useQuery({
    queryKey: empKeys.list(params),
    queryFn: () => employeeApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useEmployeeStats() {
  return useQuery({
    queryKey: empKeys.stats(),
    queryFn: () => employeeApi.stats().then((r) => r.data.data),
  });
}

export function useEmployee(id: number | undefined) {
  return useQuery({
    queryKey: [...empKeys.all, "detail", id ?? 0] as const,
    queryFn: () => employeeApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeeApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useUpdateEmployee(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<Employee>) =>
      employeeApi.update(id, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useSetEmployeeStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      employeeApi.setStatus(id, status).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useUploadEmployeePhoto(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) =>
      employeeApi.uploadPhoto(id, file).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useUploadEmployeeSignature(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) =>
      employeeApi.uploadSignature(id, file).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useCreateWorkExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, values }: { employeeId: number; values: Parameters<typeof employeeApi.createWorkExperience>[1] }) =>
      employeeApi.createWorkExperience(employeeId, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useUpdateWorkExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Parameters<typeof employeeApi.updateWorkExperience>[1] }) =>
      employeeApi.updateWorkExperience(id, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useDeleteWorkExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeeApi.deleteWorkExperience(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, values }: { employeeId: number; values: Parameters<typeof employeeApi.createSkill>[1] }) =>
      employeeApi.createSkill(employeeId, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Parameters<typeof employeeApi.updateSkill>[1] }) =>
      employeeApi.updateSkill(id, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeeApi.deleteSkill(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useCreateFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, values }: { employeeId: number; values: Parameters<typeof employeeApi.createFamily>[1] }) =>
      employeeApi.createFamily(employeeId, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useUpdateFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Parameters<typeof employeeApi.updateFamily>[1] }) =>
      employeeApi.updateFamily(id, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useDeleteFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeeApi.deleteFamily(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useCreateEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, values }: { employeeId: number; values: Parameters<typeof employeeApi.createEducation>[1] }) =>
      employeeApi.createEducation(employeeId, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useUpdateEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Parameters<typeof employeeApi.updateEducation>[1] }) =>
      employeeApi.updateEducation(id, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

export function useDeleteEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeeApi.deleteEducation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: empKeys.all }),
  });
}

