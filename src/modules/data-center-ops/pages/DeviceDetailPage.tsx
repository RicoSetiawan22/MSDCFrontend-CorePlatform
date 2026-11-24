import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, GitFork, AlertCircle } from "lucide-react";
import { useDevice } from "../api/useDevices";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import {
  DeviceDetailBreadcrumb,
  DeviceDetailHero,
  DeviceMiniKPICards,
  DeviceInfoCard,
  DeviceLocationCard,
  DeviceRelationsCard,
  DeviceDeleteConfirmModal,
} from "../components/device";
import { DeviceEditModal } from "./DeviceEditModal";
import { DeviceMoveModal } from "./DeviceMoveModal";

type ActiveTab = "description" | "detail";

export function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const deviceId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("description");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: device, isLoading, isError, error, refetch } = useDevice(deviceId);

  const handleDeviceMutated = () => {
    queryClient.invalidateQueries({ queryKey: ["dcDevices"] });
    if (deviceId) {
      queryClient.invalidateQueries({ queryKey: ["dcDevices", "detail", deviceId] });
    }
  };

  const handleDeviceDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["dcDevices"] });
    navigate("/dc/devices");
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16">
        <PageHeader
          title="Device Detail"
          subtitle="Rincian spesifikasi perangkat, alokasi rack, daya, dan jaringan."
          containerClassName="px-7 pt-5 pb-2"
        />
        <div className="px-7 py-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
            <AlertCircle size={28} />
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h3 className="text-base font-bold text-slate-800">Gagal Memuat Detail Perangkat</h3>
            <p className="text-xs text-slate-500">
              {(error as Error)?.message || "Terjadi kesalahan saat mengambil rincian data perangkat."}
            </p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={() => navigate("/dc/devices")}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              ← Kembali ke List
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !device) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16">
        <PageHeader
          title="Device Detail"
          subtitle="Rincian spesifikasi perangkat, alokasi rack, daya, dan jaringan."
          containerClassName="px-7 pt-5 pb-2"
        />
        <div className="px-7 py-16 flex items-center justify-center">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16">
        <PageHeader
          title="Device Detail"
          subtitle="Rincian spesifikasi perangkat, alokasi rack, daya, dan jaringan."
          containerClassName="px-7 pt-5 pb-2"
        />
        <div className="px-7 py-12 flex flex-col items-center gap-4">
          <EmptyState
            title="Perangkat Tidak Ditemukan"
            subtitle="Perangkat inventori dengan ID ini mungkin sudah dihapus atau tidak terdaftar."
          />
          <button
            type="button"
            onClick={() => navigate("/dc/devices")}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            ← Kembali ke Device Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Breadcrumb Rute Navigasi ── */}
      <DeviceDetailBreadcrumb deviceCode={device.device_code} />

      {/* ── 2. Header Banner Bergaya MSDC ── */}
      <PageHeader
        title="Device Detail"
        subtitle="Rincian spesifikasi perangkat, alokasi rack, daya, dan jaringan."
        containerClassName="px-7 pt-2 pb-2"
      />

      {/* ── 3. Konten Utama Halaman ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* Hero Card */}
        <DeviceDetailHero
          device={device}
          onBack={() => navigate("/dc/devices")}
          onEdit={() => setShowEditModal(true)}
          onMove={() => setShowMoveModal(true)}
          onDelete={() => setShowDeleteModal(true)}
        />

        {/* 4 Mini KPI Cards */}
        <DeviceMiniKPICards device={device} />

        {/* ── 4. Tab Navigation Header (DESKRIPSI & DETAIL) ── */}
        <div className="flex items-center gap-8 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("description")}
            className={`pb-3 flex items-center gap-2 text-sm font-bold tracking-wide transition-all cursor-pointer focus:outline-none focus:ring-0 ${
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
            className={`pb-3 flex items-center gap-2 text-sm font-bold tracking-wide transition-all cursor-pointer focus:outline-none focus:ring-0 ${
              activeTab === "detail"
                ? "text-amber-600 border-b-2 border-amber-500"
                : "text-slate-500 hover:text-slate-800 border-b-2 border-transparent"
            }`}
          >
            <GitFork size={16} />
            <span>DETAIL &amp; JARINGAN</span>
          </button>
        </div>

        {/* ── 5. Tab Content ── */}
        {activeTab === "description" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            {/* Kartu Informasi Modern (SiteInfoCard style) */}
            <DeviceInfoCard device={device} />

            {/* Kartu Penempatan Fisik */}
            <DeviceLocationCard device={device} />
          </div>
        )}

        {activeTab === "detail" && (
          <div className="animate-in fade-in duration-150">
            {/* Kartu Relasi Customer, Kontrak & Jaringan */}
            <DeviceRelationsCard device={device} />
          </div>
        )}
      </div>

      {/* ── 6. Modals & Dialogs ── */}
      {showEditModal && (
        <DeviceEditModal
          device={device}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleDeviceMutated}
        />
      )}

      {showMoveModal && (
        <DeviceMoveModal
          device={device}
          onClose={() => setShowMoveModal(false)}
          onSuccess={handleDeviceMutated}
        />
      )}

      {showDeleteModal && (
        <DeviceDeleteConfirmModal
          device={device}
          siteName={device.site?.site_name}
          rackCode={device.rack?.rack_code}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={handleDeviceDeleted}
        />
      )}
    </div>
  );
}

export default DeviceDetailPage;
