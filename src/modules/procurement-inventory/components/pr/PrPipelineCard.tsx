import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileDown, CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";
import { useSubmitPr, useCancelPr } from "../../api/usePr";
import { prApi } from "../../api/prApi";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { PdfPreviewModal } from "@shared/components/PdfPreviewModal";
import { Modal } from "@shared/components/Modal";
import { ApprovalStepsList } from "@shared/components/ApprovalStepsList";
import type { PurchaseRequest, PrStatus } from "../../types/pr";

const STATUS_LABELS: Record<PrStatus, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  converted_to_po: "Sudah Jadi PO",
};

const STATUS_BADGE: Record<PrStatus, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  submitted: "bg-amber-50 text-amber-700 border-amber-200/80",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  rejected: "bg-rose-50 text-rose-700 border-rose-200/80",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  converted_to_po: "bg-sky-50 text-sky-700 border-sky-200/80",
};

export function PrPipelineCard({
  pr,
  onRefresh,
}: {
  pr: PurchaseRequest;
  onRefresh: () => void;
}) {
  const orgId = useActiveOrgId();
  const submitMutation = useSubmitPr(pr.id);
  const cancelMutation = useCancelPr(pr.id);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const total = (pr.lines ?? []).reduce(
    (sum, l) => sum + Number(l.quantity) * Number(l.estimated_unit_price ?? 0),
    0
  );

  async function handleSubmit(e: React.MouseEvent) {
    e.stopPropagation(); // Biar modal detail ga ikut kebuka
    if (!confirm(`Submit PR ${pr.pr_number} untuk approval?`)) return;
    try {
      await submitMutation.mutateAsync();
      onRefresh();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Batalkan PR ${pr.pr_number}?`)) return;
    try {
      await cancelMutation.mutateAsync();
      onRefresh();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handlePreviewPdf(e: React.MouseEvent) {
    e.stopPropagation();
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
      {/* 🟢 CARD RINGKAS (Tinggi Rata & Bersih) */}
      <div
        onClick={() => setShowDetailModal(true)}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between overflow-hidden cursor-pointer group"
      >
        <div className="p-4 flex flex-col gap-3">
          {/* Header Card: Kode & Status */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 group-hover:bg-amber-50 group-hover:text-amber-700 px-2 py-0.5 rounded-md border border-slate-200/60 transition-colors truncate">
              {pr.pr_number}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
                STATUS_BADGE[pr.status]
              }`}
            >
              {STATUS_LABELS[pr.status]}
            </span>
          </div>

          {/* Purpose */}
          <div className="font-bold text-sm text-slate-800 line-clamp-2 h-[2.5rem]">
            {pr.purpose ?? "—"}
          </div>

          {/* Pembuat */}
          {(pr.employee?.full_name ?? pr.requester?.name) && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                {(pr.employee?.full_name ?? pr.requester?.name ?? "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <span className="truncate font-medium text-slate-700">
                {pr.employee?.full_name ?? pr.requester?.name}
              </span>
            </div>
          )}

          {/* Estimasi Nilai & Total Item */}
          <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Estimasi Nilai
              </div>
              <div className="font-mono text-xs font-bold text-emerald-600 mt-0.5">
                {formatCurrency(total)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Total Item
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">
                {pr.lines?.length ?? 0} baris
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Calendar size={12} className="text-slate-400" />
            <span>{formatDate(pr.created_at)}</span>
          </div>
        </div>

        {/* Footer Tombol Aksi Cepat */}
        <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
          {pr.status === "draft" && (
            <>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <ArrowRight size={13} /> Submit
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="p-1.5 border border-slate-200 bg-white text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Batalkan"
              >
                <XCircle size={15} />
              </button>
            </>
          )}

          {pr.status === "approved" && (
            <Link
              to={`/procurement-inventory/vendor-quotations?pr=${pr.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 py-1.5 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100/80 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <CheckCircle2 size={13} /> Siap Vendor Quotation
            </Link>
          )}

          {pr.status !== "draft" && (
            <button
              type="button"
              onClick={handlePreviewPdf}
              disabled={downloadingPdf}
              className="p-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Pratinjau PDF"
            >
              <FileDown size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 🟢 MODAL DETAIL LENGKAP (Sistem Approval Muncul di Sini) */}
      {showDetailModal && (
        <Modal
          title={`Detail PR — ${pr.pr_number}`}
          onClose={() => setShowDetailModal(false)}
          maxWidth={680}
        >
          <div className="flex flex-col gap-5 p-1">
            {/* Header Status */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">
                  Status Pengajuan
                </div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {STATUS_LABELS[pr.status]}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  STATUS_BADGE[pr.status]
                }`}
              >
                {STATUS_LABELS[pr.status]}
              </span>
            </div>

            {/* Tujuan */}
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1">
                Tujuan / Keperluan:
              </div>
              <div className="text-sm font-bold text-slate-800 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                {pr.purpose ?? "—"}
              </div>
            </div>

            {/* Info Tambahan */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Pembuat:</span>
                <span className="font-semibold text-slate-700">
                  {pr.employee?.full_name ?? pr.requester?.name ?? "—"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Tanggal Buat:</span>
                <span className="font-semibold text-slate-700">
                  {formatDate(pr.created_at)}
                </span>
              </div>
            </div>

            {/* List Barang / Jasa */}
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Daftar Barang / Jasa ({pr.lines?.length ?? 0} Item):
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-2.5">Deskripsi</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Estimasi Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pr.lines?.map((line, i) => (
                      <tr key={i}>
                        <td className="p-2.5 font-medium text-slate-800">
                          {line.description}
                        </td>
                        <td className="p-2.5 text-center text-slate-600">
                          {line.quantity} {line.uom}
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-600 font-semibold">
                          {formatCurrency(
                            Number(line.quantity) *
                              Number(line.estimated_unit_price ?? 0)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alur Persetujuan (Hanya muncul jika dalam tahap approval/selesai) */}
            {pr.status === "submitted" && (
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-500" /> Alur Persetujuan (Workflow):
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <ApprovalStepsList workflowInstanceId={pr.workflow_instance_id} />
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal PDF Preview */}
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