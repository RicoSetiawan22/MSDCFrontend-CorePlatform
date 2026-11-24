import React, { useState, useDeferredValue, useMemo, useEffect } from "react";
import {
  Globe,
  Search,
  Copy,
  Check,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Server,
  X,
  Filter,
} from "lucide-react";
import type { DashboardDetailsData } from "../../types/dashboard";
import { DataTablePagination } from "../common/DataTablePagination";

export type IpCategoryFilter = "all" | "dedicated" | "customer";

export interface IpAllocationSectionProps {
  details?: DashboardDetailsData | null;
  totalSubnetCapacity?: number; // default: 272
  onPing?: (ip: string) => void;
}

// ── Utilitas Avatar Inisial & Palet Pastel ──
function getSingleInitial(name: string): string {
  if (!name) return "?";
  const cleaned = name.replace(/^(PT|CV|UD)\.?\s+/i, "").trim();
  return (cleaned[0] || name[0]).toUpperCase();
}

function getTwoInitials(name: string): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getAvatarPalette(name: string, isCustomer: boolean = false) {
  const lower = name.toLowerCase();
  if (lower.includes("dedicated") || lower.includes("dell")) {
    return { bg: "#EDE9FE", text: "#6D28D9" }; // Lavender / Violet
  }
  if (lower.includes("pt a") || lower.startsWith("pa")) {
    return { bg: "#FEF3C7", text: "#B45309" }; // Warm Amber
  }
  if (lower.includes("coba") || lower.startsWith("pc")) {
    return { bg: "#E0F2FE", text: "#0369A1" }; // Sky Blue
  }
  return isCustomer
    ? { bg: "#DCFCE7", text: "#15803D" }
    : { bg: "#F1F5F9", text: "#475569" };
}

export const IpAllocationSection: React.FC<IpAllocationSectionProps> = ({
  details,
  totalSubnetCapacity = 272,
  onPing,
}) => {
  // ── 1. State Management ──
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<IpCategoryFilter>("all");
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  // State untuk Toolbar & Pagination Kartu Distribusi (Tier 1)
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [cardCurrentPage, setCardCurrentPage] = useState<number>(1);
  const CARD_PAGE_SIZE = 8;

  // Optimasi pencarian untuk responsivitas tinggi tanpa lag
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // ── 2. Data Komputasi ──
  const allocatedIps = useMemo(() => {
    return details?.ip_details?.allocated_ips ?? [];
  }, [details?.ip_details?.allocated_ips]);

  const allocatedCount = details?.ip_details?.allocated_count ?? allocatedIps.length;
  const rawByCustomer = useMemo(() => {
    return details?.ip_details?.by_customer ?? [];
  }, [details?.ip_details?.by_customer]);

  // Konsolidasi Case Duplikat Pelanggan (misal: "pt a" vs "PT A")
  const consolidatedCustomers = useMemo(() => {
    const map = new Map<string, { customer_id: number; company_name: string; allocated_ips: number }>();
    for (const c of rawByCustomer) {
      const key = c.company_name.trim().toLowerCase();
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.allocated_ips += c.allocated_ips;
      } else {
        map.set(key, { ...c });
      }
    }
    return Array.from(map.values());
  }, [rawByCustomer]);

  // Hitung jumlah dinamis kategori
  const { dedicatedCount, customerDirectCount } = useMemo(() => {
    let dedicated = 0;
    let customer = 0;
    for (const item of allocatedIps) {
      const isDed =
        item.owner.toLowerCase().includes("dedicated") ||
        item.device.toLowerCase().includes("dedicated");
      if (isDed) dedicated++;
      else customer++;
    }
    return { dedicatedCount: dedicated, customerDirectCount: customer };
  }, [allocatedIps]);

  // Sisa IP Baremetal Internal
  const baremetalCount = useMemo(() => {
    const customerTotal = consolidatedCustomers.reduce((acc, curr) => acc + curr.allocated_ips, 0);
    return Math.max(0, allocatedCount - customerTotal);
  }, [allocatedCount, consolidatedCustomers]);

  // Gabungkan semua entitas kartu (Customer + Internal Baremetal) ke dalam 1 list terpadu
  const allDistributionCards = useMemo(() => {
    const totalAllocatedSafe = allocatedCount || 1;

    const cards: Array<{
      id: string | number;
      type: "customer" | "baremetal";
      name: string;
      subtitle: string;
      allocatedIps: number;
      percentage: number;
      filterKey: string;
      avatarText?: string;
      avatarPalette?: { bg: string; text: string };
    }> = [];

    // 1. Kartu-kartu Customer
    for (const c of consolidatedCustomers) {
      const percentage = Math.round((c.allocated_ips / totalAllocatedSafe) * 100);
      const tierLabel = c.company_name.toLowerCase().includes("a")
        ? "Tier 2 Enterprise Customer"
        : "Colocation Standard";

      cards.push({
        id: c.customer_id,
        type: "customer",
        name: c.company_name,
        subtitle: tierLabel,
        allocatedIps: c.allocated_ips,
        percentage,
        filterKey: c.company_name,
        avatarText: getTwoInitials(c.company_name),
        avatarPalette: getAvatarPalette(c.company_name, true),
      });
    }

    // 2. Kartu Internal Baremetal (Infrastruktur Inti)
    if (baremetalCount > 0 || allocatedCount > 0) {
      const bmPercentage = Math.round((baremetalCount / totalAllocatedSafe) * 100);
      cards.push({
        id: "baremetal",
        type: "baremetal",
        name: "Internal Baremetal",
        subtitle: "Dell PowerEdge R740",
        allocatedIps: baremetalCount,
        percentage: bmPercentage,
        filterKey: "baremetal",
      });
    }

    return cards;
  }, [consolidatedCustomers, allocatedCount, baremetalCount]);

  // Filter Kartu Berdasarkan Input Search Toolbar Kartu
  const filteredDistributionCards = useMemo(() => {
    const q = cardSearchQuery.trim().toLowerCase();
    if (!q) return allDistributionCards;
    return allDistributionCards.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q)
    );
  }, [allDistributionCards, cardSearchQuery]);

  // Reset page kartu ke halaman 1 saat search query kartu berubah
  useEffect(() => {
    setCardCurrentPage(1);
  }, [cardSearchQuery]);

  // Pagination Slice untuk Kartu (Maksimal 8 Kartu / Halaman = 2 Baris x 4 Kolom)
  const cardTotalPages = Math.ceil(filteredDistributionCards.length / CARD_PAGE_SIZE) || 1;
  const paginatedCards = useMemo(() => {
    const startIndex = (cardCurrentPage - 1) * CARD_PAGE_SIZE;
    return filteredDistributionCards.slice(startIndex, startIndex + CARD_PAGE_SIZE);
  }, [filteredDistributionCards, cardCurrentPage]);

  // Filter Alokasi IP (Kategori + Cross-Filter Customer + Search Query)
  const filteredAllocatedIps = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    const custFilter = selectedCustomerFilter?.trim().toLowerCase();

    return allocatedIps.filter((item) => {
      const isDed =
        item.owner.toLowerCase().includes("dedicated") ||
        item.device.toLowerCase().includes("dedicated");

      // Filter Kategori
      if (activeCategory === "dedicated" && !isDed) return false;
      if (activeCategory === "customer" && isDed) return false;

      // Filter Customer Aktif (Cross-Filter dari Kartu Atas)
      if (custFilter) {
        const ownerLower = item.owner.trim().toLowerCase();
        if (custFilter === "baremetal") {
          if (!isDed && !ownerLower.includes("dell") && !ownerLower.includes("baremetal")) {
            return false;
          }
        } else {
          if (!ownerLower.includes(custFilter)) {
            return false;
          }
        }
      }

      // Evaluasi Query Pencarian
      if (!q) return true;
      return (
        item.ip.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q) ||
        item.device.toLowerCase().includes(q)
      );
    });
  }, [allocatedIps, activeCategory, selectedCustomerFilter, deferredSearchQuery]);

  // Reset page ke halaman 1 saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery, activeCategory, selectedCustomerFilter, pageSize]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredAllocatedIps.length / pageSize) || 1;
  const paginatedIps = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAllocatedIps.slice(startIndex, startIndex + pageSize);
  }, [filteredAllocatedIps, currentPage, pageSize]);

  // Handler Copy IP
  const handleCopy = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => {
      setCopiedIp((prev) => (prev === ip ? null : prev));
    }, 1500);
  };

  const handlePing = (ip: string) => {
    if (onPing) {
      onPing(ip);
    } else {
      console.log(`[Diagnostic] Ping ke IP: ${ip}`);
    }
  };

  const handleToggleCustomerFilter = (customerName: string) => {
    setSelectedCustomerFilter((prev) => (prev === customerName ? null : customerName));
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all">
      {/* ── 1. Top Card Header ── */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-white select-none">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight m-0">
                IP Address Terpakai &amp; Oleh Siapa
              </h3>
              <p className="text-xs text-slate-500 m-0 hidden sm:block">
                Pemetaan alokasi IP aktif per pelanggan dan infrastruktur inti
              </p>
            </div>
          </div>

          {/* Badge Total IP */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {allocatedCount} Terpakai / {totalSubnetCapacity} Total Subnet
          </span>
        </div>

        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Tutup panel IP Address" : "Buka panel IP Address"}
          className="border border-slate-200/80 bg-white cursor-pointer text-slate-500 hover:text-slate-900 p-1.5 flex items-center justify-center rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
        >
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* ── 2. Collapsible Body ── */}
      {isOpen && (
        <div className="p-5 space-y-6">
          {/* ══════════════════════════════════════════════════════════════════════
              TIER 1: HIGH-LEVEL OVERVIEW (Customer & Infra Distribution)
              ══════════════════════════════════════════════════════════════════════ */}
          <div>
            {/* Header Tier 1 + Mini Search Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-sky-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
                    Ringkasan Distribusi Pelanggan & Infrastruktur
                  </h4>
                </div>
              </div>

              {/* Toolbar Pencarian Kartu */}
              <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari pelanggan / infrastruktur..."
                    value={cardSearchQuery}
                    onChange={(e) => setCardSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/70 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
                  />
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  {cardSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCardSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Hapus pencarian"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Grid Kartu Paginated (Maksimal 8 Kartu / Halaman = 2 Baris x 4 Kolom) */}
            {filteredDistributionCards.length === 0 ? (
              <div className="py-8 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Users size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700 m-0">
                  Tidak ada pelanggan atau infrastruktur yang cocok dengan "{cardSearchQuery}"
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Coba gunakan kata kunci nama perusahaan atau perangkat lainnya.
                </p>
                <button
                  type="button"
                  onClick={() => setCardSearchQuery("")}
                  className="mt-2 text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer underline"
                >
                  Reset Pencarian Kartu
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {paginatedCards.map((c) => {
                  const isSelected = selectedCustomerFilter?.toLowerCase() === c.filterKey.toLowerCase();
                  const isBaremetal = c.type === "baremetal";

                  // Kartu Khusus Internal Baremetal
                  if (isBaremetal) {
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleToggleCustomerFilter(c.filterKey)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 shadow-xs"
                            : "border-amber-200 bg-amber-50/30 hover:border-amber-300 hover:shadow-2xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                              <Server size={16} />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 truncate m-0">
                                {c.name}
                              </h5>
                              <span className="text-[11px] text-amber-700 block truncate">
                                {c.subtitle}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-extrabold text-amber-700">
                              {c.allocatedIps} IP
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Infrastruktur Inti
                            </div>
                          </div>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-amber-100 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${c.percentage}%` }}
                          />
                        </div>

                        {isSelected && (
                          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                            <span>Filter Aktif</span>
                            <X size={12} />
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Kartu Customer Pelanggan
                  const avatarPal = c.avatarPalette || { bg: "#F1F5F9", text: "#475569" };

                  return (
                    <div
                      key={c.id}
                      onClick={() => handleToggleCustomerFilter(c.filterKey)}
                      className={`relative p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? "border-[#E59B00] bg-amber-50/40 shadow-xs ring-2 ring-amber-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            style={{ backgroundColor: avatarPal.bg, color: avatarPal.text }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs"
                          >
                            {c.avatarText}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 truncate m-0">
                              {c.name}
                            </h5>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {c.subtitle}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-extrabold text-emerald-600">
                            {c.allocatedIps} IP
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {c.percentage}% aktif
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar Visual */}
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${c.percentage}%` }}
                        />
                      </div>

                      {/* Active Filter Indicator */}
                      {isSelected && (
                        <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          <span>Selected</span>
                          <X size={12} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls untuk Kartu (Muncul hanya jika total kartu > 8) */}
            {cardTotalPages > 1 && (
              <div className="mt-3.5 flex items-center justify-end pt-2.5 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCardCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={cardCurrentPage === 1}
                    className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Halaman sebelumnya"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: cardTotalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCardCurrentPage(page)}
                        className={`w-6 h-6 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          cardCurrentPage === page
                            ? "bg-[#E59B00] text-white shadow-2xs font-bold"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCardCurrentPage((p) => Math.min(cardTotalPages, p + 1))}
                    disabled={cardCurrentPage === cardTotalPages}
                    className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Halaman berikutnya"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              TIER 2: DETAILED TABULAR INVESTIGATION (Full-Width 100%)
              ══════════════════════════════════════════════════════════════════════ */}
          <div className="pt-2 border-t border-slate-100">
            {/* Filter Pills, Active Filter Chip, & Search Input */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Category Pills */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeCategory === "all"
                        ? "bg-amber-500 text-white shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    Semua ({allocatedCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCategory("dedicated")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeCategory === "dedicated"
                        ? "bg-amber-500 text-white shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    Dedicated ({dedicatedCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCategory("customer")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeCategory === "customer"
                        ? "bg-amber-500 text-white shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    Customer ({customerDirectCount})
                  </button>
                </div>

                {/* Active Customer Filter Chip */}
                {selectedCustomerFilter && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-800 text-xs font-medium">
                    <Filter size={12} className="text-amber-600" />
                    <span>
                      Filter: <strong>{selectedCustomerFilter === "baremetal" ? "Internal Baremetal" : selectedCustomerFilter}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerFilter(null)}
                      title="Hapus filter customer"
                      className="text-amber-600 hover:text-amber-900 cursor-pointer ml-0.5"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Search Bar Input */}
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Cari IP, customer, atau device..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-9 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-2xs"
                />
                <Search
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Table Container 100% Width */}
            <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                    <th className="py-3 px-4">Status &amp; IP Address</th>
                    <th className="py-3 px-4">Pemilik / Pelanggan</th>
                    <th className="py-3 px-4">Device Terkait</th>
                    <th className="py-3 px-4">Tipe Alokasi</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedIps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 px-4 text-center">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Search size={32} className="mx-auto text-slate-300" />
                          <p className="text-sm font-semibold text-slate-700 m-0">
                            Data alokasi IP tidak ditemukan
                          </p>
                          <p className="text-xs text-slate-400 m-0">
                            Tidak ada data yang cocok dengan kriteria pencarian atau filter saat ini.
                          </p>
                          {(searchQuery || selectedCustomerFilter || activeCategory !== "all") && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery("");
                                setSelectedCustomerFilter(null);
                                setActiveCategory("all");
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                            >
                              Reset Semua Filter
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedIps.map((item) => {
                      const avatarPal = getAvatarPalette(item.owner);
                      const isCopied = copiedIp === item.ip;
                      const isDedicated =
                        item.owner.toLowerCase().includes("dedicated") ||
                        item.device.toLowerCase().includes("dedicated");

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Status & IP */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Aktif
                              </span>
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                {item.ip}
                              </span>
                            </div>
                          </td>

                          {/* Pemilik / Pelanggan */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                style={{ backgroundColor: avatarPal.bg, color: avatarPal.text }}
                                className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0"
                              >
                                {getSingleInitial(item.owner)}
                              </div>
                              <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                                {item.owner}
                              </span>
                            </div>
                          </td>

                          {/* Device Terkait */}
                          <td className="py-3.5 px-4 text-slate-600">
                            {item.device && item.device !== "—" ? (
                              <span className="font-medium text-slate-700 italic">
                                {item.device}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Tipe Alokasi */}
                          <td className="py-3.5 px-4">
                            {isDedicated ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                Dedicated Server
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Customer Direct
                              </span>
                            )}
                          </td>

                          {/* Aksi: Copy & Ping */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopy(item.ip)}
                                title={isCopied ? "IP Tersalin!" : "Salin IP"}
                                aria-label="Salin IP Address"
                                className={`p-1.5 rounded-md border transition-all cursor-pointer ${
                                  isCopied
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                }`}
                              >
                                {isCopied ? <Check size={13} /> : <Copy size={13} />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePing(item.ip)}
                                className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                              >
                                Ping
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Center Terpusat */}
            {filteredAllocatedIps.length > 0 && (
              <div className="mt-2">
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  perPage={pageSize}
                  onPageChange={(page) => setCurrentPage(page)}
                  onPerPageChange={(newSize) => setPageSize(newSize)}
                  perPageOptions={[5, 10, 20]}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
