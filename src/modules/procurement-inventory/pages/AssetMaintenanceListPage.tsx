import { useState, useMemo, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Wrench,
  ClipboardList,
  AlertTriangle,
  ExternalLink,
  Pencil,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle2,
  DollarSign,
  Laptop,
  ShieldCheck,
  X,
  FilterX,
  QrCode,
  UploadCloud,
  FileText,
  Cpu,
  Sparkles,
} from "lucide-react";
import {
  useAssetList,
  useAsset,
  useAssetHistory,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useSetAssetStatus,
  useCreateSchedule,
  useOverdueSchedules,
} from "../api/useAsset";
import { apiClient } from "@shared/lib/api-client";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { EmployeePickerField } from "../components/pr/EmployeePickerField";
import type { Asset, AssetCategory, AssetStatus } from "../types/asset";

const CATEGORY_LABELS: Record<string, string> = {
  server: "Server",
  ac: "AC",
  laptop: "Laptop",
  furniture: "Furniture",
  network: "Network",
  rack: "Rack",
  cooling: "Cooling",
  power: "Power",
  other: "Lainnya",
};

const CATEGORY_OPTIONS = [
  { value: "server", label: "Server" },
  { value: "ac", label: "AC" },
  { value: "laptop", label: "Laptop" },
  { value: "furniture", label: "Furniture" },
  { value: "network", label: "Network" },
  { value: "power", label: "Power" },
  { value: "rack", label: "Rack" },
  { value: "cooling", label: "Cooling" },
  { value: "other", label: "Lainnya" },
];

const CONDITION_OPTIONS = [
  "Baru",
  "Bekas - Baik",
  "Bekas - Cukup",
  "Rusak Ringan",
  "Rusak Berat",
] as const;

const INTERVAL_OPTIONS = [
  "Tidak Ada",
  "Setiap 3 Bulan",
  "Setiap 6 Bulan",
  "Setiap 1 Tahun",
] as const;

const STATUS_LABELS: Record<AssetStatus, string> = {
  active: "Aktif",
  in_maintenance: "Dalam Maintenance",
  retired: "Retired",
};

function CustodyBadge({ asset }: { asset: Asset }) {
  const activeLoan = asset.loans?.[0];
  if (!activeLoan && !asset.assigned_to_employee) return null;
  return (
    <div className="flex flex-col gap-0.5 mt-1">
      {activeLoan && (
        <span className="inline-flex items-center text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 w-fit">
          Sedang Dipinjam ({activeLoan.borrower_employee?.full_name ?? "—"})
        </span>
      )}
      {asset.assigned_to_employee && (
        <span className="text-[11px] text-slate-500">
          PIC: <span className="font-medium text-slate-700">{asset.assigned_to_employee.full_name}</span>
        </span>
      )}
    </div>
  );
}

export function AssetMaintenanceListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | "">("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [detailAssetId, setDetailAssetId] = useState<number | null>(null);
  const [showRecordMaintenance, setShowRecordMaintenance] = useState(false);
  const [selectedAssetForMaintenance, setSelectedAssetForMaintenance] = useState<Asset | null>(null);

  const { data, isLoading, refetch } = useAssetList({
    page,
    per_page: 20,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
  });
  const { data: overdue } = useOverdueSchedules();
  const deleteMutation = useDeleteAsset();

  const assetList = useMemo(() => data?.data ?? [], [data]);

  // Statistik KPI
  const totalAssets = data?.total ?? assetList.length;
  const activeCount = useMemo(
    () => assetList.filter((a) => a.status === "active").length,
    [assetList]
  );
  const maintenanceCount = useMemo(
    () => assetList.filter((a) => a.status === "in_maintenance").length,
    [assetList]
  );
  const overdueCount = overdue?.length ?? 0;
  const totalValuation = useMemo(
    () =>
      assetList.reduce(
        (acc, a) => acc + (a.purchase_cost || a.acquisition_cost || 0),
        0
      ),
    [assetList]
  );
  const healthyPercentage =
    totalAssets > 0 ? Math.round((activeCount / totalAssets) * 100) : 100;

  // Filtered Assets (Search & Overdue)
  const filteredAssets = useMemo(() => {
    return assetList.filter((asset) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        asset.asset_name.toLowerCase().includes(q) ||
        asset.asset_number.toLowerCase().includes(q) ||
        (asset.brand && asset.brand.toLowerCase().includes(q)) ||
        (asset.model && asset.model.toLowerCase().includes(q)) ||
        (asset.serial_number && asset.serial_number.toLowerCase().includes(q));

      const matchesOverdue = !overdueOnly || (asset.overdue_schedule_count ?? 0) > 0;

      return matchesSearch && matchesOverdue;
    });
  }, [assetList, search, overdueOnly]);

  async function handleDelete(asset: Asset) {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus aset "${asset.asset_name}" (${asset.asset_number})?`
      )
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(asset.id);
      refetch();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  const cardAnimationClass =
    "transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 active:scale-95 active:translate-y-0 select-none";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. PageHeader Banner (Navy Blue & Gold Diagonal) ── */}
      <PageHeader
        title="Asset Maintenance"
        subtitle="Registrasi aset, preventive maintenance schedule, dan log perbaikan."
        containerClassName="px-7 pt-5 pb-2"
      />

      <div className="flex flex-col gap-6 px-7 py-5">
        {/* ── Top Overview Card: Banner Status & 4 KPI Cards ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          {/* Banner Status Health */}
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5 flex-1 w-full sm:w-auto">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-bold text-emerald-800 tracking-wide uppercase">
                    Kondisi Operasional Aset
                  </h2>
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      healthyPercentage <= 50 ? "text-rose-600" : "text-emerald-700"
                    }`}
                  >
                    {healthyPercentage}% Siap Operasi
                  </span>
                </div>
                <div className="w-full bg-emerald-100/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      healthyPercentage <= 50 ? "bg-rose-500" : "bg-emerald-600"
                    }`}
                    style={{ width: `${healthyPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-emerald-200/80 w-full sm:w-auto justify-between sm:justify-end shadow-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                <DollarSign size={15} className="text-amber-500" />
                <span>Valuasi Aset:</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">
                Rp {totalValuation.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* 4 Kartu Statistik Interaktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Aset */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setOverdueOnly(false);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "" && !overdueOnly
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Laptop size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Total Aset Terdaftar
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {totalAssets}{" "}
                  <span className="text-xs font-normal text-slate-400">Unit</span>
                </h3>
              </div>
            </button>

            {/* Card 2: Aset Aktif */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "active" ? "" : "active");
                setOverdueOnly(false);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "active" && !overdueOnly
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Aset Aktif / Normal
                </p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">
                  {activeCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Unit</span>
                </h3>
              </div>
            </button>

            {/* Card 3: Dalam Maintenance */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === "in_maintenance" ? "" : "in_maintenance");
                setOverdueOnly(false);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "in_maintenance" && !overdueOnly
                  ? "border-purple-500 ring-2 ring-purple-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-purple-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <Wrench size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Dalam Maintenance
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {maintenanceCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Unit</span>
                </h3>
              </div>
            </button>

            {/* Card 4: Jadwal Overdue */}
            <button
              type="button"
              onClick={() => {
                setOverdueOnly(!overdueOnly);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                overdueOnly
                  ? "border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-rose-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Jadwal Overdue
                </p>
                <h3 className="text-2xl font-bold text-rose-600 mt-0.5">
                  {overdueCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Jadwal</span>
                </h3>
              </div>
            </button>
          </div>
        </div>

        {/* ── Main Table Card: Toolbar & Data Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[240px] max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Cari aset, serial no, atau brand..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Kategori Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value as AssetCategory | "");
                  setPage(1);
                }}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="">Semua Kategori</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              {/* Filter Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as AssetStatus | "");
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

              {(statusFilter !== "" || overdueOnly || categoryFilter !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("");
                    setOverdueOnly(false);
                    setCategoryFilter("");
                    setPage(1);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200/60 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer"
                >
                  <FilterX size={14} /> Reset Filter Card
                </button>
              )}
            </div>

            {/* Tombol Catat Maintenance / Perbaikan */}
            <button
              type="button"
              onClick={() => {
                setSelectedAssetForMaintenance(null);
                setShowRecordMaintenance(true);
              }}
              className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Wrench size={15} />
              <span>Catat Maintenance</span>
            </button>

            {/* Tombol Daftarkan Asset (Kuning Emas Sesuai Referensi) */}
            <button
              type="button"
              onClick={() => {
                setEditingAsset(null);
                setShowCreate(true);
              }}
              className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Daftarkan Asset</span>
            </button>
          </div>

          {isLoading && <LoadingState />}
          {!isLoading && filteredAssets.length === 0 && (
            <EmptyState
              title="Belum Ada Asset Terdaftar"
              subtitle="Asset otomatis terdaftar dari Goods Receipt (is_dc_asset), atau daftarkan manual di sini."
            />
          )}

          {!isLoading && filteredAssets.length > 0 && (
            <>
              <div className="border border-slate-200/90 rounded-xl overflow-hidden mt-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4">No Asset</th>
                        <th className="py-3.5 px-4">Nama & Brand</th>
                        <th className="py-3.5 px-4">Kategori</th>
                        <th className="py-3.5 px-4">Site</th>
                        <th className="py-3.5 px-4">Garansi S/D</th>
                        <th className="py-3.5 px-4">Next Maintenance</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Maintenance</th>
                        <th className="py-3.5 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {filteredAssets.map((asset) => (
                        <tr
                          key={asset.id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-600">
                            {asset.asset_number}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{asset.asset_name}</div>
                            {(asset.brand || asset.model) && (
                              <div className="text-xs text-slate-400">
                                {[asset.brand, asset.model].filter(Boolean).join(" · ")}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                              {CATEGORY_LABELS[asset.category] ?? asset.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            {asset.site?.site_name ?? "—"}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            {asset.warranty_expiry ? formatDate(asset.warranty_expiry) : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            {asset.next_maintenance_date
                              ? formatDate(asset.next_maintenance_date)
                              : asset.maintenance_schedules?.[0]?.next_due_date
                              ? formatDate(asset.maintenance_schedules[0].next_due_date)
                              : "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                asset.status === "active"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                  : asset.status === "in_maintenance"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}
                            >
                              {STATUS_LABELS[asset.status]}
                            </span>
                            <CustodyBadge asset={asset} />
                          </td>
                          <td className="py-3 px-4">
                            {(asset.overdue_schedule_count ?? 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                <AlertTriangle size={11} /> {asset.overdue_schedule_count} Overdue
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                title="Lihat Detail"
                                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 text-xs font-semibold transition-colors cursor-pointer"
                                onClick={() => setDetailAssetId(asset.id)}
                              >
                                Detail
                              </button>
                              <button
                                type="button"
                                title="Catat Maintenance / Perbaikan"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer"
                                onClick={() => {
                                  setSelectedAssetForMaintenance(asset);
                                  setShowRecordMaintenance(true);
                                }}
                              >
                                <Wrench size={13} />
                              </button>
                              <button
                                type="button"
                                title="Edit Asset"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 transition-colors cursor-pointer"
                                onClick={() => setEditingAsset(asset)}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                title="Hapus Asset"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                                onClick={() => handleDelete(asset)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="pt-3">
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

      {/* ── Modal Input Asset (Persis Requirement Bagian 2) ── */}
      {(showCreate || editingAsset) && (
        <AssetFormModal
          editingAsset={editingAsset}
          existingAssets={assetList}
          onClose={() => {
            setShowCreate(false);
            setEditingAsset(null);
          }}
          onSaved={() => {
            refetch();
            setShowCreate(false);
            setEditingAsset(null);
          }}
        />
      )}

      {/* ── Modal Catat Maintenance / Perbaikan ── */}
      {showRecordMaintenance && (
        <RecordMaintenanceModal
          initialAsset={selectedAssetForMaintenance}
          assetList={assetList}
          onClose={() => {
            setShowRecordMaintenance(false);
            setSelectedAssetForMaintenance(null);
          }}
          onSaved={() => {
            refetch();
            setShowRecordMaintenance(false);
            setSelectedAssetForMaintenance(null);
          }}
        />
      )}

      {detailAssetId && (
        <AssetDetailModal assetId={detailAssetId} onClose={() => setDetailAssetId(null)} />
      )}
    </div>
  );
}

// ─── Component Modal Form Asset (Expanded & Enhanced) ───
interface SiteOption {
  id: number;
  site_name: string;
}

interface VendorOption {
  id: number;
  vendor_name: string;
  legal_entity?: string;
}

interface ItemOption {
  id: number;
  item_name: string;
  item_code?: string;
  category?: string;
  uom?: string;
}

interface AssetFormModalProps {
  editingAsset?: Asset | null;
  existingAssets?: Asset[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  // Sumber Aset
  source_type: "manual" | "po" | "grn" | "fstb";
  source_ref: string;
  item_id: string;
  barcode: string;

  // 1. Informasi Dasar Aset
  asset_name: string;
  category: string;
  brand: string;
  model: string;
  serial_number: string;
  condition: string;

  // 2. Lokasi & PIC
  site_id: string;
  specific_location: string;
  pic_employee_id: string | number;
  pic_name: string;

  // 3. Pembelian, Garansi & Nilai
  purchase_date: string;
  purchase_cost: string;
  warranty_expiry: string;
  vendor_id: string;
  vendor_name: string;
  custom_vendor: boolean;

  // 4. Data Depresiasi & Valuasi
  depreciation_method: string;
  useful_life_years: string;
  residual_value: string;

  // 5. Spesifikasi Teknis Kondisional (Server, Network, Laptop)
  hostname: string;
  ip_address: string;
  operating_system: string;
  hardware_specs: string;

  // 6. Jadwal Maintenance & Dokumen
  maintenance_interval: string;
  next_maintenance_date: string;
  notes: string;
  attachment_name: string;
}

interface ValidationErrors {
  asset_name?: string;
  category?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  condition?: string;
  site_id?: string;
  pic_employee_id?: string;
  purchase_date?: string;
  purchase_cost?: string;
  warranty_expiry?: string;
  residual_value?: string;
}

function AssetFormModal({
  editingAsset,
  existingAssets = [],
  onClose,
  onSaved,
}: AssetFormModalProps) {
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();

  // Load sites from DC ops
  const { data: sites = [] } = useQuery<SiteOption[]>({
    queryKey: ["dc-sites-for-asset"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/v1/data-center-ops/sites", {
          params: { per_page: 100 },
        });
        const d = res.data;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.data)) return d.data;
        if (Array.isArray(d?.data?.data)) return d.data.data;
        return [];
      } catch {
        return [];
      }
    },
  });

  // Load master vendors
  const { data: vendors = [] } = useQuery<VendorOption[]>({
    queryKey: ["proc-vendors-for-asset-form"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/v1/procurement-inventory/vendors", {
          params: { per_page: 100 },
        });
        const d = res.data;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.data)) return d.data;
        if (Array.isArray(d?.data?.data)) return d.data.data;
        return [];
      } catch {
        return [];
      }
    },
  });

  // Load master items
  const { data: items = [] } = useQuery<ItemOption[]>({
    queryKey: ["proc-items-for-asset-form"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/v1/procurement-inventory/items", {
          params: { per_page: 100 },
        });
        const d = res.data;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.data)) return d.data;
        if (Array.isArray(d?.data?.data)) return d.data.data;
        return [];
      } catch {
        return [];
      }
    },
  });

  // Initial Form Parsing
  const rawNotes = editingAsset?.notes ?? "";
  const parsedSource = rawNotes.match(/\[Sumber:\s*([^\]]+)\]/i)?.[1] ?? "";
  const parsedBarcode = rawNotes.match(/\[(?:Barcode|Label):\s*([^\]]+)\]/i)?.[1] ?? "";
  const parsedDepreciation = rawNotes.match(/\[Depresiasi:\s*([^\]]+)\]/i)?.[1] ?? "";
  const parsedSpecs = rawNotes.match(/\[Spesifikasi Teknis:\s*([^\]]+)\]/i)?.[1] ?? "";

  const [form, setForm] = useState<FormState>({
    source_type: parsedSource.toUpperCase().includes("PO")
      ? "po"
      : parsedSource.toUpperCase().includes("GRN")
      ? "grn"
      : parsedSource.toUpperCase().includes("FSTB")
      ? "fstb"
      : "manual",
    source_ref: parsedSource.replace(/^(PO|GRN|FSTB|MANUAL)\s*/i, "").trim(),
    item_id: "",
    barcode: parsedBarcode || (editingAsset ? editingAsset.asset_number : ""),
    asset_name: editingAsset?.asset_name ?? "",
    category: editingAsset?.category ?? "server",
    brand: editingAsset?.brand ?? "",
    model: editingAsset?.model ?? "",
    serial_number: editingAsset?.serial_number ?? "",
    condition: editingAsset?.condition ?? "Baru",
    site_id: editingAsset?.site_id ? String(editingAsset.site_id) : "",
    specific_location: editingAsset?.specific_location ?? "",
    pic_employee_id: editingAsset?.pic_employee_id ?? editingAsset?.assigned_to_employee?.id ?? "",
    pic_name: editingAsset?.assigned_to_employee?.full_name ?? "",
    purchase_date: editingAsset?.purchase_date
      ? editingAsset.purchase_date.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    purchase_cost:
      editingAsset?.purchase_cost !== undefined && editingAsset?.purchase_cost !== null
        ? String(editingAsset.purchase_cost)
        : editingAsset?.acquisition_cost !== undefined && editingAsset?.acquisition_cost !== null
        ? String(editingAsset.acquisition_cost)
        : "",
    warranty_expiry: editingAsset?.warranty_expiry ? editingAsset.warranty_expiry.slice(0, 10) : "",
    vendor_id: editingAsset?.vendor_id ? String(editingAsset.vendor_id) : "",
    vendor_name: editingAsset?.vendor_name ?? editingAsset?.vendor?.vendor_name ?? "",
    custom_vendor: !editingAsset?.vendor_id && Boolean(editingAsset?.vendor_name),
    depreciation_method: parsedDepreciation.includes("Saldo Menurun")
      ? "declining"
      : parsedDepreciation.includes("Tidak")
      ? "none"
      : "straight_line",
    useful_life_years: "5",
    residual_value: "",
    hostname: parsedSpecs.match(/Host:\s*([^,]+)/)?.[1]?.trim() ?? "",
    ip_address: parsedSpecs.match(/IP:\s*([^,]+)/)?.[1]?.trim() ?? "",
    operating_system: parsedSpecs.match(/OS:\s*([^,]+)/)?.[1]?.trim() ?? "",
    hardware_specs: parsedSpecs.match(/Spek:\s*(.*)$/)?.[1]?.trim() ?? "",
    maintenance_interval: editingAsset?.maintenance_interval ?? "Tidak Ada",
    next_maintenance_date: editingAsset?.next_maintenance_date
      ? editingAsset.next_maintenance_date.slice(0, 10)
      : "",
    notes: rawNotes.replace(/\[(?:Sumber|Barcode|Label|Depresiasi|Spesifikasi Teknis|Lampiran)[^\]]*\]\s*/gi, "").trim(),
    attachment_name: "",
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Handle master item selection to autofill
  function handleSelectItem(itemIdStr: string) {
    const itm = items.find((i) => String(i.id) === itemIdStr);
    if (!itm) {
      setForm((f) => ({ ...f, item_id: "" }));
      return;
    }
    setForm((f) => ({
      ...f,
      item_id: itemIdStr,
      asset_name: f.asset_name ? f.asset_name : itm.item_name,
      category: itm.category && CATEGORY_OPTIONS.some((c) => c.value === itm.category) ? itm.category : f.category,
    }));
  }

  // Handle vendor master change
  function handleVendorChange(val: string) {
    if (val === "CUSTOM") {
      setForm((f) => ({ ...f, vendor_id: "", custom_vendor: true }));
    } else if (val === "") {
      setForm((f) => ({ ...f, vendor_id: "", vendor_name: "", custom_vendor: false }));
    } else {
      const v = vendors.find((vend) => String(vend.id) === val);
      setForm((f) => ({
        ...f,
        vendor_id: val,
        vendor_name: v ? `${v.legal_entity ? `${v.legal_entity} ` : ""}${v.vendor_name}` : "",
        custom_vendor: false,
      }));
    }
  }

  // Generate automated barcode
  function handleGenerateBarcode() {
    const prefix = (form.category || "AST").toUpperCase().slice(0, 3);
    const yr = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setForm((f) => ({ ...f, barcode: `AST-${prefix}-${yr}-${rand}` }));
  }

  // File upload check
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFileError("Ukuran dokumen/foto aset maksimal 5 MB.");
      return;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setFileError("Format dokumen harus PDF, JPG, PNG, atau WEBP.");
      return;
    }
    setForm((f) => ({ ...f, attachment_name: file.name }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // ── Validasi Form ──
    const errs: ValidationErrors = {};
    if (!form.asset_name.trim() || form.asset_name.trim().length < 3) {
      errs.asset_name = "Nama/Deskripsi aset wajib diisi (minimal 3 karakter).";
    }
    if (!form.category.trim()) errs.category = "Kategori aset wajib dipilih.";
    if (!form.brand.trim()) errs.brand = "Merk / Brand wajib diisi.";
    if (!form.model.trim()) errs.model = "Model spesifik wajib diisi.";
    
    // Serial number validasi & deteksi duplikat
    const snTrimmed = form.serial_number.trim();
    if (!snTrimmed || snTrimmed.length < 3) {
      errs.serial_number = "Nomor seri (Serial No) wajib diisi (minimal 3 karakter).";
    } else {
      const duplicate = existingAssets.find(
        (a) =>
          a.serial_number &&
          a.serial_number.toLowerCase() === snTrimmed.toLowerCase() &&
          a.id !== editingAsset?.id
      );
      if (duplicate) {
        errs.serial_number = `Nomor seri ini sudah terdaftar pada aset: ${duplicate.asset_number} (${duplicate.asset_name}).`;
      }
    }

    if (!form.condition.trim()) errs.condition = "Kondisi aset wajib dipilih.";
    if (!form.site_id) errs.site_id = "Site / Lokasi wajib dipilih.";
    if (!form.pic_employee_id) errs.pic_employee_id = "Penanggung Jawab (PIC) wajib dipilih.";
    if (!form.purchase_date.trim()) errs.purchase_date = "Tanggal beli wajib diisi.";

    // Validasi Tanggal: Garansi s.d >= Tanggal Beli
    if (form.warranty_expiry && form.purchase_date) {
      if (form.warranty_expiry < form.purchase_date) {
        errs.warranty_expiry = "Tanggal garansi tidak boleh sebelum tanggal beli aset.";
      }
    }

    if (form.purchase_cost.trim() === "") {
      errs.purchase_cost = "Nilai perolehan wajib diisi.";
    } else {
      const costNum = Number(form.purchase_cost);
      if (isNaN(costNum) || costNum < 0) {
        errs.purchase_cost = "Nilai perolehan harus berupa angka positif (min 0).";
      }
    }

    if (form.residual_value.trim() !== "") {
      const resNum = Number(form.residual_value);
      const costNum = Number(form.purchase_cost);
      if (isNaN(resNum) || resNum < 0) {
        errs.residual_value = "Nilai residu harus berupa angka positif.";
      } else if (resNum > costNum) {
        errs.residual_value = "Nilai residu tidak boleh melebihi nilai perolehan awal.";
      }
    }

    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      return;
    }
    setValidationErrors({});

    const parsedCost = Number(form.purchase_cost);
    const parsedSiteId = Number(form.site_id);
    const parsedPicId = Number(form.pic_employee_id);
    const parsedVendorId = form.vendor_id ? Number(form.vendor_id) : undefined;

    // Build structured audit notes to preserve all rich fields safely
    const structuredNotesParts = [
      form.notes.trim() || undefined,
      form.source_type !== "manual" || form.source_ref
        ? `[Sumber: ${form.source_type.toUpperCase()} ${form.source_ref.trim()}]`
        : "[Sumber: Registrasi Manual]",
      form.barcode.trim() ? `[Barcode: ${form.barcode.trim()}]` : undefined,
      form.depreciation_method
        ? `[Depresiasi: ${form.depreciation_method === "straight_line" ? "Garis Lurus" : form.depreciation_method === "declining" ? "Saldo Menurun" : "Tanpa Depresiasi"}, Umur: ${form.useful_life_years || "5"} Thn, Residu: Rp ${Number(form.residual_value || 0).toLocaleString("id-ID")}]`
        : undefined,
      form.hostname || form.ip_address || form.operating_system || form.hardware_specs
        ? `[Spesifikasi Teknis: Host: ${form.hostname || "-"}, IP: ${form.ip_address || "-"}, OS: ${form.operating_system || "-"}, Spek: ${form.hardware_specs || "-"}]`
        : undefined,
      form.attachment_name ? `[Lampiran: ${form.attachment_name}]` : undefined,
    ].filter(Boolean).join("\n");

    const payload = {
      asset_name: form.asset_name.trim(),
      category: form.category,
      brand: form.brand.trim(),
      model: form.model.trim(),
      serial_number: form.serial_number.trim(),
      condition: form.condition,
      site_id: parsedSiteId,
      specific_location: form.specific_location.trim() || undefined,
      pic_employee_id: parsedPicId,
      assigned_to_employee_id: parsedPicId,
      purchase_date: form.purchase_date,
      purchase_cost: parsedCost,
      acquisition_cost: parsedCost,
      warranty_expiry: form.warranty_expiry || undefined,
      vendor_id: parsedVendorId,
      vendor_name: form.vendor_name.trim() || undefined,
      maintenance_interval: form.maintenance_interval || undefined,
      next_maintenance_date: form.next_maintenance_date || undefined,
      notes: structuredNotesParts || undefined,
    };

    try {
      if (editingAsset) {
        await updateMutation.mutateAsync({
          id: editingAsset.id,
          values: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const isTechCategory = ["server", "laptop", "network", "cooling", "power"].includes(form.category);

  return (
    <Modal
      title={editingAsset ? `Edit Asset: ${editingAsset.asset_name}` : "Daftarkan Asset Baru"}
      onClose={onClose}
      maxWidth={760}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-1">
        {/* ── Section 1: Sumber Aset & Referensi Item ── */}
        <div className="flex flex-col gap-3 p-4 bg-amber-50/40 rounded-2xl border border-amber-200/60">
          <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                1. Sumber Perolehan & Jejak Audit
              </h4>
            </div>
            {form.source_type === "manual" && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                Registrasi Manual
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Tipe Sumber */}
            <div>
              <label htmlFor="asset-source-type" className="block text-xs font-semibold text-slate-700 mb-1">
                Asal Sumber Aset
              </label>
              <select
                id="asset-source-type"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                value={form.source_type}
                onChange={(e) =>
                  setForm({ ...form, source_type: e.target.value as FormState["source_type"] })
                }
              >
                <option value="manual">Manual (Tanpa Dokumen Pengadaan)</option>
                <option value="po">Purchase Order (PO)</option>
                <option value="grn">Goods Receipt Note (GRN)</option>
                <option value="fstb">Serah Terima (FSTB)</option>
              </select>
            </div>

            {/* No Dokumen Referensi */}
            <div>
              <label htmlFor="asset-source-ref" className="block text-xs font-semibold text-slate-700 mb-1">
                No. Referensi {form.source_type !== "manual" ? form.source_type.toUpperCase() : "Asal"}
              </label>
              <input
                id="asset-source-ref"
                type="text"
                placeholder={
                  form.source_type === "po"
                    ? "mis. PO-SBY-26.003-023"
                    : form.source_type === "grn"
                    ? "mis. GRN-2026-0041"
                    : form.source_type === "fstb"
                    ? "mis. FSTB-2026-0012"
                    : "mis. Hibah / Warisan Inventaris"
                }
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
                value={form.source_ref}
                onChange={(e) => setForm({ ...form, source_ref: e.target.value })}
              />
            </div>

            {/* Hubungkan ke Master Item (Opsional) */}
            <div>
              <label htmlFor="asset-item-master" className="block text-xs font-semibold text-slate-700 mb-1">
                Link Master Item (Opsional)
              </label>
              <select
                id="asset-item-master"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                value={form.item_id}
                onChange={(e) => handleSelectItem(e.target.value)}
              >
                <option value="">— Pilih Item dari Master —</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.item_code ? `[${i.item_code}] ` : ""}
                    {i.item_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 2: Informasi Dasar & Fisik ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Informasi Dasar & Fisik
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nama/Deskripsi Aset (Required) */}
            <div>
              <label htmlFor="asset-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Nama/Deskripsi Aset <span className="text-red-500">*</span>
              </label>
              <input
                id="asset-name"
                type="text"
                placeholder="mis. Server Database Production HP ProLiant"
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                  validationErrors.asset_name
                    ? "border border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                }`}
                value={form.asset_name}
                onChange={(e) => {
                  setForm({ ...form, asset_name: e.target.value });
                  if (validationErrors.asset_name) {
                    setValidationErrors({ ...validationErrors, asset_name: undefined });
                  }
                }}
              />
              {validationErrors.asset_name && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.asset_name}</p>
              )}
            </div>

            {/* Kode Label / Barcode Fisik */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="asset-barcode" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <QrCode size={13} className="text-amber-500" /> Kode Label / Barcode
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Sparkles size={11} /> Auto-Generate
                </button>
              </div>
              <input
                id="asset-barcode"
                type="text"
                placeholder="mis. AST-SRV-2026-0041"
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Kategori (Required) */}
            <div>
              <label htmlFor="asset-cat" className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                id="asset-cat"
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none transition-all cursor-pointer ${
                  validationErrors.category
                    ? "border border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                }`}
                value={form.category}
                onChange={(e) => {
                  setForm({ ...form, category: e.target.value });
                  if (validationErrors.category) {
                    setValidationErrors({ ...validationErrors, category: undefined });
                  }
                }}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {validationErrors.category && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.category}</p>
              )}
            </div>

            {/* Kondisi Aset (Required) */}
            <div>
              <label htmlFor="asset-cond" className="block text-xs font-semibold text-slate-700 mb-1">
                Kondisi Aset <span className="text-red-500">*</span>
              </label>
              <select
                id="asset-cond"
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none transition-all cursor-pointer ${
                  validationErrors.condition
                    ? "border border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                }`}
                value={form.condition}
                onChange={(e) => {
                  setForm({ ...form, condition: e.target.value });
                  if (validationErrors.condition) {
                    setValidationErrors({ ...validationErrors, condition: undefined });
                  }
                }}
              >
                {CONDITION_OPTIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
              {validationErrors.condition && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.condition}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Merk / Brand (Required) */}
            <div>
              <label htmlFor="asset-brand" className="block text-xs font-semibold text-slate-700 mb-1">
                Merk / Brand <span className="text-red-500">*</span>
              </label>
              <input
                id="asset-brand"
                type="text"
                placeholder="mis. Dell, HP, LG, Cisco"
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                  validationErrors.brand
                    ? "border border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                }`}
                value={form.brand}
                onChange={(e) => {
                  setForm({ ...form, brand: e.target.value });
                  if (validationErrors.brand) {
                    setValidationErrors({ ...validationErrors, brand: undefined });
                  }
                }}
              />
              {validationErrors.brand && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.brand}</p>
              )}
            </div>

            {/* Model (Required) */}
            <div>
              <label htmlFor="asset-model" className="block text-xs font-semibold text-slate-700 mb-1">
                Model / Tipe <span className="text-red-500">*</span>
              </label>
              <input
                id="asset-model"
                type="text"
                placeholder="mis. PowerEdge R740"
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                  validationErrors.model
                    ? "border border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                }`}
                value={form.model}
                onChange={(e) => {
                  setForm({ ...form, model: e.target.value });
                  if (validationErrors.model) {
                    setValidationErrors({ ...validationErrors, model: undefined });
                  }
                }}
              />
              {validationErrors.model && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.model}</p>
              )}
            </div>

            {/* Nomor Seri (Required) */}
            <div>
              <label htmlFor="asset-sn" className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Seri (Serial No) <span className="text-red-500">*</span>
              </label>
              <input
                id="asset-sn"
                type="text"
                placeholder="mis. SN-8823901"
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                  validationErrors.serial_number
                    ? "border border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                }`}
                value={form.serial_number}
                onChange={(e) => {
                  setForm({ ...form, serial_number: e.target.value });
                  if (validationErrors.serial_number) {
                    setValidationErrors({ ...validationErrors, serial_number: undefined });
                  }
                }}
              />
              {validationErrors.serial_number && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.serial_number}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 3: Lokasi & Penanggung Jawab ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Lokasi & Penanggung Jawab
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Site (Required) */}
            <div>
              <label htmlFor="asset-site" className="block text-xs font-semibold text-slate-700 mb-1">
                Site / Cabang <span className="text-red-500">*</span>
              </label>
              <select
                id="asset-site"
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none transition-all cursor-pointer ${
                  validationErrors.site_id
                    ? "border border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                }`}
                value={form.site_id}
                onChange={(e) => {
                  setForm({ ...form, site_id: e.target.value });
                  if (validationErrors.site_id) {
                    setValidationErrors({ ...validationErrors, site_id: undefined });
                  }
                }}
              >
                <option value="">— Pilih Site / Lokasi Utama —</option>
                {sites.map((s: SiteOption) => (
                  <option key={s.id} value={s.id}>
                    {s.site_name}
                  </option>
                ))}
              </select>
              {validationErrors.site_id && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.site_id}</p>
              )}
            </div>

            {/* Lokasi Spesifik */}
            <div>
              <label htmlFor="asset-loc" className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi Spesifik / Rak
              </label>
              <input
                id="asset-loc"
                type="text"
                placeholder="mis. DC Surabaya, Ruang Server 1, Rack 03-U14"
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                value={form.specific_location}
                onChange={(e) => setForm({ ...form, specific_location: e.target.value })}
              />
            </div>
          </div>

          {/* Penanggung Jawab (PIC) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Penanggung Jawab (PIC) <span className="text-red-500">*</span>
            </label>
            <div
              className={`rounded-xl transition-all ${
                validationErrors.pic_employee_id ? "border border-red-500 p-0.5" : ""
              }`}
            >
              <EmployeePickerField
                employeeId={form.pic_employee_id}
                employeeName={form.pic_name}
                onSelect={(emp) => {
                  setForm({
                    ...form,
                    pic_employee_id: emp ? emp.id : "",
                    pic_name: emp ? emp.full_name : "",
                  });
                  if (validationErrors.pic_employee_id) {
                    setValidationErrors({ ...validationErrors, pic_employee_id: undefined });
                  }
                }}
              />
            </div>
            {validationErrors.pic_employee_id && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.pic_employee_id}</p>
            )}
          </div>
        </div>

        {/* ── Section 4: Pembelian, Garansi & Vendor ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              4. Pembelian, Garansi & Vendor Master
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Tanggal Beli (Required) */}
            <div>
              <label htmlFor="asset-buy-date" className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Beli <span className="text-red-500">*</span>
              </label>
              <input
                id="asset-buy-date"
                type="date"
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none transition-all ${
                  validationErrors.purchase_date
                    ? "border border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                }`}
                value={form.purchase_date}
                onChange={(e) => {
                  setForm({ ...form, purchase_date: e.target.value });
                  if (validationErrors.purchase_date) {
                    setValidationErrors({ ...validationErrors, purchase_date: undefined });
                  }
                }}
              />
              {validationErrors.purchase_date && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.purchase_date}</p>
              )}
            </div>

            {/* Nilai Perolehan (Rp) */}
            <div>
              <label htmlFor="asset-cost" className="block text-xs font-semibold text-slate-700 mb-1">
                Nilai Perolehan (Rp) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-slate-400">
                  Rp
                </span>
                <input
                  id="asset-cost"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                    validationErrors.purchase_cost
                      ? "border border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  }`}
                  value={form.purchase_cost}
                  onChange={(e) => {
                    setForm({ ...form, purchase_cost: e.target.value });
                    if (validationErrors.purchase_cost) {
                      setValidationErrors({ ...validationErrors, purchase_cost: undefined });
                    }
                  }}
                />
              </div>
              {validationErrors.purchase_cost && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.purchase_cost}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Garansi s/d (Dengan Validasi Garansi >= Tanggal Beli) */}
            <div>
              <label htmlFor="asset-warranty" className="block text-xs font-semibold text-slate-700 mb-1">
                Garansi s/d
              </label>
              <input
                id="asset-warranty"
                type="date"
                className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none transition-all ${
                  validationErrors.warranty_expiry
                    ? "border border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                }`}
                value={form.warranty_expiry}
                onChange={(e) => {
                  setForm({ ...form, warranty_expiry: e.target.value });
                  if (validationErrors.warranty_expiry) {
                    setValidationErrors({ ...validationErrors, warranty_expiry: undefined });
                  }
                }}
              />
              {validationErrors.warranty_expiry && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.warranty_expiry}</p>
              )}
            </div>

            {/* Vendor Master Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="asset-vendor-select" className="text-xs font-semibold text-slate-700">
                  Vendor Penyedia
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      custom_vendor: !f.custom_vendor,
                      vendor_id: !f.custom_vendor ? "" : f.vendor_id,
                    }))
                  }
                  className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold cursor-pointer"
                >
                  {form.custom_vendor ? "Pilih dari Master" : "+ Tulis Vendor Manual"}
                </button>
              </div>

              {!form.custom_vendor ? (
                <select
                  id="asset-vendor-select"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                  value={form.vendor_id}
                  onChange={(e) => handleVendorChange(e.target.value)}
                >
                  <option value="">— Pilih Vendor Terdaftar —</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.legal_entity ? `${v.legal_entity} ` : ""}
                      {v.vendor_name}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Vendor Lainnya (Tulis Manual)</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Ketik nama vendor penyedia..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                  value={form.vendor_name}
                  onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Section 5: Data Depresiasi & Valuasi ── */}
        <div className="flex flex-col gap-3 p-4 bg-slate-50/60 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200/60">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              5. Data Depresiasi & Estimasi Valuasi Aset
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Metode Penyusutan */}
            <div>
              <label htmlFor="deprec-method" className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Penyusutan
              </label>
              <select
                id="deprec-method"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                value={form.depreciation_method}
                onChange={(e) => setForm({ ...form, depreciation_method: e.target.value })}
              >
                <option value="straight_line">Garis Lurus (Straight Line)</option>
                <option value="declining">Saldo Menurun (Declining)</option>
                <option value="none">Tanpa Depresiasi</option>
              </select>
            </div>

            {/* Masa Manfaat / Umur Ekonomis */}
            <div>
              <label htmlFor="useful-life" className="block text-xs font-semibold text-slate-700 mb-1">
                Masa Manfaat (Tahun)
              </label>
              <input
                id="useful-life"
                type="number"
                min="1"
                max="30"
                placeholder="5"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
                value={form.useful_life_years}
                onChange={(e) => setForm({ ...form, useful_life_years: e.target.value })}
              />
            </div>

            {/* Nilai Residu (Rp) */}
            <div>
              <label htmlFor="residual-val" className="block text-xs font-semibold text-slate-700 mb-1">
                Nilai Residu Sisa (Rp)
              </label>
              <input
                id="residual-val"
                type="number"
                min="0"
                placeholder="0"
                className={`w-full px-3.5 py-2.5 bg-white rounded-xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all ${
                  validationErrors.residual_value
                    ? "border border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border border-slate-200 focus:border-amber-500"
                }`}
                value={form.residual_value}
                onChange={(e) => {
                  setForm({ ...form, residual_value: e.target.value });
                  if (validationErrors.residual_value) {
                    setValidationErrors({ ...validationErrors, residual_value: undefined });
                  }
                }}
              />
              {validationErrors.residual_value && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.residual_value}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 6: Spesifikasi Teknis Kondisional (Server, Network, Laptop) ── */}
        {isTechCategory && (
          <div className="flex flex-col gap-3 p-4 bg-blue-50/40 rounded-2xl border border-blue-200/60">
            <div className="flex items-center gap-2 pb-1.5 border-b border-blue-200/50">
              <Cpu size={14} className="text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                6. Spesifikasi Teknis Perangkat IT / Server
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label htmlFor="asset-host" className="block text-xs font-semibold text-slate-700 mb-1">
                  Hostname / Device Name
                </label>
                <input
                  id="asset-host"
                  type="text"
                  placeholder="mis. srv-db-prod-01"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
                  value={form.hostname}
                  onChange={(e) => setForm({ ...form, hostname: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="asset-ip" className="block text-xs font-semibold text-slate-700 mb-1">
                  IP Address
                </label>
                <input
                  id="asset-ip"
                  type="text"
                  placeholder="mis. 192.168.10.45"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
                  value={form.ip_address}
                  onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="asset-os" className="block text-xs font-semibold text-slate-700 mb-1">
                  Sistem Operasi (OS)
                </label>
                <input
                  id="asset-os"
                  type="text"
                  placeholder="mis. Ubuntu 22.04 LTS"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
                  value={form.operating_system}
                  onChange={(e) => setForm({ ...form, operating_system: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="asset-hardware-specs" className="block text-xs font-semibold text-slate-700 mb-1">
                Spesifikasi Hardware (CPU, RAM, Storage)
              </label>
              <input
                id="asset-hardware-specs"
                type="text"
                placeholder="mis. 2x Intel Xeon Gold 6248R 24-Core, 128GB ECC DDR4, 4x 1.92TB NVMe SSD RAID 10"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
                value={form.hardware_specs}
                onChange={(e) => setForm({ ...form, hardware_specs: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* ── Section 7: Jadwal Maintenance, Dokumen & Catatan ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {isTechCategory ? "7." : "6."} Jadwal Maintenance & Dokumen
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Interval Maintenance */}
            <div>
              <label htmlFor="asset-interval" className="block text-xs font-semibold text-slate-700 mb-1">
                Interval Maintenance Berkala
              </label>
              <select
                id="asset-interval"
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                value={form.maintenance_interval}
                onChange={(e) => setForm({ ...form, maintenance_interval: e.target.value })}
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Maintenance Date */}
            <div>
              <label htmlFor="asset-next-maint" className="block text-xs font-semibold text-slate-700 mb-1">
                Jadwal Maintenance Berikutnya
              </label>
              <input
                id="asset-next-maint"
                type="date"
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                value={form.next_maintenance_date}
                onChange={(e) => setForm({ ...form, next_maintenance_date: e.target.value })}
              />
            </div>
          </div>

          {/* Upload Foto / Dokumen Aset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Foto / Dokumen Aset (Invoice / Manual / BAST)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-400 cursor-pointer transition-all">
                <UploadCloud size={14} className="text-amber-500" />
                <span>Pilih File Dokumen...</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {form.attachment_name && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-xl border border-emerald-200">
                  <FileText size={13} />
                  <span className="truncate max-w-[200px]">{form.attachment_name}</span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, attachment_name: "" }))}
                    className="p-0.5 hover:bg-emerald-100 rounded text-emerald-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
            {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label htmlFor="asset-notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Tambahan
            </label>
            <textarea
              id="asset-notes"
              rows={2}
              placeholder="Catatan tambahan seputar riwayat barang, akses fisik, dll..."
              className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all resize-none"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Action Buttons Footer ── */}
        <div className="flex items-center justify-end gap-3 pt-3 mt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>{editingAsset ? "Simpan Perubahan" : "Daftarkan Asset"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssetDetailModal({ assetId, onClose }: { assetId: number; onClose: () => void }) {
  const { data: asset, isLoading, refetch } = useAsset(assetId);
  const statusMutation = useSetAssetStatus(assetId);
  const [tab, setTab] = useState<"trace" | "schedule" | "log">("trace");
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);

  async function handleStatusChange(status: AssetStatus) {
    try {
      await statusMutation.mutateAsync(status);
      refetch();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  return (
    <Modal title={asset ? asset.asset_name : "Detail Asset"} onClose={onClose} maxWidth={720}>
      {isLoading && <LoadingState />}
      {asset && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: 8,
              padding: "0.75rem",
              fontSize: "0.82rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem 1.5rem",
            }}
          >
            <span>
              <strong>No Asset:</strong>{" "}
              <span style={{ fontFamily: "monospace" }}>{asset.asset_number}</span>
            </span>
            <span>
              <strong>Kategori:</strong> {CATEGORY_LABELS[asset.category] ?? asset.category}
            </span>
            <span>
              <strong>Site:</strong> {asset.site?.site_name ?? "—"}
            </span>
            {asset.brand && (
              <span>
                <strong>Merk:</strong> {asset.brand}
              </span>
            )}
            {asset.model && (
              <span>
                <strong>Model:</strong> {asset.model}
              </span>
            )}
            {asset.serial_number && (
              <span>
                <strong>SN:</strong> {asset.serial_number}
              </span>
            )}
            {asset.warranty_expiry && (
              <span>
                <strong>Garansi s/d:</strong> {formatDate(asset.warranty_expiry)}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--grey)" }}>Status:</span>
            {(["active", "in_maintenance", "retired"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleStatusChange(s)}
                disabled={statusMutation.isPending || asset.status === s}
                style={{
                  padding: "0.25rem 0.6rem",
                  borderRadius: 99,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: asset.status === s ? "default" : "pointer",
                  border: `1px solid ${asset.status === s ? "var(--accent)" : "var(--border)"}`,
                  background: asset.status === s ? "var(--accent-light)" : "white",
                  color: asset.status === s ? "var(--accent)" : "var(--grey)",
                }}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", borderBottom: "2px solid var(--border)" }}>
            {(["trace", "schedule", "log"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "0.5rem 1rem",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`,
                  marginBottom: "-2px",
                  fontWeight: tab === t ? 700 : 400,
                  color: tab === t ? "var(--accent)" : "var(--grey)",
                  fontSize: "0.82rem",
                }}
              >
                {t === "trace"
                  ? "Riwayat & Jejak"
                  : t === "schedule"
                  ? `Jadwal (${asset.maintenance_schedules?.length ?? 0})`
                  : `Log (${asset.maintenance_logs?.length ?? 0})`}
              </button>
            ))}
          </div>

          {tab === "trace" && <AssetTraceTab assetId={assetId} />}

          {tab === "schedule" && (
            <div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.3rem 0.6rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                  onClick={() => setShowScheduleForm(true)}
                >
                  <Wrench size={13} /> Tambah Jadwal
                </button>
              </div>
              {(!asset.maintenance_schedules || asset.maintenance_schedules.length === 0) && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--grey)",
                    textAlign: "center",
                    padding: "1rem",
                  }}
                >
                  Belum ada jadwal maintenance.
                </div>
              )}
              {asset.maintenance_schedules && asset.maintenance_schedules.length > 0 && (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Judul</th>
                      <th>Tipe</th>
                      <th>Jatuh Tempo</th>
                      <th>Ulang (hari)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asset.maintenance_schedules.map((s) => (
                      <tr key={s.id}>
                        <td>{s.title}</td>
                        <td style={{ textTransform: "capitalize" }}>{s.maintenance_type}</td>
                        <td>{formatDate(s.next_due_date)}</td>
                        <td>{s.frequency_days ?? "—"}</td>
                        <td>
                          <span
                            className={`badge badge-${
                              s.is_overdue ? "churned" : s.is_active ? "active" : "inactive"
                            }`}
                          >
                            {s.is_overdue ? "Overdue" : s.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "log" && (
            <div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.3rem 0.6rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                  onClick={() => setShowLogForm(true)}
                >
                  <ClipboardList size={13} /> Catat Maintenance
                </button>
              </div>
              {(!asset.maintenance_logs || asset.maintenance_logs.length === 0) && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--grey)",
                    textAlign: "center",
                    padding: "1rem",
                  }}
                >
                  Belum ada log maintenance.
                </div>
              )}
              {asset.maintenance_logs && asset.maintenance_logs.length > 0 && (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Temuan</th>
                      <th>Tindakan</th>
                      <th>Rekomendasi Berikutnya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asset.maintenance_logs.map((l) => (
                      <tr key={l.id}>
                        <td>{formatDate(l.maintenance_date)}</td>
                        <td style={{ fontSize: "0.8rem" }}>{l.findings ?? "—"}</td>
                        <td style={{ fontSize: "0.8rem" }}>{l.actions_taken ?? "—"}</td>
                        <td style={{ fontSize: "0.8rem" }}>
                          {l.next_recommended_date ? formatDate(l.next_recommended_date) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {showScheduleForm && (
        <ScheduleFormModal
          assetId={assetId}
          onClose={() => setShowScheduleForm(false)}
          onSaved={() => {
            refetch();
            setShowScheduleForm(false);
          }}
        />
      )}
      {showLogForm && (
        <RecordMaintenanceModal
          assetId={assetId}
          initialAsset={asset}
          schedules={asset?.maintenance_schedules ?? []}
          onClose={() => setShowLogForm(false)}
          onSaved={() => {
            refetch();
            setShowLogForm(false);
          }}
        />
      )}
    </Modal>
  );
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function AssetTraceTab({ assetId }: { assetId: number }) {
  const navigate = useNavigate();
  const { data: hist, isLoading } = useAssetHistory(assetId);

  if (isLoading) return <LoadingState />;
  if (!hist) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <div
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: "var(--grey)",
            textTransform: "uppercase",
            marginBottom: "0.4rem",
          }}
        >
          Asal Barang
        </div>
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: 8,
            padding: "0.75rem",
            fontSize: "0.82rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem 1.5rem",
            alignItems: "center",
          }}
        >
          {hist.origin.purchase_order ? (
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                fontSize: "0.78rem",
                padding: "0.25rem 0.6rem",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
              onClick={() =>
                navigate(`/procurement-inventory/po-history?po=${hist.origin.purchase_order!.id}`)
              }
            >
              <ExternalLink size={12} /> PO {hist.origin.purchase_order.po_number}
            </button>
          ) : (
            <span style={{ color: "var(--grey)" }}>Tidak ada PO asal (aset didaftarkan manual)</span>
          )}
          {hist.origin.goods_receipt && (
            <span>
              <strong>GRN:</strong> {hist.origin.goods_receipt.grn_number}
            </span>
          )}
          {hist.origin.goods_handover && (
            <span>
              <strong>FSTB:</strong> {hist.origin.goods_handover.handover_number}
            </span>
          )}
          {hist.origin.vendor && (
            <span>
              <strong>Vendor:</strong> {hist.origin.vendor.vendor_name}
            </span>
          )}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: "var(--grey)",
            textTransform: "uppercase",
            marginBottom: "0.4rem",
          }}
        >
          Custody Saat Ini
        </div>
        <div style={{ fontSize: "0.82rem" }}>
          {hist.asset.assigned_to_employee
            ? `Dipegang oleh ${hist.asset.assigned_to_employee.full_name}`
            : "Tidak dipegang siapa pun (di gudang)"}
        </div>
      </div>

      <TraceSection
        title={`Klaim Garansi / FGBG (${hist.warranty_claims.length})`}
        onOpenList={() => navigate("/procurement-inventory/warranty-claims")}
        rows={hist.warranty_claims.map((c) => ({
          id: c.id,
          number: c.claim_number,
          status: c.status,
          date: c.claim_date,
          detail: c.issue_description,
        }))}
        emptyText="Belum pernah ada klaim garansi untuk aset ini."
      />

      <TraceSection
        title={`Peminjaman / FPBG (${hist.item_loans.length})`}
        onOpenList={() => navigate("/procurement-inventory/item-loans")}
        rows={hist.item_loans.map((l) => ({
          id: l.id,
          number: l.loan_number,
          status: l.status,
          date: l.expected_return_date,
          detail: `${l.purpose}${
            l.borrower_employee ? ` — ${l.borrower_employee.full_name}` : ""
          }`,
        }))}
        emptyText="Belum pernah dipinjam."
      />

      <TraceSection
        title={`Pengembalian Rusak / FPRG (${hist.damaged_returns.length})`}
        onOpenList={() => navigate("/procurement-inventory/damaged-item-returns")}
        rows={hist.damaged_returns.map((r) => ({
          id: r.id,
          number: r.return_number,
          status: r.status,
          date: r.received_date ?? r.return_date,
          detail: r.damage_description,
        }))}
        emptyText="Belum pernah dikembalikan karena rusak."
      />
    </div>
  );
}

function TraceSection({
  title,
  rows,
  onOpenList,
  emptyText,
}: {
  title: string;
  rows: Array<{ id: number; number: string; status: string; date: string; detail: string }>;
  onOpenList: () => void;
  emptyText: string;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.4rem",
        }}
      >
        <div
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: "var(--grey)",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        <button
          type="button"
          onClick={onOpenList}
          style={{
            border: "none",
            background: "none",
            color: "var(--accent)",
            fontSize: "0.72rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.2rem",
          }}
        >
          Buka Menu <ExternalLink size={11} />
        </button>
      </div>
      {rows.length === 0 && (
        <div style={{ fontSize: "0.78rem", color: "var(--grey)", padding: "0.4rem 0" }}>
          {emptyText}
        </div>
      )}
      {rows.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>No Dokumen</th>
              <th>Status</th>
              <th>Tanggal</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{r.number}</td>
                <td style={{ fontSize: "0.75rem" }}>{statusLabel(r.status)}</td>
                <td style={{ fontSize: "0.78rem" }}>{r.date ? formatDate(r.date) : "—"}</td>
                <td style={{ fontSize: "0.78rem" }}>{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ScheduleFormModal({
  assetId,
  onClose,
  onSaved,
}: {
  assetId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const createMutation = useCreateSchedule(assetId);
  const [form, setForm] = useState({
    title: "",
    maintenance_type: "preventive",
    frequency_days: "",
    next_due_date: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.next_due_date) {
      setError("Judul dan tanggal jatuh tempo wajib diisi.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        title: form.title.trim(),
        maintenance_type: form.maintenance_type,
        frequency_days: form.frequency_days ? Number(form.frequency_days) : undefined,
        next_due_date: form.next_due_date,
        notes: form.notes || undefined,
      });
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title="Tambah Jadwal Maintenance" onClose={onClose} maxWidth={480}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <InputField
          label="Judul *"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="mis. Ganti Filter AC"
        />
        <div>
          <div style={{ marginBottom: "0.4rem" }}>
            <label className="input-label">Tipe</label>
          </div>
          <select
            className="input"
            value={form.maintenance_type}
            onChange={(e) => setForm((f) => ({ ...f, maintenance_type: e.target.value }))}
          >
            <option value="preventive">Preventive</option>
            <option value="corrective">Corrective</option>
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
          <InputField
            label="Jatuh Tempo *"
            type="date"
            required
            value={form.next_due_date}
            onChange={(e) => setForm((f) => ({ ...f, next_due_date: e.target.value }))}
          />
          <InputField
            label="Ulang tiap (hari)"
            type="number"
            min="1"
            value={form.frequency_days}
            onChange={(e) => setForm((f) => ({ ...f, frequency_days: e.target.value }))}
            placeholder="Opsional"
          />
        </div>
        <InputField
          label="Catatan"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
        {error && <div className="input-error">{error}</div>}
        <Button type="submit" disabled={createMutation.isPending} style={{ width: "100%" }}>
          {createMutation.isPending ? "Menyimpan..." : "Simpan Jadwal"}
        </Button>
      </form>
    </Modal>
  );
}

// ─── Modal Form Catat Maintenance / Perbaikan (Persis Requirement Item 18) ───
interface RecordMaintenanceModalProps {
  initialAsset?: Asset | null;
  assetId?: number;
  assetList?: Asset[];
  schedules?: { id: number; title: string }[];
  onClose: () => void;
  onSaved: () => void;
}

const RESULT_LABELS: Record<string, string> = {
  resolved: "Selesai & Berfungsi Normal",
  monitoring: "Selesai Dalam Pantauan (Monitoring)",
  pending_parts: "Tertunda Menunggu Sparepart",
  vendor_escalation: "Eskalasi ke Vendor Prinsipal",
};

function RecordMaintenanceModal({
  initialAsset,
  assetId,
  assetList = [],
  schedules = [],
  onClose,
  onSaved,
}: RecordMaintenanceModalProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string | number>(
    assetId ?? initialAsset?.id ?? ""
  );

  const [form, setForm] = useState({
    schedule_id: "",
    maintenance_date: new Date().toISOString().slice(0, 10),
    maintenance_type: "preventive" as "preventive" | "corrective",
    provider_type: "internal" as "internal" | "vendor",
    technician_or_vendor: "",
    findings: "",
    actions_taken: "",
    spareparts: "",
    cost: "",
    downtime_hours: "",
    result_status: "resolved",
    next_recommended_date: "",
    attachment_name: "",
  });

  const [fileError, setFileError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Identify active asset being serviced
  const activeAsset =
    initialAsset ?? assetList.find((a) => String(a.id) === String(selectedAssetId));

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFileError("Ukuran dokumen/foto bukti maksimal 5 MB.");
      return;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setFileError("Format dokumen harus PDF, JPG, PNG, atau WEBP.");
      return;
    }
    setForm((f) => ({ ...f, attachment_name: file.name }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const errs: Record<string, string> = {};
    if (!selectedAssetId) {
      errs.asset_id = "Pilih aset yang akan dilakukan maintenance.";
    }
    if (!form.maintenance_date) {
      errs.maintenance_date = "Tanggal pengerjaan wajib diisi.";
    }
    if (!form.technician_or_vendor.trim()) {
      errs.technician_or_vendor = "Nama teknisi / vendor pelaksana wajib diisi.";
    }
    if (!form.findings.trim() || form.findings.trim().length < 5) {
      errs.findings = "Deskripsi temuan/masalah wajib diisi (minimal 5 karakter).";
    }
    if (!form.actions_taken.trim() || form.actions_taken.trim().length < 5) {
      errs.actions_taken = "Tindakan perbaikan/pemeliharaan wajib diisi (minimal 5 karakter).";
    }
    if (form.cost.trim() !== "") {
      const c = Number(form.cost);
      if (isNaN(c) || c < 0) {
        errs.cost = "Biaya perbaikan harus berupa angka positif (min 0).";
      }
    }
    if (form.downtime_hours.trim() !== "") {
      const d = Number(form.downtime_hours);
      if (isNaN(d) || d < 0) {
        errs.downtime_hours = "Downtime harus berupa angka positif (jam).";
      }
    }

    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      return;
    }
    setValidationErrors({});

    setIsSubmitting(true);
    try {
      const detailedFindings = [
        `[Tipe: ${form.maintenance_type.toUpperCase()}]`,
        `[Pelaksana: ${form.provider_type === "internal" ? "Tim Internal IT" : "Vendor Servis Eksternal"} - ${form.technician_or_vendor.trim()}]`,
        form.downtime_hours ? `[Downtime: ${form.downtime_hours} Jam]` : "",
        form.cost ? `[Biaya: Rp ${Number(form.cost).toLocaleString("id-ID")}]` : "",
        `\nTemuan & Masalah:\n${form.findings.trim()}`,
      ]
        .filter(Boolean)
        .join(" ");

      const detailedActions = [
        `[Hasil: ${RESULT_LABELS[form.result_status] ?? form.result_status}]`,
        form.spareparts.trim() ? `[Sparepart: ${form.spareparts.trim()}]` : "",
        form.attachment_name ? `[Lampiran BAST/Nota: ${form.attachment_name}]` : "",
        `\nTindakan Dilakukan:\n${form.actions_taken.trim()}`,
      ]
        .filter(Boolean)
        .join(" ");

      await apiClient.post(`/v1/procurement-inventory/assets/${selectedAssetId}/maintenance-logs`, {
        schedule_id: form.schedule_id ? Number(form.schedule_id) : undefined,
        maintenance_date: form.maintenance_date || undefined,
        findings: detailedFindings,
        actions_taken: detailedActions,
        next_recommended_date: form.next_recommended_date || undefined,
      });

      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Catat Maintenance / Perbaikan Aset" onClose={onClose} maxWidth={680}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        {/* ── Identifikasi Aset ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Aset yang Dikerjakan <span className="text-red-500">*</span>
          </label>
          {!initialAsset && !assetId ? (
            <select
              className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none transition-all cursor-pointer ${
                validationErrors.asset_id
                  ? "border border-red-500"
                  : "border border-slate-200 focus:border-amber-500"
              }`}
              value={selectedAssetId}
              onChange={(e) => {
                setSelectedAssetId(e.target.value);
                if (validationErrors.asset_id) {
                  setValidationErrors({ ...validationErrors, asset_id: undefined });
                }
              }}
            >
              <option value="">— Pilih Aset Terdaftar —</option>
              {assetList.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.asset_number}] {a.asset_name} {a.brand ? `· ${a.brand}` : ""} ({CATEGORY_LABELS[a.category] ?? a.category})
                </option>
              ))}
            </select>
          ) : (
            <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs font-mono">
                  AST
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {activeAsset?.asset_name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    No: {activeAsset?.asset_number} · Merk: {activeAsset?.brand || "—"} · Site: {activeAsset?.site?.site_name || "—"}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800">
                {activeAsset ? STATUS_LABELS[activeAsset.status] : "Aktif"}
              </span>
            </div>
          )}
          {validationErrors.asset_id && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.asset_id}</p>
          )}
        </div>

        {/* ── Tanggal, Jenis & Jadwal Terkait ── */}
        <div className={`grid grid-cols-1 ${schedules.length > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3.5`}>
          <div>
            <label htmlFor="maint-date" className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Pengerjaan <span className="text-red-500">*</span>
            </label>
            <input
              id="maint-date"
              type="date"
              className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none transition-all ${
                validationErrors.maintenance_date
                  ? "border border-red-500"
                  : "border border-slate-200 focus:border-amber-500"
              }`}
              value={form.maintenance_date}
              onChange={(e) => {
                setForm({ ...form, maintenance_date: e.target.value });
                if (validationErrors.maintenance_date) {
                  setValidationErrors({ ...validationErrors, maintenance_date: undefined });
                }
              }}
            />
            {validationErrors.maintenance_date && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.maintenance_date}</p>
            )}
          </div>

          <div>
            <label htmlFor="maint-type" className="block text-xs font-semibold text-slate-700 mb-1">
              Jenis Maintenance <span className="text-red-500">*</span>
            </label>
            <select
              id="maint-type"
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              value={form.maintenance_type}
              onChange={(e) =>
                setForm({ ...form, maintenance_type: e.target.value as "preventive" | "corrective" })
              }
            >
              <option value="preventive">Preventive (Pemeliharaan Berkala)</option>
              <option value="corrective">Corrective (Perbaikan Kerusakan / Insiden)</option>
            </select>
          </div>

          {schedules.length > 0 && (
            <div>
              <label htmlFor="maint-sched-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Terkait Jadwal (Opsional)
              </label>
              <select
                id="maint-sched-select"
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                value={form.schedule_id}
                onChange={(e) => setForm({ ...form, schedule_id: e.target.value })}
              >
                <option value="">— Tidak Terkait —</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── Pelaksana (Teknisi / Vendor) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pelaksana Maintenance <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4 py-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="provider_type"
                  checked={form.provider_type === "internal"}
                  onChange={() => setForm({ ...form, provider_type: "internal" })}
                  className="accent-amber-500"
                />
                Tim Internal IT / DC
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="provider_type"
                  checked={form.provider_type === "vendor"}
                  onChange={() => setForm({ ...form, provider_type: "vendor" })}
                  className="accent-amber-500"
                />
                Vendor Eksternal
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="tech-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Nama {form.provider_type === "internal" ? "Teknisi / Staff PIC" : "Vendor & Teknisi Eksternal"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="tech-name"
              type="text"
              placeholder={
                form.provider_type === "internal"
                  ? "mis. Budi Santoso (Staff DC Ops)"
                  : "mis. PT Dell Services - Dedi Irawan"
              }
              className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                validationErrors.technician_or_vendor
                  ? "border border-red-500"
                  : "border border-slate-200 focus:border-amber-500"
              }`}
              value={form.technician_or_vendor}
              onChange={(e) => {
                setForm({ ...form, technician_or_vendor: e.target.value });
                if (validationErrors.technician_or_vendor) {
                  setValidationErrors({ ...validationErrors, technician_or_vendor: undefined });
                }
              }}
            />
            {validationErrors.technician_or_vendor && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.technician_or_vendor}</p>
            )}
          </div>
        </div>

        {/* ── Deskripsi Masalah & Tindakan Dilakukan ── */}
        <div>
          <label htmlFor="findings-text" className="block text-xs font-semibold text-slate-700 mb-1">
            Deskripsi Pekerjaan / Temuan Masalah <span className="text-red-500">*</span>
          </label>
          <textarea
            id="findings-text"
            rows={2}
            placeholder="Kondisi awal, indikasi kerusakan, bunyi bising fan, alarm temperatur, dll..."
            className={`w-full px-3.5 py-2 bg-slate-50/50 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all resize-none ${
              validationErrors.findings
                ? "border border-red-500"
                : "border border-slate-200 focus:border-amber-500"
            }`}
            value={form.findings}
            onChange={(e) => {
              setForm({ ...form, findings: e.target.value });
              if (validationErrors.findings) {
                setValidationErrors({ ...validationErrors, findings: undefined });
              }
            }}
          />
          {validationErrors.findings && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.findings}</p>
          )}
        </div>

        <div>
          <label htmlFor="actions-text" className="block text-xs font-semibold text-slate-700 mb-1">
            Tindakan yang Dilakukan <span className="text-red-500">*</span>
          </label>
          <textarea
            id="actions-text"
            rows={2}
            placeholder="Langkah perbaikan: pembersihan debu heatsink, re-apply thermal paste, penggantian modul RAM, firmware update..."
            className={`w-full px-3.5 py-2 bg-slate-50/50 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all resize-none ${
              validationErrors.actions_taken
                ? "border border-red-500"
                : "border border-slate-200 focus:border-amber-500"
            }`}
            value={form.actions_taken}
            onChange={(e) => {
              setForm({ ...form, actions_taken: e.target.value });
              if (validationErrors.actions_taken) {
                setValidationErrors({ ...validationErrors, actions_taken: undefined });
              }
            }}
          />
          {validationErrors.actions_taken && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.actions_taken}</p>
          )}
        </div>

        {/* ── Sparepart yang Dipakai (Terhubung ke Stok) ── */}
        <div>
          <label htmlFor="spareparts-input" className="block text-xs font-semibold text-slate-700 mb-1">
            Sparepart / Komponen Pengganti yang Digunakan (Terhubung ke Stok)
          </label>
          <input
            id="spareparts-input"
            type="text"
            placeholder="mis. 1x Fan 120mm Nidec Server, 2x Patch Cord Cat6 2m"
            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
            value={form.spareparts}
            onChange={(e) => setForm({ ...form, spareparts: e.target.value })}
          />
        </div>

        {/* ── Biaya, Downtime & Hasil ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label htmlFor="maint-cost" className="block text-xs font-semibold text-slate-700 mb-1">
              Biaya Servis / Sparepart (Rp)
            </label>
            <input
              id="maint-cost"
              type="number"
              min="0"
              placeholder="0"
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="maint-downtime" className="block text-xs font-semibold text-slate-700 mb-1">
              Downtime Operasional (Jam)
            </label>
            <input
              id="maint-downtime"
              type="number"
              step="0.5"
              min="0"
              placeholder="mis. 1.5"
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
              value={form.downtime_hours}
              onChange={(e) => setForm({ ...form, downtime_hours: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="maint-result" className="block text-xs font-semibold text-slate-700 mb-1">
              Hasil / Status Akhir
            </label>
            <select
              id="maint-result"
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              value={form.result_status}
              onChange={(e) => setForm({ ...form, result_status: e.target.value })}
            >
              <option value="resolved">Selesai & Normal</option>
              <option value="monitoring">Selesai Dalam Pantauan</option>
              <option value="pending_parts">Menunggu Sparepart</option>
              <option value="vendor_escalation">Eskalasi ke Vendor</option>
            </select>
          </div>
        </div>

        {/* ── Jadwal Rekomendasi Berikutnya & Lampiran ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="next-date" className="block text-xs font-semibold text-slate-700 mb-1">
              Jadwal Maintenance Berikutnya (Opsional)
            </label>
            <input
              id="next-date"
              type="date"
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
              value={form.next_recommended_date}
              onChange={(e) => setForm({ ...form, next_recommended_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Lampiran / BAST / Nota Servis
            </label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer transition-all">
                <UploadCloud size={14} className="text-amber-500" />
                <span>Pilih File Bukti...</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {form.attachment_name && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200">
                  <FileText size={12} />
                  <span className="truncate max-w-[140px]">{form.attachment_name}</span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, attachment_name: "" }))}
                    className="p-0.5 hover:bg-emerald-100 rounded text-emerald-600"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
            </div>
            {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Action Buttons Footer ── */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Simpan Catatan Maintenance</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}