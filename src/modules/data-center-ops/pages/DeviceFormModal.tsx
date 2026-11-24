import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Loader2,
  Server,
  Zap,
  MapPin,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Search,
} from "lucide-react";
import { useCreateDevice } from "../api/useDevices";
import { useSiteList } from "../api/useSites";
import { useRoomList } from "../api/useRooms";
import { useRackList, useContractRackAllocations } from "../api/useRacks";
import { customerApi } from "@modules/crm-sales/api/customerApi";
import { contractApi } from "@modules/crm-sales/api/contractApi";
import { extractErrorMessage } from "@shared/types/api";
import { LoadingState } from "@shared/components/LoadingState";
import type { Customer } from "@modules/crm-sales/types/customer";
import type { DeviceType, DeviceStatus } from "../types/device";

const EMPTY = {
  site_id: "",
  device_name: "",
  device_type: "server" as DeviceType,
  manufacturer: "",
  model: "",
  serial_number: "",
  power_watt: "",
  status: "active" as DeviceStatus,
  purchase_date: "",
  warranty_expiry: "",
  notes: "",
  customer_id: "",
  customer_label: "",
  contract_id: "",
};

export interface DeviceFormModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeviceFormModal({ onClose, onSuccess }: DeviceFormModalProps) {
  const [form, setForm] = useState(EMPTY);
  const [roomId, setRoomId] = useState("");
  const [rackId, setRackId] = useState("");
  const [positionU, setPositionU] = useState("");
  const [positionUEnd, setPositionUEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useCreateDevice();
  const { data: sitesData, isLoading: sitesLoading } = useSiteList({
    per_page: 100,
    status: "active",
  });
  const { data: rooms, isLoading: roomsLoading } = useRoomList(
    form.site_id ? Number(form.site_id) : undefined
  );
  const { data: racksPage, isLoading: racksLoading } = useRackList({
    site_room_id: roomId ? Number(roomId) : undefined,
    per_page: 100,
  });

  // Handle ESC key to dismiss modal safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !create.isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, create.isPending]);

  function handleSiteChange(value: string) {
    set("site_id", value);
    setRoomId("");
    setRackId("");
    setPositionU("");
    setPositionUEnd("");
  }

  function handleRoomChange(value: string) {
    setRoomId(value);
    setRackId("");
    setPositionU("");
    setPositionUEnd("");
  }

  // ── CRM: Customer Autocomplete Search ──
  const [customerSearch, setCustomerSearch] = useState("");
  const { data: customerResults, isLoading: customerSearching } = useQuery({
    queryKey: ["device-customer-search", customerSearch],
    queryFn: () =>
      customerApi
        .list({ search: customerSearch, per_page: 10 })
        .then((r) => r.data.data),
    enabled: customerSearch.length >= 2,
  });

  // Kontrak AKTIF milik customer yang dipilih
  const { data: activeContracts, isLoading: loadingContracts } = useQuery({
    queryKey: ["device-customer-active-contracts", form.customer_id],
    queryFn: () =>
      contractApi
        .list({
          customer_id: Number(form.customer_id),
          status: "active",
          per_page: 50,
        })
        .then((r) => r.data.data),
    enabled: !!form.customer_id,
  });

  // Slot rack yang SUDAH DIKUNCI/DIPESAN contract terpilih
  const [allocationId, setAllocationId] = useState("");
  const { data: contractAllocations, isLoading: loadingAllocations } =
    useContractRackAllocations(
      form.contract_id ? Number(form.contract_id) : undefined
    );
  const selectedAllocation = contractAllocations?.find(
    (a) => a.id === Number(allocationId)
  );

  function selectAllocation(value: string) {
    setAllocationId(value);
    const alloc = contractAllocations?.find((a) => a.id === Number(value));
    if (alloc?.rack?.site_room) {
      set("site_id", String(alloc.rack.site_room.site_id));
      setRoomId(String(alloc.rack.site_room_id));
      setRackId(String(alloc.rack_id));
      setPositionU(String(alloc.start_u));
      setPositionUEnd(alloc.end_u > alloc.start_u ? String(alloc.end_u) : "");
    }
  }

  function selectCustomer(customer: Customer) {
    setForm((f) => ({
      ...f,
      customer_id: String(customer.id),
      customer_label: `${customer.customer_code} — ${customer.company_name}`,
      contract_id: "",
    }));
    setCustomerSearch("");
    setAllocationId("");
  }

  function clearCustomer() {
    setForm((f) => ({
      ...f,
      customer_id: "",
      customer_label: "",
      contract_id: "",
    }));
    setAllocationId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.site_id) {
      setError("Site penempatan wajib dipilih.");
      return;
    }
    if (!form.device_name.trim()) {
      setError("Nama device wajib diisi.");
      return;
    }

    if (form.contract_id && !rackId) {
      setError("Device yang terhubung ke contract wajib memilih Rack penempatan.");
      return;
    }
    if (form.contract_id && !positionU) {
      setError("Device yang terhubung ke contract wajib mengisi Posisi U penempatan.");
      return;
    }
    if (positionUEnd && positionU && Number(positionUEnd) < Number(positionU)) {
      setError("Posisi U Akhir tidak boleh lebih kecil dari Posisi U.");
      return;
    }

    if (form.contract_id && rackId && positionU) {
      const start = Number(positionU);
      const end = positionUEnd ? Number(positionUEnd) : start;
      const withinSomeAllocation = (contractAllocations ?? []).some(
        (a) => a.rack_id === Number(rackId) && a.start_u <= start && a.end_u >= end
      );
      if ((contractAllocations?.length ?? 0) > 0 && !withinSomeAllocation) {
        setError(
          "Slot ini di luar alokasi rack yang sudah dikunci untuk contract ini. Pilih dari 'Slot Alokasi Kontrak' atau kunci slot lewat halaman Contract."
        );
        return;
      }
    }
    setError(null);

    try {
      await create.mutateAsync({
        site_id: Number(form.site_id),
        site_room_id: roomId ? Number(roomId) : undefined,
        rack_id: rackId ? Number(rackId) : undefined,
        rack_position_u: positionU ? Number(positionU) : undefined,
        rack_position_u_end: positionUEnd ? Number(positionUEnd) : undefined,
        device_name: form.device_name.trim(),
        device_type: form.device_type,
        manufacturer: form.manufacturer || undefined,
        model: form.model || undefined,
        serial_number: form.serial_number || undefined,
        power_watt: form.power_watt ? Number(form.power_watt) : undefined,
        status: form.status,
        purchase_date: form.purchase_date || undefined,
        warranty_expiry: form.warranty_expiry || undefined,
        notes: form.notes || undefined,
        customer_id: form.customer_id ? Number(form.customer_id) : undefined,
        contract_id: form.contract_id ? Number(form.contract_id) : undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={create.isPending ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-[680px] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-form-modal-title"
      >
        {/* ── Modal Header Bergaya MSDC ── */}
        <div className="px-7 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
              <Server size={20} />
            </div>
            <div>
              <h2
                id="device-form-modal-title"
                className="text-lg font-bold text-[#0A2140] tracking-tight leading-tight"
              >
                Tambah Device Baru
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftarkan perangkat server, storage, atau network ke dalam sistem inventori data center
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={create.isPending}
            aria-label="Tutup modal"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Scrollable Body ── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-7 py-5 flex flex-col gap-6 overflow-y-auto">
            {/* ── SEKSI 1: LOKASI FISIK & PENEMPATAN ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <MapPin size={14} className="text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  1. Lokasi Fisik &amp; Penempatan Rack
                </span>
              </div>

              {sitesLoading ? (
                <LoadingState />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Site Data Center <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                      value={form.site_id}
                      onChange={(e) => handleSiteChange(e.target.value)}
                    >
                      <option value="">— Pilih Site —</option>
                      {sitesData?.data.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.site_code} — {s.site_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Room / Ruang Server
                    </label>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                      value={roomId}
                      disabled={!form.site_id || roomsLoading}
                      onChange={(e) => handleRoomChange(e.target.value)}
                    >
                      <option value="">— Tanpa room spesifik —</option>
                      {(rooms ?? []).map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.room_code} — {r.room_name}
                        </option>
                      ))}
                    </select>
                    {!form.site_id && (
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Pilih site terlebih dahulu
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Baris Rack & Posisi Slot U */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Rack Unit {form.contract_id ? <span className="text-rose-500">*</span> : null}
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    value={rackId}
                    disabled={!roomId || racksLoading}
                    onChange={(e) => {
                      setRackId(e.target.value);
                      setPositionU("");
                      setPositionUEnd("");
                    }}
                  >
                    <option value="">— Tanpa rack / Gudang —</option>
                    {(racksPage?.data ?? []).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.rack_code} {r.rack_name ? `— ${r.rack_name}` : ""}
                      </option>
                    ))}
                  </select>
                  {!roomId && (
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Pilih room untuk melihat daftar rack
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Posisi U {form.contract_id ? <span className="text-rose-500">*</span> : null}
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="mis. 5"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    value={positionU}
                    onChange={(e) => setPositionU(e.target.value)}
                    disabled={!rackId}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    s/d U (Multi-U)
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder={positionU || "—"}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    value={positionUEnd}
                    onChange={(e) => setPositionUEnd(e.target.value)}
                    disabled={!rackId}
                  />
                </div>
              </div>
              {rackId ? (
                <p className="text-[11px] text-slate-400 -mt-1">
                  💡 Kosongkan &quot;s/d U&quot; jika perangkat hanya berukuran 1U. Isi jika perangkat berukuran 2U/3U/4U (misal Posisi U: 5, s/d U: 7).
                </p>
              ) : null}
            </div>

            {/* ── SEKSI 2: IDENTITAS PERANGKAT ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Server size={14} className="text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  2. Identitas Perangkat &amp; Tipe
                </span>
              </div>

              {/* Baris Kode & Tipe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Kode Perangkat
                  </label>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm italic text-slate-400 select-none cursor-not-allowed">
                    Otomatis (Number Sequence)
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Tipe Perangkat <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                    value={form.device_type}
                    onChange={(e) => set("device_type", e.target.value as DeviceType)}
                  >
                    <option value="server">Server</option>
                    <option value="storage">Storage</option>
                    <option value="switch">Switch</option>
                    <option value="router">Router</option>
                    <option value="firewall">Firewall</option>
                    <option value="ups">UPS</option>
                    <option value="pdu">PDU</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Nama Perangkat */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Nama Perangkat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="mis. Dell PowerEdge R740 - Prod Web"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  value={form.device_name}
                  onChange={(e) => set("device_name", e.target.value)}
                />
              </div>

              {/* Vendor, Model, Serial Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Manufacturer / Vendor
                  </label>
                  <input
                    type="text"
                    placeholder="mis. Dell / HPE / Cisco"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    value={form.manufacturer}
                    onChange={(e) => set("manufacturer", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Model
                  </label>
                  <input
                    type="text"
                    placeholder="mis. PowerEdge R740"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    value={form.model}
                    onChange={(e) => set("model", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Serial Number (SN)
                  </label>
                  <input
                    type="text"
                    placeholder="mis. SN8Y3X2W1"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    value={form.serial_number}
                    onChange={(e) => set("serial_number", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── SEKSI 3: SPESIFIKASI OPERASIONAL & DAYA ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Zap size={14} className="text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  3. Daya &amp; Status Operasional
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Beban Daya (Watt)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="mis. 450"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-3.5 pr-8 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      value={form.power_watt}
                      onChange={(e) => set("power_watt", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      W
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Status Perangkat
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as DeviceStatus)}
                  >
                    <option value="active">Aktif</option>
                    <option value="spare">Spare / Cadangan</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="decommissioned">Didecommission</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Tanggal Beli
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                    value={form.purchase_date}
                    onChange={(e) => set("purchase_date", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Garansi Berakhir
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                    value={form.warranty_expiry}
                    onChange={(e) => set("warranty_expiry", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Catatan / Keterangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Informasi konfigurasi, port uplink, atau catatan pemeliharaan..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-y"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>
            </div>

            {/* ── SEKSI 4: KEPEMILIKAN CUSTOMER & KONTRAK (OPSIONAL) ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <UserCheck size={14} className="text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  4. Kepemilikan Customer &amp; Kontrak (Opsional)
                </span>
              </div>

              {/* Customer Autocomplete Input / Pill */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Customer Terkait
                </label>
                {form.customer_id ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span className="font-semibold text-emerald-900">
                        {form.customer_label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearCustomer}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                      Ganti Customer
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Cari kode atau nama customer (ketik minimal 2 huruf)..."
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                    {customerSearching ? (
                      <Loader2
                        size={16}
                        className="animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    ) : null}

                    {customerSearch.length >= 2 && customerResults && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {customerResults.length === 0 ? (
                          <div className="p-3 text-xs text-slate-500 text-center">
                            Tidak ditemukan customer yang sesuai.
                          </div>
                        ) : (
                          customerResults.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectCustomer(c)}
                              className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <span className="font-semibold text-slate-800">
                                {c.company_name}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {c.customer_code}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Kontrak Aktif Dropdown */}
              {form.customer_id ? (
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Kontrak Aktif
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                    value={form.contract_id}
                    disabled={loadingContracts}
                    onChange={(e) => {
                      set("contract_id", e.target.value);
                      setAllocationId("");
                    }}
                  >
                    <option value="">— Tanpa contract —</option>
                    {(activeContracts ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.contract_number}
                      </option>
                    ))}
                  </select>
                  {!loadingContracts &&
                    activeContracts &&
                    activeContracts.length === 0 && (
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Customer ini belum memiliki kontrak berstatus aktif.
                      </span>
                    )}
                </div>
              ) : null}

              {/* Slot Alokasi Kontrak yang Sudah Dikunci */}
              {form.contract_id ? (
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Slot Alokasi Kontrak
                    {(contractAllocations?.length ?? 0) > 0 ? (
                      <span className="text-rose-500"> *</span>
                    ) : null}
                  </label>
                  {loadingAllocations ? (
                    <LoadingState />
                  ) : (contractAllocations ?? []).length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 leading-relaxed">
                      ⚠️ Kontrak ini belum memiliki rack/slot yang dikunci. Kunci slot terlebih dahulu di halaman <strong>Contract &gt; Lokasi &amp; Kunci Resource</strong>, atau pastikan koordinat rack sesuai alokasi.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <select
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                        value={allocationId}
                        onChange={(e) => selectAllocation(e.target.value)}
                      >
                        <option value="">— Pilih slot terkunci —</option>
                        {(contractAllocations ?? []).map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.rack?.site_room
                              ? `${a.rack.site_room.room_code} — `
                              : ""}
                            {a.rack?.rack_code ?? `Rack #${a.rack_id}`} (U
                            {a.start_u}-U{a.end_u})
                          </option>
                        ))}
                      </select>
                      {selectedAllocation ? (
                        <p className="text-[11px] text-slate-500">
                          Slot terkunci: <strong>U{selectedAllocation.start_u} s/d U{selectedAllocation.end_u}</strong>. Form penempatan fisik di atas telah diisi otomatis.
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Error Message Alert */}
            {error ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
                <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </div>
            ) : null}
          </div>

          {/* ── Modal Footer ── */}
          <div className="px-7 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={create.isPending}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#E59B00] hover:bg-[#D48F00] active:scale-98 rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {create.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Device</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeviceFormModal;
