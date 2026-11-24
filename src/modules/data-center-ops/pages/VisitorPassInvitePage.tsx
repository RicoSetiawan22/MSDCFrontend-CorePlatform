import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Calendar,
  Server,
  Mail,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  User,
  Users,
  Check,
  Info,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { useEligibleCustomers, useInviteVisitorPass } from "../api/useVisitorPass";
import { useSiteList } from "../api/useSites";
import { useRoomList } from "../api/useRooms";
import { useRackList } from "../api/useRacks";
import { getApiErrorMessage } from "@shared/lib/api-client";
import type { InviteVisitorPayload } from "../types/visitorPass";

export const VisitorPassInvitePage: React.FC = () => {
  const navigate = useNavigate();

  // Queries master & data CRM
  const { data: eligibleCustomers = [], isLoading: isCustomersLoading } = useEligibleCustomers();
  const { data: sitesPage, isLoading: isSitesLoading } = useSiteList({ per_page: 100 });
  const allSites = useMemo(() => sitesPage?.data ?? [], [sitesPage]);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [selectedContractId, setSelectedContractId] = useState<number | "">("");
  const [selectedSiteId, setSelectedSiteId] = useState<number | "">("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | "">("");
  const [selectedRackIds, setSelectedRackIds] = useState<number[]>([]);

  // Access window dates (default today until +3 days)
  const [allowedStartDate, setAllowedStartDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [allowedEndDate, setAllowedEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });

  // Recipient settings
  const [recipientType, setRecipientType] = useState<"crm_contact" | "direct_vendor">("crm_contact");
  const [selectedContactId, setSelectedContactId] = useState<number | "">("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [operatorInstructions, setOperatorInstructions] = useState(
    "Wajib membawa kartu identitas asli (KTP/SIM/Paspor) yang masih berlaku. Harap kenakan pakaian rapi, celana panjang, serta sepatu tertutup/safety saat berada di dalam ruang server cold aisle."
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    passNumber: string;
    email: string;
    invitationUrl: string;
  } | null>(null);

  // Queries dependent on selected site & room
  const { data: allRooms = [] } = useRoomList(
    selectedSiteId ? Number(selectedSiteId) : undefined
  );
  const { data: racksPage } = useRackList({
    site_room_id: selectedRoomId ? Number(selectedRoomId) : undefined,
    site_id: selectedSiteId ? Number(selectedSiteId) : undefined,
    per_page: 200,
  });
  const allRacks = useMemo(() => racksPage?.data ?? [], [racksPage]);

  // Mutation
  const inviteMutation = useInviteVisitorPass();

  // Current customer object
  const currentCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return eligibleCustomers.find((c) => c.customer_id === Number(selectedCustomerId)) || null;
  }, [eligibleCustomers, selectedCustomerId]);

  // Handle customer change
  const handleCustomerSelect = (customerId: number) => {
    setSelectedCustomerId(customerId);
    const cust = eligibleCustomers.find((c) => c.customer_id === customerId);
    if (!cust) {
      setSelectedContractId("");
      return;
    }

    // Default to first contract
    if (cust.contracts && cust.contracts.length > 0) {
      const firstContract = cust.contracts[0];
      setSelectedContractId(firstContract.contract_id);
      if (firstContract.site_id) setSelectedSiteId(firstContract.site_id);
      if (firstContract.room_id) setSelectedRoomId(firstContract.room_id);
      if (firstContract.rack_id) setSelectedRackIds([firstContract.rack_id]);
      else setSelectedRackIds([]);
    } else {
      setSelectedContractId("");
      setSelectedRackIds([]);
    }

    // Handle CRM Contacts auto-selection
    if (cust.contacts && cust.contacts.length > 0) {
      const primary = cust.contacts.find((ct) => ct.is_primary) || cust.contacts[0];
      setSelectedContactId(primary.id);
      if (primary.email) setRecipientEmail(primary.email);
    } else {
      setSelectedContactId("");
      if (cust.email) setRecipientEmail(cust.email);
    }
  };

  // Handle contact change
  const handleContactSelect = (contactId: number) => {
    setSelectedContactId(contactId);
    const ct = currentCustomer?.contacts?.find((item) => item.id === contactId);
    if (ct?.email) {
      setRecipientEmail(ct.email);
    }
  };

  // Toggle rack selection
  const toggleRack = (rackId: number) => {
    setSelectedRackIds((prev) =>
      prev.includes(rackId) ? prev.filter((id) => id !== rackId) : [...prev, rackId]
    );
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomerId) {
      setErrorMessage("Silakan pilih Pelanggan CRM penjamin kunjungan.");
      return;
    }
    const contractId = selectedContractId || currentCustomer?.contracts?.[0]?.contract_id;
    if (!contractId) {
      setErrorMessage("Pelanggan tidak memiliki kontrak kolokasi aktif di CRM.");
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
    if (!allowedStartDate || !allowedEndDate) {
      setErrorMessage("Rentang tanggal izin akses wajib diisi.");
      return;
    }
    if (new Date(allowedEndDate) < new Date(allowedStartDate)) {
      setErrorMessage("Tanggal akhir izin tidak boleh lebih awal dari tanggal mulai.");
      return;
    }
    if (!recipientEmail.trim() || !recipientEmail.includes("@")) {
      setErrorMessage("Alamat email penerima undangan wajib diisi dengan format valid.");
      return;
    }

    const payload: InviteVisitorPayload = {
      customer_id: Number(selectedCustomerId),
      contract_id: Number(contractId),
      site_id: Number(selectedSiteId),
      site_room_id: Number(selectedRoomId),
      target_rack_ids: selectedRackIds,
      allowed_start_date: allowedStartDate,
      allowed_end_date: allowedEndDate,
      recipient_type: recipientType,
      recipient_contact_id: selectedContactId ? Number(selectedContactId) : undefined,
      recipient_email: recipientEmail.trim(),
      cc_email: ccEmail.trim() || undefined,
      operator_instructions: operatorInstructions.trim() || undefined,
    };

    try {
      const createdPass = await inviteMutation.mutateAsync(payload);
      const p = (createdPass || {}) as any;
      const token = p.invitation_token || p.token || p.public_url_token || "";
      const invitationUrl =
        p.invitation_url ||
        (token ? `${window.location.origin}/visitor-registration/${token}` : "");

      setSuccessInfo({
        passNumber: p.pass_number || "Baru",
        email: recipientEmail.trim(),
        invitationUrl,
      });
    } catch (err: unknown) {
      const msg = getApiErrorMessage(
        err,
        "Gagal mengirimkan undangan kunjungan. Pastikan koneksi dan data kontrak benar."
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
        title="Kirim Undangan Akses Tamu"
        subtitle="Penerbitan link formulir registrasi mandiri untuk PIC Pelanggan CRM atau Teknisi Vendor Data Center"
        containerClassName="px-7 pt-2 pb-2"
      />

      {/* ── 3. Konten Formulir & Detail ── */}
      <div className="px-7 py-5">
        {/* Banner Sukses Jika Terkirim */}
        {successInfo && (
          <div className="mb-6 p-5 sm:p-6 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-emerald-950">
                    Undangan Registrasi Mandiri Berhasil Diterbitkan!
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Nomor izin <strong className="font-semibold">{successInfo.passNumber}</strong> telah diterbitkan dengan status{" "}
                    <span className="font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full text-[0.7rem]">
                      Menunggu Registrasi Tamu
                    </span>
                    . Notifikasi beserta tautan aman pengisian data diri tamu telah dikirim ke{" "}
                    <strong>{successInfo.email}</strong> via NotificationService.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => navigate("/dc/visitor-passes")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  Kembali ke Daftar Izin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessInfo(null);
                    setRecipientEmail("");
                    setSelectedRackIds([]);
                  }}
                  className="px-3.5 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Buat Undangan Lain
                </button>
              </div>
            </div>

            {/* Box Tautan Registrasi dengan Tombol Salin */}
            {successInfo.invitationUrl && (
              <div className="p-3.5 sm:p-4 bg-white/95 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex flex-col gap-1 overflow-hidden w-full sm:w-auto flex-1">
                  <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail size={12} className="text-emerald-600" />
                    <span>Tautan Registrasi Tamu (Bisa Diteruskan via WhatsApp / Chat PIC)</span>
                  </span>
                  <span className="text-xs font-mono text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 truncate select-all">
                    {successInfo.invitationUrl}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(successInfo.invitationUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs ${
                      copiedLink
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    {copiedLink ? <Check size={14} className="stroke-[2.5]" /> : <Copy size={14} />}
                    <span>{copiedLink ? "Tersalin!" : "Salin Tautan"}</span>
                  </button>

                  <a
                    href={successInfo.invitationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    title="Buka Tautan Registrasi di Tab Baru"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-200 shadow-2xs">
            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* ── 4. Grid Formulir & Sidebar ── */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ═════════ Kolom Kiri: Formulir (8 Kolom) ═════════ */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* Section 1: Entitas Pelanggan & Kontrak CRM */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#F59E0B] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Penjamin & Kontrak CRM Pelanggan
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dropdown Customer */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Pelanggan CRM Aktif <span className="text-rose-500">*</span>
                    </label>
                    <select
                      aria-label="Pilih Perusahaan Pelanggan"
                      value={selectedCustomerId}
                      onChange={(e) => handleCustomerSelect(Number(e.target.value))}
                      disabled={isCustomersLoading}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer shadow-2xs"
                    >
                      <option value="">-- Pilih Perusahaan Pelanggan --</option>
                      {eligibleCustomers.map((cust) => (
                        <option key={cust.customer_id} value={cust.customer_id}>
                          {cust.company_name || cust.customer_name} ({cust.contracts?.length || 0} Kontrak Aktif)
                        </option>
                      ))}
                    </select>
                    {isCustomersLoading && (
                      <span className="text-[0.68rem] text-slate-400 mt-1 block">Memuat daftar pelanggan CRM...</span>
                    )}
                  </div>

                  {/* Dropdown Kontrak */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nomor Kontrak Kolokasi <span className="text-rose-500">*</span>
                    </label>
                    <select
                      aria-label="Nomor Kontrak Kolokasi"
                      value={selectedContractId}
                      onChange={(e) => setSelectedContractId(Number(e.target.value))}
                      disabled={!currentCustomer || currentCustomer.contracts.length === 0}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer shadow-2xs disabled:bg-slate-50"
                    >
                      {currentCustomer?.contracts.map((c) => (
                        <option key={c.contract_id} value={c.contract_id}>
                          {c.contract_number} ({c.service_type || "Colocation Rack"})
                        </option>
                      )) || <option value="">Pilih pelanggan terlebih dahulu</option>}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Lokasi Fasilitas & Zona Rak yang Diizinkan */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#F59E0B] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Fasilitas & Batas Zona Akses Ruangan
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Site Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Site Data Center <span className="text-rose-500">*</span>
                    </label>
                    <select
                      aria-label="Site Data Center"
                      value={selectedSiteId}
                      onChange={(e) => {
                        setSelectedSiteId(Number(e.target.value));
                        setSelectedRoomId("");
                        setSelectedRackIds([]);
                      }}
                      disabled={isSitesLoading}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer shadow-2xs"
                    >
                      <option value="">-- Pilih Site --</option>
                      {allSites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.site_name} ({site.site_code || `Site #${site.id}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Ruangan Server / Hall <span className="text-rose-500">*</span>
                    </label>
                    <select
                      aria-label="Ruangan Server / Hall"
                      value={selectedRoomId}
                      onChange={(e) => {
                        setSelectedRoomId(Number(e.target.value));
                        setSelectedRackIds([]);
                      }}
                      disabled={!selectedSiteId || allRooms.length === 0}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer shadow-2xs disabled:bg-slate-50"
                    >
                      <option value="">-- Pilih Ruangan Server --</option>
                      {allRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.room_name} ({room.room_code || "Room"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Target Rak Multi-Select Checkbox Pills */}
                <div className="flex flex-col gap-2 pt-4">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Pilih Rak Server yang Diizinkan</span>
                    <span className="text-[0.68rem] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      {selectedRackIds.length} rak dipilih
                    </span>
                  </label>

                  {allRacks.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                      {selectedRoomId
                        ? "Tidak ada rak terdaftar pada ruangan ini."
                        : "Pilih Site dan Ruangan Server terlebih dahulu untuk memunculkan daftar rak."}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl">
                      {allRacks.map((rk) => {
                        const isSelected = selectedRackIds.includes(rk.id);
                        return (
                          <button
                            key={rk.id}
                            type="button"
                            onClick={() => toggleRack(rk.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            <Server size={13} className={isSelected ? "text-white" : "text-slate-400"} />
                            <span>{rk.rack_code}</span>
                            {isSelected && <Check size={12} className="stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Rentang Tanggal Izin & Penerima Undangan */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#F59E0B] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Jadwal Rentang Izin & Penerima Undangan
                  </h2>
                </div>

                {/* Rentang Tanggal Izin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tanggal Mulai Berlaku <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="date"
                        value={allowedStartDate}
                        onChange={(e) => setAllowedStartDate(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tanggal Akhir Berlaku <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="date"
                        value={allowedEndDate}
                        onChange={(e) => setAllowedEndDate(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Pilihan Radio Tipe Penerima */}
                <div className="flex flex-col gap-2 mb-4">
                  <label className="block text-xs font-semibold text-slate-700">
                    Target Email Penerima Undangan <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        recipientType === "crm_contact"
                          ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40 text-amber-950 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="recipientType"
                        checked={recipientType === "crm_contact"}
                        onChange={() => setRecipientType("crm_contact")}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <Users size={14} className="text-amber-600" />
                          <span>PIC Terdaftar di CRM</span>
                        </div>
                        <div className="text-[0.68rem] text-slate-500 mt-0.5">
                          Kirim ke kontak resmi pelanggan yang terdata di sistem
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        recipientType === "direct_vendor"
                          ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40 text-amber-950 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="recipientType"
                        checked={recipientType === "direct_vendor"}
                        onChange={() => setRecipientType("direct_vendor")}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <User size={14} className="text-amber-600" />
                          <span>Teknisi / Vendor Eksternal</span>
                        </div>
                        <div className="text-[0.68rem] text-slate-500 mt-0.5">
                          Kirim langsung ke alamat email vendor pelaksana
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Conditional Dropdown PIC vs Input Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {recipientType === "crm_contact" ? (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Pilih PIC Pelanggan CRM <span className="text-rose-500">*</span>
                      </label>
                      <select
                        aria-label="Pilih PIC Pelanggan CRM"
                        value={selectedContactId}
                        onChange={(e) => handleContactSelect(Number(e.target.value))}
                        disabled={!currentCustomer || !currentCustomer.contacts?.length}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer shadow-2xs disabled:bg-slate-50"
                      >
                        {currentCustomer?.contacts && currentCustomer.contacts.length > 0 ? (
                          currentCustomer.contacts.map((ct) => (
                            <option key={ct.id} value={ct.id}>
                              {ct.name} {ct.position ? `(${ct.position})` : ""} {ct.is_primary ? "★ PIC Utama" : ""} - {ct.email || "No Email"}
                            </option>
                          ))
                        ) : (
                          <option value="">Tidak ada kontak PIC terdaftar di CRM</option>
                        )}
                      </select>
                    </div>
                  ) : null}

                  {/* Email Tujuan */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Alamat Email Penerima <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="nama.tamu@vendor.co.id"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Email CC */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email CC (Opsional)
                    </label>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="email"
                        value={ccEmail}
                        onChange={(e) => setCcEmail(e.target.value)}
                        placeholder="supervisor@vendor.com atau noc@msdc.jtv.co.id"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Catatan / Instruksi Khusus Operator */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Instruksi Khusus Operator / SOP K3 Data Center
                  </label>
                  <textarea
                    rows={3}
                    value={operatorInstructions}
                    onChange={(e) => setOperatorInstructions(e.target.value)}
                    placeholder="Instruksi APD, pembatasan perangkat kerja, atau larangan khusus di ruang server."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all shadow-2xs"
                  />
                  <span className="text-[0.68rem] text-slate-400 mt-1 block">
                    Instruksi ini akan dibaca oleh tamu pada halaman formulir registrasi mandiri sebelum mereka menandatangani NDA.
                  </span>
                </div>

                {/* Tombol Aksi di Bawah Form */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/dc/visitor-passes")}
                    className="px-5 py-2.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={inviteMutation.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F59E0B] hover:bg-amber-600 disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-2xs hover:shadow cursor-pointer"
                  >
                    {inviteMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Mengirimkan Undangan...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Kirimkan Undangan Akses</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ═════════ Kolom Kanan: Sidebar (4 Kolom) ═════════ */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              {/* Kartu 1: Informasi Penting Undangan */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                    <Info size={12} className="stroke-[3]" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Informasi Penting Undangan
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                    <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      Tautan formulir registrasi mandiri akan dikirimkan otomatis ke alamat email tamu/PIC yang ditunjuk.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                    <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      Tamu wajib mengisi data diri (KTP/SIM/Paspor) serta menyetujui NDA dan SOP K3 Data Center sebelum QR Pass terbit.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                    <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      Akses fasilitas dibatasi sesuai site, ruangan server, dan zona rak yang dipilih pada formulir ini.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Kartu 2: Alur Undangan Digital */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Send size={16} className="text-[#F59E0B]" />
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Alur Undangan Digital
                  </h3>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xs text-slate-600 leading-relaxed flex-1">
                    Setelah terkirim, penerima akan mendapatkan tautan untuk mengisi data identitas diri secara mandiri sebelum tanggal kunjungan.
                  </p>
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 text-[#F59E0B] shadow-2xs">
                    <Mail size={26} className="stroke-[1.8]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

