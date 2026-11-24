import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  CreditCard,
  Building2,
  Mail,
  Phone,
  FileText,
  Calendar,
  Check,
  Info,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  useEligibleCustomers,
  useCreateVisitorPass,
} from "../api/useVisitorPass";
import { useSiteList } from "../api/useSites";
import { useRoomList } from "../api/useRooms";
import { useRackList } from "../api/useRacks";
import { PageHeader } from "@shared/components/PageHeader";
import { getApiErrorMessage } from "@shared/lib/api-client";
import type {
  CreateVisitorPassPayload,
  VisitorIdentityType,
} from "../types/visitorPass";

export const VisitorPassCreatePage: React.FC = () => {
  const navigate = useNavigate();

  // Queries master & CRM
  const { data: eligibleCustomers = [], isLoading: isCustomersLoading } =
    useEligibleCustomers();
  const { data: sitesPage, isLoading: isSitesLoading } = useSiteList({
    per_page: 100,
  });
  const allSites = useMemo(() => sitesPage?.data ?? [], [sitesPage]);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [selectedContractId, setSelectedContractId] = useState<number | "">("");
  const [selectedSiteId, setSelectedSiteId] = useState<number | "">("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | "">("");
  const [selectedRackId, setSelectedRackId] = useState<number | "">("");

  const [visitorName, setVisitorName] = useState("");
  const [visitorIdentityType, setVisitorIdentityType] =
    useState<VisitorIdentityType>("ktp");
  const [visitorIdCard, setVisitorIdCard] = useState("");
  const [visitorCompany, setVisitorCompany] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [purpose, setPurpose] = useState("Maintenance & Pengecekan Rak");
  const [notes, setNotes] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdPass, setCreatedPass] = useState<{
    id: number;
    pass_number: string;
  } | null>(null);

  // Default datetime range (sekarang sampai 8 jam kemudian)
  const [validFrom, setValidFrom] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [validTo, setValidTo] = useState(() => {
    const later = new Date(Date.now() + 8 * 3600 * 1000);
    return new Date(later.getTime() - later.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });

  // Queries dependent
  const { data: allRooms = [] } = useRoomList(
    selectedSiteId ? Number(selectedSiteId) : undefined,
  );
  const { data: racksPage } = useRackList({
    site_room_id: selectedRoomId ? Number(selectedRoomId) : undefined,
    site_id: selectedSiteId ? Number(selectedSiteId) : undefined,
    per_page: 200,
  });
  const allRacks = useMemo(() => racksPage?.data ?? [], [racksPage]);

  // Mutation
  const createPassMutation = useCreateVisitorPass();

  // Current Customer
  const currentCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return (
      eligibleCustomers.find(
        (c) => c.customer_id === Number(selectedCustomerId),
      ) || null
    );
  }, [eligibleCustomers, selectedCustomerId]);

  // Handle pemilihan customer
  const handleCustomerSelect = (customerId: number) => {
    setSelectedCustomerId(customerId);
    const cust = eligibleCustomers.find((c) => c.customer_id === customerId);
    if (!cust) {
      setSelectedContractId("");
      return;
    }

    if (cust.contracts && cust.contracts.length > 0) {
      const firstContract = cust.contracts[0];
      setSelectedContractId(firstContract.contract_id);
      if (firstContract.site_id) setSelectedSiteId(firstContract.site_id);
      if (firstContract.room_id) setSelectedRoomId(firstContract.room_id);
      if (firstContract.rack_id) setSelectedRackId(firstContract.rack_id);
    } else {
      setSelectedContractId("");
      setSelectedRackId("");
    }
  };

  const resetForm = () => {
    setSelectedCustomerId("");
    setSelectedContractId("");
    setSelectedSiteId("");
    setSelectedRoomId("");
    setSelectedRackId("");
    setVisitorName("");
    setVisitorIdentityType("ktp");
    setVisitorIdCard("");
    setVisitorCompany("");
    setVisitorEmail("");
    setVisitorPhone("");
    setPurpose("Maintenance & Pengecekan Rak");
    setNotes("");
    setCreatedPass(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomerId) {
      setErrorMessage("Silakan pilih Pelanggan / Customer Penjamin.");
      return;
    }
    const activeContractId =
      selectedContractId || currentCustomer?.contracts?.[0]?.contract_id;
    if (!activeContractId) {
      setErrorMessage("Kontrak aktif pelanggan tidak ditemukan di CRM.");
      return;
    }
    if (!selectedSiteId) {
      setErrorMessage("Silakan tentukan Site Data Center tujuan.");
      return;
    }
    if (!selectedRoomId) {
      setErrorMessage("Silakan tentukan Ruangan Server Data Center tujuan.");
      return;
    }
    if (!visitorName.trim()) {
      setErrorMessage("Nama pengunjung wajib diisi.");
      return;
    }
    if (!visitorIdCard.trim()) {
      setErrorMessage(
        `Nomor identitas (${visitorIdentityType.toUpperCase()}) wajib diisi.`,
      );
      return;
    }
    if (!visitorPhone.trim()) {
      setErrorMessage("Nomor telepon / WhatsApp pengunjung wajib diisi.");
      return;
    }
    if (!visitorEmail.trim()) {
      setErrorMessage(
        "Email pengunjung wajib diisi untuk pengiriman QR Pass digital.",
      );
      return;
    }

    const startTs = new Date(validFrom).getTime();
    const endTs = new Date(validTo).getTime();
    if (isNaN(startTs) || isNaN(endTs)) {
      setErrorMessage("Format tanggal & waktu jadwal kunjungan tidak valid.");
      return;
    }
    if (endTs <= startTs) {
      setErrorMessage(
        "Waktu selesai berlaku harus lebih lambat dari waktu mulai berlaku.",
      );
      return;
    }

    const checkInIso = new Date(validFrom).toISOString();
    const checkOutIso = new Date(validTo).toISOString();

    const payload: CreateVisitorPassPayload = {
      customer_id: Number(selectedCustomerId),
      contract_id: Number(activeContractId),
      site_id: Number(selectedSiteId),
      site_room_id: Number(selectedRoomId),
      visitor_name: visitorName.trim(),
      visitor_identity_type: visitorIdentityType,
      visitor_identity_number: visitorIdCard.trim(),
      visitor_phone: visitorPhone.trim(),
      visitor_email: visitorEmail.trim() || null,
      visitor_company: visitorCompany.trim() || null,
      purpose: purpose.trim(),
      target_rack_ids: selectedRackId ? [Number(selectedRackId)] : [],
      planned_check_in_at: checkInIso,
      planned_check_out_at: checkOutIso,
      valid_from: checkInIso,
      valid_until: checkOutIso,
      valid_to: checkOutIso,
      notes: notes.trim() || undefined,
      room_id: Number(selectedRoomId),
      rack_id: selectedRackId ? Number(selectedRackId) : undefined,
      visitor_id_card: visitorIdCard.trim(),
    };

    try {
      const res = await createPassMutation.mutateAsync(payload);
      setCreatedPass({
        id: res.id,
        pass_number: res.pass_number,
      });
    } catch (err: unknown) {
      const msg = getApiErrorMessage(
        err,
        "Gagal mendaftarkan izin kunjungan. Pastikan data terisi dengan benar.",
      );
      setErrorMessage(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Tombol Navigasi Kembali di Atas Header Sesuai Desain ── */}
      <div className="px-7 pt-5 pb-1">
        <button
          type="button"
          onClick={() => navigate("/dc/visitor-passes")}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Visitor</span>
        </button>
      </div>

      {/* ── 2. Page Header Bergaya MSDC ── */}
      <PageHeader
        title="Daftarkan Pengunjung Data Center"
        subtitle="Penerbitan izin akses fasilitas & link QR Pass digital bagi tamu"
        containerClassName="px-7 pt-2 pb-2"
      />

      {/* ── 3. Konten Formulir & Detail ── */}
      <div className="px-7 py-5">
        {/* ── 3. Banner Sukses Penerbitan Tiket (Bila Berhasil) ── */}
        {createdPass && (
          <div className="mb-6 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Izin Kunjungan Fisik Berhasil Diterbitkan!
                </h3>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Tiket{" "}
                  <strong className="font-semibold">
                    {createdPass.pass_number}
                  </strong>{" "}
                  telah aktif dan terdaftar di sistem. Tamu dapat langsung
                  check-in di pos jaga.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => navigate(`/dc/visitor-passes/${createdPass.id}`)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                Buka Detail Tiket & QR
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-3.5 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Daftarkan Lagi
              </button>
            </div>
          </div>
        )}

        {/* ── 4. Alert Error (Bila Validasi Gagal) ── */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-200 shadow-2xs">
            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* ── 5. Grid Formulir & Sidebar ── */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ═════════ Kolom Kiri: Formulir (8 Kolom) ═════════ */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* ── SEKSI 1: Pelanggan Penjamin (Kontrak Aktif CRM) ── */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#F59E0B] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Pelanggan Penjamin (Kontrak Aktif CRM)
                  </h2>
                </div>

                {/* Baris 1: Full-width Dropdown Pelanggan */}
                <div className="mb-4">
                  <select
                    aria-label="Pilih Pelanggan dengan Kontrak Aktif"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer shadow-2xs"
                    value={selectedCustomerId}
                    onChange={(e) =>
                      handleCustomerSelect(Number(e.target.value))
                    }
                    disabled={isCustomersLoading}
                  >
                    <option value="">
                      -- Pilih Pelanggan dengan Kontrak Aktif --
                    </option>
                    {eligibleCustomers.map((cust) => (
                      <option key={cust.customer_id} value={cust.customer_id}>
                        {cust.company_name || cust.customer_name} (
                        {cust.contracts?.length || 0} Kontrak Aktif CRM)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Baris 2: 3 Kolom Dropdown Berjenjang (Site, Ruangan, Rak) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Site Tujuan */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Site Tujuan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      aria-label="Site Tujuan"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer shadow-2xs"
                      value={selectedSiteId}
                      onChange={(e) => {
                        setSelectedSiteId(
                          e.target.value ? Number(e.target.value) : "",
                        );
                        setSelectedRoomId("");
                        setSelectedRackId("");
                      }}
                      disabled={isSitesLoading}
                    >
                      <option value="">-- Pilih Site Tujuan --</option>
                      {allSites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.site_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ruangan Server */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Ruangan Server <span className="text-rose-500">*</span>
                    </label>
                    <select
                      aria-label="Ruangan Server"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer shadow-2xs"
                      value={selectedRoomId}
                      onChange={(e) => {
                        setSelectedRoomId(
                          e.target.value ? Number(e.target.value) : "",
                        );
                        setSelectedRackId("");
                      }}
                      disabled={!selectedSiteId}
                    >
                      <option value="">
                        {selectedSiteId
                          ? "-- Pilih Ruangan Server --"
                          : "-- Pilih site dahulu --"}
                      </option>
                      {allRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.room_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Rak (Opsional) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Target Rak (Opsional)
                    </label>
                    <select
                      aria-label="Target Rak (Opsional)"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer shadow-2xs"
                      value={selectedRackId}
                      onChange={(e) =>
                        setSelectedRackId(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      disabled={!selectedRoomId}
                    >
                      <option value="">
                        {selectedRoomId
                          ? "-- Pilih Rak (Opsional) --"
                          : "-- Pilih site dahulu --"}
                      </option>
                      {allRacks.map((rk) => (
                        <option key={rk.id} value={rk.id}>
                          {rk.rack_name || rk.rack_code} ({rk.rack_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── SEKSI 2: Data Identitas Pengunjung ── */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#F59E0B] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Data Identitas Pengunjung
                  </h2>
                </div>

                {/* Baris 1: Nama Lengkap, Jenis Identitas, Nomor Identitas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {/* Nama Lengkap Tamu */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Lengkap Tamu <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
                        placeholder="Contoh: Muhammad Akmal"
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Jenis Identitas */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Jenis Identitas <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <select
                        aria-label="Jenis Identitas"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer shadow-2xs"
                        value={visitorIdentityType}
                        onChange={(e) =>
                          setVisitorIdentityType(
                            e.target.value as VisitorIdentityType,
                          )
                        }
                      >
                        <option value="ktp">KTP (e-KTP)</option>
                        <option value="sim">SIM</option>
                        <option value="passport">Paspor</option>
                      </select>
                    </div>
                  </div>

                  {/* Nomor Identitas */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nomor Identitas ({visitorIdentityType.toUpperCase()}){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
                        placeholder="Contoh: 3578012345670001"
                        value={visitorIdCard}
                        onChange={(e) => setVisitorIdCard(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Baris 2: Perusahaan, Email, Nomor Telepon/WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {/* Perusahaan / Instansi Tamu */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Perusahaan / Instansi Tamu
                    </label>
                    <div className="relative">
                      <Building2
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
                        placeholder="Contoh: PT Integrasi Jaringan"
                        value={visitorCompany}
                        onChange={(e) => setVisitorCompany(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Email Tamu */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Tamu (Kirim Tiket & QR){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="email"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
                        placeholder="tamu@perusahaan.com"
                        value={visitorEmail}
                        onChange={(e) => setVisitorEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Nomor Telepon / WhatsApp */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nomor Telepon / WhatsApp{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="tel"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
                        placeholder="Contoh: 08123456789"
                        value={visitorPhone}
                        onChange={(e) => setVisitorPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Baris 3: Keperluan Kunjungan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Keperluan Kunjungan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
                      placeholder="Maintenance & Pengecekan Rak"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ── SEKSI 3: Jadwal & Masa Berlaku Izin Masuk ── */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#F59E0B] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Jadwal & Masa Berlaku Izin Masuk
                  </h2>
                </div>

                {/* Baris 1: Mulai Berlaku & Selesai Berlaku */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Waktu Mulai Berlaku */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Waktu Mulai Berlaku{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="datetime-local"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
                        value={validFrom}
                        onChange={(e) => setValidFrom(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Waktu Selesai Berlaku */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Waktu Selesai Berlaku{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="datetime-local"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
                        value={validTo}
                        onChange={(e) => setValidTo(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Baris 2: Catatan Tambahan Pos Jaga / NOC */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Catatan Tambahan Pos Jaga / NOC
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
                    placeholder="Catatan khusus barang bawaan, izin membawa laptop, pendamping NOC, dll."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* ── Tombol Aksi di Bawah Form ── */}
                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate("/dc/visitor-passes")}
                    className="px-5 py-2.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={createPassMutation.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F59E0B] hover:bg-amber-600 disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-2xs hover:shadow cursor-pointer"
                  >
                    {createPassMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Menyimpan & Menerbitkan...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} className="stroke-[2.5]" />
                        <span>Simpan & Terbitkan Visitor Pass</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ═════════ Kolom Kanan: Sidebar (4 Kolom) ═════════ */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              {/* Kartu 1: Informasi Penting */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                    <Info size={12} className="stroke-[3]" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Informasi Penting
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                    <span className="text-blue-500 font-bold shrink-0 mt-0.5">
                      •
                    </span>
                    <span>
                      Pastikan data yang diisi sesuai dengan identitas asli
                      pengunjung.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                    <span className="text-blue-500 font-bold shrink-0 mt-0.5">
                      •
                    </span>
                    <span>
                      QR Pass akan dikirim ke email pengunjung setelah data
                      berhasil disimpan.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                    <span className="text-blue-500 font-bold shrink-0 mt-0.5">
                      •
                    </span>
                    <span>
                      Pengunjung wajib melakukan check-in di pos jaga saat tiba
                      di area Data Center.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Kartu 2: QR Pass Digital */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode size={16} className="text-[#F59E0B]" />
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    QR Pass Digital
                  </h3>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xs text-slate-600 leading-relaxed flex-1">
                    Setelah terdaftar, pengunjung akan menerima QR Pass melalui
                    email yang dapat digunakan untuk proses check-in di pos
                    jaga.
                  </p>
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 text-[#F59E0B] shadow-2xs">
                    <QrCode size={28} className="stroke-[1.8]" />
                  </div>
                </div>
              </div>

              {/* Catatan: Kartu "Contoh Format Identitas" diabaikan sesuai instruksi user karena tidak ada aset */}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
