import { apiClient } from "@shared/lib/api-client";

const BASE_PATH = "/v1/core-platform/report-exports";

export type ReportExportFormat = "csv" | "xlsx" | "pdf";

export interface ReportExportJob {
  id: number;
  format: ReportExportFormat;
  source_module: string;
  report_name: string;
  status: "completed" | "failed";
  file_path: string | null;
  row_count: number;
  error_message: string | null;
}

/**
 * Baris export flat (key jadi header kolom) - SEMUA baris harus punya
 * key yang sama, urutan diambil dari baris pertama (lihat
 * ReportExportController::store() di backend, tidak ada param columns
 * terpisah).
 */
export type ExportRow = Record<string, string | number>;

export const reportExportApi = {
  /** Sinkron - job SUDAH 'completed'/'failed' begitu response ini balik,
   * TIDAK perlu polling (lihat ReportExportService::export() di backend). */
  create(format: ReportExportFormat, reportName: string, rows: ExportRow[]) {
    return apiClient.post<{ message: string; data: ReportExportJob }>(BASE_PATH, {
      format,
      source_module: "CrmSales",
      report_name: reportName,
      rows,
    });
  },
  download(jobId: number) {
    return apiClient.get<Blob>(`${BASE_PATH}/${jobId}/download`, { responseType: "blob" });
  },
};
