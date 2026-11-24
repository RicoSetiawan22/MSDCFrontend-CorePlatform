import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, GitFork } from "lucide-react";
import { useRack } from "../api/useRacks";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import {
  RackDetailBreadcrumb,
  RackDetailHero,
  RackInfoCard,
  RackDependentsCard,
  RackVisualPickerModal,
  RackDeleteConfirmModal,
} from "../components/rack";
import { RackCctvWidget } from "../components/cctv";

type ActiveTab = "description" | "detail";

export function RackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const rackId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("description");
  const [showVisualPicker, setShowVisualPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: rack, isLoading, refetch, isRefetching } = useRack(rackId);

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["dcRacks"] });
  };

  const handleRackDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["dcRacks"] });
    navigate("/dc/racks");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16">
        <PageHeader
          title="Rack Manager"
          subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
          containerClassName="px-7 pt-5 pb-2"
        />
        <div className="px-7 py-12">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (!rack) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16">
        <PageHeader
          title="Rack Manager"
          subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
          containerClassName="px-7 pt-5 pb-2"
        />
        <div className="px-7 py-12">
          <EmptyState
            title="Rack Tidak Ditemukan"
            subtitle="Rack dengan ID ini mungkin sudah dihapus atau tidak terdaftar di sistem."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Indikator Rute / Breadcrumb Paling Atas (Rack > R03) ── */}
      <RackDetailBreadcrumb rackCode={rack.rack_code} />

      {/* ── 2. Header Banner Bergaya MSDC (Navy & Gold Accent) ── */}
      <PageHeader
        title="Rack Manager"
        subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
        containerClassName="px-7 pt-2 pb-2"
      />

      {/* ── 3. Konten Utama Halaman ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* Hero Profile Card */}
        <RackDetailHero
          rack={rack}
          onBack={() => navigate("/dc/racks")}
          onViewSlots={() => setShowVisualPicker(true)}
          onDelete={() => setShowDeleteConfirm(true)}
        />

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
            {/* Kartu Informasi Riil Endpoint (2 Kolom di Desktop) */}
            <div className="lg:col-span-2">
              <RackInfoCard rack={rack} />
            </div>

            {/* Widget Pengawasan CCTV Rak (1 Kolom di Desktop) */}
            <div className="lg:col-span-1">
              <RackCctvWidget rackId={rack.id} rackCode={rack.rack_code} />
            </div>
          </div>
        )}

        {activeTab === "detail" && (
          <div className="animate-in fade-in duration-150">
            {/* Kartu Telemetri Kapasitas & Penggunaan Daya + Dependensi */}
            <RackDependentsCard
              rack={rack}
              onRefresh={handleRefresh}
              isRefreshing={isRefetching}
            />
          </div>
        )}
      </div>

      {/* ── 6. Modals Terkait ── */}
      {showVisualPicker && (
        <RackVisualPickerModal
          rack={rack}
          isOpen={showVisualPicker}
          onClose={() => setShowVisualPicker(false)}
        />
      )}

      {showDeleteConfirm && (
        <RackDeleteConfirmModal
          rack={rack}
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onSuccess={handleRackDeleted}
        />
      )}
    </div>
  );
}

export default RackDetailPage;
