import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type {
  ResourceCheckResult, ResourceRequirementInput, SalesOrder, SalesOrderDetail, SalesOrderListParams, SalesOrderStatus,
} from "../types/salesOrder";

const BASE_PATH = "/v1/crm-sales";
const DC_BASE_PATH = "/v1/data-center-ops";

export interface ConfirmWithFileResult {
  message: string;
  data: SalesOrderDetail;
  invoice: { id: number; invoice_number: string; total_amount: string } | null;
}

/** Invoice asli dibuat Finance AR dari konfirmasi Sales Order CRM. Tidak membuat invoice kedua. */
export type CrmInvoiceApiRow = {
  id: number; invoice_number: string; customer_name: string; sales_order_number: string;
  invoice_date: string | null; due_date: string | null; total_amount: number;
  paid_amount: number; status: string; is_overdue: boolean;
  finance_handoff_status: string | null;
};
export type InvoiceHandoffResponse = {
  message: string; finance_handoff_status: "pending_finance"; invoice_id: number;
};

export const salesOrderApi = {
  listInvoices(params?: { per_page?: number; page?: number }) {
    return apiClient.get<PaginatedResponse<CrmInvoiceApiRow>>(`${BASE_PATH}/invoices`, { params });
  },
  sendInvoiceToFinance(invoiceId: number) {
    return apiClient.post<InvoiceHandoffResponse>(`${BASE_PATH}/invoices/${invoiceId}/send-to-finance`, {});
  },
  printPdfUrl(id: number, organizationId: number) {
    return `${BASE_PATH}/sales-orders/${id}/print-pdf?organization_id=${organizationId}`;
  },
  list(params: SalesOrderListParams) {
    return apiClient.get<PaginatedResponse<SalesOrder>>(`${BASE_PATH}/sales-orders`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: SalesOrderDetail }>(`${BASE_PATH}/sales-orders/${id}`);
  },
  storeFromQuotation(quotationId: number) {
    return apiClient.post<ApiMessageResponse<SalesOrder>>(`${BASE_PATH}/sales-orders/from-quotation`, { quotation_id: quotationId });
  },
  updateStatus(id: number, status: SalesOrderStatus) {
    return apiClient.post<ApiMessageResponse<SalesOrder>>(`${BASE_PATH}/sales-orders/${id}/status`, { status });
  },
  // file_id didapat dari fileApi.upload() (CorePlatform File Management)
  // dulu - endpoint ini cuma menautkan id-nya + memicu pembuatan AR Invoice
  // otomatis (lihat CreateInvoiceFromSalesOrder listener di backend).
  confirmWithFile(id: number, fileId: number) {
    return apiClient.post<ConfirmWithFileResult>(`${BASE_PATH}/sales-orders/${id}/confirm-with-file`, { file_id: fileId });
  },
  // Simpan site tujuan + kebutuhan resource per baris (rack U/IP/watt/
  // Mbps/cross-connect) - endpoint CrmSales, cuma menyimpan data, TIDAK
  // cek ketersediaan (itu dua endpoint di bawah, endpoint DataCenterOps).
  updateResourceRequirements(id: number, siteId: number, lines: ResourceRequirementInput[]) {
    return apiClient.post<ApiMessageResponse<SalesOrderDetail>>(`${BASE_PATH}/sales-orders/${id}/resource-requirements`, { site_id: siteId, lines });
  },
  // Read-only preview - TIDAK mereservasi apapun.
  checkResourceAvailability(id: number) {
    return apiClient.get<{ data: ResourceCheckResult[] }>(`${DC_BASE_PATH}/sales-orders/${id}/resource-check`);
  },
  // Reservasi SEMUA baris dalam 1 transaksi (all-or-nothing) - berhasil
  // set resources_reserved_at, itu yang membuka gerbang confirmWithFile().
  reserveResources(id: number) {
    return apiClient.post<ApiMessageResponse<SalesOrderDetail>>(`${DC_BASE_PATH}/sales-orders/${id}/resource-reserve`, {});
  },
};
