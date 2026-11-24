import { useState, useMemo, type FormEvent } from "react";
import {
  Plus,
  Pencil,
  Check,
  Loader2,
  AlertCircle,
  Search,
  Building2,
  CheckCircle2,
  Ban,
  Layers,
  MapPin,
  User,
  X,
  FilterX,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useWarehouseList, useCreateWarehouse, useUpdateWarehouse } from "../api/useItem";
import { apiClient } from "@shared/lib/api-client";
import { ProcurementFormModal } from "../components/ProcurementFormModal";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import { extractErrorMessage } from "@shared/types/api";
import { WAREHOUSE_TYPES, type Warehouse } from "../types/warehouse";

interface EmployeeOption {
  id: number;
  full_name: string;
  employee_number?: string;
}

interface FormState {
  warehouse_name: string;
  warehouse_type: string;
  address: string;
  phone: string;
  pic_employee_id: string;
  pic_name: string;
  capacity: string;
  notes: string;
  is_active: boolean;
  is_main: boolean;
  site_branch: string;
  operating_hours: string;
}

interface FormErrors {
  warehouse_name?: string;
  warehouse_type?: string;
  address?: string;
  capacity?: string;
  phone?: string;
}

const EMPTY_FORM: FormState = {
  warehouse_name: "",
  warehouse_type: "Gudang Utama",
  address: "",
  phone: "",
  pic_employee_id: "",
  pic_name: "",
  capacity: "500",
  notes: "",
  is_active: true,
  is_main: false,
  site_branch: "Surabaya (Kantor Pusat)",
  operating_hours: "08:00 - 17:00 WIB",
};

export function WarehouseListPage() {
  const { data: warehouses, isLoading, refetch } = useWarehouseList();
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "main" | "inactive">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch employees for PIC dropdown
  const { data: employees = [] } = useQuery<EmployeeOption[]>({
    queryKey: ["warehouse-employees-list"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/v1/hr-service-support/employees", {
          params: { per_page: 100 },
        });
        const data = res.data;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data?.data?.data)) return data.data.data;
        return [];
      } catch {
        return [];
      }
    },
  });

  const warehousesList = useMemo(() => warehouses?.data ?? [], [warehouses]);

  // Statistik KPI
  const totalWarehouses = warehousesList.length;
  const activeCount = useMemo(
    () => warehousesList.filter((w) => w.is_active).length,
    [warehousesList]
  );
  const mainCount = useMemo(
    () =>
      warehousesList.filter(
        (w) =>
          (w.warehouse_type || w.type) === "Gudang Utama" ||
          w.warehouse_code === "WH-Main" ||
          (w as { is_main?: boolean }).is_main
      ).length,
    [warehousesList]
  );
  const inactiveCount = useMemo(
    () => warehousesList.filter((w) => !w.is_active).length,
    [warehousesList]
  );
  const totalCapacity = useMemo(
    () => warehousesList.reduce((acc, w) => acc + (w.capacity || 0), 0),
    [warehousesList]
  );
  const healthyPercentage =
    totalWarehouses > 0 ? Math.round((activeCount / totalWarehouses) * 100) : 100;

  // Filtered List
  const filteredWarehouses = useMemo(() => {
    return warehousesList.filter((wh) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        wh.warehouse_name.toLowerCase().includes(q) ||
        (wh.warehouse_code && wh.warehouse_code.toLowerCase().includes(q)) ||
        (wh.address && wh.address.toLowerCase().includes(q));

      const effectiveType = wh.warehouse_type || wh.type || "";
      const matchesType = !typeFilter || effectiveType === typeFilter;

      let matchesStatus = true;
      if (statusFilter === "active") matchesStatus = wh.is_active;
      else if (statusFilter === "inactive") matchesStatus = !wh.is_active;
      else if (statusFilter === "main") {
        matchesStatus =
          effectiveType === "Gudang Utama" ||
          wh.warehouse_code === "WH-Main" ||
          (wh as { is_main?: boolean }).is_main === true;
      }

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [warehousesList, search, typeFilter, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setValidationErrors({});
    setError(null);
    setIsModalOpen(true);
  }

  function openEdit(wh: Warehouse) {
    setEditing(wh);
    const isMain =
      (wh.warehouse_type || wh.type) === "Gudang Utama" ||
      wh.warehouse_code === "WH-Main" ||
      (wh as { is_main?: boolean }).is_main === true;

    setForm({
      warehouse_name: wh.warehouse_name ?? "",
      warehouse_type: wh.warehouse_type ?? wh.type ?? "Gudang Utama",
      address: wh.address ?? "",
      phone: wh.phone ?? "",
      pic_employee_id: wh.pic_employee_id ? String(wh.pic_employee_id) : "",
      pic_name: wh.pic_name ?? wh.pic_employee?.full_name ?? "",
      capacity: wh.capacity !== undefined && wh.capacity !== null && wh.capacity > 0 ? String(wh.capacity) : "500",
      notes: wh.notes ?? "",
      is_active: wh.is_active ?? true,
      is_main: isMain,
      site_branch: (wh as { site_branch?: string }).site_branch ?? "Surabaya (Kantor Pusat)",
      operating_hours: (wh as { operating_hours?: string }).operating_hours ?? "08:00 - 17:00 WIB",
    });
    setValidationErrors({});
    setError(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const errs: FormErrors = {};
    const trimmedName = form.warehouse_name.trim();

    // 1. Validasi Nama: wajib & min 3 karakter
    if (!trimmedName || trimmedName.length < 3) {
      errs.warehouse_name = "Nama warehouse wajib diisi (minimal 3 karakter).";
    } else {
      // Deteksi duplikat nama
      const duplicate = warehousesList.find(
        (w) =>
          (!editing || String(w.id) !== String(editing.id)) &&
          w.warehouse_name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        errs.warehouse_name = `Nama gudang sudah digunakan oleh kode [${duplicate.warehouse_code}]. Harap gunakan nama spesifik untuk membedakannya di dropdown transaksi.`;
      }
    }

    // 2. Validasi Tipe Gudang: Wajib
    if (!form.warehouse_type.trim()) {
      errs.warehouse_type = "Tipe gudang wajib dipilih.";
    }

    // 3. Validasi Alamat: Wajib & min 8 karakter (mencegah 'aaaa')
    const trimmedAddress = form.address.trim();
    if (!trimmedAddress) {
      errs.address = "Alamat gudang wajib diisi.";
    } else if (trimmedAddress.length < 8) {
      errs.address = "Alamat gudang minimal 8 karakter (masukkan alamat jalan/lokasi yang valid).";
    }

    // 4. Validasi Kapasitas: Wajib & > 0 m³
    if (!form.capacity.trim()) {
      errs.capacity = "Kapasitas gudang (m³) wajib diisi.";
    } else {
      const num = Number(form.capacity);
      if (isNaN(num) || num <= 0) {
        errs.capacity = "Kapasitas harus berupa angka positif lebih dari 0 m³.";
      }
    }

    // 5. Validasi Telepon jika diisi
    if (form.phone.trim() && form.phone.trim().length < 7) {
      errs.phone = "Nomor telepon minimal 7 digit.";
    }

    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      return;
    }
    setValidationErrors({});

    const parsedCapacity = Number(form.capacity.trim());
    const parsedEmployeeId = form.pic_employee_id.trim() !== "" ? Number(form.pic_employee_id) : null;
    const finalType = form.is_main ? "Gudang Utama" : form.warehouse_type;

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          values: {
            warehouse_name: trimmedName,
            warehouse_type: finalType,
            type: finalType,
            address: trimmedAddress,
            phone: form.phone.trim() || null,
            pic_employee_id: parsedEmployeeId,
            pic_name: form.pic_name.trim() || null,
            capacity: parsedCapacity,
            notes: form.notes.trim() || null,
            is_active: form.is_active,
          },
        });
      } else {
        await createMutation.mutateAsync({
          warehouse_name: trimmedName,
          warehouse_type: finalType,
          type: finalType,
          address: trimmedAddress,
          phone: form.phone.trim() || undefined,
          pic_employee_id: parsedEmployeeId,
          pic_name: form.pic_name.trim() || undefined,
          capacity: parsedCapacity,
          notes: form.notes.trim() || undefined,
        });
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const cardAnimationClass =
    "transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 active:scale-95 active:translate-y-0 select-none";

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. PageHeader Banner (Navy Blue & Gold Diagonal) ── */}
      <PageHeader
        title="Warehouse"
        subtitle="Daftar gudang, kapasitas penyimpanan, dan PIC operasional MSDC."
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── 2. Pembungkus Konten Utama ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* ── Top Overview Card: Banner & 4 KPI Cards (Persis Referensi) ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          {/* Banner Status Health */}
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5 flex-1 w-full sm:w-auto">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-bold text-emerald-800 tracking-wide uppercase">
                    Status Operasional Gudang
                  </h2>
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      healthyPercentage <= 50 ? "text-rose-600" : "text-emerald-700"
                    }`}
                  >
                    {healthyPercentage}% Siap Pakai
                  </span>
                </div>
                <div className="w-full bg-emerald-100/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      healthyPercentage <= 50 ? "bg-rose-500" : "bg-emerald-600"
                    }`}
                    style={{ width: `${healthyPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-emerald-200/80 w-full sm:w-auto justify-between sm:justify-end shadow-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                <Layers size={15} className="text-amber-500" />
                <span>Total Kapasitas:</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {totalCapacity.toLocaleString("id-ID")} m³
              </span>
            </div>
          </div>

          {/* 4 Kartu Statistik Interaktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Warehouse */}
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "all"
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Building2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Total Warehouse
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {totalWarehouses}{" "}
                  <span className="text-xs font-normal text-slate-400">Unit</span>
                </h3>
              </div>
            </button>

            {/* Card 2: Warehouse Aktif */}
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "active"
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Warehouse Aktif
                </p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">
                  {activeCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Gudang</span>
                </h3>
              </div>
            </button>

            {/* Card 3: Gudang Utama */}
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "main" ? "all" : "main")}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "main"
                  ? "border-purple-500 ring-2 ring-purple-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-purple-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <Layers size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Gudang Utama
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  {mainCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Lokasi</span>
                </h3>
              </div>
            </button>

            {/* Card 4: Warehouse Nonaktif */}
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "inactive" ? "all" : "inactive")}
              className={`w-full text-left p-5 rounded-xl border bg-white shadow-sm flex items-center gap-4 focus:outline-none ${cardAnimationClass} ${
                statusFilter === "inactive"
                  ? "border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                  : "border-slate-200/80 hover:border-rose-300 hover:shadow-md"
              }`}
            >
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <Ban size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                  Warehouse Nonaktif
                </p>
                <h3 className="text-2xl font-bold text-rose-600 mt-0.5">
                  {inactiveCount}{" "}
                  <span className="text-xs font-normal text-slate-400">Item</span>
                </h3>
              </div>
            </button>
          </div>
        </div>

        {/* ── Main Table Card: Toolbar & Data Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          {/* Toolbar Sesuai Gambar Referensi */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              {/* Search input */}
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Cari warehouse atau alamat..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Tipe Dropdown */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="">Semua Tipe</option>
                {WAREHOUSE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {statusFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200/60 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer"
                >
                  <FilterX size={14} /> Reset Filter Card
                </button>
              )}
            </div>

            {/* Tombol Aksi Tambah (Kuning Emas Sesuai Referensi) */}
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Warehouse Baru</span>
            </button>
          </div>

          {isLoading && <LoadingState />}
          {!isLoading && filteredWarehouses.length === 0 && (
            <EmptyState
              title="Tidak Ada Warehouse Ditemukan"
              subtitle="Coba ubah kata kunci pencarian atau filter status."
            />
          )}

          {!isLoading && filteredWarehouses.length > 0 && (
            <div className="border border-slate-200/90 rounded-xl overflow-hidden mt-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">Kode</th>
                      <th className="py-3.5 px-4">Nama Warehouse</th>
                      <th className="py-3.5 px-4">Tipe</th>
                      <th className="py-3.5 px-4">Kapasitas</th>
                      <th className="py-3.5 px-4">Lokasi & PIC</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {filteredWarehouses.map((wh) => (
                      <tr
                        key={wh.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-600">
                          {wh.warehouse_code}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{wh.warehouse_name}</span>
                            {(wh.warehouse_code === "WH-Main" || (wh.warehouse_type || wh.type) === "Gudang Utama") && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                Utama
                              </span>
                            )}
                          </div>
                          {wh.notes && (
                            <div className="text-xs text-slate-400 truncate max-w-xs">
                              {wh.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {wh.warehouse_type || wh.type ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                              {wh.warehouse_type || wh.type}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs">
                          {wh.capacity !== undefined && wh.capacity !== null && wh.capacity > 0 ? (
                            <span className="font-semibold text-slate-800">
                              {wh.capacity.toLocaleString("id-ID")}{" "}
                              <span className="text-[10px] text-slate-400 font-normal">m³</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate max-w-xs">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{wh.address || "—"}</span>
                          </div>
                          {(wh.pic_name || wh.pic_employee?.full_name) && (
                            <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                              <User size={12} className="shrink-0" />
                              <span>PIC: {wh.pic_name || wh.pic_employee?.full_name}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              wh.is_active
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {wh.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            title="Edit Warehouse"
                            onClick={() => openEdit(wh)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300 transition-colors cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Input Warehouse ── */}
      {isModalOpen && (
        <ProcurementFormModal
          title={editing ? "Edit Warehouse" : "Tambah Warehouse Baru"}
          subtitle={
            editing
              ? `Perbarui informasi data gudang ${editing.warehouse_code}`
              : "Isi data gudang dan PIC operasional untuk kebutuhan inventaris"
          }
          icon={Building2}
          onClose={() => setIsModalOpen(false)}
          maxWidth="max-w-[620px]"
          hideFooter
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* ── Section 1: Informasi Dasar ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Informasi Dasar
                </h4>
              </div>

              {editing && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Warehouse
                  </label>
                  <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-700">
                    {editing.warehouse_code}
                  </div>
                </div>
              )}

              {/* Nama Warehouse (Required) */}
              <div>
                <label htmlFor="wh-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Warehouse <span className="text-red-500">*</span>
                </label>
                <input
                  id="wh-name"
                  type="text"
                  placeholder="mis. Gudang Utama MSDC Surabaya"
                  className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                    validationErrors.warehouse_name
                      ? "border border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  }`}
                  value={form.warehouse_name}
                  onChange={(e) => {
                    setForm({ ...form, warehouse_name: e.target.value });
                    if (validationErrors.warehouse_name) {
                      setValidationErrors({ ...validationErrors, warehouse_name: undefined });
                    }
                  }}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Kode akan digenerate otomatis oleh sistem
                </p>
                {validationErrors.warehouse_name && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.warehouse_name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Tipe Gudang (Required) */}
                <div>
                  <label htmlFor="wh-type" className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipe Gudang <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="wh-type"
                    disabled={form.is_main}
                    className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none transition-all cursor-pointer disabled:opacity-60 ${
                      validationErrors.warehouse_type
                        ? "border border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    }`}
                    value={form.is_main ? "Gudang Utama" : form.warehouse_type}
                    onChange={(e) => {
                      setForm({ ...form, warehouse_type: e.target.value });
                      if (validationErrors.warehouse_type) {
                        setValidationErrors({ ...validationErrors, warehouse_type: undefined });
                      }
                    }}
                  >
                    <option value="">-- Pilih Tipe Gudang --</option>
                    {WAREHOUSE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {validationErrors.warehouse_type && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.warehouse_type}</p>
                  )}
                </div>

                {/* Kapasitas (m3) (Required) */}
                <div>
                  <label htmlFor="wh-capacity" className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapasitas Gudang (m³) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="wh-capacity"
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="mis. 500"
                    className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                      validationErrors.capacity
                        ? "border border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    }`}
                    value={form.capacity}
                    onChange={(e) => {
                      setForm({ ...form, capacity: e.target.value });
                      if (validationErrors.capacity) {
                        setValidationErrors({ ...validationErrors, capacity: undefined });
                      }
                    }}
                  />
                  {validationErrors.capacity && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.capacity}</p>
                  )}
                </div>
              </div>

              {/* Flag Gudang Utama & Site Cabang */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl">
                <label className="flex items-center gap-2 text-xs font-semibold text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    checked={form.is_main}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm({
                        ...form,
                        is_main: checked,
                        warehouse_type: checked ? "Gudang Utama" : form.warehouse_type,
                      });
                    }}
                  />
                  <span>Gudang Utama / Default Perusahaan</span>
                </label>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Site / Cabang Induk
                  </label>
                  <select
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                    value={form.site_branch}
                    onChange={(e) => setForm({ ...form, site_branch: e.target.value })}
                  >
                    <option value="Surabaya (Kantor Pusat)">Surabaya (Kantor Pusat & Studio)</option>
                    <option value="Jakarta (Biro Perwakilan)">Jakarta (Biro Perwakilan & Studio)</option>
                    <option value="Malang (Transmitter)">Malang (Stasiun Pemancar)</option>
                    <option value="Kediri (Transmitter)">Kediri (Stasiun Pemancar)</option>
                    <option value="Madiun (Transmitter)">Madiun (Stasiun Pemancar)</option>
                  </select>
                </div>
              </div>

              {/* Keterangan (Optional) */}
              <div>
                <label htmlFor="wh-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan
                </label>
                <textarea
                  id="wh-notes"
                  rows={2}
                  placeholder="Keterangan tambahan gudang..."
                  className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            {/* ── Section 2: Kontak & Lokasi ── */}
            <div className="flex flex-col gap-3 mt-1">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kontak & Lokasi
                </h4>
              </div>

              {/* Alamat (Required) */}
              <div>
                <label htmlFor="wh-address" className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="wh-address"
                  rows={2}
                  placeholder="Alamat lengkap lokasi gudang..."
                  className={`w-full px-3.5 py-2.5 bg-slate-50/50 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all resize-none ${
                    validationErrors.address
                      ? "border border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  }`}
                  value={form.address}
                  onChange={(e) => {
                    setForm({ ...form, address: e.target.value });
                    if (validationErrors.address) {
                      setValidationErrors({ ...validationErrors, address: undefined });
                    }
                  }}
                />
                {validationErrors.address && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* No. Telepon (Optional) */}
                <div>
                  <label htmlFor="wh-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Telepon
                  </label>
                  <input
                    id="wh-phone"
                    type="text"
                    placeholder="mis. (031) 555-0123 / 08123456789"
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                {/* PIC / Penanggung Jawab (Optional) */}
                <div>
                  <label htmlFor="wh-pic" className="block text-xs font-semibold text-slate-700 mb-1">
                    PIC / Penanggung Jawab
                  </label>
                  <select
                    id="wh-pic"
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
                    value={form.pic_employee_id}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const emp = employees.find((item) => String(item.id) === selectedId);
                      setForm({
                        ...form,
                        pic_employee_id: selectedId,
                        pic_name: emp ? emp.full_name : "",
                      });
                    }}
                  >
                    <option value="">-- Pilih PIC (Opsional) --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} {emp.employee_number ? `(${emp.employee_number})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editing && (
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  Status Warehouse Aktif
                </label>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ── Action Buttons Footer ── */}
            <div className="flex items-center justify-end gap-3 pt-3 mt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Simpan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </ProcurementFormModal>
      )}
    </div>
  );
}
