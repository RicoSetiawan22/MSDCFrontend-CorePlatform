import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contractApi } from "./contractApi";
import { renewalApi } from "./renewalApi";
import { buildRenewalData } from "./renewalUtils";
import type { Contract } from "../types/contract";
import type { ContractCloseValues, ContractRenewValues } from "../types/renewal";

// Prefix "contracts" SAMA dengan useContracts.ts -> invalidate otomatis
// menyegarkan list/detail Contract juga.
const RENEWAL_KEY = ["contracts", "renewals"] as const;

async function fetchAllContracts(): Promise<Contract[]> {
  const all: Contract[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const res = await contractApi.list({ page, per_page: 100 }).then((r) => r.data);
    all.push(...res.data);
    lastPage = res.last_page;
    page += 1;
  } while (page <= lastPage && page <= 20);
  return all;
}

export function useRenewalData() {
  const q = useQuery({ queryKey: RENEWAL_KEY, queryFn: fetchAllContracts, staleTime: 30_000 });
  const data = useMemo(() => (q.data ? buildRenewalData(q.data) : undefined), [q.data]);
  return { data, isLoading: q.isLoading, isError: q.isError, error: q.error };
}

export function useRenewContract(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ContractRenewValues) => renewalApi.renew(id, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useCloseContract(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ContractCloseValues) => renewalApi.close(id, values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}
