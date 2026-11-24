import React, { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Video,
  Plus,
  Search,
  RotateCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  X,
} from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { useAuth } from "@shared/lib/auth-context";
import { getApiErrorMessage } from "@shared/lib/api-client";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import { Pagination } from "@shared/components/Pagination";
import {
  useCctvCameras,
  useCheckCctvCamera,
  useDeleteCctvCamera,
} from "../api/useCctv";
import { useSiteList } from "../api/useSites";
import { useRoomList } from "../api/useRooms";
import { useRackList } from "../api/useRacks";
import type { CctvCamera } from "../types/cctv";
import {
  CctvCameraCard,
  CctvPlayerModal,
} from "../components/cctv";
import { DashboardStatusBanner } from "../components/common/DashboardStatusBanner";

/** Batas player inline yang memutar bersamaan (dokumen 07 §5.2): HLS berat untuk browser & server CCTV. */
const MAX_ACTIVE_PLAYERS = 4;

const PER_PAGE = 12;

/** Filter yang disimpan di query string agar bisa dibagikan / di-bookmark. */
const FILTER_KEYS = ["search", "site_id", "site_room_id", "rack_id", "status", "source_type"] as const;

const toNumber = (value: string | null): number | undefined => {
  const n = value ? Number(value) : NaN;
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export const CctvListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canView = hasPermission("cctv.view");
  const canManage = hasPermission("cctv.manage");

  // Filter & Pagination dari URL
  const [searchParams, setSearchParams] = useSearchParams();
  const page = toNumber(searchParams.get("page")) ?? 1;
  const search = searchParams.get("search") ?? "";
  const selectedSiteId = toNumber(searchParams.get("site_id"));
  const selectedRoomId = toNumber(searchParams.get("site_room_id"));
  const selectedRackId = toNumber(searchParams.get("rack_id"));
  const selectedStatus = searchParams.get("status") ?? "";
  const selectedSourceType = searchParams.get("source_type") ?? "";

  /** Perbarui sebagian filter; setiap perubahan filter mengembalikan ke halaman 1. */
  const updateParams = useCallback(
    (patch: Record<string, string | number | undefined>, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, value]) => {
            if (value === undefined || value === "") next.delete(key);
            else next.set(key, String(value));
          });
          if (resetPage) next.delete("page");
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setPage = (newPage: number) => updateParams({ page: newPage > 1 ? newPage : undefined }, false);

  // Modal Player State
  const [activeCamera, setActiveCamera] = useState<CctvCamera | null>(null);
  const [checkingCameraId, setCheckingCameraId] = useState<number | null>(null);
  const [deleteConfirmCamera, setDeleteConfirmCamera] = useState<CctvCamera | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Player inline aktif, urutan = paling lama diputar lebih dulu (dibuang saat melebihi batas)
  const [activePlayerIds, setActivePlayerIds] = useState<number[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 6000);
  }, []);

  // Queries
  const {
    data: cameraResponse,
    isLoading,
    isError,
    refetch,
    isRefetching,
    dataUpdatedAt,
  } = useCctvCameras(
    {
      page,
      per_page: PER_PAGE,
      search: search.trim() || undefined,
      site_id: selectedSiteId,
      site_room_id: selectedRoomId,
      rack_id: selectedRackId,
      status: selectedStatus || undefined,
      source_type: selectedSourceType || undefined,
    },
    canView
  );

  // Format Waktu Terakhir Diperbarui
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

  const { data: siteList } = useSiteList({ per_page: 100 });
  const { data: roomList } = useRoomList(selectedSiteId);
  const { data: rackList } = useRackList({
    site_id: selectedSiteId,
    per_page: 100,
  });

  // Mutations
  const checkMutation = useCheckCctvCamera();
  const deleteMutation = useDeleteCctvCamera();

  const cameras: CctvCamera[] = useMemo(() => {
    return cameraResponse?.data || [];
  }, [cameraResponse]);

  const paginationMeta = {
    current_page: cameraResponse?.current_page ?? page,
    last_page: cameraResponse?.last_page ?? 1,
    total: cameraResponse?.total ?? cameras.length,
  };

  // KPI dari `summary` backend: menghitung seluruh hasil filter, bukan hanya halaman ini.
  const kpiMetrics = {
    total: cameraResponse?.summary?.total ?? paginationMeta.total,
    onlineCount: cameraResponse?.summary?.online ?? 0,
    offlineCount: cameraResponse?.summary?.offline ?? 0,
    maintenanceCount: cameraResponse?.summary?.maintenance ?? 0,
  };

  // Handlers
  const handlePlayInline = useCallback((camera: CctvCamera) => {
    setActivePlayerIds((prev) => {
      const next = [...prev.filter((id) => id !== camera.id), camera.id];
      return next.slice(-MAX_ACTIVE_PLAYERS);
    });
  }, []);

  const handleStopInline = useCallback((camera: CctvCamera) => {
    setActivePlayerIds((prev) => prev.filter((id) => id !== camera.id));
  }, []);

  const handleOpenPlayer = (camera: CctvCamera) => {
    // Modal memutar stream yang sama: hentikan player inline-nya agar tidak dobel.
    handleStopInline(camera);
    setActiveCamera(camera);
  };

  const handleCheckCamera = async (camera: CctvCamera) => {
    try {
      setCheckingCameraId(camera.id);
      const result = await checkMutation.mutateAsync(camera.id);
      if (result.ok) {
        showToast(`Stream "${camera.camera_name}" hidup. Status: ${result.camera.status}.`, "success");
      } else {
        const stillOnline = result.camera.status !== "offline";
        showToast(
          `Stream "${camera.camera_name}" gagal diperiksa: ${result.message ?? "tidak diketahui"}` +
            (stillOnline
              ? " Status belum berubah menjadi offline sampai gagal beberapa kali berturut-turut."
              : ""),
          "error"
        );
      }
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal memeriksa ulang kamera."), "error");
    } finally {
      setCheckingCameraId(null);
    }
  };

  const handleDeleteCamera = async () => {
    if (!deleteConfirmCamera) return;
    const target = deleteConfirmCamera;
    try {
      await deleteMutation.mutateAsync(target.id);
      handleStopInline(target);
      setDeleteConfirmCamera(null);
      showToast(`Kamera "${target.camera_name}" berhasil dihapus.`, "success");
    } catch (err) {
      setDeleteConfirmCamera(null);
      showToast(getApiErrorMessage(err, "Gagal menghapus kamera."), "error");
    }
  };

  const handleResetFilters = () => {
    updateParams(Object.fromEntries(FILTER_KEYS.map((key) => [key, undefined])));
  };

  const hasActiveFilters = FILTER_KEYS.some((key) => Boolean(searchParams.get(key)));

  if (!canView) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16 font-sans">
        <PageHeader
          title="Pemantauan CCTV Rak & Lorong"
          subtitle="Monitoring visual kamera pengawas data center"
          containerClassName="px-6 pt-5 pb-3"
        />
        <div className="px-6 py-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8">
            <EmptyState title="Akses Ditolak" subtitle="Anda tidak punya izin (cctv.view) untuk membuka halaman ini." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16 font-sans">
      {/* ── 1. Page Header Bergaya MSDC (Clean Header Banner) ── */}
      <PageHeader
        title="Pemantauan CCTV Rak & Lorong"
        subtitle="Monitoring visual 24×7 kamera pengawas di lorong rak server dan perimeter fisik data center"
        containerClassName="px-7 pt-5 pb-2"
      />

      <div className="flex flex-col gap-6 px-7 py-5">
        {/* ── Feedback Notification Toast ── */}
        {feedbackToast && (
          <div
            role="status"
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-xs animate-in slide-in-from-top duration-200 ${
              feedbackToast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedbackToast.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
              )}
              <span>{feedbackToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackToast(null)}
              aria-label="Tutup notifikasi"
              className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* ── 2. Container 1: Overview Card (Status Banner & 4 KPI Cards) ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          <DashboardStatusBanner
            isOperational={kpiMetrics.offlineCount === 0}
            statusTitle="SURVEILLANCE SYSTEM OPERATIONAL"
            attentionTitle="SURVEILLANCE ATTENTION REQUIRED"
            subtitle={
              kpiMetrics.offlineCount === 0
                ? "Semua feed kamera CCTV aktif dan termonitor secara real-time"
                : `${kpiMetrics.offlineCount} kamera pengawas membutuhkan pengecekan koneksi segera`
            }
            lastUpdated={lastUpdatedTime}
          />

          {/* 4 Interactive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Kamera */}
            <div
              onClick={() => updateParams({ status: undefined })}
              className={`group bg-white rounded-xl border p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer flex items-center justify-between ${
                !selectedStatus
                  ? "border-amber-500/80 ring-2 ring-amber-500/15"
                  : "border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">
                    Total Kamera
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">{kpiMetrics.total}</div>
                <span className="text-[0.68rem] text-slate-400 mt-0.5 block">Semua lokasi data center</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100 group-hover:scale-105 transition-transform">
                <Video size={20} />
              </div>
            </div>

            {/* Kamera Online */}
            <div
              onClick={() => updateParams({ status: selectedStatus === "online" ? undefined : "online" })}
              className={`group bg-white rounded-xl border p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer flex items-center justify-between ${
                selectedStatus === "online"
                  ? "border-emerald-500 ring-2 ring-emerald-500/15 bg-emerald-50/20"
                  : "border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">
                    Kamera Online
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{kpiMetrics.onlineCount}</div>
                <span className="text-[0.68rem] text-slate-400 mt-0.5 block">Feed aktif & responsif</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
                <CheckCircle2 size={20} />
              </div>
            </div>

            {/* Kamera Offline */}
            <div
              onClick={() => updateParams({ status: selectedStatus === "offline" ? undefined : "offline" })}
              className={`group bg-white rounded-xl border p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer flex items-center justify-between ${
                selectedStatus === "offline"
                  ? "border-rose-500 ring-2 ring-rose-500/15 bg-rose-50/20"
                  : "border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">
                    Kamera Offline
                  </span>
                </div>
                <div className="text-2xl font-black text-rose-600 mt-1">{kpiMetrics.offlineCount}</div>
                <span className="text-[0.68rem] text-slate-400 mt-0.5 block">Perlu investigasi jaringan</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 group-hover:scale-105 transition-transform">
                <XCircle size={20} />
              </div>
            </div>

            {/* Maintenance */}
            <div
              onClick={() => updateParams({ status: selectedStatus === "maintenance" ? undefined : "maintenance" })}
              className={`group bg-white rounded-xl border p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer flex items-center justify-between ${
                selectedStatus === "maintenance"
                  ? "border-amber-500 ring-2 ring-amber-500/15 bg-amber-50/20"
                  : "border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">
                    Maintenance
                  </span>
                </div>
                <div className="text-2xl font-black text-amber-600 mt-1">{kpiMetrics.maintenanceCount}</div>
                <span className="text-[0.68rem] text-slate-400 mt-0.5 block">Dalam pemeliharaan</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:scale-105 transition-transform">
                <AlertTriangle size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Container 2: Main Surveillance Card (Toolbar, Grid & Pagination) ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          {/* Toolbar: Search, Filters & Action Buttons */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            {/* Sisi Kiri: Search Input & Filter Dropdowns */}
            <div className="flex items-center gap-2.5 flex-1 flex-wrap">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => updateParams({ search: e.target.value })}
                  placeholder="Cari nama kamera, NVR, atau merek..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                />
              </div>

              {/* Filter Site */}
              <div className="w-full sm:w-auto min-w-[140px]">
                <select
                  value={selectedSiteId ?? ""}
                  onChange={(e) =>
                    updateParams({ site_id: e.target.value || undefined, site_room_id: undefined, rack_id: undefined })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
                >
                  <option value="">Semua Site</option>
                  {siteList?.data?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.site_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Ruangan */}
              <div className="w-full sm:w-auto min-w-[140px]">
                <select
                  value={selectedRoomId ?? ""}
                  onChange={(e) => updateParams({ site_room_id: e.target.value || undefined, rack_id: undefined })}
                  disabled={!roomList || roomList.length === 0}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer disabled:opacity-50"
                >
                  <option value="">Semua Ruangan</option>
                  {roomList?.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.room_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Rak */}
              <div className="w-full sm:w-auto min-w-[130px]">
                <select
                  value={selectedRackId ?? ""}
                  onChange={(e) => updateParams({ rack_id: e.target.value || undefined })}
                  disabled={!selectedSiteId || !rackList?.data || rackList.data.length === 0}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer disabled:opacity-50"
                >
                  <option value="">Semua Rak</option>
                  {rackList?.data?.map((r) => (
                    <option key={r.id} value={r.id}>
                      Rak {r.rack_code} {r.rack_name ? `(${r.rack_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Status */}
              <div className="w-full sm:w-auto min-w-[120px]">
                <select
                  value={selectedStatus}
                  onChange={(e) => updateParams({ status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
                >
                  <option value="">Semua Status</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="unknown">Belum Dicek</option>
                </select>
              </div>

              {/* Filter Tipe Stream */}
              <div className="w-full sm:w-auto min-w-[120px]">
                <select
                  value={selectedSourceType}
                  onChange={(e) => updateParams({ source_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
                >
                  <option value="">Semua Tipe</option>
                  <option value="hls">HLS (Browser)</option>
                  <option value="rtmp">RTMP (NVR)</option>
                </select>
              </div>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Reset semua filter"
                >
                  <X size={13} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Sisi Kanan: Action Buttons (Segarkan & Tambah Kamera) */}
            <div className="flex items-center gap-2.5 self-end xl:self-auto shrink-0 pt-2 xl:pt-0">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isRefetching}
                title="Segarkan data kamera dan status live"
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                <RotateCw size={14} className={isRefetching ? "animate-spin text-amber-500" : "text-slate-500"} />
                <span>Segarkan</span>
              </button>

              {canManage && (
                <button
                  type="button"
                  onClick={() => navigate("/dc/cctv/new")}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Plus size={16} className="stroke-[2.5]" />
                  <span>Tambah Kamera</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Main Surveillance Grid / Content Area ── */}
          {isLoading ? (
            <div className="py-12">
              <LoadingState />
            </div>
          ) : isError ? (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-8 text-center text-slate-700">
              <XCircle size={36} className="text-rose-500 mx-auto mb-2" />
              <h4 className="text-base font-bold text-slate-800">Gagal Memuat Daftar Kamera</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Terjadi gangguan saat mengambil data kamera dari server. Silakan coba lagi.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-600 cursor-pointer shadow-sm"
              >
                Coba Lagi
              </button>
            </div>
          ) : cameras.length === 0 ? (
            <div className="py-12 text-center">
              <EmptyState
                title="Belum Ada Kamera CCTV"
                subtitle={
                  hasActiveFilters
                    ? "Tidak ada kamera yang cocok dengan kriteria filter saat ini."
                    : "Mulai daftarkan kamera CCTV untuk memantau keamanan fisik rak server dan lorong data center."
                }
              />
              {canManage && !hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => navigate("/dc/cctv/new")}
                  className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Tambah Kamera Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in">
              {cameras.map((camera) => (
                <CctvCameraCard
                  key={camera.id}
                  camera={camera}
                  canManage={canManage}
                  onOpenPlayer={handleOpenPlayer}
                  onEdit={(cam) => navigate(`/dc/cctv/${cam.id}/edit`)}
                  onDelete={(cam) => setDeleteConfirmCamera(cam)}
                  onCheck={handleCheckCamera}
                  isChecking={checkingCameraId === camera.id}
                  isPlayingInline={activePlayerIds.includes(camera.id)}
                  onPlayInline={handlePlayInline}
                  onStopInline={handleStopInline}
                />
              ))}
            </div>
          )}

          {/* ── Pagination Bar (di dalam Card) ── */}
          {!isLoading && !isError && paginationMeta.last_page > 1 && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Pagination
                currentPage={paginationMeta.current_page}
                lastPage={paginationMeta.last_page}
                total={paginationMeta.total}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── 6. Modals ── */}
      {/* Player Modal Fullscreen */}
      <CctvPlayerModal
        camera={activeCamera}
        isOpen={Boolean(activeCamera)}
        onClose={() => setActiveCamera(null)}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmCamera && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
              <XCircle size={26} />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">Hapus Kamera CCTV?</h4>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Anda yakin ingin menghapus kamera{" "}
              <strong className="text-slate-700 font-bold">
                {deleteConfirmCamera.camera_name}
              </strong>
              ? Data monitoring dan relasi kamera ini dengan rak server akan dihapus dari sistem.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmCamera(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteCamera}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus Kamera"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

