import { PageHeader } from "@shared/components/PageHeader";
import { useState } from "react";
// SESUDAH
import { Plus, Search } from "lucide-react";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Modal } from "@shared/components/Modal";
import { useAuth } from "@shared/lib/auth-context";
import { extractErrorMessage } from "@shared/types/api";
import { useFacilityList, useCreateFacility, useUpdateFacility, useDeleteFacility } from "../api/useFacilities";
import { FACILITY_TYPE_LABELS } from "../types/facility";
import type { GaFacility, FacilityType, FacilityStatus } from "../types/facility";

export function GaFacilityListPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("facility.manage");
  const { data: facilities, isLoading } = useFacilityList();
  const [editing, setEditing] = useState<GaFacility | "new" | null>(null);
  const deleteFacility = useDeleteFacility();

  // Backend menolak (422) kalau fasilitas ini masih dipakai di Peminjaman
  // Fasilitas atau Izin Gedung manapun (lihat GaFacilityController::destroy())
  // - pesannya ditampilkan apa adanya lewat alert, sama pola dengan
  // ProductListPage.tsx (CRM Sales) buat hapus kategori produk.
  function handleDelete(facility: GaFacility) {
    if (!confirm(`Hapus fasilitas "${facility.name}"?`)) return;
    deleteFacility.mutate(facility.id, {
      onError: e => alert(extractErrorMessage(e)),
    });
  }

  // SESUDAH
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FacilityType | "">("");
  const [statusFilter, setStatusFilter] = useState<FacilityStatus | "">("");

  const filteredFacilities = (facilities ?? []).filter(f => {
    if (typeFilter && f.type !== typeFilter) return false;
    if (statusFilter && f.status !== statusFilter) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalCount = facilities?.length ?? 0;
  const activeCount = (facilities ?? []).filter(f => f.status === "active").length;
  const maintenanceCount = (facilities ?? []).filter(f => f.status === "maintenance").length;
  const inactiveCount = (facilities ?? []).filter(f => f.status === "inactive").length;

  function resetFilters() {
    setSearch(""); setTypeFilter(""); setStatusFilter("");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Gedung &amp; Fasilitas"
        subtitle="Master data ruang meeting, aula serbaguna, dan peralatan inventaris operasional kantor."
      >
        {canManage && (
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm"
            onClick={() => setEditing("new")}
          >
            <Plus size={15} /> Fasilitas Baru
          </button>
        )}
      </PageHeader>

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Info Banner */}
        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
            <Plus size={18} />
          </div>
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">General Affairs &amp; Sarana:</strong> Master data fasilitas ini digunakan untuk reservasi otomatis di menu <span className="font-semibold text-slate-800">Peminjaman Fasilitas</span>. Sistem secara otomatis mendeteksi jadwal bentrok saat ada permohonan baru.
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Fasilitas</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700">
                <Search size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalCount}</span>
              <p className="text-xs text-slate-500 mt-1">Aset fasilitas terdaftar</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tersedia</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <Plus size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{activeCount}</span>
              <p className="text-xs text-emerald-600 font-medium mt-1">Siap dipinjam</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Maintenance</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <Search size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{maintenanceCount}</span>
              <p className="text-xs text-amber-600 font-medium mt-1">Sedang perbaikan/servis</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nonaktif</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
                <Search size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{inactiveCount}</span>
              <p className="text-xs text-rose-600 font-medium mt-1">Tidak dapat digunakan</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2140]/10 focus:border-[#0A2140] transition-all"
                placeholder="Cari nama atau kode fasilitas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:border-[#0A2140]"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as FacilityType | "")}
              >
                <option value="">Semua Kategori</option>
                {Object.entries(FACILITY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select
                className="px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:border-[#0A2140]"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as FacilityStatus | "")}
              >
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Nonaktif</option>
              </select>
              {(search || typeFilter || statusFilter) && (
                <button
                  className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                  onClick={resetFilters}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {isLoading && <LoadingState />}
          {facilities && facilities.length === 0 && (
            <div className="p-8">
              <EmptyState title="Belum Ada Fasilitas" subtitle='Klik "Fasilitas Baru" untuk mendaftarkan ruang/peralatan pertama.' />
            </div>
          )}
          {filteredFacilities.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80">
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-12 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-[#0A2140] focus:ring-0 cursor-pointer" />
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fasilitas / Aset</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lokasi Gedung</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kapasitas</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map(f => {
                    const statusMeta: Record<string, { bg: string; text: string; dot: string; label: string }> = {
                      active: { bg: "bg-emerald-50 border-emerald-200/60", text: "text-emerald-700", dot: "bg-emerald-500", label: "Aktif" },
                      maintenance: { bg: "bg-amber-50 border-amber-200/60", text: "text-amber-700", dot: "bg-amber-500", label: "Maintenance" },
                      inactive: { bg: "bg-rose-50 border-rose-200/60", text: "text-rose-700", dot: "bg-rose-500", label: "Nonaktif" },
                    };
                    const sm = statusMeta[f.status] ?? statusMeta.inactive;

                    return (
                      <tr key={f.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                        <td className="px-5 py-3.5 text-center">
                          <input type="checkbox" className="rounded border-slate-300 text-[#0A2140] focus:ring-0 cursor-pointer" />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-sm text-slate-900">{f.name}</div>
                          <div className="font-mono text-xs text-slate-400 mt-0.5">{f.code}</div>
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
                            {FACILITY_TYPE_LABELS[f.type as FacilityType] ?? f.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-700">{f.location || "—"}</td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">
                          {f.capacity ? `${f.capacity} orang` : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${sm.bg} ${sm.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                            {sm.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {canManage && (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                onClick={() => setEditing(f)}
                              >
                                Edit
                              </button>
                              <button
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                onClick={() => handleDelete(f)}
                                title="Hapus fasilitas"
                              >
                                <Plus size={14} className="rotate-45" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editing && <FacilityFormModal facility={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function FacilityFormModal({ facility, onClose }: { facility: GaFacility | null; onClose: () => void }) {
  const create = useCreateFacility();
  const update = useUpdateFacility();
  const [name, setName] = useState(facility?.name ?? "");
  const [type, setType] = useState<FacilityType>(facility?.type ?? "meeting_room");
  const [location, setLocation] = useState(facility?.location ?? "");
  const [capacity, setCapacity] = useState(facility?.capacity?.toString() ?? "");
  const [status, setStatus] = useState<FacilityStatus>(facility?.status ?? "active");
  const [error, setError] = useState<string | null>(null);

  const saving = create.isPending || update.isPending;

  function handleSubmit() {
    if (!name.trim()) { setError("Nama fasilitas wajib diisi."); return; }
    setError(null);

    const values = {
      name: name.trim(), type,
      location: location || undefined,
      capacity: capacity ? Number(capacity) : undefined,
      status,
    };

    const mutation = facility ? update.mutateAsync({ id: facility.id, values }) : create.mutateAsync(values);
    mutation.then(onClose).catch(e => setError(extractErrorMessage(e)));
  }

  return (
    <Modal title={facility ? "Edit Fasilitas" : "Fasilitas Baru"} onClose={onClose} maxWidth={480}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label className="input-label">Tipe</label>
          <select className="input" style={{ width: "100%" }} value={type} onChange={e => setType(e.target.value as FacilityType)}>
            {Object.entries(FACILITY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">Kode</label>
          {facility ? (
            <div style={{ padding: "0.5rem 0.7rem", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "monospace", fontWeight: 700 }}>
              {facility.code}
            </div>
          ) : (
            <div style={{ padding: "0.5rem 0.7rem", fontSize: "0.72rem", color: "var(--grey)", fontStyle: "italic" }}>
              Otomatis (Number Sequence)
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Nama Fasilitas</label>
        <input className="input" style={{ width: "100%" }} value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label className="input-label">Lokasi</label>
          <input className="input" style={{ width: "100%" }} value={location} onChange={e => setLocation(e.target.value)} placeholder="mis. Lantai 2" />
        </div>
        <div>
          <label className="input-label">Kapasitas (opsional)</label>
          <input className="input" type="number" min={0} style={{ width: "100%" }} value={capacity} onChange={e => setCapacity(e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Status</label>
        <select className="input" style={{ width: "100%" }} value={status} onChange={e => setStatus(e.target.value as FacilityStatus)}>
          <option value="active">Aktif</option>
          <option value="maintenance">Maintenance</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn btn-primary" disabled={saving} onClick={handleSubmit}>
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </Modal>
  );
}
