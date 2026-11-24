import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/api-client";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import { useActiveOrgId } from "@shared/lib/organization-context";

const BASE_EXEC = "/v1/finance-accounting/executive-summary";
const BASE_DASH = "/v1/finance-accounting";

/**
 * Executive Summary — new enriched endpoint with AR aging, income statement,
 * balance sheet, and all sections in one response.
 */
export function useExecutiveSummary() {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: ["executive-summary", activeOrgId],
    queryFn: () =>
      apiClient
        .get(`${BASE_EXEC}?organization_id=${activeOrgId}`)
        .then((r) => r.data.data),
    staleTime: 30_000,
  });
}

/**
 * Download Executive Summary as PDF (branded letterhead).
 */
export function useDownloadExecutiveSummaryPdf() {
  return useMutation({
    mutationFn: async (organizationId: number) => {
      try {
        const res = await apiClient.get(
          `${BASE_EXEC}/print-pdf?organization_id=${organizationId}`,
          { responseType: "blob" }
        );
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}

/**
 * Legacy finance dashboard — used by CbHubPage and FinanceDashboardPage.
 * Points to the original /dashboard endpoint.
 */
export function useFinanceDashboard() {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: ["finance-dashboard", activeOrgId],
    queryFn: () =>
      apiClient
        .get(`${BASE_DASH}/dashboard`)
        .then((r) => r.data.data),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
