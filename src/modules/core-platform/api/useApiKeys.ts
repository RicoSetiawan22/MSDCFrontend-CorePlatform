import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeyApi } from "./apiKeyApi";
import type { ApiKeyListParams, ApiKeyCreateValues } from "../types/apiKey";

const apiKeyKeys = {
  all: ["apiKeys"] as const,
  list: (params: ApiKeyListParams) => [...apiKeyKeys.all, "list", params] as const,
};

export function useApiKeyList(params: ApiKeyListParams) {
  return useQuery({
    queryKey: apiKeyKeys.list(params),
    queryFn: () => apiKeyApi.list(params).then(r => r.data),
    placeholderData: prev => prev,
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ApiKeyCreateValues) => apiKeyApi.create(values).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeyKeys.all }),
  });
}

export function useUpdateApiKeyAllowedIps(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (allowedIps: string[]) => apiKeyApi.updateAllowedIps(id, allowedIps).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeyKeys.all }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiKeyApi.revoke(id).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeyKeys.all }),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiKeyApi.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiKeyKeys.all }),
  });
}
