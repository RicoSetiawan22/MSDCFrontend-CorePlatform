import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/api-client";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import { useActiveOrgId } from "@shared/lib/organization-context";

export interface VendorLedgerEntry {
  date: string;
  reference: string;
  description: string;
  bill_amount: number | null;
  payment_amount: number | null;
  credit_note_amount: number | null;
  balance: number;
}

export interface VendorLedgerResponse {
  vendor_id: number;
  vendor_name: string;
  credit_limit: number;
  total_outstanding: number;
  oldest_invoice_age_days: number | null;
  entries: VendorLedgerEntry[];
}

export interface VendorLedgerParams {
  vendor_id: number;
  date_from?: string;
  date_to?: string;
}

export function useVendorLedger(vendorId: number | undefined, dateFrom?: string, dateTo?: string) {
  const activeOrgId = useActiveOrgId();
  return useQuery<VendorLedgerResponse, Error>({
    queryKey: ["vendor-ledger", activeOrgId, vendorId, dateFrom, dateTo],
    queryFn: async () => {
      // Backend returns {data: {...}}; axios wraps in res.data; unwrap once.
      const res = await apiClient.get<{ data: VendorLedgerResponse }>(
        `/v1/finance-accounting/ap/vendors/${vendorId}/ledger`,
        { params: { date_from: dateFrom, date_to: dateTo } }
      );
      return res.data.data as VendorLedgerResponse;
    },
    enabled: !!vendorId && vendorId > 0,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });
}

export function useDownloadVendorLedgerPdf() {
  return useMutation({
    mutationFn: async (params: { vendorId: number; organizationId: number; date_from?: string; date_to?: string }) => {
      try {
        const res = await apiClient.get<Blob>(
          `/v1/finance-accounting/ap/vendors/${params.vendorId}/print-pdf`,
          { params: { organization_id: params.organizationId, date_from: params.date_from, date_to: params.date_to }, responseType: "blob" }
        );
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
        throw err;
      }
    },
  });
}
