import { useState, useMemo } from "react";
import {
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  X,
  FilterX,
  Layers,
  FileCheck2,
  Plus,
} from "lucide-react";
import { useGrnList } from "../api/useGrn";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import type { GrnStatus } from "../types/grn";
import { GrnTable } from "../components/grn/GrnTable";
import { EmployeeFilterPicker } from "../components/grn/EmployeeFilterPicker";
import { ReceiveGoodsModal } from "../components/grn/ReceiveGoodsModal";

const STATUS_LABELS: Record<GrnStatus, string> = {
  draft: "Draft",
  posted: "Posted",
  cancelled: "Dibatalkan",
};

export function GrnListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<GrnStatus | "">("");
  const [employeeFilter, setEmployeeFilter] = useState<{ id: number; full_name: string } | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useGrnList({
    page,
    per_page: 20,
    status: statusFilter || undefined,
    employee_id: employeeFilter?.id,
  });

  const grnList = data?.data ?? [];
  const totalGrn = data?.total ?? 0;

  // KPI Calculations
  const draftCount = useMemo(
    () => grnList.filter((g) => g.status === "draft").length,
    [grnList]
  );
  const postedCount = useMemo(
    () => grnList.filter((g) => g.status === "posted").length,
    [grnList]
  );
  const cancelledCount = useMemo(
    () => grnList.filter((g) => g.status === "cancelled").length,
    [grnList]
  );

  const healthPercentage =
    totalGrn > 0 ? Math.round((postedCount / (totalGrn || 1)) * 100) : 100;

  // Client-side search filtering
  const filteredItems = useMemo(() => {
    if (!search) return grnList;
    const q = search.toLowerCase();
    return grnList.filter((g) => {
      const matchGrn = g.grn_number && g.grn_number.toLowerCase().includes(q);
      const matchPo = g.purchase_order?.po_number && g.purchase_order.po_number.toLowerCase().includes(q);
      const matchVendor = g.purchase_order?.vendor?.vendor_name && g.purchase_order.vendor.vendor_name.toLowerCase().includes(q);
      const matchEmp = g.employee?.full_name && g.employee.full_name.toLowerCase().includes(q);
      return matchGrn || matchPo || matchVendor || matchEmp;
    });
  }, [grnList, search]);

  const hasActiveFilters = Boolean(search) || Boolean(statusFilter) || Boolean(employeeFilter);

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setEmployeeFilter(null);
    setPage(1);
  }

  const cardAnimationClass =
    "transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 active:scale-95 active:translate-y-0 select-none";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. PageHeader Banner (Navy Blue & Gold Diagonal) ── */}
      <PageHeader
        title="Goods Receipt (GRN)"
        subtitle="Penerimaan barang dan verifikasi fisik dari vendor rekanan — Bukti Penerimaan Barang per PIC gudang."
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
                    Status Penerimaan Fisik & Stok Masuk
                  </h2>
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      healthPercentage < 50 ? "text-amber-600" : "text-emerald-700"
                    }`}
                  >
                    {healthPercentage}% Stok Masuk (Posted)
                  </span>
                </div>
                <div className="w-full bg-emerald-100/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      healthPercentage < 50 ? "bg-amber-500" : "bg-emerald-600"
                    }`}
                    style={{ width: `${healthPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-emerald-200/80 w-full sm:w-auto justify-between sm:justify-end shadow-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                <Layers size={15} className="text-amber-500" />
                <span>Total Penerimaan:</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {totalGrn} Transaksi
              </span>
            </div>
          </div>

          {/* 4 Kartu Statistik Interaktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total GRN */}
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
                <Truck size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Total Penerimaan
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {totalGrn}{" "}
                  <span className="text-xs font-normal text-slate-400">Transaksi</span>
                </h3>
              </div>
            </button>

            {/* Card 2: Stok Masuk (Posted) */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "posted" ? "" : "posted");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "posted"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Stok Masuk (Posted)
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {postedCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Selesai</span>
                </h3>
              </div>
            </button>

            {/* Card 3: Menunggu Post (Draft) */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "draft" ? "" : "draft");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "draft"
                  ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-amber-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <Clock size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Draft (Perlu Cek)
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {draftCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Perlu Post</span>
                </h3>
              </div>
            </button>

            {/* Card 4: Dibatalkan */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "cancelled" ? "" : "cancelled");
                setPage(1);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "cancelled"
                  ? "border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-rose-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <XCircle size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Dibatalkan
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {cancelledCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Batal</span>
                </h3>
              </div>
            </button>
          </div>
        </div>

        {/* ── Main Data Card: Toolbar & GRN Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          {/* Info Box Alur */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
            <FileCheck2 size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Petunjuk Penerimaan:</strong> Klik tombol <strong className="text-amber-600">Post</strong> pada baris penerimaan bertipe draft agar kuantitas penerimaan barang otomatis menambahkan saldo fisik pada <strong>Stok Total Inventory</strong>.
            </span>
          </div>

          {/* Toolbar Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[220px]">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Cari No GRN, PO, vendor, atau PIC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Select */}
              <select
                className="px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as GrnStatus | "");
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

              {/* Employee Picker */}
              <div className="min-w-[220px]">
                <EmployeeFilterPicker
                  value={employeeFilter}
                  onChange={(emp) => {
                    setEmployeeFilter(emp);
                    setPage(1);
                  }}
                />
              </div>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all font-medium flex items-center gap-1"
                >
                  <FilterX size={14} />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>

            {/* Tombol Terima Barang Baru */}
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus size={16} />
              <span>Terima Barang (GRN Baru)</span>
            </button>
          </div>

          {/* Table States */}
          {isLoading && <LoadingState />}

          {!isLoading && filteredItems.length === 0 && (
            <EmptyState
              title="Belum Ada Goods Receipt"
              subtitle={
                hasActiveFilters
                  ? "Tidak ada penerimaan barang yang sesuai dengan kriteria filter."
                  : "Dokumen GRN dibuat secara otomatis saat barang dari vendor tiba dan diverifikasi di lokasi."
              }
            />
          )}

          {!isLoading && filteredItems.length > 0 && (
            <>
              <div className="border border-slate-200/90 rounded-xl overflow-hidden mt-1 shadow-2xs">
                <GrnTable items={filteredItems} />
              </div>

              <div className="pt-2">
                <Pagination
                  currentPage={data?.current_page ?? 1}
                  lastPage={data?.last_page ?? 1}
                  total={data?.total ?? 0}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Form Terima Barang */}
      {isCreateOpen && (
        <ReceiveGoodsModal
          onClose={() => setIsCreateOpen(false)}
          onSaved={() => setIsCreateOpen(false)}
        />
      )}
    </div>
  );
}