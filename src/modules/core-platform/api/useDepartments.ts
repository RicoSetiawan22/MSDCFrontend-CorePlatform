import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orgStructureApi } from "./companyApi";
import type { PaginatedResponse } from "@shared/types/api";
import type { Branch, BusinessUnit, Department } from "../types/organization";

export function useBranches() {
  return useQuery<PaginatedResponse<Branch>>({
    queryKey: ["organizations", "branches"] as const,
    queryFn: () => orgStructureApi.branches().then((r) => r.data.data as PaginatedResponse<Branch>),
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: orgStructureApi.createBranch,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organizations", "branches"] }); },
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Record<string, unknown> }) =>
      orgStructureApi.updateBranch(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organizations", "branches"] }); },
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: orgStructureApi.deleteBranch,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organizations", "branches"] }); },
  });
}

export function useBusinessUnits() {
  return useQuery<PaginatedResponse<BusinessUnit>>({
    queryKey: ["organizations", "business-units"] as const,
    queryFn: () => orgStructureApi.businessUnits().then((r) => r.data.data as PaginatedResponse<BusinessUnit>),
  });
}

export function useCreateBusinessUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: orgStructureApi.createBusinessUnit,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organizations", "business-units"] }); },
  });
}

export function useUpdateBusinessUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Record<string, unknown> }) =>
      orgStructureApi.updateBusinessUnit(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organizations", "business-units"] }); },
  });
}

export function useDeleteBusinessUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: orgStructureApi.deleteBusinessUnit,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organizations", "business-units"] }); },
  });
}

export function useDepartments(params?: { per_page?: number }) {
  return useQuery<PaginatedResponse<Department>>({
    queryKey: ["organizations", "departments", params] as const,
    // Backend bungkus paginator LAGI di dalam {success,data:...} - res.data
    // SAJA masih {success,data:paginator}, perlu .data SEKALI LAGI (lihat
    // catatan sama di OrganizationStructurePage.tsx).
    queryFn: () => orgStructureApi.departments(params).then((r) => r.data.data as PaginatedResponse<Department>),
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: orgStructureApi.createDepartment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organizations", "departments"] }); },
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Record<string, unknown> }) =>
      orgStructureApi.updateDepartment(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organizations", "departments"] }); },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: orgStructureApi.deleteDepartment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organizations", "departments"] }); },
  });
}

export function useOrgStructureTree(params?: { organization_id?: number }) {
  return useQuery({
    queryKey: ["organizations", "structure-tree", params] as const,
    queryFn: () => orgStructureApi.tree(params).then((r) => r.data.data),
  });
}

