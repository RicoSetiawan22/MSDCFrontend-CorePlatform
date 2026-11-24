import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSiteList } from "../api/useSites";
import { PageHeader } from "@shared/components/PageHeader";
import { extractErrorMessage } from "@shared/types/api";
import {
  SiteStatusBanner,
  SiteKPICards,
  SiteToolbar,
  SiteTable,
  SiteFormModal,
  SiteDeleteConfirmModal,
} from "../components/site";
import type { Site, SiteStatus } from "../types/site";

export function SiteListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [deleteTargetSite, setDeleteTargetSite] = useState<Site | null>(null);

  // ── 1. Query Seluruh Sites untuk Metrik KPI (Endpoint /v1/data-center-ops/sites) ──
  const {
    data: allSitesData,
    isLoading: isAllSitesLoading,
    dataUpdatedAt,
  } = useSiteList({ per_page: 100 });

  // ── 2. Query Paginasi untuk Tabel Site dengan Filter & Pencarian ──
  const {
    data: tableData,
    isLoading: isTableLoading,
    isError: isTableError,
    error: tableError,
    refetch: refetchTable,
  } = useSiteList({
    page,
    per_page: 10,
    search: search || undefined,
    status: (statusFilter || undefined) as SiteStatus | undefined,
  });

  // ── 3. Komputasi Statistik KPI (Total Site, Total Rooms, Site Aktif, Maintenance) ──
  const stats = useMemo(() => {
    const list = allSitesData?.data ?? [];
    const totalSites = allSitesData?.total ?? list.length;
    const totalRooms = list.reduce((acc, s) => acc + (s.rooms?.length ?? 0), 0);
    const activeSites = list.filter((s) => s.status === "active").length;
    const maintenanceSites = list.filter((s) => s.status === "maintenance").length;

    return {
      totalSites,
      totalRooms,
      activeSites,
      maintenanceSites,
    };
  }, [allSitesData]);

  // ── 4. Format Waktu Terakhir Diperbarui (Last Updated Timestamp) ──
  const lastUpdatedTime = useMemo(() => {
    if (!dataUpdatedAt) return undefined;
    return new Date(dataUpdatedAt)
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\./g, ":");
  }, [dataUpdatedAt]);

  const isOperational = stats.maintenanceSites === 0;

  // Jika baris yang dihapus adalah satu-satunya di halaman ini, mundur ke halaman
  // sebelumnya agar tabel tidak menampilkan empty state padahal data masih ada.
  function handleSiteDeleted() {
    const isLastRowOnPage = (tableData?.data.length ?? 0) <= 1;
    if (isLastRowOnPage) {
      setPage((prev) => Math.max(1, prev - 1));
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Header Banner Bergaya MSDC (Navy Blue & Gold Diagonal Accent) ── */}
      <PageHeader
        title="Site Manager"
        subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── 2. Konten Utama Halaman Site ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* ── Overview Card: Status Banner & 4 KPI Cards Sesuai Desain Gambar ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          <SiteStatusBanner
            isOperational={isOperational}
            lastUpdated={lastUpdatedTime}
            maintenanceSites={stats.maintenanceSites}
          />

          <SiteKPICards
            stats={stats}
            isLoading={isAllSitesLoading && !allSitesData}
            activeFilter={statusFilter}
            onFilterChange={(st) => {
              setStatusFilter(st);
              setPage(1);
            }}
          />
        </div>

        {/* ── Table Card: Toolbar & Tabel Site Modern ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          <SiteToolbar
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
            onAddSite={() => setShowSiteForm(true)}
            totalSites={tableData?.total}
          />

          <SiteTable
            sites={tableData?.data ?? []}
            isLoading={isTableLoading && !tableData}
            isError={isTableError}
            errorMessage={tableError ? extractErrorMessage(tableError) : null}
            onRetry={() => refetchTable()}
            onDetail={(siteId) => navigate(`/dc/sites/${siteId}`)}
            onEdit={(site) => setEditSite(site)}
            onDelete={(site) => setDeleteTargetSite(site)}
            currentPage={tableData?.current_page ?? 1}
            lastPage={tableData?.last_page ?? 1}
            total={tableData?.total ?? 0}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>

      {/* ── Modals & Dialogs (Preservasi 100% Logika Asli) ── */}
      {showSiteForm && (
        <SiteFormModal onClose={() => setShowSiteForm(false)} />
      )}

      {editSite && (
        <SiteFormModal
          site={editSite}
          onClose={() => setEditSite(null)}
        />
      )}

      {deleteTargetSite && (
        <SiteDeleteConfirmModal
          site={deleteTargetSite}
          onClose={() => setDeleteTargetSite(null)}
          onSuccess={handleSiteDeleted}
        />
      )}
    </div>
  );
}
export default SiteListPage;
