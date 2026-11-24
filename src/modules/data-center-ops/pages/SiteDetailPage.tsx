import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, GitFork } from "lucide-react";
import { useSite } from "../api/useSites";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import {
  SiteDetailBreadcrumb,
  SiteDetailHero,
  SiteMiniKPICards,
  SiteInfoCard,
  SiteRoomsCard,
  SiteDependentsCard,
  SiteFormModal,
} from "../components/site";
import { RoomFormModal } from "./RoomFormModal";

type ActiveTab = "description" | "detail";

export function SiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const siteId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("description");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);

  const { data: site, isLoading } = useSite(siteId);

  const handleRoomAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["dcSites"] });
    setShowAddRoomModal(false);
  };

  const handleSiteUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["dcSites"] });
    setShowEditModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16">
        <PageHeader
          title="Site Manager"
          subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
          containerClassName="px-7 pt-5 pb-2"
        />
        <div className="px-7 py-12">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16">
        <PageHeader
          title="Site Manager"
          subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
          containerClassName="px-7 pt-5 pb-2"
        />
        <div className="px-7 py-12">
          <EmptyState
            title="Site Tidak Ditemukan"
            subtitle="Data Center Site dengan ID ini mungkin sudah dihapus atau tidak terdaftar."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Indikator Rute / Breadcrumb Paling Atas (Site > DC-SBY-01) ── */}
      <SiteDetailBreadcrumb siteCode={site.site_code} />

      {/* ── 2. Header Banner Bergaya MSDC (Navy & Gold Accent) ── */}
      <PageHeader
        title="Site Manager"
        subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
        containerClassName="px-7 pt-2 pb-2"
      />

      {/* ── 3. Konten Utama Halaman ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* Hero Profile Card */}
        <SiteDetailHero
          site={site}
          onBack={() => navigate("/dc/sites")}
          onEdit={() => setShowEditModal(true)}
          onAddRoom={() => setShowAddRoomModal(true)}
        />

        {/* ── 6 Mini KPI Metric Cards (Room, Rack, Device, Daya, Bandwidth, Kontrak+SSO) ── */}
        <SiteMiniKPICards dependents={site.dependents} />

        {/* ── 4. Tab Navigation Header (DESKRIPSI & DETAIL) ── */}
        <div className="flex items-center gap-8 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("description")}
            className={`pb-3 flex items-center gap-2 text-sm font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === "description"
                ? "text-amber-600 border-b-2 border-amber-500"
                : "text-slate-500 hover:text-slate-800 border-b-2 border-transparent"
            }`}
          >
            <FileText size={16} />
            <span>DESKRIPSI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("detail")}
            className={`pb-3 flex items-center gap-2 text-sm font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === "detail"
                ? "text-amber-600 border-b-2 border-amber-500"
                : "text-slate-500 hover:text-slate-800 border-b-2 border-transparent"
            }`}
          >
            <GitFork size={16} />
            <span>DETAIL</span>
          </button>
        </div>

        {/* ── 5. Tab Content ── */}
        {activeTab === "description" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            {/* Kartu Informasi Riil Endpoint */}
            <SiteInfoCard site={site} />

            {/* Kartu Ruangan yang Terhubung */}
            <SiteRoomsCard
              rooms={site.rooms}
              onAddRoom={() => setShowAddRoomModal(true)}
            />
          </div>
        )}

        {activeTab === "detail" && (
          <div className="animate-in fade-in duration-150">
            {/* Kartu Dependensi & Relasi Customer */}
            <SiteDependentsCard dependents={site.dependents} />
          </div>
        )}
      </div>

      {/* ── 6. Modals Terkait ── */}
      {showEditModal && (
        <SiteFormModal
          site={site}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleSiteUpdated}
        />
      )}

      {showAddRoomModal && (
        <RoomFormModal
          siteId={site.id}
          siteName={site.site_name}
          onClose={() => setShowAddRoomModal(false)}
          onSuccess={handleRoomAdded}
        />
      )}
    </div>
  );
}

export default SiteDetailPage;
