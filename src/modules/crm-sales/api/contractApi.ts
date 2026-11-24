import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Contract, ContractCrossConnect, ContractDetail, ContractFormValues, ContractFromQuotationValues, ContractListParams, ContractResourceLockStatus, ContractStatus } from "../types/contract";
import type { SalesOrder } from "../types/salesOrder";

const BASE_PATH = "/v1/crm-sales";

export const contractApi = {
  list(params: ContractListParams) {
    return apiClient.get<PaginatedResponse<Contract>>(`${BASE_PATH}/contracts`, { params });
  },
  // eager-load customer/services/addenda/slas/salesOrder (lihat ContractController::show())
  show(id: number) {
    return apiClient.get<{ data: ContractDetail }>(`${BASE_PATH}/contracts/${id}`);
  },
  create(values: ContractFormValues) {
    return apiClient.post<ApiMessageResponse<Contract>>(`${BASE_PATH}/contracts`, values);
  },
  storeFromSalesOrder(salesOrderId: number, options?: { start_date?: string; end_date?: string; monthly_value?: number }) {
    return apiClient.post<ApiMessageResponse<Contract>>(`${BASE_PATH}/contracts/from-sales-order`, { sales_order_id: salesOrderId, ...options });
  },
  terminate(id: number) {
    return apiClient.post<ApiMessageResponse<Contract>>(`${BASE_PATH}/contracts/${id}/terminate`, {});
  },
  updateStatus(id: number, status: ContractStatus) {
    return apiClient.post<ApiMessageResponse<Contract>>(`${BASE_PATH}/contracts/${id}/status`, { status });
  },
  /** Ajukan Contract untuk approval Finance -> Legal - SAMA POLA dengan
   * quotationApi.submitApproval(), POST langsung ke endpoint generik
   * Workflow Engine (bukan endpoint khusus Contract) supaya alur
   * approval-nya tetap diatur admin lewat Workflow Design, bukan
   * di-hardcode di sini. Lihat ContractApprovalWorkflowSeeder.php untuk
   * template 'contract-approval-v1' (Finance lalu Legal).
   *
   * payload SENGAJA dilengkapi (total_amount + lines) - bukan cuma
   * customer_name/monthly_value seperti sebelumnya - supaya "Lihat Detail
   * yang Diapprove" di My Approvals (ApprovalDetail, generik lintas
   * document_type) bisa ikut menampilkan rincian layanan kontrak, bukan
   * cuma nama customer. total_amount/lines dibaca pakai nama field yang
   * SAMA dengan payload Quotation supaya reuse renderer generik itu. */
  submitApproval(contract: ContractDetail) {
    return apiClient.post("/v1/core-platform/workflow/instances", {
      module_code: "crm-sales",
      document_type: "contract",
      document_id: contract.id,
      reference_number: contract.contract_number,
      template_code: "contract-approval-v1",
      payload: {
        contract_number: contract.contract_number,
        customer_name: contract.customer?.company_name ?? "—",
        monthly_value: contract.monthly_value,
        total_amount: contract.monthly_value,
        site_name: contract.site ? `${contract.site.site_code} — ${contract.site.site_name}` : null,
        payment_term_days: contract.payment_term_days,
        start_date: contract.start_date,
        end_date: contract.end_date,
        lines: (contract.services ?? []).map((s) => ({
          description: s.description,
          quantity: s.quantity,
          unit_price: s.unit_price,
          amount: s.amount,
        })),
      },
    });
  },
  /** Klien sudah tanda tangan & kirim balik dokumennya - file_id didapat
   * dari upload lebih dulu ke POST /v1/core-platform/files/upload. */
  confirmSignedDocument(id: number, fileId: number) {
    return apiClient.post<ApiMessageResponse<Contract>>(`${BASE_PATH}/contracts/${id}/confirm-signed-document`, { file_id: fileId });
  },
  printPdfUrl(id: number, organizationId: number) {
    return `${BASE_PATH}/contracts/${id}/print-pdf?organization_id=${organizationId}`;
  },
  /** Alur BARU: Contract dibuat LANGSUNG dari quotation 'accepted' - baris
   * layanan + template resource disalin otomatis (lihat
   * ContractManagementService::createFromQuotation()). */
  storeFromQuotation(values: ContractFromQuotationValues) {
    return apiClient.post<ApiMessageResponse<Contract>>(`${BASE_PATH}/contracts/from-quotation`, values);
  },
  /** Pilih Site DataCenterOps tujuan alokasi resource - wajib sebelum rack
   * bisa dikunci lewat Rack Visual Picker. */
  setSite(id: number, siteId: number) {
    return apiClient.post<ApiMessageResponse<Contract>>(`${BASE_PATH}/contracts/${id}/site`, { site_id: siteId });
  },
  /** Cek kelengkapan resource yang sudah dikunci vs kebutuhan Contract. */
  resourceStatus(id: number) {
    return apiClient.get<{ data: ContractResourceLockStatus }>(`${BASE_PATH}/contracts/${id}/resource-status`);
  },
  /** LANGKAH TERAKHIR alur baru: kunci status resource & terbitkan Sales
   * Order otomatis dari Contract yang sudah 'active' + resource lengkap. */
  issueSalesOrder(id: number) {
    return apiClient.post<ApiMessageResponse<{ contract: Contract; sales_order: SalesOrder }>>(`${BASE_PATH}/contracts/${id}/issue-sales-order`, {});
  },
  /** Customer 360 - semua yang terhubung ke contract ini lintas modul:
   * layanan, invoice+pembayaran (FinanceAccounting), tiket gangguan
   * (DataCenterOps) & tiket dukungan (HrServiceSupport) - lihat
   * ContractController::related(). */
  related(id: number) {
    return apiClient.get<{ data: ContractRelatedData }>(`${BASE_PATH}/contracts/${id}/related`);
  },
};

export interface ContractRelatedInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  reference_type: string | null;
}

export interface ContractRelatedPayment {
  id: number;
  payment_number: string;
  payment_date: string;
  payment_method: string;
  amount: number;
  status: string;
}

export interface ContractRelatedTicket {
  id: number;
  ticket_number: string;
  ticket_type?: string;
  channel?: string;
  priority: string;
  subject: string;
  status: string;
  created_at?: string;
  opened_at?: string;
  resolved_at: string | null;
}

export interface ContractRelatedDevice {
  id: number;
  device_code: string;
  device_name: string;
  device_type: string;
  site_id: number | null;
  site_room_id: number | null;
  rack_id: number | null;
  rack_position_u: number | null;
  rack_position_u_end: number | null;
  status: string;
  site: { id: number; site_name: string; site_code: string } | null;
  site_room: { id: number; room_code: string; room_name: string } | null;
  rack: { id: number; rack_code: string } | null;
}

export interface ContractRelatedOtbPort {
  id: number;
  otb_id: number;
  port_number: number;
  status: string;
  contract_service_id: number | null;
  allocated_date: string | null;
  otb: { id: number; tag_number: string; location: string } | null;
  contract_service: { id: number; description: string } | null;
}

export interface ContractRelatedIpAddress {
  id: number;
  subnet_id: number;
  ip_address: string;
  status: string;
  contract_service_id: number | null;
  allocated_date: string | null;
  subnet: { id: number; cidr: string } | null;
  contract_service: { id: number; description: string } | null;
}

export interface ContractRelatedRackAllocation {
  id: number;
  rack_id: number;
  start_u: number;
  end_u: number;
  status: string;
  allocated_date: string | null;
  rack: { id: number; site_room_id: number; rack_code: string; rack_name: string; site_room: { id: number; room_code: string; room_name: string } | null } | null;
}

export interface ContractRelatedData {
  contract: ContractDetail;
  invoices: ContractRelatedInvoice[];
  payments: ContractRelatedPayment[];
  tickets_operational: ContractRelatedTicket[];
  tickets_support: ContractRelatedTicket[];
  devices: ContractRelatedDevice[];
  cross_connects: ContractCrossConnect[];
  otb_ports: ContractRelatedOtbPort[];
  ip_addresses: ContractRelatedIpAddress[];
  rack_allocations: ContractRelatedRackAllocation[];
}
