import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taxTypeApi, taxEFakturApi, taxWithholdingApi, taxProfileApi, taxReportApi } from "./taxApi";
import { normalizeBlobError } from "@shared/lib/downloadFile";
import type { TaxTypeFormValues, TaxTypeListParams } from "../types/taxType";
import type { TaxEFakturFormValues, TaxEFakturListParams } from "../types/taxEFaktur";
import type { TaxWithholdingFormValues, TaxWithholdingListParams } from "../types/taxWithholding";
import type {
  TaxCustomerProfileFormValues, TaxCustomerProfileListParams,
  TaxVendorProfileFormValues, TaxVendorProfileListParams,
} from "../types/taxProfile";
import { useActiveOrgId } from "@shared/lib/organization-context";

// ---------- Tax Type ----------
export function useTaxTypeList(params: TaxTypeListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: ["tax-types", activeOrgId, params],
    queryFn: () => taxTypeApi.list(params).then((res) => res.data.data),
  });
}

export function useCreateTaxType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: TaxTypeFormValues) => taxTypeApi.create(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tax-types"] }),
  });
}

// ---------- E-Faktur ----------
export function useTaxEFakturList(params: TaxEFakturListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: ["tax-efaktur", activeOrgId, "list", params],
    queryFn: () => taxEFakturApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateTaxEFaktur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: TaxEFakturFormValues) => taxEFakturApi.create(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tax-efaktur"] }),
  });
}

export function useCancelTaxEFaktur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => taxEFakturApi.cancel(id).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tax-efaktur"] }),
  });
}

// ---------- Withholding Certificate (Bukti Potong) ----------
export function useTaxWithholdingList(params: TaxWithholdingListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: ["tax-withholding", activeOrgId, "list", params],
    queryFn: () => taxWithholdingApi.list(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateTaxWithholding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: TaxWithholdingFormValues) => taxWithholdingApi.create(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tax-withholding"] }),
  });
}

export function useRemitTaxWithholding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remittedDate, withdrawalAccountCode }: { id: number; remittedDate: string; withdrawalAccountCode: string }) =>
      taxWithholdingApi.remit(id, remittedDate, withdrawalAccountCode).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tax-withholding"] }),
  });
}

// ---------- Tax Profile (registrasi PKP customer & vendor) ----------
export function useTaxCustomerProfileList(params: TaxCustomerProfileListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: ["tax-customer-profile", activeOrgId, "list", params],
    queryFn: () => taxProfileApi.customerList(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useSaveTaxCustomerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: TaxCustomerProfileFormValues) => taxProfileApi.saveCustomer(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tax-customer-profile"] }),
  });
}

export function useTaxVendorProfileList(params: TaxVendorProfileListParams) {
  const activeOrgId = useActiveOrgId();
  return useQuery({
    queryKey: ["tax-vendor-profile", activeOrgId, "list", params],
    queryFn: () => taxProfileApi.vendorList(params).then((res) => res.data),
    placeholderData: (previousData) => previousData,
  });
}

export function useSaveTaxVendorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: TaxVendorProfileFormValues) => taxProfileApi.saveVendor(values).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tax-vendor-profile"] }),
  });
}

// ---------- Report ----------
export function usePpnSummary(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ["ppn-summary", dateFrom, dateTo],
    queryFn: () => taxReportApi.ppnSummary(dateFrom!, dateTo!).then((res) => res.data.data),
    enabled: !!dateFrom && !!dateTo,
  });
}

export function usePphSummary(periodMonth: number, periodYear: number) {
  return useQuery({
    queryKey: ["pph-summary", periodMonth, periodYear],
    queryFn: () => taxReportApi.pphSummary(periodMonth, periodYear).then((res) => res.data.data),
  });
}

export function useDownloadTaxReportPdf() {
  return useMutation({
    mutationFn: async (params: {
      organizationId: number;
      date_from?: string;
      date_to?: string;
      period_month?: number;
      period_year?: number;
    }) => {
      try {
        const res = await taxReportApi.printPdf(params);
        return res.data;
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}

// ---------- Legacy PDF (Tax Types list page) ----------
export function useDownloadTaxTypesPdf() {
  return useMutation({
    mutationFn: async (organizationId: number) => {
      try {
        const res = await taxTypeApi.printPdf(organizationId);
        return res.data; // Blob - pratinjau dulu, bukan langsung unduh
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}
