import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Save,
  Zap,
  Radio,
  Building2,
  Server,
  Layers,
  AlertCircle,
  HelpCircle,
  Info,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { useAuth } from "@shared/lib/auth-context";
import { getApiErrorMessage } from "@shared/lib/api-client";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import {
  useCctvCamera,
  useCreateCctvCamera,
  useUpdateCctvCamera,
  useTestCctvStream,
} from "../api/useCctv";
import { useSiteList } from "../api/useSites";
import { useRoomList } from "../api/useRooms";
import { useRackList } from "../api/useRacks";
import {
  CctvStreamTestResult,
  HlsPlayer,
} from "../components/cctv";
import { detectSourceType } from "../utils/cctv";
import type { CctvStreamTestResult as ICctvStreamTestResult } from "../types/cctv";

/** Pesan error test/simpan; 429 (batas 10 test per menit) diberi pesan yang jelas. */
function describeTestError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.status === 429) {
    const retryAfter = Number(err.response.headers?.["retry-after"]);
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? `${retryAfter} detik` : "1 menit";
    return `Terlalu banyak percobaan test koneksi. Coba lagi dalam ${wait}.`;
  }
  return getApiErrorMessage(err, "Gagal menguji koneksi stream ke server CCTV.");
}

export const CctvFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const cameraId = id ? Number(id) : undefined;
  const navigate = useNavigate();

  const { hasPermission } = useAuth();
  const canManage = hasPermission("cctv.manage");

  // Query existing data if edit mode
  const { data: existingCamera, isLoading: isCameraLoading } = useCctvCamera(canManage ? cameraId : undefined);

  // Form States
  const [cameraName, setCameraName] = useState("");
  const [siteId, setSiteId] = useState<number | "">("");
  const [siteRoomId, setSiteRoomId] = useState<number | "">("");
  const [rackId, setRackId] = useState<number | "">("");
  const [deviceBrand, setDeviceBrand] = useState("");
  const [modelSeries, setModelSeries] = useState("");
  const [nvrName, setNvrName] = useState("");
  const [nvrChannel, setNvrChannel] = useState<number | "">("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);

  // Stream Test State
  const [testResult, setTestResult] = useState<ICctvStreamTestResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Cascading Location Queries
  const { data: siteList, isLoading: isSitesLoading } = useSiteList({ per_page: 100 });
  const { data: roomList, isLoading: isRoomsLoading } = useRoomList(siteId ? Number(siteId) : undefined);
  // Rak diambil per ruangan (pola DeviceMoveModal), bukan per site lalu difilter di
  // client: per_page 100 per site bisa memotong rak di site besar.
  const { data: rackList, isLoading: isRacksLoading } = useRackList({
    site_room_id: siteRoomId ? Number(siteRoomId) : undefined,
    per_page: 100,
  });
  const availableRacks = siteRoomId ? rackList?.data ?? [] : [];

  // Mutations
  const createMutation = useCreateCctvCamera();
  const updateMutation = useUpdateCctvCamera();
  const testMutation = useTestCctvStream();

  // Populate data when existingCamera loaded
  useEffect(() => {
    if (existingCamera) {
      setCameraName(existingCamera.camera_name || "");
      setSiteId(existingCamera.site_id || "");
      setSiteRoomId(existingCamera.site_room_id || "");
      setRackId(existingCamera.rack_id || "");
      setDeviceBrand(existingCamera.device_brand || "");
      setModelSeries(existingCamera.model_series || "");
      setNvrName(existingCamera.nvr_name || "");
      setNvrChannel(existingCamera.nvr_channel ?? "");
      setNotes(existingCamera.notes || "");
      setIsActive(Boolean(existingCamera.is_active));
      setIsMaintenance(existingCamera.status === "maintenance");
      // sourceUrl dibiarkan kosong agar tidak membocorkan masked url
    }
  }, [existingCamera]);

  // Live visual detector for typed stream URL
  const detectedType = useMemo(() => {
    return detectSourceType(sourceUrl);
  }, [sourceUrl]);

  // Handle URL change: reset previous test result if user changes the URL
  const handleSourceUrlChange = (val: string) => {
    setSourceUrl(val);
    setTestResult(null);
    setFormError(null);
  };

  const handleTestConnection = async () => {
    const trimmed = sourceUrl.trim();
    if (!trimmed) {
      setFormError("Silakan masukkan alamat stream (RTMP/HLS) terlebih dahulu.");
      return;
    }
    setFormError(null);

    try {
      const res = await testMutation.mutateAsync({ source_url: trimmed });
      setTestResult(res);
    } catch (err) {
      const msg = describeTestError(err);
      setFormError(msg);
      // 422 dari /test tetap berbentuk StreamTestResult (error_code INVALID_FORMAT /
      // HOST_NOT_ALLOWED): pertahankan supaya kode error tampil di panel hasil.
      const body = axios.isAxiosError(err) ? (err.response?.data as Partial<ICctvStreamTestResult> | undefined) : undefined;
      setTestResult({
        ok: false,
        source_type: body?.source_type,
        error_code: body?.error_code ?? null,
        message: msg,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    if (!cameraName.trim()) {
      setFormError("Nama kamera wajib diisi.");
      return;
    }
    if (!siteId) {
      setFormError("Site data center wajib dipilih.");
      return;
    }
    if (!siteRoomId) {
      setFormError("Ruangan server wajib dipilih.");
      return;
    }

    // Validasi gate stream test
    if (!isEditMode) {
      if (!sourceUrl.trim()) {
        setFormError("Alamat stream CCTV wajib diisi.");
        return;
      }
      if (!testResult || !testResult.ok) {
        setFormError("Wajib melakukan 'Test Koneksi Stream' dan memastikan stream terverifikasi sebelum menyimpan.");
        return;
      }
    } else {
      // Pada mode edit, jika sourceUrl diisi baru, wajib test sukses
      if (sourceUrl.trim() && (!testResult || !testResult.ok)) {
        setFormError("Alamat stream baru wajib diuji koneksinya sebelum disimpan.");
        return;
      }
    }

    setFormError(null);

    try {
      if (isEditMode && cameraId) {
        await updateMutation.mutateAsync({
          id: cameraId,
          data: {
            camera_name: cameraName.trim(),
            site_id: Number(siteId),
            site_room_id: Number(siteRoomId),
            rack_id: rackId ? Number(rackId) : null,
            device_brand: deviceBrand.trim() || null,
            model_series: modelSeries.trim() || null,
            nvr_name: nvrName.trim() || null,
            nvr_channel: nvrChannel === "" ? null : Number(nvrChannel),
            source_url: sourceUrl.trim() || undefined,
            is_active: isActive,
            notes: notes.trim() || null,
            maintenance: isMaintenance,
          },
        });
      } else {
        await createMutation.mutateAsync({
          camera_name: cameraName.trim(),
          site_id: Number(siteId),
          site_room_id: Number(siteRoomId),
          rack_id: rackId ? Number(rackId) : null,
          device_brand: deviceBrand.trim() || null,
          model_series: modelSeries.trim() || null,
          nvr_name: nvrName.trim() || null,
          nvr_channel: nvrChannel === "" ? null : Number(nvrChannel),
          source_url: sourceUrl.trim(),
          is_active: isActive,
          notes: notes.trim() || null,
        });
      }

      navigate("/dc/cctv");
    } catch (err) {
      setFormError(
        axios.isAxiosError(err) && err.response?.status === 429
          ? "Terlalu banyak percobaan simpan. Tunggu sebentar lalu coba lagi."
          : getApiErrorMessage(err, "Terjadi kesalahan saat menyimpan kamera CCTV.")
      );
    }
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16 font-sans">
        <div className="px-7 pt-4 pb-1">
          <button
            type="button"
            onClick={() => navigate("/dc/cctv")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Pemantauan CCTV</span>
          </button>
        </div>
        <PageHeader
          title={isEditMode ? "Ubah Kamera CCTV" : "Pendaftaran Kamera CCTV Baru"}
          subtitle="Konfigurasi kamera CCTV"
          containerClassName="px-7 pt-2 pb-2"
        />
        <div className="px-7 py-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8">
            <EmptyState title="Akses Ditolak" subtitle="Anda tidak punya izin (cctv.manage) untuk membuka halaman ini." />
          </div>
        </div>
      </div>
    );
  }

  if (isEditMode && isCameraLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16 font-sans">
        <div className="px-7 pt-4 pb-1">
          <button
            type="button"
            onClick={() => navigate("/dc/cctv")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Pemantauan CCTV</span>
          </button>
        </div>
        <PageHeader
          title="Ubah Kamera CCTV"
          subtitle="Memuat konfigurasi kamera..."
          containerClassName="px-7 pt-2 pb-2"
        />
        <div className="px-7 py-12">
          <LoadingState />
        </div>
      </div>
    );
  }

  // Apakah tombol simpan diizinkan aktif
  const isSaveReady = isEditMode
    ? !sourceUrl.trim() || Boolean(testResult?.ok)
    : Boolean(testResult?.ok);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20 font-sans">
      {/* ── 1. Navigasi Kembali di atas Banner ── */}
      <div className="px-7 pt-4 pb-1">
        <button
          type="button"
          onClick={() => navigate("/dc/cctv")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Pemantauan CCTV</span>
        </button>
      </div>

      {/* ── 2. Page Header Bergaya MSDC ── */}
      <PageHeader
        title={isEditMode ? `Ubah Kamera: ${existingCamera?.camera_name || ""}` : "Pendaftaran Kamera CCTV Baru"}
        subtitle="Konfigurasikan integrasi stream pengawasan lorong rak server data center"
        containerClassName="px-7 pt-2 pb-2"
      />

      {/* ── 3. Formulir Konten Utama (Layout 2 Kolom Responsif) ── */}
      <div className="px-7 py-5">
        <form onSubmit={handleSubmit}>
          {/* Banner Error Global */}
          {formError && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3 animate-in fade-in duration-200"
            >
              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Terjadi Kesalahan:</strong>
                <span>{formError}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── Kolom Kiri: Spesifikasi Identitas, Lokasi, NVR & Status (7 Kolom) ── */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Card 1: Identitas & Lokasi Penempatan */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shrink-0">
                    <Radio size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">1. Identitas & Lokasi Penempatan</h3>
                    <p className="text-xs text-slate-500">Tentukan nama dan titik instalasi fisik kamera di fasilitas</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Nama Kamera */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nama Kamera CCTV <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={cameraName}
                      onChange={(e) => setCameraName(e.target.value)}
                      placeholder="Contoh: CCTV-R01-FRONT (Lorong Depan Rak 01-08)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Grid Site & Ruangan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Site Data Center */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                        <Building2 size={13} className="text-slate-400" />
                        <span>Site Data Center <span className="text-rose-500">*</span></span>
                      </label>
                      <select
                        required
                        value={siteId}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : "";
                          setSiteId(val);
                          setSiteRoomId("");
                          setRackId("");
                        }}
                        disabled={isSitesLoading}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
                      >
                        <option value="">{isSitesLoading ? "Memuat site..." : "Pilih Site Data Center"}</option>
                        {siteList?.data?.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.site_name} ({s.site_code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Ruangan Server */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                        <Layers size={13} className="text-slate-400" />
                        <span>Ruangan Server <span className="text-rose-500">*</span></span>
                      </label>
                      <select
                        required
                        value={siteRoomId}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : "";
                          setSiteRoomId(val);
                          setRackId("");
                        }}
                        disabled={!siteId || isRoomsLoading}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer disabled:opacity-50"
                      >
                        <option value="">
                          {!siteId
                            ? "Pilih site terlebih dahulu"
                            : isRoomsLoading
                            ? "Memuat ruangan..."
                            : "Pilih Ruangan"}
                        </option>
                        {roomList?.map((r: any) => (
                          <option key={r.id} value={r.id}>
                            {r.room_name} ({r.room_code || "-"})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Rak Terkait (Opsional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Server size={13} className="text-slate-400" />
                        <span>Rak Server Terkait <span className="text-slate-400 font-normal">(Opsional)</span></span>
                      </span>
                      <span className="text-[0.68rem] text-slate-400">Pilih jika kamera menyorot spesifik ke rak ini</span>
                    </label>
                    <select
                      value={rackId}
                      onChange={(e) => setRackId(e.target.value ? Number(e.target.value) : "")}
                      disabled={!siteRoomId || isRacksLoading}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer disabled:opacity-50"
                    >
                      <option value="">
                        {!siteRoomId
                          ? "Pilih ruangan terlebih dahulu"
                          : isRacksLoading
                          ? "Memuat rak..."
                          : "-- Tidak Ditautkan ke Rak Spesifik (Kamera Umum / Lorong) --"}
                      </option>
                      {availableRacks.map((rack) => (
                        <option key={rack.id} value={rack.id}>
                          Rak {rack.rack_code} {rack.rack_name ? `(${rack.rack_name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Perangkat CCTV & NVR */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                    <Server size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">2. Spesifikasi Hardware & NVR</h3>
                    <p className="text-xs text-slate-500">Informasi merek perangkat dan konfigurasi channel NVR (opsional)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Brand */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Merek (Brand)</label>
                    <input
                      type="text"
                      maxLength={50}
                      value={deviceBrand}
                      onChange={(e) => setDeviceBrand(e.target.value)}
                      placeholder="Hikvision / Dahua"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Model / Seri</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={modelSeries}
                      onChange={(e) => setModelSeries(e.target.value)}
                      placeholder="DS-2CD2043G2-I"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                  </div>

                  {/* NVR Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama / Host NVR</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={nvrName}
                      onChange={(e) => setNvrName(e.target.value)}
                      placeholder="NVR-DC-SURABAYA-01"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                  </div>

                  {/* NVR Channel */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Channel NVR</label>
                    <input
                      type="number"
                      min={0}
                      max={65535}
                      value={nvrChannel}
                      onChange={(e) => setNvrChannel(e.target.value ? Number(e.target.value) : "")}
                      placeholder="1"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Status Pemantauan & Catatan */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Info size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">3. Status Pemantauan & Catatan</h3>
                    <p className="text-xs text-slate-500">Konfigurasi keaktifan kamera dan dokumentasi teknis</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-6 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 cursor-pointer accent-amber-500"
                      />
                      <span>Kamera Aktif Dipantau Sistem</span>
                    </label>

                    {isEditMode && (
                      <label className="flex items-center gap-2.5 text-xs font-semibold text-amber-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isMaintenance}
                          onChange={(e) => setIsMaintenance(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 cursor-pointer accent-amber-500"
                        />
                        <span>Mode Pemeliharaan (Maintenance)</span>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Catatan Teknisi / Pos Jaga (Opsional)
                    </label>
                    <textarea
                      rows={3}
                      maxLength={2000}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan sudut pandang kamera, riwayat pemeliharaan, atau area pantau khusus. Hindari menulis kredensial/password NVR di sini."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white resize-none transition-all leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Kolom Kanan: Uji Konektivitas Stream & Aksi Simpan (5 Kolom Sticky) ── */}
            <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-6">
              {/* Card: Alamat Stream & Uji Konektivitas */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                      <Zap size={18} className="fill-amber-500 stroke-1" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Uji Koneksi Stream</h3>
                      <p className="text-xs text-slate-500">Verifikasi feed sebelum didaftarkan</p>
                    </div>
                  </div>

                  {detectedType !== "unknown" && !testResult && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[0.68rem] font-bold uppercase tracking-wider ${
                        detectedType === "hls"
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}
                    >
                      {detectedType.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>
                        URL Sumber Stream (RTMP / HLS) {!isEditMode && <span className="text-rose-500">*</span>}
                      </span>
                      {isEditMode && existingCamera && (
                        <span className="text-[0.68rem] font-mono text-slate-400">
                          Tersimpan: {existingCamera.source_url_masked}
                        </span>
                      )}
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required={!isEditMode}
                        value={sourceUrl}
                        onChange={(e) => handleSourceUrlChange(e.target.value)}
                        placeholder={
                          isEditMode
                            ? "Kosongkan jika stream tidak diubah"
                            : "http://.../stream.m3u8 atau rtmp://..."
                        }
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-mono"
                      />

                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={!sourceUrl.trim() || testMutation.isPending}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-[0.98]"
                      >
                        <Zap size={14} className="fill-slate-950 stroke-1" />
                        <span>{testMutation.isPending ? "Menguji..." : "Test"}</span>
                      </button>
                    </div>

                    <p className="text-[0.7rem] text-slate-400 mt-2 flex items-start gap-1.5 leading-relaxed">
                      <HelpCircle size={13} className="shrink-0 mt-0.5 text-slate-400" />
                      <span>
                        Server ERP menguji stream langsung via ffprobe/HTTP. Tombol simpan hanya aktif setelah uji koneksi dinyatakan valid.
                      </span>
                    </p>
                  </div>

                  {/* Hasil Uji Koneksi Stream */}
                  <CctvStreamTestResult result={testResult} isLoading={testMutation.isPending} />

                  {/* Pratinjau Video Instan bila HLS Playable */}
                  {testResult?.ok && testResult.playable_in_browser && sourceUrl.trim() && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          <span>Pratinjau Live Feed (HLS)</span>
                        </span>
                        <span className="text-[0.65rem] text-slate-400">Feed Browser</span>
                      </div>
                      <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
                        <HlsPlayer
                          playbackUrl={sourceUrl.trim()}
                          cameraName={cameraName || "Pratinjau Kamera"}
                          autoPlay={true}
                          muted={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card: Status Kelayakan & Tombol Aksi Simpan */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col gap-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kesiapan Pendaftaran Kamera
                </h4>

                {/* Checklist Status Persyaratan */}
                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    {cameraName.trim() ? (
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className={cameraName.trim() ? "text-slate-700 font-medium" : "text-slate-400"}>
                      Nama kamera telah diisi
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {siteId && siteRoomId ? (
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className={siteId && siteRoomId ? "text-slate-700 font-medium" : "text-slate-400"}>
                      Site & Ruangan server telah dipilih
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSaveReady ? (
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Lock size={15} className="text-amber-500 shrink-0" />
                    )}
                    <span className={isSaveReady ? "text-slate-700 font-medium" : "text-amber-700 font-medium"}>
                      {isSaveReady
                        ? "Koneksi stream telah terverifikasi"
                        : "Uji koneksi stream diperlukan"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
                  <button
                    type="submit"
                    disabled={!isSaveReady || isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <Save size={15} />
                    <span>
                      {isSubmitting
                        ? "Menyimpan Data..."
                        : isEditMode
                        ? "Simpan Perubahan Kamera"
                        : "Simpan & Daftarkan Kamera"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/dc/cctv")}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

