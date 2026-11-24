import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roleApi } from "./roleApi";

const roleKeys = {
  all: ["coreRoles"] as const,
  list: () => [...roleKeys.all, "list"] as const,
};

export function useRoleList() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () => roleApi.list().then((r) => r.data),
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["corePermissions"] as const,
    queryFn: () => roleApi.permissions().then((r) => r.data.data),
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roleApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: number; permissions: string[] }) => roleApi.updatePermissions(id, permissions),
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useUpdateRoleSidebarSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sections }: { id: number; sections: string[] | null }) => roleApi.updateSidebarSections(id, sections),
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roleApi.destroy,
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useAssignUserRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleNames }: { userId: number; roleNames: string[] }) =>
      roleApi.assignToUser(userId, roleNames),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coreUsers"] }),
  });
}
