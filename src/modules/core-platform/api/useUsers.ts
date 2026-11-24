import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "./userApi";
import type { UserListParams } from "../types/user";

const userKeys = {
  all: ["coreUsers"] as const,
  list: (p: UserListParams) => [...userKeys.all, "list", p] as const,
};

export function useUserList(params: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userApi.list(params).then((r) => r.data),
    placeholderData: (p) => p,
  });
}

export function useUser(id: number | undefined) {
  return useQuery({
    queryKey: [...userKeys.all, "detail", id ?? 0] as const,
    queryFn: () => userApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => userApi.setActive(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useSyncUserOrganizations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, organizationIds }: { userId: number; organizationIds: number[] }) =>
      userApi.syncOrganizations(userId, organizationIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}
