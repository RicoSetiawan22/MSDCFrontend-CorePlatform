import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  useOtb,
  useOtbPorts,
  useReleaseOtbPort,
  useMarkOtbPortDamaged,
  useRepairOtbPort,
} from "../api/useOtb";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import { extractErrorMessage } from "@shared/types/api";
import type { OtbPort, OtbPortStatus } from "../types/otb";
import {
  OtbDetailHero,
  OtbPortTable,
  OtbPortReleaseModal,
  OtbPortDamagedModal,
  OtbPortAllocateModal,
} from "../components/otb";
import {
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  X,
  Wrench,
} from "lucide-react";

export function OtbDetailPage() {
  const { id } = useParams<{ id: string }>();
  const otbId = id ? Number(id) : undefined;

  // Pagination & Filter States (Default 15 per page as requested: 15, 30, 50)
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // Action Modals State
  const [allocateTarget, setAllocateTarget] = useState<OtbPort | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<OtbPort | null>(null);
  const [damagedTarget, setDamagedTarget] = useState<OtbPort | null>(null);
  const [repairTarget, setRepairTarget] = useState<OtbPort | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Queries
  const { data: otb, isLoading: loadingOtb, refetch: refetchOtb } = useOtb(otbId);
  const {
    data: ports,
    isLoading: loadingPorts,
    refetch: refetchPorts,
  } = useOtbPorts(otbId, {
    page,
    per_page: perPage,
    status: (statusFilter || undefined) as OtbPortStatus | undefined,
    search: search.trim() || undefined,
  });

  // Mutations
  const releaseMutation = useReleaseOtbPort();
  const damagedMutation = useMarkOtbPortDamaged();
  const repairMutation = useRepairOtbPort();

  // Handlers
  async function handleConfirmRelease() {
    if (!releaseTarget) return;
    try {
      setActionError(null);
      await releaseMutation.mutateAsync(releaseTarget.id);
      setReleaseTarget(null);
    } catch (err) {
      setActionError(extractErrorMessage(err));
      setReleaseTarget(null);
    }
  }

  async function handleConfirmDamaged() {
    if (!damagedTarget) return;
    try {
      setActionError(null);
      await damagedMutation.mutateAsync(damagedTarget.id);
      setDamagedTarget(null);
    } catch (err) {
      setActionError(extractErrorMessage(err));
      setDamagedTarget(null);
    }
  }

  async function handleConfirmRepair() {
    if (!repairTarget) return;
    try {
      setActionError(null);
      await repairMutation.mutateAsync(repairTarget.id);
      setRepairTarget(null);
    } catch (err) {
      setActionError(extractErrorMessage(err));
      setRepairTarget(null);
    }
  }

  if (loadingOtb) {
    return (
      <div className="py-24">
        <LoadingState />
      </div>
    );
  }

  if (!otb) {
    return (
      <div className="px-7 py-12">
        <EmptyState
          title="OTB Tidak Ditemukan"
          subtitle="Data OTB ini mungkin sudah dihapus atau URL tidak valid."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── 1. Hero & Breadcrumb Section (Sesuai Gambar UI 1) ── */}
      <OtbDetailHero otb={otb} />

      {/* ── Inline Action Error Banner ── */}
      {actionError && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start justify-between gap-3 text-xs text-rose-800 animate-in fade-in duration-150 shadow-xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <strong className="font-semibold text-rose-900">Operasi Gagal: </strong>
              <span>{actionError}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Tutup pesan error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── 2. Table Section (Strip Kuning Emas Pastel, Aksi 3 Ikon & Paginasi [15, 30, 50]) ── */}
      <OtbPortTable
        ports={ports?.data ?? []}
        isLoading={loadingPorts}
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        onAllocate={(port) => {
          setActionError(null);
          setAllocateTarget(port);
        }}
        onRelease={(port) => {
          setActionError(null);
          setReleaseTarget(port);
        }}
        onMarkDamaged={(port) => {
          setActionError(null);
          setDamagedTarget(port);
        }}
        onRepair={(port) => {
          setActionError(null);
          setRepairTarget(port);
        }}
        currentPage={page}
        totalPages={ports?.last_page ?? 1}
        perPage={perPage}
        total={ports?.total ?? 0}
        onPageChange={setPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage);
          setPage(1);
        }}
      />

      {/* ── 3. Modal Lepas Alokasi Port (Blue Theme - Gambar UI 2) ── */}
      <OtbPortReleaseModal
        port={releaseTarget}
        otb={otb}
        isOpen={Boolean(releaseTarget)}
        onClose={() => setReleaseTarget(null)}
        onConfirm={handleConfirmRelease}
        isPending={releaseMutation.isPending}
      />

      {/* ── 4. Modal Tandai Port Rusak (Red Theme - Gambar UI 3) ── */}
      <OtbPortDamagedModal
        port={damagedTarget}
        otb={otb}
        isOpen={Boolean(damagedTarget)}
        onClose={() => setDamagedTarget(null)}
        onConfirm={handleConfirmDamaged}
        isPending={damagedMutation.isPending}
      />

      {/* ── 5. Modal Alokasikan Port (Enhanced Design - Gambar UI 4) ── */}
      <OtbPortAllocateModal
        port={allocateTarget}
        otb={otb}
        isOpen={Boolean(allocateTarget)}
        onClose={() => setAllocateTarget(null)}
        onSuccess={() => {
          refetchPorts();
          refetchOtb();
        }}
      />

      {/* ── 6. Modal Konfirmasi Selesai Perbaikan Port (Green Theme) ── */}
      {repairTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={repairMutation.isPending ? undefined : () => setRepairTarget(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="repair-dialog-title"
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/80 shadow-2xs shrink-0">
                  <Wrench size={22} className="stroke-[2.2]" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 text-[10px] font-bold tracking-wider text-emerald-700 uppercase mb-1">
                    Selesai Perbaikan Port
                  </div>
                  <h2 id="repair-dialog-title" className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    Pulihkan Port #{repairTarget.port_number}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tandai port sudah selesai diperbaiki dan siap digunakan kembali.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRepairTarget(null)}
                disabled={repairMutation.isPending}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                aria-label="Tutup dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 my-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                <span className="text-[11px] text-slate-500 font-medium">Port &amp; OTB Terpilih</span>
                <span className="font-mono font-bold text-slate-900">
                  Port #{repairTarget.port_number} • {otb.tag_number}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium mb-1">Status Saat Ini</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Damaged
                  </span>
                </div>
                <ArrowRight size={16} className="text-slate-400 mt-3" />
                <div className="flex flex-col items-end">
                  <span className="text-[11px] text-slate-500 font-medium mb-1">Status Setelah Dipulihkan</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    Available (Tersedia)
                  </span>
                </div>
              </div>
            </div>

            {/* Catatan Operasional */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-2.5 mb-5 text-xs text-emerald-900">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Port yang telah diperbaiki akan berstatus <strong>Available</strong> dan siap kembali dialokasikan untuk layanan pelanggan atau cross-connect.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRepairTarget(null)}
                disabled={repairMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRepair}
                disabled={repairMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-w-[140px]"
              >
                {repairMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="stroke-[2.2]" />
                    <span>Ya, Pulihkan Port</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OtbDetailPage;
