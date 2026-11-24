import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShoppingBag, User, Building2, FileText, Calendar } from "lucide-react";
import { usePendingPoList } from "../../api/usePr";
import { formatDate } from "@shared/lib/format";

export function PendingPoSection() {
  const [showAll, setShowAll] = useState(false);
  const { data: pendingPrs, isLoading } = usePendingPoList();

  if (isLoading) return null;
  const shown = showAll ? (pendingPrs ?? []) : (pendingPrs ?? []).slice(0, 4);
  const count = pendingPrs?.length ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col gap-4">
      {/* Header Widget */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg border border-sky-100">
              <ShoppingBag size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Approved PR — Belum Jadi PO
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar pengajuan PR disetujui yang siap dikonversi ke Purchase Order.
          </p>
        </div>
        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-full border border-sky-200">
          {count} PR
        </span>
      </div>

      {/* Grid Content */}
      {count === 0 ? (
        <div className="text-center py-6 bg-emerald-50/40 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-medium flex items-center justify-center gap-2">
          <CheckCircle2 size={16} />
          <span>Semua PR disetujui sudah dikonversi ke PO.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {shown.map((pr) => (
            <div
              key={pr.id}
              className="p-3.5 bg-slate-50/60 hover:bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col justify-between gap-3 transition-colors"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {pr.pr_number}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md">
                    Approved
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 line-clamp-2">
                  {pr.purpose}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <User size={12} className="text-slate-400" />
                    <span>{pr.requester}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Building2 size={12} className="text-slate-400" />
                    <span>{pr.department}</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <FileText size={12} className="text-slate-400" />
                    <span>{pr.line_count} item</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    <span>{formatDate(pr.created_at)}</span>
                  </span>
                </div>
              </div>

              <Link
                to={`/procurement-inventory/vendor-quotations?pr=${pr.id}`}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-medium transition-all shadow-2xs"
              >
                <span>Vendor Quotation</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Toggle View All */}
      {count > 4 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 self-start cursor-pointer mt-1"
        >
          {showAll ? "▲ Tampilkan Sedikit" : `▼ Lihat Semua (${count})`}
        </button>
      )}
    </div>
  );
}