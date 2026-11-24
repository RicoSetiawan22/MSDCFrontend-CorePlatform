
import { apiClient } from "@shared/lib/api-client";

import type {
  PaginatedResponse,
  ApiMessageResponse,
} from "@shared/types/api";

import type {
  Quotation,
  QuotationDetail,
  QuotationFormValues,
  QuotationListParams,
  QuotationStatus,
} from "../types/quotation";

const BASE = "/v1/crm-sales";

export const quotationApi = {

  /**
   * Mengambil daftar Quotation.
   *
   * Mendukung:
   * - Pagination
   * - Filter status
   * - Filter customer
   * - Pencarian
   */
  list(params: QuotationListParams) {
    return apiClient.get(
      `${BASE}/quotations`,
      { params }
    ) as ReturnType<
      typeof apiClient.get<PaginatedResponse<Quotation>>
    >;
  },

  /**
   * Mengambil detail Quotation.
   *
   * Backend melakukan eager-load:
   * - Customer
   * - Lines / layanan
   */
  show(id: number) {
    return apiClient.get(
      `${BASE}/quotations/${id}`
    ) as ReturnType<
      typeof apiClient.get<{ data: QuotationDetail }>
    >;
  },

  /**
   * Membuat Quotation baru.
   */
  create(values: QuotationFormValues) {
    return apiClient.post(
      `${BASE}/quotations`,
      values
    ) as ReturnType<
      typeof apiClient.post<ApiMessageResponse<Quotation>>
    >;
  },

  /**
   * Memperbarui data Quotation.
   */
  update(
    id: number,
    values: Partial<QuotationFormValues>
  ) {
    return apiClient.put(
      `${BASE}/quotations/${id}`,
      values
    ) as ReturnType<
      typeof apiClient.put<ApiMessageResponse<Quotation>>
    >;
  },

  /**
   * Memperbarui status Quotation.
   *
   * Contoh:
   * draft
   * approved
   * sent
   * accepted
   */
  updateStatus(
    id: number,
    status: QuotationStatus
  ) {
    return apiClient.post(
      `${BASE}/quotations/${id}/status`,
      { status }
    ) as ReturnType<
      typeof apiClient.post<ApiMessageResponse<Quotation>>
    >;
  },

  /**
   * ======================================
   * FITUR BARU: QUOTATION LOSE
   * ======================================
   *
   * Digunakan ketika penawaran ditolak
   * atau kalah dari sisi client.
   *
   * Ini BERBEDA dengan penolakan
   * approval internal.
   *
   * rejected = penolakan internal
   * lost = penawaran kalah di client
   *
   * Mengirim:
   * - status: "lost"
   * - lost_reason: alasan penolakan
   *
   * Identitas pelaku aksi sebaiknya
   * dicatat backend dari user login.
   *
   * Catatan:
   * Endpoint yang digunakan adalah
   * endpoint status yang sudah ada.
   * Backend belum dipastikan mendukung
   * nilai "lost" dan "lost_reason".
   */
  lose(
    id: number,
    reason: string
  ) {
    const lostReason = reason.trim();

    if (!lostReason) {
      throw new Error(
        "Alasan Lose wajib diisi."
      );
    }

    return apiClient.post(
      `${BASE}/quotations/${id}/status`,
      {
        status: "lost",
        lost_reason: lostReason,
      }
    ) as ReturnType<
      typeof apiClient.post<ApiMessageResponse<Quotation>>
    >;
  },

  /**
   * Menghubungkan Quotation
   * dengan Customer.
   */
  assignCustomer(
    id: number,
    customerId: number
  ) {
    return apiClient.post(
      `${BASE}/quotations/${id}/customer`,
      {
        customer_id: customerId,
      }
    ) as ReturnType<
      typeof apiClient.post<ApiMessageResponse<Quotation>>
    >;
  },

  /**
   * Mengirim Quotation melalui email.
   *
   * Endpoint ini membuat PDF Penawaran
   * di server lalu melampirkannya
   * pada email yang dikirim.
   */
  sendEmail(
    id: number,
    organizationId: number,
    email: string,
    subject: string,
    message: string
  ) {
    return apiClient.post(
      `${BASE}/quotations/${id}/send-email`,
      {
        organization_id: organizationId,
        email,
        subject,
        message,
      }
    ) as ReturnType<
      typeof apiClient.post<{ message: string }>
    >;
  },

  /**
   * URL untuk mencetak PDF Quotation.
   */
  printPdfUrl(
    id: number,
    organizationId: number
  ) {
    return `${BASE}/quotations/${id}/print-pdf?organization_id=${organizationId}`;
  },

  /**
   * ======================================
   * SUBMIT APPROVAL QUOTATION
   * ======================================
   *
   * Mengajukan Quotation ke proses
   * approval internal melalui Workflow.
   *
   * Data detail diambil kembali karena
   * endpoint daftar quotation tidak
   * membawa seluruh customer dan lines.
   */
  async submitApproval(
    id: number,
    quotation: Quotation
  ) {

    /**
     * Mengambil detail lengkap
     * dari backend.
     */
    const detail = await quotationApi
      .show(id)
      .then((r) => r.data.data);

    /**
     * Menghitung subtotal dan diskon.
     */
    const subtotal = Number(
      detail.subtotal ?? detail.total_amount
    );

    const discountAmount = Number(
      detail.discount_amount ?? 0
    );

    /**
     * Persentase diskon digunakan
     * oleh Workflow Engine.
     */
    const discountPct =
      subtotal > 0
        ? Math.round(
            (discountAmount / subtotal) * 10000
          ) / 100
        : 0;

    /**
     * Mengirim data ke wrapper
     * approval khusus Quotation.
     *
     * Backend memeriksa apakah
     * quotation boleh diajukan lagi.
     */
    return apiClient.post(
      `${BASE}/quotations/${id}/submit-approval`,
      {
        reference_number:
          detail.quotation_number,

        template_code:
          "quotation-approval-v1",

        payload: {
          quotation_number:
            detail.quotation_number,

          customer_name:
            detail.customer?.company_name ?? "—",

          total_amount:
            detail.total_amount,

          subtotal,

          discount_amount:
            discountAmount,

          discount_pct:
            discountPct,

          status: quotation.status,

          lines: (
            detail.lines ?? []
          ).map((line) => ({
            description:
              line.description,

            quantity:
              line.quantity,

            unit_price:
              line.unit_price,

            discount_pct:
              line.discount_pct,

            amount:
              line.amount,
          })),
        },
      }
    );
  },
};
