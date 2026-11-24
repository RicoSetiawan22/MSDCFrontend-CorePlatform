/**
 * Tipe generik yang cocok dengan format response Laravel di SELURUH 7
 * modul backend - dipakai lintas modul frontend, bukan didefinisikan
 * ulang tiap modul.
 */

/** Bentuk response dari response()->json(['success' => ..., 'message' => ..., 'data' => ...]) */
export interface ApiMessageResponse<T> {
  success: boolean;
  message: string;
  warning?: string;
  unallocated_amount?: string | number;
  data: T;
}

/**
 * Bentuk response dari Eloquent::paginate() + wrapper { success, data }.
 * Semua backend index() return: { success: true, data: { data: T[], total, ... } }
 * Ekstraksi: r.data.data.data = T[] (axios → success+data wrapper → paginator → items)
 */
export interface PaginatedResponse<T> {
  success?: boolean;
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

/** Bentuk error validasi standar Laravel (422) */
export interface ApiValidationError {
  message: string;
  errors: Record<string, string[]>;
}

/** Bentuk 422 khusus dari GeneratesSequentialNumber (CrmSales) saat
 * module_code Number Sequence belum diatur di Master Data CorePlatform
 * (lihat NumberSequenceNotConfiguredException, di-render global lewat
 * bootstrap/app.php - berlaku di SEMUA endpoint pembuatan dokumen
 * bernomor: Lead/Opportunity/Quotation/Sales Order/Contract/dst). */
export interface NumberSequenceNotConfiguredError {
  error_code: "number_sequence_not_configured";
  module_code: string;
  suggested_prefix: string;
  suggested_format: string;
  message: string;
}

/** Deteksi error 422 di atas dari AxiosError apapun - dipakai form
 * pembuatan dokumen CRM buat tampilkan NumberSequenceSetupModal inline,
 * bukan cuma pesan error generik. */
export function extractNumberSequenceError(error: unknown): NumberSequenceNotConfiguredError | null {
  if (typeof error === "object" && error !== null && "response" in error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (error as any).response?.data;
    if (data?.error_code === "number_sequence_not_configured") {
      return data as NumberSequenceNotConfiguredError;
    }
  }
  return null;
}

/** Helper - ambil pesan error yang enak dibaca dari AxiosError apapun bentuknya */
export function extractErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = (error as any).response;
    if (response?.data?.errors) {
      const firstField = Object.keys(response.data.errors)[0];
      return response.data.errors[firstField][0];
    }
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return "Terjadi kesalahan tak terduga. Coba lagi.";
}
