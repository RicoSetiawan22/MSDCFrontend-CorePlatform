import { useMutation } from "@tanstack/react-query";
import { reportExportApi, type ExportRow, type ReportExportFormat } from "./reportExportApi";
import { downloadBlobAsFile, normalizeBlobError } from "@shared/lib/downloadFile";

interface ExportReportArgs {
  format: ReportExportFormat;
  reportName: string;
  rows: ExportRow[];
  filenameBase: string;
}

/** Bikin export job (sinkron, lihat reportExportApi) lalu langsung unduh
 * hasilnya sebagai file - dipakai tombol "Export" di tiap laporan CRM. */
export function useExportReport() {
  return useMutation({
    mutationFn: async ({ format, reportName, rows, filenameBase }: ExportReportArgs) => {
      const created = await reportExportApi.create(format, reportName, rows);
      const job = created.data.data;
      if (job.status === "failed") {
        throw new Error(job.error_message ?? "Export gagal dibuat.");
      }

      try {
        const res = await reportExportApi.download(job.id);
        downloadBlobAsFile(res.data, `${filenameBase}.${format}`);
      } catch (err) {
        await normalizeBlobError(err);
      }
    },
  });
}
