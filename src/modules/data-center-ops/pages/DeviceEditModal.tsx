import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Loader2,
  Pencil,
  Zap,
  MapPin,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Search,
} from "lucide-react";
import { useUpdateDevice, useMoveDevice } from "../api/useDevices";
import { useSiteList } from "../api/useSites";
import { useRoomList } from "../api/useRooms";
import { useRackList, useContractRackAllocations } from "../api/useRacks";
import { customerApi } from "@modules/crm-sales/api/customerApi";
import { contractApi } from "@modules/crm-sales/api/contractApi";
import { extractErrorMessage } from "@shared/types/api";
import { LoadingState } from "@shared/components/LoadingState";
import type { Customer } from "@modules/crm-sales/types/customer";
import type { Device } from "../types/device";

export interface DeviceEditModalProps {
  device: Device;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeviceEditModal({ device, onClose, onSuccess }: DeviceEditModalProps) {
  const [form, setForm] = useState({
    device_name: device.device_name,
    manufacturer: device.manufacturer ?? "",
    model: device.model ?? "",
    serial_number: device.serial_number ?? "",
    power_watt:
      device.power_watt !== null && device.power_watt !== undefined
        ? String(device.power_watt)
        : "",
    purchase_date: device.purchase_date ?? "",
    warranty_expiry: device.warranty_expiry ?? "",
    notes: device.notes ?? "",
    customer_id: device.customer_id ? String(device.customer_id) : "",
    customer_label: "",
    contract_id: device.contract_id ? String(device.contract_id) : "",
  });
  const [error, setError] = useState<string | null>(null);

  const update = useUpdateDevice(device.id);
  const move = useMoveDevice(device.id);
  const isPending = update.isPending || move.isPending;

  // Lokasi penempatan fisik
  const [siteId, setSiteId] = useState(device.site_id ? String(device.site_id) : "");
  const [roomId, setRoomId] = useState(device.site_room_id ? String(device.site_room_id) : "");
  const [rackId, setRackId] = useState(device.rack_id ? String(device.rack_id) : "");
  const [positionU, setPositionU] = useState(device.rack_position_u ? String(device.rack_position_u) : "");
  const [positionUEnd, setPositionUEnd] = useState(device.rack_position_u_end ? String(device.rack_position_u_end) : "");
  const [allocationId, setAllocationId] = useState("");

  const { data: sitesData, isLoading: sitesLoading } = useSiteList({ per_page: 100 });
  const { data: rooms, isLoading: roomsLoading } = useRoomList(siteId ? Number(siteId) : undefined);
  const { data: racksPage, isLoading: racksLoading } = useRackList({
    site_room_id: roomId ? Number(roomId) : undefined,
    per_page: 100,
  });

  // Handle ESC key to dismiss modal safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPending]);

  function handleSiteChange(value: string) {
    setSiteId(value);
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

  // ── CRM: Customer & Contract Data ──
  const [customerSearch, setCustomerSearch] = useState("");
  const { data: customerResults, isLoading: customerSearching } = useQuery({
    queryKey: ["device-customer-search", customerSearch],
    queryFn: () => customerApi.list({ search: customerSearch, per_page: 10 }).then((r) => r.data.data),
    enabled: customerSearch.length >= 2,
  });

  const { data: currentCustomer } = useQuery({
    queryKey: ["device-current-customer", device.customer_id],
    queryFn: () => customerApi.show(device.customer_id!).then((r) => r.data.data),
    enabled: !!device.customer_id && !form.customer_label,
  });

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

  const { data: contractAllocations, isLoading: loadingAllocations } =
    useContractRackAllocations(form.contract_id ? Number(form.contract_id) : undefined);
  const selectedAllocation = contractAllocations?.find((a) => a.id === Number(allocationId));

  function selectAllocation(value: string) {
    setAllocationId(value);
    const alloc = contractAllocations?.find((a) => a.id === Number(value));
    if (alloc?.rack?.site_room) {
      setSiteId(String(alloc.rack.site_room.site_id));
      setRoomId(String(alloc.rack.site_room_id));
      setRackId(String(alloc.rack_id));
      setPositionU(String(alloc.start_u));
      setPositionUEnd(alloc.end_u > alloc.start_u ? String(alloc.end_u) : "");
    }
  }

  const customerLabel =
    form.customer_label ||
    (currentCustomer ? `${currentCustomer.customer_code} — ${currentCustomer.company_name}` : "");

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

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.device_name.trim()) {
      setError("Nama device wajib diisi.");
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
      await update.mutateAsync({
        device_name: form.device_name.trim(),
        manufacturer: form.manufacturer || undefined,
        model: form.model || undefined,
        serial_number: form.serial_number || undefined,
        power_watt: form.power_watt ? Number(form.power_watt) : null,
        purchase_date: form.purchase_date || undefined,
        warranty_expiry: form.warranty_expiry || undefined,
        notes: form.notes || undefined,
        customer_id: form.customer_id ? Number(form.customer_id) : null,
        contract_id: form.contract_id ? Number(form.contract_id) : null,
      });

      // Pindahkan lokasi jika ada perubahan
      const locationChanged =
        siteId !== (device.site_id ? String(device.site_id) : "") ||
        roomId !== (device.site_room_id ? String(device.site_room_id) : "") ||
        rackId !== (device.rack_id ? String(device.rack_id) : "") ||
        positionU !== (device.rack_position_u ? String(device.rack_position_u) : "") ||
        positionUEnd !== (device.rack_position_u_end ? String(device.rack_position_u_end) : "");

      if (locationChanged) {
        await move.mutateAsync({
          site_id: siteId ? Number(siteId) : null,
          site_room_id: roomId ? Number(roomId) : null,
          rack_id: rackId ? Number(rackId) : null,
          rack_position_u: positionU ? Number(positionU) : null,
          rack_position_u_end: positionUEnd ? Number(positionUEnd) : null,
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={isPending ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-[680px] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-edit-modal-title"
      >
        {/* ── Modal Header ── */}
        <div className="px-7 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
              <Pencil size={18} />
            </div>
            <div>
              <h2
                id="device-edit-modal-title"
                className="text-lg font-bold text-[#0A2140] tracking-tight leading-tight"
              >
                Edit Perangkat — {device.device_code}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbarui data perangkat, spesifikasi hardware, atau lokasi rack
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Tutup modal"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Scrollable Body ── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-7 py-5 flex flex-col gap-6 overflow-y-auto">
            {/* ── SEKSI 1: IDENTITAS PERANGKAT ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Pencil size={14} className="text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  1. Identitas &amp; Spesifikasi Perangkat
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Nama Perangkat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  value={form.device_name}
                  onChange={(e) => set("device_name", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Manufacturer / Vendor
                  </label>
                  <input
                    type="text"
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    value={form.serial_number}
                    onChange={(e) => set("serial_number", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── SEKSI 2: DAYA & GARANSI ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Zap size={14} className="text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  2. Daya &amp; Masa Berlaku Garansi
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-y"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>
            </div>

            {/* ── SEKSI 3: LOKASI FISIK RACK & SLOT U ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <MapPin size={14} className="text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  3. Lokasi Fisik &amp; Penempatan Rack
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Site Data Center
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                    value={siteId}
                    disabled={sitesLoading}
                    onChange={(e) => handleSiteChange(e.target.value)}
                  >
                    <option value="">— Tanpa site —</option>
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
                    disabled={!siteId || roomsLoading}
                    onChange={(e) => handleRoomChange(e.target.value)}
                  >
                    <option value="">— Tanpa room spesifik —</option>
                    {(rooms ?? []).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.room_code} — {r.room_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Rack Unit
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
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Posisi U
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
            </div>

            {/* ── SEKSI 4: KEPEMILIKAN CUSTOMER & KONTRAK (OPSIONAL) ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <UserCheck size={14} className="text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  4. Kepemilikan Customer &amp; Kontrak (Opsional)
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Customer Terkait
                </label>
                {form.customer_id ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span className="font-semibold text-emerald-900">
                        {customerLabel || `Customer #${form.customer_id}`}
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
                      placeholder="Cari customer (ketik minimal 2 huruf)..."
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
                </div>
              ) : null}

              {form.contract_id ? (
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Slot Alokasi Kontrak
                  </label>
                  {loadingAllocations ? (
                    <LoadingState />
                  ) : (contractAllocations ?? []).length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 leading-relaxed">
                      ⚠️ Kontrak ini belum memiliki rack/slot yang dikunci.
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
              disabled={isPending}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#E59B00] hover:bg-[#D48F00] active:scale-98 rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeviceEditModal;
