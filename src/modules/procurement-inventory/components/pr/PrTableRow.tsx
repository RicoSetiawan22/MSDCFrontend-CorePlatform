import { useState } from "react";
import { FileDown, X, ArrowRight } from "lucide-react";
import { useSubmitPr, useCancelPr } from "../../api/usePr";
import { prApi } from "../../api/prApi";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { extractErrorMessage } from "@shared/types/api";
import { PdfPreviewModal } from "@shared/components/PdfPreviewModal";
import type { PurchaseRequest, PrStatus } from "../../types/pr";

const STATUS_LABELS: Record<PrStatus, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  converted_to_po: "Sudah Jadi PO",
};

export function PrTableRow({
  pr,
  onRefresh,
}: {
  pr: PurchaseRequest;
  onRefresh: () => void;
}) {
  const orgId = useActiveOrgId();
  const submitMutation = useSubmitPr(pr.id);
  const cancelMutation = useCancelPr(pr.id);

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  async function handleSubmit() {
    if (!confirm(`Submit PR ${pr.pr_number} untuk approval?`)) return;
    try {
      await submitMutation.mutateAsync();
      onRefresh();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleCancel() {
    if (!confirm(`Batalkan PR ${pr.pr_number}?`)) return;
    try {
      await cancelMutation.mutateAsync();
      onRefresh();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handlePreviewPdf() {
    if (!orgId) return;
    setDownloadingPdf(true);
    try {
      const res = await prApi.downloadPdf(pr.id, orgId);
      setPreviewBlob(res.data);
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <>
      <tr className="hover:bg-slate-50/70 transition-colors">
        <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
          {pr.pr_number}
        </td>
        <td className="py-3 px-4 text-xs font-medium text-slate-800 max-w-[300px] truncate">
          {pr.purpose ?? "—"}
        </td>
        <td className="py-3 px-4">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {STATUS_LABELS[pr.status]}
          </span>
        </td>
        <td className="py-3 px-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            {pr.status === "draft" && (
              <>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight size={12} /> Submit
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                  title="Batalkan"
                >
                  <X size={14} />
                </button>
              </>
            )}

            {pr.status !== "draft" && (
              <button
                type="button"
                onClick={handlePreviewPdf}
                disabled={downloadingPdf}
                className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <FileDown size={12} /> PDF
              </button>
            )}
          </div>
        </td>
      </tr>

      {previewBlob && (
        <PdfPreviewModal
          title={`FPPBJ — ${pr.pr_number}`}
          blob={previewBlob}
          filename={`FPPBJ_${pr.pr_number}.pdf`}
          onClose={() => setPreviewBlob(null)}
        />
      )}
    </>
  );
}