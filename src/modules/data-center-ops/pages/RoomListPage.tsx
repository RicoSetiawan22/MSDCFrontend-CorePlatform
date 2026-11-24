import { useState, useMemo } from "react";
import { PageHeader } from "@shared/components/PageHeader";
import { useRoomList } from "../api/useRooms";
import { useSiteList } from "../api/useSites";
import {
  RoomStatusBanner,
  RoomKPICards,
  RoomToolbar,
  RoomTable,
  RoomFormModal,
  RoomDeleteConfirmModal,
  type RoomItem,
} from "../components/room";

export function RoomListPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editRoom, setEditRoom] = useState<RoomItem | null>(null);
  const [deleteTargetRoom, setDeleteTargetRoom] = useState<RoomItem | null>(null);

  // ── 1. Query Data Room & Site ──
  const { data: allRooms = [], isLoading, dataUpdatedAt } = useRoomList();
  const { data: sitesPage } = useSiteList({ per_page: 100 });

  // ── 2. Komputasi Statistik KPI (Total Room, Server Room, Network Room, UPS & Power) ──
  const stats = useMemo(() => {
    let serverRooms = 0;
    let networkRooms = 0;
    let upsRooms = 0;

    allRooms.forEach((r) => {
      const type = (r.room_type ?? "").toLowerCase();
      if (type === "server_room") serverRooms += 1;
      else if (type === "network_room") networkRooms += 1;
      else if (type === "ups_room") upsRooms += 1;
    });

    return {
      totalRooms: allRooms.length,
      serverRooms,
      networkRooms,
      upsRooms,
    };
  }, [allRooms]);

  const maintenanceRooms = useMemo(() => {
    return allRooms.filter((r) => (r as { status?: string }).status === "maintenance").length;
  }, [allRooms]);

  const isOperational = maintenanceRooms === 0;

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

  const sitesList = useMemo(() => {
    return (sitesPage?.data ?? []).map((s) => ({
      id: s.id,
      site_name: s.site_name,
      site_code: s.site_code,
    }));
  }, [sitesPage]);

  // ── 2. Filter Client-side ──
  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRooms.filter((r) => {
      const matchSearch =
        !q ||
        r.room_code?.toLowerCase().includes(q) ||
        r.room_name?.toLowerCase().includes(q) ||
        r.site_name?.toLowerCase().includes(q) ||
        r.site_code?.toLowerCase().includes(q);

      const matchSite = !siteFilter || String(r.site_id) === siteFilter;
      const matchType = !typeFilter || r.room_type === typeFilter;

      return matchSearch && matchSite && matchType;
    });
  }, [allRooms, search, siteFilter, typeFilter]);

  // ── 3. Paginasi Client-side ──
  const total = filteredRooms.length;
  const totalPages = Math.ceil(total / perPage) || 1;

  const paginatedRooms = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredRooms.slice(start, start + perPage);
  }, [filteredRooms, page, perPage]);

  const handleRoomDeleted = () => {
    if (paginatedRooms.length <= 1 && page > 1) {
      setPage((prev) => Math.max(1, prev - 1));
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Header Halaman Konsisten dengan SiteListPage ── */}
      <PageHeader
        title="Room Manager"
        subtitle="Kelola ruangan Data Center — Server Room, Network Room, UPS Room & Power."
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── 2. Konten Utama ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* ── Overview Card: Status Banner & 4 KPI Cards Sesuai Desain MSDC (Selaras SiteListPage) ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          <RoomStatusBanner
            isOperational={isOperational}
            lastUpdated={lastUpdatedTime}
            maintenanceRooms={maintenanceRooms}
          />

          <RoomKPICards
            stats={stats}
            isLoading={isLoading && allRooms.length === 0}
            activeFilter={typeFilter}
            onFilterChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
          />
        </div>

        {/* Table Card Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          <RoomToolbar
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            siteFilter={siteFilter}
            onSiteFilterChange={(val) => {
              setSiteFilter(val);
              setPage(1);
            }}
            typeFilter={typeFilter}
            onTypeFilterChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
            sites={sitesList}
            onAddRoom={() => setShowCreate(true)}
            totalRooms={total}
          />

          <RoomTable
            rooms={paginatedRooms}
            isLoading={isLoading}
            onEdit={(room) => setEditRoom(room)}
            onDelete={(room) => setDeleteTargetRoom(room)}
            currentPage={page}
            totalPages={totalPages}
            perPage={perPage}
            total={total}
            onPageChange={(p) => setPage(p)}
            onPerPageChange={(pp) => {
              setPerPage(pp);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* ── 3. Modals & Dialogs (Backdrop blur) ── */}
      {showCreate && (
        <RoomFormModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editRoom && (
        <RoomFormModal
          room={editRoom}
          isOpen={Boolean(editRoom)}
          onClose={() => setEditRoom(null)}
        />
      )}

      {deleteTargetRoom && (
        <RoomDeleteConfirmModal
          room={deleteTargetRoom}
          isOpen={Boolean(deleteTargetRoom)}
          onClose={() => setDeleteTargetRoom(null)}
          onSuccess={handleRoomDeleted}
        />
      )}
    </div>
  );
}

export default RoomListPage;
