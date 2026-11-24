/**
 * Lookup hooks — lightweight, debounced, used across all form pickers.
 * Uses React Query for caching per query string.
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/api-client";

export interface LookupAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
}

/** Search COA accounts — debounce is handled by the caller (SearchableSelect). */
export function useAccountLookup(params: { q?: string; type?: string; is_active?: boolean; limit?: number } = {}) {
  return useQuery({
    queryKey: ["lookup", "accounts", params],
    queryFn: () =>
      apiClient
        .get<{ data: LookupAccount[]; total: number }>("/v1/finance-accounting/lookup/accounts", { params })
        .then((res) => res.data),
    staleTime: 30_000,
  });
}

export interface LookupCostCenter {
  id: number;
  code: string;
  name: string;
  type?: string;
  parent_id: number | null;
  parent_code?: string | null;
  parent_name?: string | null;
}

/** Search Cost Centers — includes parent hierarchy for display. */
export function useCostCenterLookup(params: { q?: string; is_active?: boolean; limit?: number } = {}) {
  return useQuery({
    queryKey: ["lookup", "cost-centers", params],
    queryFn: () =>
      apiClient
        .get<{ data: LookupCostCenter[]; total: number }>("/v1/finance-accounting/lookup/cost-centers", { params })
        .then((res) => res.data),
    staleTime: 30_000,
  });
}

export interface LookupProfitCenter {
  id: number;
  code: string;
  name: string;
  parent_id: number | null;
  parent_code?: string | null;
  parent_name?: string | null;
}

/** Search Profit Centers — includes parent hierarchy for display. */
export function useProfitCenterLookup(params: { q?: string; is_active?: boolean; limit?: number } = {}) {
  return useQuery({
    queryKey: ["lookup", "profit-centers", params],
    queryFn: () =>
      apiClient
        .get<{ data: LookupProfitCenter[]; total: number }>("/v1/finance-accounting/lookup/profit-centers", { params })
        .then((res) => res.data),
    staleTime: 30_000,
  });
}

export interface LookupDepartment {
  id: number;
  name: string;
  code: string;
  parent_id: number | null;
  parent_name?: string | null;
}

/** Search Departments from CorePlatform — used for Budget form. */
export function useDepartmentLookup(params: { q?: string; is_active?: boolean; limit?: number } = {}) {
  return useQuery({
    queryKey: ["lookup", "departments", params],
    queryFn: () =>
      apiClient
        .get<{ data: LookupDepartment[]; total: number }>("/v1/core-platform/departments", { params })
        .then((res) => res.data),
    staleTime: 60_000,
  });
}
