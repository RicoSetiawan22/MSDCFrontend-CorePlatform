import { useState } from "react";
import { FileText } from "lucide-react";
import { usePostGrn } from "../../api/useGrn";
import { grnApi } from "../../api/grnApi";
import { formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { BastPreviewModal } from "./BastPreviewModal";
import { LinkItemsBeforePostModal } from "./LinkItemsBeforePostModal";
import type { GoodsReceipt, GoodsReceiptLine, GrnStatus } from "../../types/grn";

const STATUS_LABELS: Record<GrnStatus, string> = {
  draft: "Draft",
  posted: "Posted",
  cancelled: "Dibatalkan",
};

interface GrnTableProps {
  items: GoodsReceipt[];
}

export function GrnTable({ items }: GrnTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200/80">
          <tr>
            <th className="py-3 px-4">No GRN</th>
            <th className="py-3 px-4">PO</th>
            <th className="py-3 px-4">Vendor</th>
            <th className="py-3 px-4">Tanggal Terima</th>
            <th className="py-3 px-4">Diterima Oleh</th>
            <th className="py-3 px-4">BAST</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((grn) => (
            <GrnRow key={grn.id} grn={grn} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GrnRow({ grn }: { grn: GoodsReceipt }) {
  const postMutation = usePostGrn(grn.id);
  const [showBastPreview, setShowBastPreview] = useState(false);
  const [linkModal, setLinkModal] = useState<{ grn: GoodsReceipt; unlinkedLines: GoodsReceiptLine[] } | null>(null);
  const [checkingLinks, setCheckingLinks] = useState(false);

  async function handlePost() {
    setCheckingLinks(true);
    try {
      const detail = await grnApi.show(grn.id).then((r) => r.data.data);
      const unlinked = (detail.lines ?? []).filter(
        (l) =>
          l.purchase_order_line?.line_type !== "service" &&
          !l.purchase_order_line?.is_dc_asset &&
          !l.purchase_order_line?.item_id
      );
      if (unlinked.length > 0) {
        setLinkModal({ grn: detail, unlinkedLines: unlinked });
        return;
      }
      if (!confirm(`Post GRN ${grn.grn_number}? Stok akan bertambah ke inventory.`)) return;
      await postMutation.mutateAsync(undefined);
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setCheckingLinks(false);
    }
  }

  return (
    <>
      <tr className="hover:bg-slate-50/60 transition-colors">
        <td className="py-3 px-4 font-mono text-xs font-bold text-amber-600">
          {grn.grn_number}
        </td>
        <td className="py-3 px-4 font-mono text-xs text-slate-600">
          {grn.purchase_order?.po_number ?? "—"}
        </td>
        <td className="py-3 px-4 text-xs font-medium text-slate-800">
          {grn.purchase_order?.vendor?.vendor_name ?? "—"}
        </td>
        <td className="py-3 px-4 text-xs">{formatDate(grn.receipt_date)}</td>
        <td className="py-3 px-4 text-xs text-slate-700">
          {grn.employee?.full_name || (grn.notes?.match(/\[Penerima:\s*([^\]]+)\]/)?.[1]) || "—"}
        </td>
        <td className="py-3 px-4 text-xs">
          {grn.bast_file ? (
            <button
              type="button"
              onClick={() => setShowBastPreview(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 cursor-pointer"
            >
              <FileText size={14} /> Lihat BAST
            </button>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
        <td className="py-3 px-4">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              grn.status === "posted"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : grn.status === "cancelled"
                ? "bg-rose-50 text-rose-600 border-rose-200"
                : "bg-amber-50 text-amber-600 border-amber-200"
            }`}
          >
            {STATUS_LABELS[grn.status]}
          </span>
        </td>
        <td className="py-3 px-4 text-center">
          {grn.status === "draft" && (
            <button
              onClick={handlePost}
              disabled={postMutation.isPending || checkingLinks}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium text-xs rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {checkingLinks ? "Mengecek..." : "Post"}
            </button>
          )}
        </td>
      </tr>

      {showBastPreview && grn.bast_file && (
        <BastPreviewModal
          fileId={grn.bast_file.id}
          fileName={grn.bast_file.original_name}
          mimeType={grn.bast_file.mime_type ?? null}
          onClose={() => setShowBastPreview(false)}
        />
      )}

      {linkModal && (
        <LinkItemsBeforePostModal
          grn={linkModal.grn}
          unlinkedLines={linkModal.unlinkedLines}
          onClose={() => setLinkModal(null)}
          onPosted={() => setLinkModal(null)}
          postMutation={postMutation}
        />
      )}
    </>
  );
}