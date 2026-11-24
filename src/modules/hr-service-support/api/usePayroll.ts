import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { payrollApi } from "./payrollApi";
import type { PayrollListParams, EmployeeSalaryListParams, PayrollRecord } from "../types/payroll";
import type { Employee } from "../types/employee";

const prKeys = {
  all: ["hrPayroll"] as const,
  list: (p: Record<string, unknown>) => [...prKeys.all, "list", p] as const,
  salaries: (p: Record<string, unknown>) => [...prKeys.all, "salaries", p] as const,
  salary: (employeeId: number) => [...prKeys.all, "salary", employeeId] as const,
};

export function usePayrollList(params: PayrollListParams) {
  return useQuery({
    queryKey: prKeys.list(params),
    queryFn: () => payrollApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function usePayrollRecord(id: number | undefined) {
  return useQuery({
    queryKey: [...prKeys.all, "detail", id ?? 0] as const,
    queryFn: () => payrollApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, values }: { employeeId: number; values: Parameters<typeof payrollApi.create>[1] }) =>
      payrollApi.create(employeeId, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: prKeys.all }),
  });
}

export function useUpdatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Parameters<typeof payrollApi.update>[1] }) =>
      payrollApi.update(id, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: prKeys.all }),
  });
}

export function useCalculatePayrollDeductions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ record, employee }: { record: PayrollRecord; employee?: Partial<Employee> | null }) =>
      payrollApi.calculateDeductions(record, employee),
    onSuccess: () => qc.invalidateQueries({ queryKey: prKeys.all }),
  });
}

export function useSubmitPayrollToFinance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ record, employee }: { record: PayrollRecord; employee?: Partial<Employee> | null }) =>
      payrollApi.submitToFinance(record, employee),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: prKeys.all });
      qc.invalidateQueries({ queryKey: ["hrIntegration"] });
    },
  });
}

export function useGeneratePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      payrollApi.generate(month, year).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: prKeys.all }),
  });
}

export function useDeletePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => payrollApi.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: prKeys.all }),
  });
}

export function useSalaryList(params: EmployeeSalaryListParams) {
  return useQuery({
    queryKey: prKeys.salaries(params),
    queryFn: () => payrollApi.listSalaries(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useEmployeeSalary(employeeId: number | undefined) {
  return useQuery({
    queryKey: prKeys.salary(employeeId ?? 0),
    queryFn: () => payrollApi.getSalary(employeeId!).then((r) => r.data.data),
    enabled: !!employeeId,
  });
}

export function useSetEmployeeSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, baseSalary }: { employeeId: number; baseSalary: number }) =>
      payrollApi.setSalary(employeeId, baseSalary).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: prKeys.all }),
  });
}

export function useUploadTaxCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { employeeId: number; year: number; file: File; records?: PayrollRecord[] }) =>
      payrollApi.uploadTaxCertificate(params),
    onSuccess: () => qc.invalidateQueries({ queryKey: prKeys.all }),
  });
}

export function useRemoveTaxCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { employeeId: number; year: number; records?: PayrollRecord[] }) =>
      payrollApi.removeTaxCertificate(params),
    onSuccess: () => qc.invalidateQueries({ queryKey: prKeys.all }),
  });
}
