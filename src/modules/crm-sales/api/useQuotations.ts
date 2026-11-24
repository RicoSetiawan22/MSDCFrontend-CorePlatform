
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { quotationApi } from "./quotationApi";

import type {
  QuotationFormValues,
  QuotationListParams,
  QuotationStatus,
  Quotation,
} from "../types/quotation";

/**
 * Query Keys untuk Quotation.
 *
 * Digunakan oleh React Query untuk
 * menyimpan dan memperbarui cache data.
 */
const qtKeys = {
  all: ["quotations"] as const,

  lists: () =>
    [...qtKeys.all, "list"] as const,

  list: (params: QuotationListParams) =>
    [...qtKeys.lists(), params] as const,

  detail: (id: number) =>
    [...qtKeys.all, "detail", id] as const,
};

/**
 * ==========================================
 * 1. MENGAMBIL DAFTAR QUOTATION
 * ==========================================
 */
export function useQuotationList(
  params: QuotationListParams
) {
  return useQuery({
    queryKey: qtKeys.list(params),

    queryFn: () =>
      quotationApi
        .list(params)
        .then((response) => response.data),

    placeholderData: (previous) => previous,
  });
}

/**
 * ==========================================
 * 2. MENGAMBIL DETAIL QUOTATION
 * ==========================================
 */
export function useQuotation(
  id: number | undefined
) {
  return useQuery({
    queryKey: qtKeys.detail(id ?? 0),

    queryFn: () =>
      quotationApi
        .show(id!)
        .then((response) => response.data.data),

    enabled: !!id,
  });
}

/**
 * ==========================================
 * 3. MEMBUAT QUOTATION
 * ==========================================
 */
export function useCreateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      values: QuotationFormValues
    ) =>
      quotationApi
        .create(values)
        .then((response) => response.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: qtKeys.lists(),
      });
    },
  });
}

/**
 * ==========================================
 * 4. MEMPERBARUI QUOTATION
 * ==========================================
 */
export function useUpdateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: number;
      values: Partial<QuotationFormValues>;
    }) =>
      quotationApi
        .update(id, values)
        .then((response) => response.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: qtKeys.lists(),
      });
    },
  });
}

/**
 * ==========================================
 * 5. MEMPERBARUI STATUS QUOTATION
 * ==========================================
 *
 * Digunakan untuk perubahan status biasa,
 * misalnya accepted.
 */
export function useUpdateQuotationStatus(
  id: number
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      status: QuotationStatus
    ) =>
      quotationApi
        .updateStatus(id, status)
        .then((response) => response.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: qtKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: qtKeys.detail(id),
      });
    },
  });
}

/**
 * ==========================================
 * 6. MENGHUBUNGKAN QUOTATION KE CUSTOMER
 * ==========================================
 */
export function useAssignQuotationCustomer(
  id: number
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      customerId: number
    ) =>
      quotationApi
        .assignCustomer(id, customerId)
        .then((response) => response.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: qtKeys.lists(),
      });
    },
  });
}

/**
 * ==========================================
 * 7. MENGAJUKAN APPROVAL QUOTATION
 * ==========================================
 *
 * Digunakan untuk mengajukan quotation
 * ke workflow persetujuan internal.
 *
 * Approval internal BERBEDA dengan Lose.
 */
export function useSubmitQuotationApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      quotation,
    }: {
      id: number;
      quotation: Quotation;
    }) =>
      quotationApi
        .submitApproval(id, quotation)
        .then((response) => response.data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: qtKeys.lists(),
      });
    },
  });
}

/**
 * ==========================================
 * 8. FITUR BARU: QUOTATION LOSE
 * ==========================================
 *
 * Digunakan ketika quotation kalah
 * atau ditolak oleh client.
 *
 * Contoh:
 * - Harga terlalu mahal
 * - Client memilih kompetitor
 * - Anggaran client tidak tersedia
 * - Client membatalkan kebutuhan
 *
 * Proses:
 *
 * 1. Frontend mengirim status "lost"
 *    beserta alasan kekalahan.
 *
 * 2. Frontend membaca ulang detail
 *    Quotation dari backend.
 *
 * 3. Jika backend mengembalikan status
 *    "lost" dan alasan yang sama,
 *    aksi dianggap berhasil.
 *
 * 4. Jika data tidak sesuai,
 *    tampilkan kesalahan.
 *
 * Backend harus mendukung status dan
 * field tersebut agar bisa tersimpan.
 */
export function useLoseQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: number;
      reason: string;
    }) => {
      const cleanedReason = reason.trim();

      if (!cleanedReason) {
        throw new Error(
          "Alasan Lose wajib diisi."
        );
      }

      /**
       * Kirim aksi Lose ke backend.
       */
      await quotationApi.lose(
        id,
        cleanedReason
      );

      /**
       * Ambil detail terbaru langsung
       * dari API, bukan dari cache.
       *
       * Tujuannya memastikan bahwa
       * perubahan benar-benar tersimpan.
       */
      const response =
        await quotationApi.show(id);

      const updatedQuotation =
        response.data.data;

      /**
       * Validasi status Lose.
       */
      if (
        updatedQuotation.status !== "lost"
      ) {
        throw new Error(
          "Status Lose belum dikonfirmasi oleh server. " +
          "Periksa dukungan API backend."
        );
      }

      /**
       * Validasi alasan kekalahan.
       */
      if (
        updatedQuotation.lost_reason?.trim() !==
        cleanedReason
      ) {
        throw new Error(
          "Alasan Lose belum tersimpan sesuai " +
          "data yang dikirim. Periksa API backend."
        );
      }

      return updatedQuotation;
    },

    /**
     * Refresh data setelah permintaan,
     * baik berhasil maupun gagal.
     *
     * Ini penting karena backend mungkin
     * telah mengubah sebagian data sebelum
     * pemeriksaan detail gagal.
     */
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: qtKeys.all,
      });
    },
  });
}
