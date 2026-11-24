import { useState, useMemo, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Plus,
  X,
  FileDown,
  RotateCcw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  FilterX,
  UserCheck,
  Paperclip,
  Upload,
} from "lucide-react";
import { fileApi } from "@shared/api/fileApi";
import {
  useDamagedItemReturnList,
  useCreateDamagedItemReturn,
  useSubmitDamagedItemReturn,
  useCancelDamagedItemReturn,
  useMarkDamagedItemReceived,
  useReturnableAssets,
} from "../api/useDamagedItemReturn";
import { DamagedReturnEvidenceModal } from "./DamagedReturnEvidenceModal";
import { damagedItemReturnApi } from "../api/damagedItemReturnApi";
import { ProcurementFormModal } from "../components/ProcurementFormModal";
import { PdfPreviewModal } from "@shared/components/PdfPreviewModal";
import { ApprovalStepsList } from "@shared/components/ApprovalStepsList";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { useAuth } from "@shared/lib/auth-context";
import { employeeApi } from "@modules/hr-service-support/api/employeeApi";
import type { Employee } from "@modules/hr-service-support/types/employee";
import type {
  DamagedItemReturn,
  DamagedItemReturnStatus,
  ReturnableAsset,
} from "../types/damagedItemReturn";

const STATUS_LABELS: Record<DamagedItemReturnStatus, string> = {
  draft: "Draft",
  submitted: "Menunggu Diketahui Manager",
  approved: "Disetujui Keuangan",
  rejected: "Ditolak",
  received: "Sudah Diterima Gudang",
  cancelled: "Dibatalkan",
};

const STATUS_BADGE_CLASSES: Record<DamagedItemReturnStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-amber-50 text-amber-700 border-amber-200/80",
  approved: "bg-purple-50 text-purple-700 border-purple-200/80",
  rejected: "bg-rose-50 text-rose-700 border-rose-200/80",
  received: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

export function DamagedItemReturnListPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("damaged-item-return.manage");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DamagedItemReturnStatus | "">("");
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useDamagedItemReturnList({
    page,
    per_page: 20,
    status: statusFilter || undefined,
  });

  const returnsList = useMemo(() => data?.data ?? [], [data]);

  // KPI Calculations
  const totalReturns = data?.total ?? 0;
  const submittedCount = useMemo(
    () => returnsList.filter((r) => r.status === "submitted").length,
    [returnsList]
  );
  const approvedCount = useMemo(
    () => returnsList.filter((r) => r.status === "approved").length,
    [returnsList]
  );
  const receivedCount = useMemo(
    () => returnsList.filter((r) => r.status === "received").length,
    [returnsList]
  );

  const resolvePercentage =
    totalReturns > 0 ? Math.round((receivedCount / totalReturns) * 100) : 100;

  const filteredReturns = useMemo(() => {
    if (!search) return returnsList;
    const q = search.toLowerCase();
    return returnsList.filter(
      (r) =>
        r.return_number.toLowerCase().includes(q) ||
        (r.asset?.asset_number && r.asset.asset_number.toLowerCase().includes(q)) ||
        (r.asset?.asset_name && r.asset.asset_name.toLowerCase().includes(q)) ||
        (r.returned_by_employee?.full_name && r.returned_by_employee.full_name.toLowerCase().includes(q))
    );
  }, [returnsList, search]);

  const cardAnimationClass =
    "transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 active:scale-95 active:translate-y-0 select-none";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. PageHeader Banner (Navy Blue & Gold Diagonal) ── */}
      <PageHeader
        title="Pengembalian Barang Rusak (FPRG)"
        subtitle="Serah terima aset berkode yang rusak dari user kembali ke gudang — diketahui Manager, disetujui Keuangan."
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── 2. Pembungkus Konten Utama ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* ── Top Overview Card: Banner & 4 KPI Cards (Persis Referensi) ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          {/* Banner Status Health */}
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5 flex-1 w-full sm:w-auto">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-bold text-emerald-800 tracking-wide uppercase">
                    Status Operasional Pengembalian Barang Rusak (FPRG)
                  </h2>
                  <span className="text-[11px] font-bold font-mono text-emerald-700">
                    {resolvePercentage}% Sudah Diterima Gudang
                  </span>
                </div>
                <div className="w-full bg-emerald-100/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${resolvePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-emerald-200/80 w-full sm:w-auto justify-between sm:justify-end shadow-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                <RotateCcw size={15} className="text-amber-500" />
                <span>Total Pengembalian:</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {totalReturns} Dokumen
              </span>
            </div>
          </div>

          {/* 4 Kartu Statistik Interaktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total FPRG */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === ""
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <RotateCcw size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Total FPRG
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {totalReturns}{" "}
                  <span className="text-xs font-normal text-slate-400">Dokumen</span>
                </h3>
              </div>
            </button>

            {/* Card 2: Menunggu Diketahui */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "submitted" ? "" : "submitted");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "submitted"
                  ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-amber-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <Clock size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Menunggu Diketahui
                </p>
                <h3 className="text-2xl font-bold text-amber-600 mt-0.5">
                  {submittedCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Kasus</span>
                </h3>
              </div>
            </button>

            {/* Card 3: Disetujui Keuangan */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "approved" ? "" : "approved");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "approved"
                  ? "border-purple-500 ring-2 ring-purple-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-purple-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Disetujui Keuangan
                </p>
                <h3 className="text-2xl font-bold text-purple-600 mt-0.5">
                  {approvedCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Unit</span>
                </h3>
              </div>
            </button>

            {/* Card 4: Sudah Diterima Gudang */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "received" ? "" : "received");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "received"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Diterima Gudang
                </p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">
                  {receivedCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Selesai</span>
                </h3>
              </div>
            </button>
          </div>
        </div>

        {/* ── Main Table Card: Toolbar & Data Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          {/* Toolbar Sesuai Referensi */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              {/* Search input */}
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Cari No. FPRG / Kode Barang / Employee..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as DamagedItemReturnStatus | "");
                  setPage(1);
                }}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="">Semua Status</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>

              {statusFilter !== "" && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("");
                    setPage(1);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200/60 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer"
                >
                  <FilterX size={14} /> Reset Filter
                </button>
              )}
            </div>

            {/* Tombol Aksi Tambah (Kuning Emas Sesuai Referensi) */}
            {canManage && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus size={16} />
                <span>Pengembalian Baru</span>
              </button>
            )}
          </div>

          {isLoading && <LoadingState />}
          {!isLoading && filteredReturns.length === 0 && (
            <EmptyState
              title="Belum Ada Pengembalian Barang Rusak"
              subtitle="Aset berkode yang dikembalikan dari user ke gudang karena rusak akan muncul di sini."
            />
          )}

          {!isLoading && filteredReturns.length > 0 && (
            <div className="border border-slate-200/90 rounded-xl overflow-hidden mt-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">No FPRG</th>
                      <th className="py-3.5 px-4">Barang / Aset</th>
                      <th className="py-3.5 px-4">Dikembalikan Oleh</th>
                      <th className="py-3.5 px-4">Status & Alur</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {filteredReturns.map((r) => (
                      <DamagedItemReturnRow key={r.id} ret={r} />
                    ))}
                  </tbody>
                </table>
              </div>
              {data && data.last_page > 1 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/40">
                  <Pagination
                    currentPage={data.current_page}
                    lastPage={data.last_page}
                    total={data.total}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && <DamagedItemReturnFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function DamagedItemReturnRow({ ret }: { ret: DamagedItemReturn }) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("damaged-item-return.manage");
  const orgId = useActiveOrgId();
  const submitMutation = useSubmitDamagedItemReturn(ret.id);
  const cancelMutation = useCancelDamagedItemReturn(ret.id);
  const receivedMutation = useMarkDamagedItemReceived(ret.id);
  const [showEvidence, setShowEvidence] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  async function handleSubmit() {
    if (!confirm(`Submit Pengembalian ${ret.return_number} untuk diketahui Manager?`)) return;
    try {
      await submitMutation.mutateAsync();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleCancel() {
    if (!confirm(`Batalkan Pengembalian ${ret.return_number}?`)) return;
    try {
      await cancelMutation.mutateAsync();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleMarkReceived() {
    if (
      !confirm(
        `Konfirmasi barang untuk FPRG ${ret.return_number} SUDAH diterima gudang? Aset akan ditandai "Retired" dan kepemilikannya dikembalikan ke gudang.`
      )
    )
      return;
    try {
      await receivedMutation.mutateAsync();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handlePreviewPdf() {
    if (!orgId) return;
    setDownloadingPdf(true);
    try {
      const res = await damagedItemReturnApi.downloadPdf(ret.id, orgId);
      setPreviewBlob(res.data);
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <>
      <tr className="hover:bg-slate-50/60 transition-colors">
        <td className="py-3.5 px-4">
          <div className="font-mono text-xs font-bold text-slate-800">
            {ret.return_number}
          </div>
          {ret.return_date && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <Calendar size={11} />
              <span>{new Date(ret.return_date).toLocaleDateString("id-ID")}</span>
            </div>
          )}
        </td>
        <td className="py-3.5 px-4 text-xs">
          <div className="font-medium text-slate-900">{ret.asset?.asset_name ?? "—"}</div>
          <div className="inline-flex items-center font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
            {ret.asset?.asset_number ?? "—"}
          </div>
          {ret.damage_description && (
            <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
              {ret.damage_description}
            </div>
          )}
        </td>
        <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
          <div className="flex items-center gap-1.5">
            <UserCheck size={14} className="text-emerald-600 shrink-0" />
            <span>{ret.returned_by_employee?.full_name ?? "—"}</span>
          </div>
        </td>
        <td className="py-3.5 px-4">
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border w-fit ${
                STATUS_BADGE_CLASSES[ret.status] ?? "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {STATUS_LABELS[ret.status]}
            </span>
            {ret.status === "submitted" && (
              <div className="text-xs">
                <ApprovalStepsList workflowInstanceId={ret.workflow_instance_id} />
              </div>
            )}
          </div>
        </td>
        <td className="py-3.5 px-4 text-center">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowEvidence(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
            >
              <Paperclip size={12} />
              <span>Bukti Kerusakan</span>
            </button>
            {ret.status === "draft" && canManage && (
              <>
                <button
                  type="button"
                  disabled={submitMutation.isPending}
                  onClick={handleSubmit}
                  className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  Submit
                </button>
                <button
                  type="button"
                  disabled={cancelMutation.isPending}
                  onClick={handleCancel}
                  className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </>
            )}
            {ret.status === "approved" && canManage && (
              <button
                type="button"
                disabled={receivedMutation.isPending}
                onClick={handleMarkReceived}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors cursor-pointer"
              >
                <CheckCircle2 size={12} />
                <span>Terima Barang</span>
              </button>
            )}
            {ret.status !== "draft" && (
              <button
                type="button"
                disabled={downloadingPdf}
                onClick={handlePreviewPdf}
                title="Pratinjau PDF FPRG"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
              >
                <FileDown size={12} className="text-amber-500" />
                <span>PDF</span>
              </button>
            )}
          </div>
        </td>
      </tr>
      {showEvidence && (
        <DamagedReturnEvidenceModal
          key={`${orgId}-${ret.id}`}
          id={ret.id}
          onClose={() => setShowEvidence(false)}
        />
      )}
      {previewBlob && (
        <PdfPreviewModal
          title={`FPRG — ${ret.return_number}`}
          blob={previewBlob}
          filename={`FPRG_${ret.return_number}.pdf`}
          onClose={() => setPreviewBlob(null)}
        />
      )}
    </>
  );
}

function DamagedItemReturnFormModal({ onClose }: { onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [assetId, setAssetId] = useState<number | "">("");
  const [assetSearch, setAssetSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<ReturnableAsset | null>(null);
  const [returnedBy, setReturnedBy] = useState<Employee | { id: number; full_name: string } | null>(null);
  const [returnDate, setReturnDate] = useState(today);
  const [incidentDate, setIncidentDate] = useState(today);
  const [damageSeverity, setDamageSeverity] = useState<"minor" | "moderate" | "severe">("moderate");
  const [damageCause, setDamageCause] = useState<"normal_wear" | "negligence" | "accident" | "force_majeure">("normal_wear");
  const [actionRecommendation, setActionRecommendation] = useState<"internal_repair" | "warranty_claim" | "replacement" | "write_off">("internal_repair");
  const [damageDescription, setDamageDescription] = useState("");
  const [photoProof, setPhotoProof] = useState<{ id: number; name: string } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createMutation = useCreateDamagedItemReturn();

  const { data: returnableAssets } = useReturnableAssets(assetSearch);

  function selectAsset(a: ReturnableAsset) {
    setAssetId(a.id);
    setSelectedAsset(a);
    setAssetSearch("");
    if (a.assigned_to_employee) setReturnedBy(a.assigned_to_employee);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await fileApi.upload(file, "ProcurementInventory", "DamagedItemReturn");
      setPhotoProof({ id: res.data.data.id, name: res.data.data.original_name });
    } catch {
      setError("Gagal mengunggah foto bukti kerusakan.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!assetId) {
      setError("Pilih aset yang dikembalikan.");
      return;
    }
    if (!returnedBy) {
      setError("Pilih employee yang mengembalikan barang.");
      return;
    }
    if (returnDate > today) {
      setError("Tanggal pengembalian tidak boleh di masa depan.");
      return;
    }
    if (incidentDate > today) {
      setError("Tanggal kejadian tidak boleh di masa depan.");
      return;
    }
    if (incidentDate > returnDate) {
      setError("Tanggal kejadian tidak boleh setelah tanggal pengembalian.");
      return;
    }
    if (!damageDescription.trim()) {
      setError("Jelaskan detail kerusakan fisik dan kondisi barang.");
      return;
    }

    try {
      const severityMap = {
        minor: "Ringan",
        moderate: "Sedang",
        severe: "Berat / Rusak Total",
      };
      const causeMap = {
        normal_wear: "Pemakaian Wajar / Usia",
        negligence: "Kelalaian Pengguna",
        accident: "Kecelakaan / Terjatuh / Kena Air",
        force_majeure: "Bencana / Force Majeure",
      };
      const recMap = {
        internal_repair: "Perbaikan Teknisi Internal",
        warranty_claim: "Klaim Garansi ke Vendor",
        replacement: "Penggantian Unit Baru",
        write_off: "Afkir / Penghapusan Aset",
      };

      const auditNotes = [
        `[Tingkat: ${severityMap[damageSeverity]}]`,
        `[Penyebab: ${causeMap[damageCause]}]`,
        `[Rekomendasi: ${recMap[actionRecommendation]}]`,
        `[Tgl Kejadian: ${incidentDate}]`,
        photoProof ? `[Foto Bukti: ${photoProof.name}]` : null,
      ]
        .filter(Boolean)
        .join(" ");

      await createMutation.mutateAsync({
        asset_id: assetId,
        returned_by_employee_id: returnedBy.id,
        damage_description: `${damageDescription.trim()} ${auditNotes}`,
        return_date: returnDate,
        notes: auditNotes || undefined,
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <ProcurementFormModal
      title="Pengembalian Barang Rusak (FPRG) Baru"
      subtitle="Formulir resmi serah terima barang/aset rusak ke bagian perlengkapan gudang"
      icon={RotateCcw}
      onClose={onClose}
      maxWidth="max-w-[620px]"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="damaged-return-form"
            disabled={createMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {createMutation.isPending ? "Menyimpan..." : "Simpan Dokumen FPRG"}
          </button>
        </>
      }
    >
      <form id="damaged-return-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5 py-1">
        {/* Pilih Aset */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Barang / Aset yang Dikembalikan *
          </label>
          {selectedAsset ? (
            <div className="flex items-center justify-between gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-sm">
              <div>
                <span className="font-bold text-amber-950 font-mono">
                  {selectedAsset.asset_name}
                </span>
                <span className="text-xs text-amber-700 block font-mono">
                  Kode: {selectedAsset.asset_number} — Dipegang oleh {selectedAsset.assigned_to_employee?.full_name ?? "—"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAsset(null);
                  setAssetId("");
                  setReturnedBy(null);
                }}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
                  placeholder="Cari nama atau Kode Barang yang sedang dipegang..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                />
              </div>
              {(returnableAssets ?? []).length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {(returnableAssets ?? []).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="w-full p-2.5 text-left hover:bg-slate-50 text-xs text-slate-800 flex flex-col gap-0.5 transition-colors cursor-pointer"
                      onClick={() => selectAsset(a)}
                    >
                      <span className="font-semibold text-slate-900">{a.asset_name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        ({a.asset_number}) — dipegang {a.assigned_to_employee?.full_name ?? "—"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {returnableAssets && returnableAssets.length === 0 && (
                <div className="text-xs text-slate-400 mt-1.5 italic">
                  Tidak ada aset yang terdaftar sedang dipegang employee saat ini.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dikembalikan Oleh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Dikembalikan Oleh (Employee Penanggung Jawab) *
          </label>
          <EmployeePickerField
            employeeId={returnedBy?.id ?? ""}
            employeeName={returnedBy?.full_name ?? ""}
            onSelect={setReturnedBy}
          />
        </div>

        {/* Tanggal Kejadian & Tanggal Pengembalian */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Tanggal Kejadian Kerusakan *
            </label>
            <input
              type="date"
              required
              max={today}
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Tanggal Pengembalian ke Gudang *
            </label>
            <input
              type="date"
              required
              max={today}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Tingkat & Penyebab Kerusakan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Tingkat Keparahan Kerusakan *
            </label>
            <select
              value={damageSeverity}
              onChange={(e) => setDamageSeverity(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            >
              <option value="minor">Ringan (Baret / Minus Fisik Kecil)</option>
              <option value="moderate">Sedang (Komponen Rusak / Gangguan Fungsi)</option>
              <option value="severe">Berat (Mati Total / Pecah Parah / Tak Berfungsi)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Penyebab Kerusakan *
            </label>
            <select
              value={damageCause}
              onChange={(e) => setDamageCause(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            >
              <option value="normal_wear">Pemakaian Wajar / Usia Pakai</option>
              <option value="negligence">Kelalaian Pengguna (Human Error)</option>
              <option value="accident">Kecelakaan (Jatuh / Terbentur / Air)</option>
              <option value="force_majeure">Bencana / Force Majeure (Petir/Banjir)</option>
            </select>
          </div>
        </div>

        {/* Rekomendasi Tindak Lanjut */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Rekomendasi Tindak Lanjut *
          </label>
          <select
            value={actionRecommendation}
            onChange={(e) => setActionRecommendation(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all font-medium"
          >
            <option value="internal_repair">Perbaikan Internal (Teknisi JTV / Bengkel Internal)</option>
            <option value="warranty_claim">Klaim Garansi ke Vendor (FGBG)</option>
            <option value="replacement">Pengadaan Unit Baru (FPR Pengganti)</option>
            <option value="write_off">Afkir / Penghapusan Aset (Scrap)</option>
          </select>
        </div>

        {/* Deskripsi Kronologi / Kerusakan */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Kronologi &amp; Rincian Kerusakan Fisik *
          </label>
          <textarea
            rows={3}
            value={damageDescription}
            onChange={(e) => setDamageDescription(e.target.value)}
            placeholder="Jelaskan bagaimana kerusakan terjadi, bagian mana yang cacat/patah/mati, dan gejala yang terlihat..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all resize-y"
          />
        </div>

        {/* Upload Foto Bukti Kerusakan Langsung */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Foto Bukti Kerusakan Fisik (Opsional saat input)
          </label>
          {photoProof ? (
            <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
              <span className="flex items-center gap-1.5 truncate">
                <Paperclip size={14} /> {photoProof.name}
              </span>
              <button
                type="button"
                onClick={() => setPhotoProof(null)}
                className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 p-3 border border-dashed border-slate-300 rounded-xl cursor-pointer text-xs text-slate-500 hover:bg-slate-50 transition-all">
              <Upload size={15} className="text-slate-400" />
              <span>
                {uploadingPhoto
                  ? "Mengunggah foto..."
                  : "Pilih foto bukti fisik barang rusak (JPG, PNG, PDF)"}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="hidden"
              />
            </label>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-medium text-rose-700">
            {error}
          </div>
        )}
      </form>
    </ProcurementFormModal>
  );
}

function EmployeePickerField({
  employeeId,
  employeeName,
  onSelect,
}: {
  employeeId: number | "";
  employeeName: string;
  onSelect: (emp: Employee | null) => void;
}) {
  const [search, setSearch] = useState("");
  const { data: results } = useQuery({
    queryKey: ["employee-search", search],
    queryFn: () =>
      employeeApi.list({ search, per_page: 10 }).then((r) => r.data?.data ?? []),
    enabled: search.length >= 2,
  });

  if (employeeId) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-sm">
        <span className="font-semibold text-amber-900">{employeeName}</span>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
        placeholder="Cari nama employee..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search.length >= 2 && results && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
          {results.length === 0 && (
            <div className="p-3 text-xs text-slate-400">Tidak ditemukan.</div>
          )}
          {results.map((emp) => (
            <button
              key={emp.id}
              type="button"
              className="w-full p-2.5 text-left hover:bg-slate-50 text-xs text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              onClick={() => {
                onSelect(emp);
                setSearch("");
              }}
            >
              <span className="font-medium text-slate-900">{emp.full_name}</span>
              <span className="text-[11px] font-mono text-slate-400">({emp.employee_number})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}