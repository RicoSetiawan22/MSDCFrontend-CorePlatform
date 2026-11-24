import { useState, useMemo, type FormEvent } from "react";
import {
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  ArrowDownLeft,
  Calendar,
  Building2,
  User,
  FilterX,
  Layers,
  Info,
} from "lucide-react";
import {
  useStockMovements,
  useStockBalance,
  useItemList,
  useWarehouseList,
  useIssueStock,
  useTransferStock,
  useAdjustStock,
} from "../api/useItem";
import { ProcurementFormModal } from "../components/ProcurementFormModal";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";

type ModalKind = "issue" | "transfer" | "adjust" | null;

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  receipt: "Penerimaan (GRN)",
  issue: "Keluar",
  adjustment: "Penyesuaian",
  transfer: "Transfer",
};

const MOVEMENT_TYPE_BADGES: Record<string, string> = {
  receipt: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  issue: "bg-rose-50 text-rose-700 border-rose-200/80",
  adjustment: "bg-amber-50 text-amber-700 border-amber-200/80",
  transfer: "bg-blue-50 text-blue-700 border-blue-200/80",
};

export function StockMovementListPage() {
  const { data: balance, isLoading: loadingBalance } = useStockBalance();
  const { data: itemsData } = useItemList({ per_page: 200, is_active: true });
  const { data: warehousesData } = useWarehouseList();
  const items = itemsData?.data ?? [];
  const warehouses = warehousesData?.data ?? [];

  const [modalKind, setModalKind] = useState<ModalKind>(null);

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState<"movements" | "balance">("movements");
  const [traceItemId, setTraceItemId] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<"all" | "in" | "out">("all");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const { data: movements, isLoading: loadingMovements } = useStockMovements({
    item_id: traceItemId ? Number(traceItemId) : undefined,
    per_page: traceItemId ? 200 : 50,
  });

  // KPI Calculations
  const balanceList = balance ?? [];
  const movementsList = movements?.data ?? [];

  const totalPositions = balanceList.length;
  const lowStockCount = useMemo(
    () => balanceList.filter((b) => b.below_reorder_point).length,
    [balanceList]
  );
  const inMovementsCount = useMemo(
    () => movementsList.filter((m) => m.direction === "in").length,
    [movementsList]
  );
  const outMovementsCount = useMemo(
    () => movementsList.filter((m) => m.direction === "out").length,
    [movementsList]
  );

  const healthyPercentage =
    totalPositions > 0
      ? Math.max(0, Math.round(((totalPositions - lowStockCount) / totalPositions) * 100))
      : 100;

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return movementsList.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (m.item?.item_name && m.item.item_name.toLowerCase().includes(q)) ||
        (m.item?.item_code && m.item.item_code.toLowerCase().includes(q)) ||
        (m.warehouse?.warehouse_name && m.warehouse.warehouse_name.toLowerCase().includes(q)) ||
        (m.reference_number && m.reference_number.toLowerCase().includes(q)) ||
        (m.reference_type && m.reference_type.toLowerCase().includes(q)) ||
        (m.employee?.full_name && m.employee.full_name.toLowerCase().includes(q));

      const matchesType = typeFilter === "all" || m.movement_type === typeFilter;
      const matchesDirection = directionFilter === "all" || m.direction === directionFilter;

      return matchesSearch && matchesType && matchesDirection;
    });
  }, [movementsList, search, typeFilter, directionFilter]);

  // Filtered Stock Balance
  const filteredBalance = useMemo(() => {
    return balanceList.filter((b) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (b.item?.item_name && b.item.item_name.toLowerCase().includes(q)) ||
        (b.item?.item_code && b.item.item_code.toLowerCase().includes(q)) ||
        (b.warehouse?.warehouse_name && b.warehouse.warehouse_name.toLowerCase().includes(q));

      const matchesLowStock = !onlyLowStock || b.below_reorder_point;

      return matchesSearch && matchesLowStock;
    });
  }, [balanceList, search, onlyLowStock]);

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(traceItemId) ||
    typeFilter !== "all" ||
    directionFilter !== "all" ||
    onlyLowStock;

  function resetFilters() {
    setSearch("");
    setTraceItemId("");
    setTypeFilter("all");
    setDirectionFilter("all");
    setOnlyLowStock(false);
  }

  const cardAnimationClass =
    "transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 active:scale-95 active:translate-y-0 select-none";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. PageHeader Banner (Navy Blue & Gold Diagonal) ── */}
      <PageHeader
        title="Stock Movement"
        subtitle="Mutasi stok — penerimaan, pengeluaran, penyesuaian, dan transfer gudang dengan penelusuran (Trace Barang)."
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
                    Status Operasional Sirkulasi Stok
                  </h2>
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      healthyPercentage < 80 ? "text-amber-600" : "text-emerald-700"
                    }`}
                  >
                    {healthyPercentage}% Siap Pakai
                  </span>
                </div>
                <div className="w-full bg-emerald-100/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      healthyPercentage < 80 ? "bg-amber-500" : "bg-emerald-600"
                    }`}
                    style={{ width: `${healthyPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-emerald-200/80 w-full sm:w-auto justify-between sm:justify-end shadow-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                <Layers size={15} className="text-amber-500" />
                <span>Posisi Stok Aktif:</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {totalPositions} Lokasi SKU
              </span>
            </div>
          </div>

          {/* 4 Kartu Statistik Interaktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Saldo Item */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("balance");
                setOnlyLowStock(false);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                activeTab === "balance" && !onlyLowStock
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Boxes size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Total Saldo Item
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {totalPositions}{" "}
                  <span className="text-xs font-normal text-slate-400">Posisi</span>
                </h3>
              </div>
            </button>

            {/* Card 2: Mutasi Masuk (IN) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("movements");
                setDirectionFilter(directionFilter === "in" ? "all" : "in");
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                activeTab === "movements" && directionFilter === "in"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <ArrowDownLeft size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Mutasi Masuk (In)
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {inMovementsCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Penerimaan</span>
                </h3>
              </div>
            </button>

            {/* Card 3: Mutasi Keluar (OUT) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("movements");
                setDirectionFilter(directionFilter === "out" ? "all" : "out");
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                activeTab === "movements" && directionFilter === "out"
                  ? "border-purple-500 ring-2 ring-purple-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-purple-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <ArrowUpRight size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Mutasi Keluar (Out)
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {outMovementsCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Pengeluaran</span>
                </h3>
              </div>
            </button>

            {/* Card 4: Stok Kritis / Reorder */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("balance");
                setOnlyLowStock(true);
              }}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                activeTab === "balance" && onlyLowStock
                  ? "border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-rose-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Stok di Bawah Reorder
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {lowStockCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Item Kritis</span>
                </h3>
              </div>
            </button>
          </div>
        </div>

        {/* ── Main Data Card: Segmented Tabs, Toolbar, and Tables ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          {/* Top Row: Segmented Tabs & Quick Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            {/* Tab Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 self-start">
              <button
                type="button"
                onClick={() => setActiveTab("movements")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "movements"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Riwayat Mutasi & Trace</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200/70 text-slate-700">
                  {movementsList.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("balance")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "balance"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Saldo Stok Gudang (Balance)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200/70 text-slate-700">
                  {balanceList.length}
                </span>
                {lowStockCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" title="Ada stok kritis" />
                )}
              </button>
            </div>

            {/* Quick Action Buttons (Matching Ref Amber standard) */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setModalKind("issue")}
                title="Untuk barang keluar tanpa penerima tertentu (pemakaian internal/rusak). Jika diserahkan ke employee, gunakan FSTB."
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3.5 py-2 rounded-xl text-sm transition-all border border-slate-200 active:scale-95 flex items-center gap-1.5"
              >
                <ArrowUpRight size={15} />
                <span>Keluar Barang (Non-FSTB)</span>
              </button>
              <button
                type="button"
                onClick={() => setModalKind("transfer")}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3.5 py-2 rounded-xl text-sm transition-all border border-slate-200 active:scale-95 flex items-center gap-1.5"
              >
                <ArrowLeftRight size={15} />
                <span>Transfer Gudang</span>
              </button>
              <button
                type="button"
                onClick={() => setModalKind("adjust")}
                className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-xs active:scale-95 flex items-center gap-2"
              >
                <SlidersHorizontal size={15} />
                <span>Penyesuaian Stok</span>
              </button>
            </div>
          </div>

          {/* ── Toolbar: Search & Dynamic Filters ── */}
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
                  placeholder={
                    activeTab === "movements"
                      ? "Cari item, ref no, employee, gudang..."
                      : "Cari item atau gudang..."
                  }
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

              {/* Controls specific to Movements Tab */}
              {activeTab === "movements" && (
                <>
                  {/* Trace Barang Dropdown */}
                  <select
                    value={traceItemId}
                    onChange={(e) => setTraceItemId(e.target.value)}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium max-w-[240px]"
                  >
                    <option value="">— Semua Item (Trace Barang) —</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.item_code} — {i.item_name}
                      </option>
                    ))}
                  </select>

                  {/* Tipe Mutasi Filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                  >
                    <option value="all">Semua Tipe Mutasi</option>
                    <option value="receipt">Penerimaan (GRN)</option>
                    <option value="issue">Keluar</option>
                    <option value="transfer">Transfer Gudang</option>
                    <option value="adjustment">Penyesuaian (Opname)</option>
                  </select>

                  {/* Arah Mutasi (In / Out) */}
                  <select
                    value={directionFilter}
                    onChange={(e) => setDirectionFilter(e.target.value as "all" | "in" | "out")}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                  >
                    <option value="all">Semua Arah</option>
                    <option value="in">Hanya Masuk (+)</option>
                    <option value="out">Hanya Keluar (-)</option>
                  </select>
                </>
              )}

              {/* Controls specific to Balance Tab */}
              {activeTab === "balance" && (
                <button
                  type="button"
                  onClick={() => setOnlyLowStock(!onlyLowStock)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-1.5 ${
                    onlyLowStock
                      ? "bg-rose-50 text-rose-700 border-rose-300"
                      : "bg-slate-50 text-slate-600 border-slate-200/90 hover:bg-slate-100"
                  }`}
                >
                  <AlertTriangle size={14} className={onlyLowStock ? "text-rose-600" : "text-slate-400"} />
                  <span>Di Bawah Reorder Point</span>
                  {lowStockCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200 text-rose-800 font-bold">
                      {lowStockCount}
                    </span>
                  )}
                </button>
              )}

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
          </div>

          {/* Trace Barang Info Callout */}
          {activeTab === "movements" && traceItemId && (
            <div className="flex items-center gap-2 p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-xs text-blue-800">
              <Info size={16} className="shrink-0 text-blue-600" />
              <span>
                <strong>Mode Trace Aktif:</strong> Menampilkan seluruh riwayat pergerakan item terpilih lintas gudang, asal dokumen (GRN/PO/Transfer), serta petugas yang bertanggung jawab.
              </span>
            </div>
          )}

          {/* ── Content View 1: Riwayat Mutasi ── */}
          {activeTab === "movements" && (
            <>
              {loadingMovements && <LoadingState />}

              {!loadingMovements && filteredMovements.length === 0 && (
                <EmptyState
                  title="Belum Ada Riwayat Mutasi"
                  subtitle={
                    hasActiveFilters
                      ? "Tidak ada mutasi yang cocok dengan kriteria filter."
                      : "Mutasi stok akan muncul secara otomatis saat ada penerimaan GRN, pengeluaran, transfer, atau penyesuaian."
                  }
                />
              )}

              {!loadingMovements && filteredMovements.length > 0 && (
                <div className="border border-slate-200/90 rounded-xl overflow-hidden mt-1 shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Tanggal</th>
                          <th className="px-4 py-3">Tipe Mutasi</th>
                          <th className="px-4 py-3">Item Inventaris</th>
                          <th className="px-4 py-3">Warehouse</th>
                          <th className="px-4 py-3">Referensi Dokumen</th>
                          <th className="px-4 py-3">Petugas / PIC</th>
                          <th className="px-4 py-3 text-right">Kuantitas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredMovements.map((m) => {
                          const isIn = m.direction === "in";
                          return (
                            <tr
                              key={m.id}
                              className="hover:bg-slate-50/60 transition-colors"
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-slate-600">
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={13} className="text-slate-400" />
                                  <span>{formatDate(m.movement_date ?? m.created_at)}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                    MOVEMENT_TYPE_BADGES[m.movement_type] ??
                                    "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  {MOVEMENT_TYPE_LABELS[m.movement_type] ?? m.movement_type}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-800 text-xs">
                                  {m.item?.item_name ?? `#${m.item_id}`}
                                </div>
                                {m.item?.item_code && (
                                  <div className="text-[11px] font-mono text-slate-400">
                                    {m.item.item_code}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-700">
                                <div className="flex items-center gap-1.5">
                                  <Building2 size={13} className="text-slate-400" />
                                  <span>{m.warehouse?.warehouse_name ?? `#${m.warehouse_id}`}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs">
                                <span className="font-mono text-slate-600 bg-slate-100/70 px-2 py-0.5 rounded border border-slate-200/60">
                                  {m.reference_number ?? m.reference_type ?? "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                                <div className="flex items-center gap-1.5">
                                  <User size={13} className="text-slate-400" />
                                  <span>{m.employee?.full_name ?? "—"}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-xs">
                                <span
                                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded ${
                                    isIn
                                      ? "text-emerald-700 bg-emerald-50/70"
                                      : "text-rose-700 bg-rose-50/70"
                                  }`}
                                >
                                  {isIn ? "+" : "-"}
                                  {m.quantity} {m.item?.uom ?? ""}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Content View 2: Saldo Stok Gudang (Stock Balance) ── */}
          {activeTab === "balance" && (
            <>
              {loadingBalance && <LoadingState />}

              {!loadingBalance && filteredBalance.length === 0 && (
                <EmptyState
                  title="Belum Ada Saldo Stok"
                  subtitle={
                    hasActiveFilters
                      ? "Tidak ada saldo stok yang cocok dengan kriteria pencarian."
                      : "Saldo stok akan otomatis muncul saat ada mutasi barang pertama di gudang."
                  }
                />
              )}

              {!loadingBalance && filteredBalance.length > 0 && (
                <div className="border border-slate-200/90 rounded-xl overflow-hidden mt-1 shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Item Inventaris</th>
                          <th className="px-4 py-3">Lokasi Warehouse</th>
                          <th className="px-4 py-3">Status Reorder Point</th>
                          <th className="px-4 py-3 text-right">Saldo Saat Ini</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredBalance.map((b) => (
                          <tr
                            key={`${b.item_id}-${b.warehouse_id}`}
                            className="hover:bg-slate-50/60 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-800 text-xs">
                                {b.item?.item_name ?? `#${b.item_id}`}
                              </div>
                              {b.item?.item_code && (
                                <div className="text-[11px] font-mono text-slate-400">
                                  {b.item.item_code}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <Building2 size={13} className="text-slate-400" />
                                <span>{b.warehouse?.warehouse_name ?? `#${b.warehouse_id}`}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {b.below_reorder_point ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle size={12} className="text-rose-600" />
                                  <span>Di Bawah Reorder Point</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 size={12} className="text-emerald-600" />
                                  <span>Stok Aman</span>
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-slate-900 text-sm">
                              {b.balance}{" "}
                              <span className="text-xs font-normal text-slate-500">
                                {b.item?.uom ?? ""}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── MODALS (Revamped to match MSDC modern styling) ── */}
      {modalKind === "issue" && (
        <IssueModal
          items={items}
          warehouses={warehouses}
          balance={balanceList}
          onClose={() => setModalKind(null)}
        />
      )}
      {modalKind === "transfer" && (
        <TransferModal
          items={items}
          warehouses={warehouses}
          balance={balanceList}
          onClose={() => setModalKind(null)}
        />
      )}
      {modalKind === "adjust" && (
        <AdjustModal
          items={items}
          warehouses={warehouses}
          balance={balanceList}
          onClose={() => setModalKind(null)}
        />
      )}
    </div>
  );
}

interface PickerItem {
  id: number;
  item_code: string;
  item_name: string;
  uom: string;
}
interface PickerWarehouse {
  id: number;
  warehouse_code: string;
  warehouse_name: string;
}

function ItemSelect({
  items,
  value,
  onChange,
}: {
  items: PickerItem[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Pilih item inventaris...</option>
      {items.map((i) => (
        <option key={i.id} value={i.id}>
          {i.item_code} — {i.item_name} ({i.uom})
        </option>
      ))}
    </select>
  );
}

function WarehouseSelect({
  warehouses,
  value,
  onChange,
  label,
  excludeId,
}: {
  warehouses: PickerWarehouse[];
  value: string;
  onChange: (v: string) => void;
  label?: string;
  excludeId?: string | number;
}) {
  const filtered = excludeId
    ? warehouses.filter((w) => String(w.id) !== String(excludeId))
    : warehouses;

  return (
    <select
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{label ?? "Pilih warehouse..."}</option>
      {filtered.map((w) => (
        <option key={w.id} value={w.id}>
          {w.warehouse_code} — {w.warehouse_name}
        </option>
      ))}
    </select>
  );
}

// ── 15. Keluar Barang (Non-FSTB) Modal ──
function IssueModal({
  items,
  warehouses,
  balance,
  onClose,
}: {
  items: PickerItem[];
  warehouses: PickerWarehouse[];
  balance: Array<{ item_id: number; warehouse_id: number; balance: number }>;
  onClose: () => void;
}) {
  const mutation = useIssueStock();
  const [itemId, setItemId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [issueReason, setIssueReason] = useState<"operational" | "damaged_disposed" | "technical_correction">("operational");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [personInCharge, setPersonInCharge] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedItem = items.find((i) => String(i.id) === itemId);

  // Cari saldo tersedia di gudang asal
  const currentBalance = useMemo(() => {
    if (!itemId || !warehouseId) return null;
    const match = balance.find(
      (b) => String(b.item_id) === itemId && String(b.warehouse_id) === warehouseId
    );
    return match ? Number(match.balance || 0) : 0;
  }, [balance, itemId, warehouseId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!itemId) {
      setError("Pilih item inventaris.");
      return;
    }
    if (!warehouseId) {
      setError("Pilih warehouse asal pengeluaran.");
      return;
    }
    if (!personInCharge.trim()) {
      setError("Nama penanggung jawab pengeluaran wajib diisi.");
      return;
    }
    const numQty = Number(quantity);
    if (!numQty || numQty <= 0) {
      setError("Kuantitas pengeluaran harus lebih besar dari 0.");
      return;
    }
    if (currentBalance !== null && numQty > currentBalance) {
      setError(
        `Kuantitas keluar (${numQty} ${selectedItem?.uom || "unit"}) melebihi saldo tersedia di gudang (${currentBalance} ${selectedItem?.uom || "unit"}).`
      );
      return;
    }

    const reasonLabels = {
      operational: "Pemakaian Operasional Rutin",
      damaged_disposed: "Barang Rusak / Dibuang (Scrap)",
      technical_correction: "Koreksi Teknis / Kalibrasi",
    };

    const auditNotes = [
      `[Alasan: ${reasonLabels[issueReason]}]`,
      `[Tgl: ${issueDate}]`,
      `[PIC: ${personInCharge.trim()}]`,
      costCenter.trim() ? `[Cost Center: ${costCenter.trim()}]` : null,
      notes.trim() ? notes.trim() : null,
    ]
      .filter(Boolean)
      .join(" ");

    try {
      await mutation.mutateAsync({
        item_id: Number(itemId),
        warehouse_id: Number(warehouseId),
        quantity: numQty,
        reference_type: "manual",
        notes: auditNotes || undefined,
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <ProcurementFormModal
      title="Keluar Barang (Non-FSTB)"
      subtitle="Pencatatan pengeluaran barang internal tanpa penerima karyawan tertentu"
      icon={ArrowUpRight}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Simpan Pengeluaran"
      isSubmitting={mutation.isPending}
      maxWidth="max-w-[580px]"
    >
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900">
        <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <span>
          Gunakan form ini untuk pengeluaran internal (pemakaian operasional, barang rusak/afkir, koreksi teknis). Jika diserahkan ke employee resmi, silakan gunakan menu <strong>Serah Terima Barang (FSTB)</strong>.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Item Inventaris <span className="text-rose-500">*</span>
          </label>
          <ItemSelect items={items} value={itemId} onChange={setItemId} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Warehouse Asal <span className="text-rose-500">*</span>
          </label>
          <WarehouseSelect
            warehouses={warehouses}
            value={warehouseId}
            onChange={setWarehouseId}
          />
        </div>
      </div>

      {/* Saldo Tersedia Banner */}
      {currentBalance !== null && (
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Saldo Tersedia di Gudang:</span>
          <span className={`font-mono font-bold ${currentBalance > 0 ? "text-emerald-700" : "text-rose-600"}`}>
            {currentBalance} {selectedItem?.uom || "unit"}
          </span>
        </div>
      )}

      {/* Alasan Pengeluaran & Tanggal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Alasan Pengeluaran <span className="text-rose-500">*</span>
          </label>
          <select
            value={issueReason}
            onChange={(e) => setIssueReason(e.target.value as any)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
          >
            <option value="operational">Pemakaian Operasional Rutin</option>
            <option value="damaged_disposed">Barang Rusak / Dibuang (Scrap)</option>
            <option value="technical_correction">Koreksi Teknis / Kalibrasi</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Tanggal Pengeluaran <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>
      </div>

      {/* Penanggung Jawab & Cost Center */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Penanggung Jawab (PIC) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Nama staf pengambil / penanggung jawab"
            value={personInCharge}
            onChange={(e) => setPersonInCharge(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Cost Center (Beban Biaya)
          </label>
          <input
            type="text"
            placeholder="mis. CC-OPS-PROD / CC-BROADCAST"
            value={costCenter}
            onChange={(e) => setCostCenter(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Kuantitas (Qty) Keluar <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono font-bold"
            type="number"
            min="0.01"
            max={currentBalance !== null ? currentBalance : undefined}
            step="any"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
          />
          {selectedItem && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              {selectedItem.uom}
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Catatan Tambahan
        </label>
        <input
          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Keterangan spesifik keperluan operasional (opsional)"
        />
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          {error}
        </div>
      )}
    </ProcurementFormModal>
  );
}

// ── 16. Transfer Antar Gudang Modal ──
function TransferModal({
  items,
  warehouses,
  balance,
  onClose,
}: {
  items: PickerItem[];
  warehouses: PickerWarehouse[];
  balance: Array<{ item_id: number; warehouse_id: number; balance: number }>;
  onClose: () => void;
}) {
  const mutation = useTransferStock();
  const [itemId, setItemId] = useState("");
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("");
  const [transferReason, setTransferReason] = useState("Penyetaraan Stok Antar Gudang");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedItem = items.find((i) => String(i.id) === itemId);

  // Saldo tersedia di gudang asal
  const currentOriginBalance = useMemo(() => {
    if (!itemId || !fromWarehouseId) return null;
    const match = balance.find(
      (b) => String(b.item_id) === itemId && String(b.warehouse_id) === fromWarehouseId
    );
    return match ? Number(match.balance || 0) : 0;
  }, [balance, itemId, fromWarehouseId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!itemId) {
      setError("Pilih item inventaris.");
      return;
    }
    if (!fromWarehouseId || !toWarehouseId) {
      setError("Warehouse asal dan tujuan wajib dipilih.");
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      setError("Gudang asal dan tujuan tidak boleh sama.");
      return;
    }
    const numQty = Number(quantity);
    if (!numQty || numQty <= 0) {
      setError("Kuantitas transfer harus lebih besar dari 0.");
      return;
    }
    if (currentOriginBalance !== null && numQty > currentOriginBalance) {
      setError(
        `Kuantitas transfer (${numQty} ${selectedItem?.uom || "unit"}) melebihi saldo di gudang asal (${currentOriginBalance} ${selectedItem?.uom || "unit"}).`
      );
      return;
    }

    const auditNotes = [
      deliveryNoteNumber.trim() ? `[No. Surat Jalan: ${deliveryNoteNumber.trim()}]` : null,
      transferReason.trim() ? `[Alasan: ${transferReason.trim()}]` : null,
      notes.trim() ? notes.trim() : null,
    ]
      .filter(Boolean)
      .join(" ");

    try {
      await mutation.mutateAsync({
        item_id: Number(itemId),
        from_warehouse_id: Number(fromWarehouseId),
        to_warehouse_id: Number(toWarehouseId),
        quantity: numQty,
        notes: auditNotes || undefined,
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <ProcurementFormModal
      title="Transfer Antar Gudang"
      subtitle="Pemindahan saldo fisik item antar lokasi gudang MSDC"
      icon={ArrowLeftRight}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Simpan Transfer"
      isSubmitting={mutation.isPending}
      maxWidth="max-w-[580px]"
    >
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Item Inventaris <span className="text-rose-500">*</span>
        </label>
        <ItemSelect items={items} value={itemId} onChange={setItemId} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Dari Warehouse Asal <span className="text-rose-500">*</span>
          </label>
          <WarehouseSelect
            warehouses={warehouses}
            value={fromWarehouseId}
            onChange={(val) => {
              setFromWarehouseId(val);
              if (val === toWarehouseId) setToWarehouseId("");
            }}
            label="Pilih Warehouse Asal..."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Ke Warehouse Tujuan <span className="text-rose-500">*</span>
          </label>
          <WarehouseSelect
            warehouses={warehouses}
            value={toWarehouseId}
            onChange={setToWarehouseId}
            label="Pilih Warehouse Tujuan..."
            excludeId={fromWarehouseId}
          />
        </div>
      </div>

      {/* Saldo Gudang Asal Banner */}
      {currentOriginBalance !== null && (
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Saldo di Gudang Asal:</span>
          <span className={`font-mono font-bold ${currentOriginBalance > 0 ? "text-emerald-700" : "text-rose-600"}`}>
            {currentOriginBalance} {selectedItem?.uom || "unit"}
          </span>
        </div>
      )}

      {/* Kuantitas Transfer */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Kuantitas Transfer <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono font-bold"
            type="number"
            min="0.01"
            max={currentOriginBalance !== null ? currentOriginBalance : undefined}
            step="any"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
          />
          {selectedItem && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              {selectedItem.uom}
            </span>
          )}
        </div>
      </div>

      {/* No Surat Jalan & Alasan Transfer (Dipisah) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            No. Surat Jalan Transfer
          </label>
          <input
            type="text"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
            value={deliveryNoteNumber}
            onChange={(e) => setDeliveryNoteNumber(e.target.value)}
            placeholder="mis. SJ-TRF-2026/04/001"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Alasan Transfer
          </label>
          <select
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
          >
            <option value="Penyetaraan Stok Antar Gudang">Penyetaraan Stok Antar Gudang</option>
            <option value="Permintaan Pemenuhan Site Cabang">Permintaan Pemenuhan Site Cabang</option>
            <option value="Relokasi Proyek Produksi">Relokasi Proyek Produksi</option>
            <option value="Koreksi Alokasi Gudang">Koreksi Alokasi Gudang</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Catatan Tambahan
        </label>
        <input
          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Keterangan pengemudi / plat nomor kendaraan / kurir"
        />
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          {error}
        </div>
      )}
    </ProcurementFormModal>
  );
}

// ── 17. Penyesuaian Stok (Stock Opname) Modal ──
function AdjustModal({
  items,
  warehouses,
  balance,
  onClose,
}: {
  items: PickerItem[];
  warehouses: PickerWarehouse[];
  balance: Array<{ item_id: number; warehouse_id: number; balance: number }>;
  onClose: () => void;
}) {
  const mutation = useAdjustStock();
  const [itemId, setItemId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [opnameDate, setOpnameDate] = useState(new Date().toISOString().slice(0, 10));
  const [physicalCount, setPhysicalCount] = useState("");
  const [adjustReason, setAdjustReason] = useState<"opname_diff" | "damaged_lost" | "input_correction" | "other">("opname_diff");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedItem = items.find((i) => String(i.id) === itemId);

  // Saldo Sistem saat ini
  const currentSystemBalance = useMemo(() => {
    if (!itemId || !warehouseId) return null;
    const match = balance.find(
      (b) => String(b.item_id) === itemId && String(b.warehouse_id) === warehouseId
    );
    return match ? Number(match.balance || 0) : 0;
  }, [balance, itemId, warehouseId]);

  // Hitung selisih otomatis (Kuantitas Fisik - Saldo Sistem)
  const difference = useMemo(() => {
    if (physicalCount === "" || currentSystemBalance === null) return null;
    const phys = Number(physicalCount);
    if (isNaN(phys)) return null;
    return phys - currentSystemBalance;
  }, [physicalCount, currentSystemBalance]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!itemId) {
      setError("Pilih item inventaris.");
      return;
    }
    if (!warehouseId) {
      setError("Pilih warehouse opname.");
      return;
    }
    if (physicalCount === "") {
      setError("Kuantitas hasil hitungan fisik wajib diisi.");
      return;
    }
    const phys = Number(physicalCount);
    if (phys < 0) {
      setError("Kuantitas fisik tidak boleh bernilai negatif.");
      return;
    }
    if (difference === null || difference === 0) {
      setError("Kuantitas fisik sama dengan saldo sistem. Tidak ada selisih stok yang perlu disesuaikan.");
      return;
    }

    const direction: "in" | "out" = difference > 0 ? "in" : "out";
    const deltaQty = Math.abs(difference);

    const reasonLabels = {
      opname_diff: "Selisih Stock Opname Berkala",
      damaged_lost: "Barang Rusak / Hilang saat Penyimpanan",
      input_correction: "Koreksi Kesalahan Input Sebelumnya",
      other: "Lainnya",
    };

    const auditReason = [
      `[Alasan: ${reasonLabels[adjustReason]}]`,
      `[Tgl Opname: ${opnameDate}]`,
      `[Fisik: ${phys}, Sistem: ${currentSystemBalance}, Selisih: ${difference > 0 ? `+${deltaQty}` : `-${deltaQty}`}]`,
      notes.trim() ? notes.trim() : null,
    ]
      .filter(Boolean)
      .join(" ");

    try {
      await mutation.mutateAsync({
        item_id: Number(itemId),
        warehouse_id: Number(warehouseId),
        direction,
        quantity: deltaQty,
        reason: auditReason,
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <ProcurementFormModal
      title="Penyesuaian Stok (Stock Opname)"
      subtitle="Sinkronisasi hitungan fisik hasil opname dengan catatan saldo sistem"
      icon={SlidersHorizontal}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Simpan Penyesuaian Opname"
      isSubmitting={mutation.isPending}
      maxWidth="max-w-[580px]"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Item Inventaris <span className="text-rose-500">*</span>
          </label>
          <ItemSelect items={items} value={itemId} onChange={setItemId} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Warehouse Opname <span className="text-rose-500">*</span>
          </label>
          <WarehouseSelect
            warehouses={warehouses}
            value={warehouseId}
            onChange={setWarehouseId}
          />
        </div>
      </div>

      {/* Perbandingan Saldo Sistem vs Hitungan Fisik */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs border-b border-slate-200/60 pb-2">
          <span className="text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            Saldo Sistem Saat Ini:
          </span>
          <span className="font-mono font-bold text-slate-800 text-sm">
            {currentSystemBalance !== null ? `${currentSystemBalance} ${selectedItem?.uom || "unit"}` : "—"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Hasil Hitungan Fisik Gudang *
            </label>
            <div className="relative">
              <input
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono font-bold"
                type="number"
                min="0"
                step="any"
                required
                value={physicalCount}
                onChange={(e) => setPhysicalCount(e.target.value)}
                placeholder="mis. 12"
              />
              {selectedItem && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  {selectedItem.uom}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Selisih Penyesuaian Otomatis
            </label>
            <div className="h-[38px] px-3.5 rounded-xl border flex items-center justify-between bg-white border-slate-200">
              {difference === null ? (
                <span className="text-xs text-slate-400 italic">Masukkan hitungan fisik</span>
              ) : difference > 0 ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 font-mono">
                  <span>+{difference} {selectedItem?.uom || "unit"} (Tambah / IN)</span>
                </span>
              ) : difference < 0 ? (
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1 font-mono">
                  <span>{difference} {selectedItem?.uom || "unit"} (Kurangi / OUT)</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-500 font-mono">
                  0 (Sesuai Sistem)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tanggal Opname & Alasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Tanggal Pelaksanaan Opname <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={opnameDate}
            onChange={(e) => setOpnameDate(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Kategori Alasan Penyesuaian <span className="text-rose-500">*</span>
          </label>
          <select
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value as any)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
          >
            <option value="opname_diff">Selisih Stock Opname Berkala</option>
            <option value="damaged_lost">Barang Rusak / Hilang saat Penyimpanan</option>
            <option value="input_correction">Koreksi Kesalahan Input Sebelumnya</option>
            <option value="other">Alasan Lainnya</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Catatan / Berita Acara Opname
        </label>
        <input
          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-amber-500"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="No. Berita Acara Opname / Catatan penyesuaian fisik (opsional)"
        />
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          {error}
        </div>
      )}
    </ProcurementFormModal>
  );
}
