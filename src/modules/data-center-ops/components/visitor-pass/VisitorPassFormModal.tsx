import React, { useState, useMemo } from "react";
import { X, UserPlus, AlertCircle, Building2, Server, Calendar, Check, Info, CheckCircle2 } from "lucide-react";
import { useEligibleCustomers, useCreateVisitorPass } from "../../api/useVisitorPass";
import { useSiteList } from "../../api/useSites";
import { useRoomList } from "../../api/useRooms";
import { useRackList } from "../../api/useRacks";
import { getApiErrorMessage } from "@shared/lib/api-client";
import type { CreateVisitorPassPayload, VisitorIdentityType } from "../../types/visitorPass";

interface VisitorPassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VisitorPassFormModal: React.FC<VisitorPassFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { data: eligibleCustomers = [], isLoading: isCustomersLoading } = useEligibleCustomers();
  const createPassMutation = useCreateVisitorPass();

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [selectedContractId, setSelectedContractId] = useState<number | "">("");
  const [selectedSiteId, setSelectedSiteId] = useState<number | "">("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | "">("");
  const [selectedRackId, setSelectedRackId] = useState<number | "">("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorIdentityType, setVisitorIdentityType] = useState<VisitorIdentityType>("ktp");
  const [visitorIdCard, setVisitorIdCard] = useState("");
  const [visitorCompany, setVisitorCompany] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [purpose, setPurpose] = useState("Maintenance & Pengecekan Rak");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Master Data Center: Sites, Rooms, Racks
  const { data: sitesPage, isLoading: isSitesLoading } = useSiteList({ per_page: 100 });
  const allSites = useMemo(() => sitesPage?.data ?? [], [sitesPage]);

  const { data: allRooms = [], isLoading: isRoomsLoading } = useRoomList(
    selectedSiteId ? Number(selectedSiteId) : undefined
  );

  const { data: racksPage, isLoading: isRacksLoading } = useRackList({
    site_room_id: selectedRoomId ? Number(selectedRoomId) : undefined,
    site_id: selectedSiteId ? Number(selectedSiteId) : undefined,
    per_page: 200,
  });
  const allRacks = useMemo(() => racksPage?.data ?? [], [racksPage]);

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

  // Pelanggan yang dipilih
  const currentCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return eligibleCustomers.find((c) => c.customer_id === Number(selectedCustomerId)) || null;
  }, [eligibleCustomers, selectedCustomerId]);

  // Alokasi unik dari kontrak pelanggan CRM
  const contractAllocations = useMemo(() => {
    if (!currentCustomer) {
      return { siteIds: new Set<number>(), roomIds: new Set<number>(), rackIds: new Set<number>() };
    }
    const siteIds = new Set<number>();
    const roomIds = new Set<number>();
    const rackIds = new Set<number>();

    currentCustomer.contracts.forEach((c) => {
      if (c.site_id) siteIds.add(c.site_id);
      if (c.room_id) roomIds.add(c.room_id);
      if (c.rack_id) rackIds.add(c.rack_id);
    });

    return { siteIds, roomIds, rackIds };
  }, [currentCustomer]);

  // Opsi Site (Master Data Center + Kontrak CRM)
  const siteOptions = useMemo(() => {
    const map = new Map<number, { id: number; name: string; code?: string; isContractAllocated?: boolean }>();

    allSites.forEach((s) => {
      map.set(s.id, {
        id: s.id,
        name: s.site_name,
        code: s.site_code,
        isContractAllocated: contractAllocations.siteIds.has(s.id),
      });
    });

    // Fallback jika ada site dari kontrak yang belum masuk allSites
    if (currentCustomer) {
      currentCustomer.contracts.forEach((c) => {
        if (c.site_id && !map.has(c.site_id)) {
          map.set(c.site_id, {
            id: c.site_id,
            name: c.site_name || `Site #${c.site_id}`,
            isContractAllocated: true,
          });
        }
      });
    }

    return Array.from(map.values());
  }, [allSites, currentCustomer, contractAllocations.siteIds]);

  // Opsi Room (Berdasarkan Site yang dipilih)
  const roomOptions = useMemo(() => {
    if (!selectedSiteId) return [];
    const map = new Map<number, { id: number; name: string; code?: string; isContractAllocated?: boolean }>();

    allRooms.forEach((r) => {
      map.set(r.id, {
        id: r.id,
        name: r.room_name,
        code: r.room_code,
        isContractAllocated: contractAllocations.roomIds.has(r.id),
      });
    });

    // Fallback jika ada room dari kontrak
    if (currentCustomer) {
      currentCustomer.contracts.forEach((c) => {
        if (c.room_id && (c.site_id === Number(selectedSiteId) || !c.site_id) && !map.has(c.room_id)) {
          map.set(c.room_id, {
            id: c.room_id,
            name: c.room_name || `Ruang #${c.room_id}`,
            isContractAllocated: true,
          });
        }
      });
    }

    return Array.from(map.values());
  }, [selectedSiteId, allRooms, currentCustomer, contractAllocations.roomIds]);

  // Opsi Target Rak (Berdasarkan Site & Room yang dipilih)
  const rackOptions = useMemo(() => {
    if (!selectedSiteId) return [];
    const map = new Map<number, { id: number; code: string; name?: string; isContractAllocated?: boolean }>();

    allRacks.forEach((rk) => {
      // Filter per room jika room dipilih
      if (selectedRoomId) {
        const matchesRoom = rk.site_room_id === Number(selectedRoomId) || rk.site_room?.id === Number(selectedRoomId);
        if (!matchesRoom) return;
      } else if (selectedSiteId) {
        // Jika room belum dipilih, cocokkan site jika ada relasi
        const siteMatches = !rk.site_room?.site?.id || rk.site_room?.site?.id === Number(selectedSiteId);
        if (!siteMatches) return;
      }

      map.set(rk.id, {
        id: rk.id,
        code: rk.rack_code,
        name: rk.rack_name || undefined,
        isContractAllocated: contractAllocations.rackIds.has(rk.id),
      });
    });

    // Fallback jika ada rack dari kontrak
    if (currentCustomer) {
      currentCustomer.contracts.forEach((c) => {
        if (c.rack_id && !map.has(c.rack_id)) {
          if (!selectedRoomId || !c.room_id || c.room_id === Number(selectedRoomId)) {
            map.set(c.rack_id, {
              id: c.rack_id,
              code: c.rack_code || `R-${c.rack_id}`,
              isContractAllocated: true,
            });
          }
        }
      });
    }

    return Array.from(map.values());
  }, [selectedSiteId, selectedRoomId, allRacks, currentCustomer, contractAllocations.rackIds]);

  // Auto-select room jika site hanya memiliki 1 room dan belum dipilih
  React.useEffect(() => {
    if (selectedSiteId && roomOptions.length === 1 && !selectedRoomId) {
      setSelectedRoomId(roomOptions[0].id);
    }
  }, [selectedSiteId, roomOptions, selectedRoomId]);

  // Handle pemilihan customer
  function handleCustomerSelect(id: number) {
    setSelectedCustomerId(id);
    const cust = eligibleCustomers.find((c) => c.customer_id === id);
    if (!cust) {
      setSelectedContractId("");
      return;
    }

    // Default ke kontrak pertama pelanggan
    if (cust.contracts && cust.contracts.length > 0) {
      setSelectedContractId(cust.contracts[0].contract_id);
    } else {
      setSelectedContractId("");
    }

    // Prioritas 1: Jika kontrak pelanggan memiliki alokasi site spesifik
    const contractWithSite = cust.contracts.find((c) => c.site_id);
    if (contractWithSite?.site_id) {
      setSelectedContractId(contractWithSite.contract_id);
      setSelectedSiteId(contractWithSite.site_id);
      setSelectedRoomId(contractWithSite.room_id || "");
      setSelectedRackId(contractWithSite.rack_id || "");
    } else if (siteOptions.length === 1) {
      // Prioritas 2: Jika hanya ada 1 site master di DC
      setSelectedSiteId(siteOptions[0].id);
      setSelectedRoomId("");
      setSelectedRackId("");
    } else if (allSites.length === 1) {
      setSelectedSiteId(allSites[0].id);
      setSelectedRoomId("");
      setSelectedRackId("");
    } else {
      setSelectedSiteId("");
      setSelectedRoomId("");
      setSelectedRackId("");
    }
  }

  function handleSiteChange(id: number | "") {
    setSelectedSiteId(id);
    setSelectedRoomId("");
    setSelectedRackId("");
  }

  function handleRoomChange(id: number | "") {
    setSelectedRoomId(id);
    setSelectedRackId("");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomerId) {
      setErrorMessage("Silakan pilih Pelanggan / Customer Penjamin.");
      return;
    }

    // Pastikan contract_id valid
    const activeContractId =
      selectedContractId || currentCustomer?.contracts?.[0]?.contract_id;
    if (!activeContractId) {
      setErrorMessage("Kontrak aktif pelanggan tidak ditemukan di CRM. Pastikan pelanggan memiliki kontrak layanan aktif.");
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
      setErrorMessage(`Nomor identitas (${visitorIdentityType.toUpperCase()}) wajib diisi.`);
      return;
    }
    if (!visitorPhone.trim()) {
      setErrorMessage("Nomor telepon / WhatsApp pengunjung wajib diisi.");
      return;
    }
    if (!visitorEmail.trim()) {
      setErrorMessage("Email pengunjung wajib diisi untuk pengiriman QR Pass digital.");
      return;
    }

    const startTs = new Date(validFrom).getTime();
    const endTs = new Date(validTo).getTime();
    if (isNaN(startTs) || isNaN(endTs)) {
      setErrorMessage("Format tanggal & waktu jadwal kunjungan tidak valid.");
      return;
    }
    if (endTs <= startTs) {
      setErrorMessage("Waktu selesai berlaku harus lebih lambat dari waktu mulai berlaku.");
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
      await createPassMutation.mutateAsync(payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(
        err,
        "Gagal mendaftarkan izin kunjungan. Pastikan data terisi dengan benar."
      );
      setErrorMessage(msg);
    }
  };

  if (!isOpen) return null;

  const hasContractSpecificAllocations =
    contractAllocations.siteIds.size > 0 || contractAllocations.rackIds.size > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <UserPlus size={19} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Daftarkan Pengunjung Data Center
              </h3>
              <p className="text-xs text-slate-500">
                Penerbitan izin akses fasilitas & link QR Pass digital bagi tamu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal pendaftaran"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Bagian 1: Pelanggan Penjamin (CRM Binding) */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="customer-select" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={14} className="text-amber-500" />
                1. Pelanggan Penjamin (Kontrak Aktif CRM)
              </label>
              {isCustomersLoading && (
                <span className="text-[0.7rem] text-slate-400">Memuat data pelanggan...</span>
              )}
            </div>

            <select
              id="customer-select"
              required
              value={selectedCustomerId}
              onChange={(e) => handleCustomerSelect(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
            >
              <option value="">-- Pilih Pelanggan dengan Kontrak Aktif --</option>
              {eligibleCustomers.map((cust) => (
                <option key={cust.customer_id} value={cust.customer_id}>
                  {cust.customer_name} ({cust.contracts.length} kontrak layanan aktif)
                </option>
              ))}
            </select>

            {/* Opsi Kontrak jika Pelanggan memiliki lebih dari 1 kontrak layanan aktif */}
            {currentCustomer && currentCustomer.contracts.length > 1 && (
              <div>
                <label htmlFor="contract-select" className="block text-[0.68rem] font-bold text-slate-600 uppercase mb-1">
                  Kontrak Layanan Terkait <span className="text-rose-500">*</span>
                </label>
                <select
                  id="contract-select"
                  required
                  value={selectedContractId}
                  onChange={(e) => {
                    const cId = Number(e.target.value);
                    setSelectedContractId(cId);
                    const chosen = currentCustomer.contracts.find((c) => c.contract_id === cId);
                    if (chosen?.site_id) {
                      setSelectedSiteId(chosen.site_id);
                      setSelectedRoomId(chosen.room_id || "");
                      setSelectedRackId(chosen.rack_id || "");
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  {currentCustomer.contracts.map((c) => (
                    <option key={c.contract_id} value={c.contract_id}>
                      #{c.contract_number} ({c.service_type || "Layanan Colocation/DC"})
                      {c.site_name ? ` — ${c.site_name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Lokasi Alokasi Data Center (Site, Room, Rack Cascading) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/60">
              {/* Site */}
              <div>
                <label htmlFor="site-select" className="block text-[0.68rem] font-bold text-slate-600 uppercase mb-1">
                  Site Tujuan <span className="text-rose-500">*</span>
                </label>
                <select
                  id="site-select"
                  required
                  value={selectedSiteId}
                  disabled={!selectedCustomerId || isSitesLoading}
                  onChange={(e) => handleSiteChange(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {isSitesLoading ? "Memuat site..." : "-- Pilih Site Tujuan --"}
                  </option>
                  {siteOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.code ? `(${s.code})` : ""} {s.isContractAllocated ? "★ Alokasi Kontrak" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room */}
              <div>
                <label htmlFor="room-select" className="block text-[0.68rem] font-bold text-slate-600 uppercase mb-1">
                  Ruangan Server <span className="text-rose-500">*</span>
                </label>
                <select
                  id="room-select"
                  required
                  value={selectedRoomId}
                  disabled={!selectedSiteId || isRoomsLoading}
                  onChange={(e) => handleRoomChange(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!selectedSiteId
                      ? "Pilih site dahulu"
                      : isRoomsLoading
                      ? "Memuat ruangan..."
                      : "-- Pilih Ruangan Server --"}
                  </option>
                  {roomOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.code ? `(${r.code})` : ""} {r.isContractAllocated ? "★ Sesuai Kontrak" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rack */}
              <div>
                <label htmlFor="rack-select" className="block text-[0.68rem] font-bold text-slate-600 uppercase mb-1">
                  Target Rak (Opsional)
                </label>
                <select
                  id="rack-select"
                  value={selectedRackId}
                  disabled={!selectedSiteId || isRacksLoading}
                  onChange={(e) => setSelectedRackId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!selectedSiteId
                      ? "Pilih site dahulu"
                      : isRacksLoading
                      ? "Memuat rak..."
                      : "Semua Rak / Bebas"}
                  </option>
                  {rackOptions.map((rk) => (
                    <option key={rk.id} value={rk.id}>
                      Rak {rk.code} {rk.name ? `— ${rk.name}` : ""} {rk.isContractAllocated ? "★ Sesuai Kontrak" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Context Feedback Hint */}
            {selectedCustomerId && (
              <div className="mt-1">
                {hasContractSpecificAllocations ? (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[0.72rem] text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>
                      Alokasi kontrak CRM terdeteksi otomatis (ditandai ★). Anda dapat menyesuaikan Ruangan dan Rak jika tamu memerlukan akses perangkat lainnya.
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-[0.72rem] text-amber-800 flex items-center gap-1.5">
                    <Info size={13} className="text-amber-600 shrink-0" />
                    <span>
                      Kontrak aktif pelanggan ini belum mengunci alokasi rak spesifik di CRM. Silakan pilih Site, Ruangan, dan Rak tujuan operasional dari master di atas.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bagian 2: Identitas Pengunjung */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Server size={14} className="text-amber-500" />
              2. Data Identitas Pengunjung (Visitor)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="visitor-name" className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                  Nama Lengkap Tamu <span className="text-rose-500">*</span>
                </label>
                <input
                  id="visitor-name"
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Akmal"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label htmlFor="visitor-identity-type" className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                  Jenis Identitas <span className="text-rose-500">*</span>
                </label>
                <select
                  id="visitor-identity-type"
                  required
                  value={visitorIdentityType}
                  onChange={(e) => setVisitorIdentityType(e.target.value as VisitorIdentityType)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  <option value="ktp">KTP (e-KTP)</option>
                  <option value="sim">SIM</option>
                  <option value="passport">Passport</option>
                </select>
              </div>

              <div>
                <label htmlFor="visitor-id-card" className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                  Nomor Identitas ({visitorIdentityType.toUpperCase()}) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="visitor-id-card"
                  type="text"
                  required
                  placeholder={
                    visitorIdentityType === "ktp"
                      ? "Contoh: 3578012345670001"
                      : visitorIdentityType === "sim"
                      ? "Contoh: 1234-5678-9012"
                      : "Contoh: A12345678"
                  }
                  value={visitorIdCard}
                  onChange={(e) => setVisitorIdCard(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label htmlFor="visitor-company" className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                  Perusahaan / Instansi Tamu
                </label>
                <input
                  id="visitor-company"
                  type="text"
                  placeholder="Contoh: PT Integrasi Jaringan / Vendor"
                  value={visitorCompany}
                  onChange={(e) => setVisitorCompany(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label htmlFor="visitor-email" className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                  Email Tamu (Kirim Tiket & QR) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="visitor-email"
                  type="email"
                  required
                  placeholder="tamu@perusahaan.com"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label htmlFor="visitor-phone" className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                  Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  id="visitor-phone"
                  type="tel"
                  required
                  placeholder="Contoh: 08123456789"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="visitor-purpose" className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                  Keperluan Kunjungan <span className="text-rose-500">*</span>
                </label>
                <input
                  id="visitor-purpose"
                  type="text"
                  required
                  placeholder="Pemasangan Server / Maintenance"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Bagian 3: Rentang Waktu Berlaku */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-amber-500" />
              3. Jadwal & Masa Berlaku Izin Masuk
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="valid-from" className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                  Waktu Mulai Berlaku <span className="text-rose-500">*</span>
                </label>
                <input
                  id="valid-from"
                  type="datetime-local"
                  required
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label htmlFor="valid-to" className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                  Waktu Selesai Berlaku <span className="text-rose-500">*</span>
                </label>
                <input
                  id="valid-to"
                  type="datetime-local"
                  required
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="visitor-notes" className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                Catatan Tambahan Pos Jaga / NOC
              </label>
              <textarea
                id="visitor-notes"
                rows={2}
                placeholder="Catatan khusus barang bawaan, izin membawa laptop, pendamping NOC, dll."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={createPassMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createPassMutation.isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              <Check size={15} />
              <span>
                {createPassMutation.isPending ? "Menerbitkan Izin..." : "Terbitkan Visitor Pass"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
