import { useState, useMemo } from "react";
import { Search, Plus, LayoutGrid, List, FileSpreadsheet, Clock, CheckCircle2, ShoppingBag } from "lucide-react";
import { usePrList, useCreatePr } from "../api/usePr";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { apiClient } from "@shared/lib/api-client";
import { extractErrorMessage } from "@shared/types/api";

import { PendingPoSection } from "../components/pr/PendingPoSection";
import { PrPipelineCard } from "../components/pr/PrPipelineCard";
import { PrTableRow } from "../components/pr/PrTableRow";
import { PrFormModal } from "../components/pr/PrFormModal";
import { PrPagination } from "../components/prpagination";
import type { PrStatus, PrLineForm, PrFormValues } from "../types/pr";

const STATUS_LABELS: Record<PrStatus, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  converted_to_po: "Sudah Jadi PO",
};

const EMPTY_LINE = (): PrLineForm => ({
  item_id: null,
  item_name: "",
  line_type: "goods",
  description: "",
  quantity: 1,
  uom: "pcs",
  estimated_unit_price: 0,
  channel: "offline",
});

const EMPTY_FORM: PrFormValues = {
  purpose: "",
  department_id: "",
  cost_center_id: "",
  notes: "",
  employee_id: "",
  employee_name: "",
  required_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  priority: "normal",
  need_type: "consumable",
  justification: "",
  lines: [],
};

export function PrListPage() {
  const [tab, setTab] = useState<"pipeline" | "list">("pipeline");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PrStatus | "">("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<PrFormValues>(EMPTY_FORM);
  const [lines, setLines] = useState<PrLineForm[]>([EMPTY_LINE()]);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const orgId = useActiveOrgId();
  const createMutation = useCreatePr();

  const { data, isLoading, refetch } = usePrList({
    page,
    per_page: 6,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  // Fetch semua PR tanpa paginasi ketat/per_page besar untuk kalkulasi statistik kartu KPI yang akurat
  const { data: allDataForStats } = usePrList({
    per_page: 100,
  });

  const prListForStats = allDataForStats?.data ?? [];

  // Hitung metrik untuk KPI Cards
  const totalPrCount = prListForStats.length;
  const draftCount = useMemo(
    () => prListForStats.filter((pr) => pr.status === "draft").length,
    [prListForStats]
  );
  const submittedCount = useMemo(
    () => prListForStats.filter((pr) => pr.status === "submitted").length,
    [prListForStats]
  );
  const approvedCount = useMemo(
    () => prListForStats.filter((pr) => pr.status === "approved" || pr.status === "converted_to_po").length,
    [prListForStats]
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setLines([EMPTY_LINE()]);
    setError(null);
    setStagedFiles([]);
    setShowModal(true);
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.purpose?.trim()) {
      setError("Tujuan/keperluan wajib diisi.");
      return;
    }

    const validLines = lines.filter(
      (l) => l.description.trim() && l.quantity > 0
    );

    if (validLines.length === 0) {
      setError("Minimal 1 baris barang/jasa wajib diisi.");
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        purpose: form.purpose.trim(),
        employee_id: form.employee_id ? Number(form.employee_id) : undefined,
        department_id: form.department_id ? Number(form.department_id) : undefined,
        cost_center_id: form.cost_center_id ? Number(form.cost_center_id) : undefined,
        notes: form.notes ?? undefined,
        lines: validLines.map((l) => ({
          item_id: l.line_type === "service" ? undefined : (l.item_id ?? undefined),
          line_type: l.line_type,
          description: l.description.trim(),
          quantity: l.quantity,
          uom: l.uom,
          estimated_unit_price: l.estimated_unit_price,
          channel: l.channel,
        })),
      });

      const newPrId = (created as { id?: number })?.id;
      if (newPrId && stagedFiles.length > 0) {
        for (const file of stagedFiles) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("category", "supporting");
          try {
            await apiClient.post(
              `/v1/procurement-inventory/purchase-requests/${newPrId}/attachments`,
              fd,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
          } catch {
            // Silence failure
          }
        }
      }

      setShowModal(false);
      setPage(1);
      refetch();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const cardAnimationClass = "transition-all duration-200 ease-in-out select-none";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      <PageHeader
        title="Purchase Request"
        subtitle="Pengajuan kebutuhan pembelian — lampirkan file penunjang sebelum dibuatkan PO."
        containerClassName="px-7 pt-5 pb-2"
      />

      <div className="flex flex-col gap-6 px-7 py-5">
        <PendingPoSection />

        {/* ── Top Overview Card: Banner & 4 KPI Cards untuk PR ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-5">
          <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5 flex-1 w-full sm:w-auto">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                <FileSpreadsheet size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-bold text-amber-800 tracking-wide uppercase">
                    Ringkasan Pengajuan Purchase Request (PR)
                  </h2>
                  <span className="text-[11px] font-bold font-mono text-amber-700">
                    {totalPrCount} Total PR Tercatat
                  </span>
                </div>
                <div className="w-full bg-amber-100/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${totalPrCount > 0 ? 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-amber-200/80 w-full sm:w-auto justify-between sm:justify-end shadow-xs shrink-0">
              <span className="text-xs font-medium text-slate-600">Status Aktif:</span>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {submittedCount} Menunggu Approval
              </span>
            </div>
          </div>

          {/* 4 Kartu Statistik Interaktif PR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-4 ${cardAnimationClass}`}>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <ShoppingBag size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">Total Keseluruhan PR</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{totalPrCount} <span className="text-xs font-normal text-slate-400">Dokumen</span></h3>
              </div>
            </div>

            <div className={`p-5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-4 ${cardAnimationClass}`}>
              <div className="p-3 bg-slate-100 text-slate-600 rounded-xl shrink-0">
                <Clock size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">Status Draft</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{draftCount} <span className="text-xs font-normal text-slate-400">Draft</span></h3>
              </div>
            </div>

            <div className={`p-5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-4 ${cardAnimationClass}`}>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <Clock size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">Menunggu Approval</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{submittedCount} <span className="text-xs font-normal text-slate-400">Pending</span></h3>
              </div>
            </div>

            <div className={`p-5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-4 ${cardAnimationClass}`}>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">Disetujui / Jadi PO</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{approvedCount} <span className="text-xs font-normal text-slate-400">Selesai</span></h3>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setTab("pipeline")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${tab === "pipeline"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <LayoutGrid size={14} /> Pipeline
              </button>
              <button
                type="button"
                onClick={() => setTab("list")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${tab === "list"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <List size={14} /> Daftar
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari PR..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <select
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as PrStatus | "");
                  setPage(1);
                }}
              >
                <option value="">Semua Status</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={openCreate}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Plus size={15} /> PR Baru
              </button>
            </div>
          </div>

          {isLoading && <LoadingState />}

          {!isLoading && data?.data.length === 0 && (
            <EmptyState
              title="Belum Ada Purchase Request"
              subtitle="Tidak ada pengajuan PR yang sesuai dengan kriteria/filter."
            />
          )}

          {!isLoading && data && data.data.length > 0 && tab === "pipeline" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.data.map((pr) => (
                  <PrPipelineCard key={pr.id} pr={pr} onRefresh={refetch} />
                ))}
              </div>
              <PrPagination
                currentPage={data.current_page}
                lastPage={data.last_page}
                total={data.total}
                onPageChange={setPage}
              />
            </div>
          )}

          {!isLoading && data && data.data.length > 0 && tab === "list" && (
            <div className="flex flex-col gap-4">
              <div className="border border-slate-200/90 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">NO PR</th>
                        <th className="py-3 px-4">TUJUAN</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-4 text-center">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {data.data.map((pr) => (
                        <PrTableRow key={pr.id} pr={pr} onRefresh={refetch} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <PrPagination
                currentPage={data.current_page}
                lastPage={data.last_page}
                total={data.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <PrFormModal
          form={form}
          setForm={setForm}
          lines={lines}
          setLines={setLines}
          stagedFiles={stagedFiles}
          setStagedFiles={setStagedFiles}
          error={error}
          isSaving={createMutation.isPending}
          onSubmit={handleSubmitForm}
          onClose={() => setShowModal(false)}
          orgId={orgId}
        />
      )}
    </div>
  );
}

export default PrListPage;