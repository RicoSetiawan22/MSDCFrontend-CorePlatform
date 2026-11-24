import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/api-client";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import { useActiveOrgId } from "@shared/lib/organization-context";

export interface CustomerLedgerEntry {
  date: string;
  reference: string;
  description: string;
  invoice_amount: number | null;
  payment_amount: number | null;
  balance: number;
}

export interface CustomerLedgerResponse {
  customer_id: number;
  customer_name: string;
  credit_limit: number;
  total_outstanding: number;
  total_overdue: number;
  utilization_pct: number;
  entries: CustomerLedgerEntry[];
}

export function useCustomerLedger(customerId: number | undefined, dateFrom?: string, dateTo?: string) {
  const activeOrgId = useActiveOrgId();

  return useQuery<CustomerLedgerResponse, Error>({
    queryKey: ["customer-ledger", activeOrgId, customerId, dateFrom, dateTo],
    queryFn: async () => {
      // Backend returns {data: {...}}; axios wraps in res.data; unwrap once.
      const res = await apiClient.get<{ data: CustomerLedgerResponse }>(
        `/v1/finance-accounting/ar/customers/${customerId}/ledger`,
        { params: { date_from: dateFrom, date_to: dateTo } }
      );
      return res.data.data as CustomerLedgerResponse;
    },
    // Always fetch fresh data: invalidate stale cache when customerId changes
    enabled: customerId !== undefined && customerId > 0,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });
}

export function useDownloadCustomerLedgerPdf() {
  return useMutation({
    mutationFn: async (params: { customerId: number; organizationId: number; date_from?: string; date_to?: string }) => {
      try {
        const res = await apiClient.get<Blob>(
          `/v1/finance-accounting/ar/customers/${params.customerId}/print-pdf`,
          { params: { organization_id: params.organizationId, date_from: params.date_from, date_to: params.date_to }, responseType: "blob" }
        );
        return res.data;
      } catch (err) {
        normalizeBlobError(err);
        throw err;
      }
    },
  });
}
