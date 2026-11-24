import { useState } from "react";
import { Search, Plus, Pencil, Target, X, Crown } from "lucide-react";
import { usePositions, useCreatePosition, useUpdatePosition, useKpiMetrics } from "../api/usePositions";
import { useSiteList } from "@modules/data-center-ops/api/useSites";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/api-client";
import { extractErrorMessage } from "@shared/types/api";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { EmployeePicker, type EmployeePickerResult } from "../components/EmployeePicker";
import type { Position, PositionLevel, PositionValues, WorkLocation } from "../api/positionApi";

const LEVEL_LABELS: Record<PositionLevel, string> = {
  staff: "Staff", supervisor: "Supervisor", manager: "Manager", senior_manager: "Sr. Manager",
};
const LEVEL_COLORS: Record<PositionLevel, string> = {
  staff: "#60a5fa", supervisor: "#fbbf24", manager: "#f87171", senior_manager: "#e879f9",
};
const WORK_LOCATION_LABELS: Record<WorkLocation, string> = {
  office: "Kantor", field: "Lapangan",
};

export function PositionListPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editPosition, setEditPosition] = useState<Position | null>(null);

  const { data: positions, isLoading } = usePositions();

  const allPositions = positions ?? [];
  const filtered = allPositions.filter((p) =>
    !search || p.position_title?.toLowerCase().includes(search.toLowerCase()) || p.position_code?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPositions = allPositions.length;
  const managerialCount = allPositions.filter(p => p.level === "manager" || p.level === "senior_manager").length;
  const staffSpvCount = allPositions.filter(p => p.level === "staff" || p.level === "supervisor").length;
  const fieldCount = allPositions.filter(p => p.work_location === "field").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Position / Jabatan"
        subtitle="Master posisi dan tingkatan organisasi untuk penugasan pegawai, alur approval, dan operasional Data Center."
      />

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Structure Info Banner */}
        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
            <Crown size={18} />
          </div>
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Hierarki & Approver:</strong> Setiap posisi jabatan memiliki Kepala (Head) yang bertindak sebagai approver hierarkis saat pegawai mengajukan izin atau cuti di <span className="font-semibold text-slate-800">My Approvals</span>. Posisi lapangan (Field) otomatis terhubung ke site Data Center.
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Jabatan</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700">
                <Search size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalPositions}</span>
              <p className="text-xs text-slate-500 mt-1">Jabatan terdaftar di sistem</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Manajerial</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
                <Crown size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{managerialCount}</span>
              <p className="text-xs text-purple-600 font-medium mt-1">Manager &amp; Senior Manager</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Staff &amp; SPV</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <Pencil size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{staffSpvCount}</span>
              <p className="text-xs text-blue-600 font-medium mt-1">Posisi operasional harian</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Posisi Lapangan</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-[#F2A602]">
                <Target size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{fieldCount}</span>
              <p className="text-xs text-slate-500 mt-1">Site Data Center Ops</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2140]/10 focus:border-[#0A2140] transition-all"
                placeholder="Cari nama jabatan atau kode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#f4ae3e] hover:bg-[#07162c] rounded-xl transition-all shadow-sm"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={15} /> Posisi Baru
            </button>
          </div>

          {isLoading && <LoadingState />}
          {!isLoading && filtered.length === 0 && (
            <div className="py-8">
              <EmptyState title="Belum Ada Posisi" subtitle="Tambahkan posisi/jabatan baru ke master data." />
            </div>
          )}
          {!isLoading && filtered.length > 0 && (
            <div className="flex flex-col gap-3">
              {filtered.map((pos) => (
                <PositionRow key={pos.id} position={pos} onEdit={() => setEditPosition(pos)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && <PositionFormModal onClose={() => setShowCreate(false)} />}
      {editPosition && <PositionFormModal position={editPosition} onClose={() => setEditPosition(null)} />}
    </div>
  );
}

function PositionRow({ position, onEdit }: { position: Position; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { data: members, isLoading } = useQuery({
    queryKey: ["positionMembers", position.id] as const,
    queryFn: () =>
      apiClient.get<{ data: { id: number; full_name: string }[] }>("v1/hr-service-support/employees", {
        params: { position_id: position.id, per_page: 50 },
      }).then((r) => r.data?.data ?? []),
    enabled: expanded,
  });

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "0.5rem",
      padding: "0.85rem 1.1rem", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }} onClick={() => setExpanded(s => !s)}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: "#fef3c7",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#d97706", fontWeight: 800, fontSize: "0.875rem", flexShrink: 0,
        }}>
          {position.position_code?.substring(0, 2) ?? "??"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>{position.position_title}</div>
          <div style={{ fontSize: "0.78rem", color: "#64748b", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", color: "#64748b" }}>{position.position_code}</span>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1", display: "inline-block" }} />
            <span style={{ color: LEVEL_COLORS[position.level] ?? "#64748b", fontWeight: 600 }}>
              {LEVEL_LABELS[position.level] ?? position.level}
            </span>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1", display: "inline-block" }} />
            <span style={{ color: position.work_location === "field" ? "#ea580c" : "#64748b", fontWeight: 600 }}>
              {position.work_location === "field" ? "🏗️" : "🏢"} {WORK_LOCATION_LABELS[position.work_location] ?? position.work_location}
            </span>
            {position.site && (
              <>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1", display: "inline-block" }} />
                <span style={{ color: "#16a34a", fontWeight: 600 }}>🏢 {position.site.site_name}</span>
              </>
            )}
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1", display: "inline-block" }} />
            <span style={{ color: (position.employees_count ?? 0) > 0 ? "#2563eb" : "#64748b", fontWeight: 600 }}>
              {position.employees_count ?? 0} employee
            </span>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1", display: "inline-block" }} />
            {position.head ? (
              <span style={{ color: "#d97706", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }} title="Kepala - approver Ijin untuk posisi ini">
                <Crown size={11} /> {position.head.full_name}
              </span>
            ) : (
              <span style={{ color: "#dc2626", fontWeight: 600 }} title="Belum ada Kepala - employee di posisi ini tidak bisa mengajukan Ijin">
                ⚠ Belum ada Kepala
              </span>
            )}
          </div>
          {position.kpi_targets && position.kpi_targets.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {position.kpi_targets.map(t => (
                <span key={t.metric_key} title={t.metric_label}
                  style={{ fontSize: "0.7rem", padding: "0.1rem 0.5rem", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                  <Target size={10} /> {t.metric_label ?? t.metric_key}: {t.target_value}
                </span>
              ))}
            </div>
          )}
        </div>
        <button className="btn btn-secondary" style={{ padding: "0.35rem 0.6rem" }}
          onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          <Pencil size={13} />
        </button>
      </div>
      {expanded && (
        <div style={{ width: "100%" }}>
          {isLoading ? (
            <div style={{ fontSize: "0.8rem", color: "#64748b", padding: "0.5rem" }}>Memuat anggota...</div>
          ) : !members || members.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "#64748b", padding: "0.5rem" }}>Belum ada employee di posisi ini.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0.5rem 0" }}>
              {members.map((emp) => (
                <span key={emp.id} style={{
                  fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: 20,
                  background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontWeight: 600,
                }}>
                  {emp.full_name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Create/Edit Position Modal ──────────────────────────────────────────────
function PositionFormModal({ position, onClose }: { position?: Position; onClose: () => void }) {
  const isEdit = !!position;
  const [title, setTitle] = useState(position?.position_title ?? "");
  const [level, setLevel] = useState<PositionLevel>(position?.level ?? "staff");
  const [workLocation, setWorkLocation] = useState<WorkLocation>(position?.work_location ?? "office");
  const [siteId, setSiteId] = useState(position?.site_id ? String(position.site_id) : "");
  const [head, setHead] = useState<EmployeePickerResult | null>(position?.head ? { id: position.head.id, full_name: position.head.full_name } : null);
  const [pickingHead, setPickingHead] = useState(false);
  const [kpiTargets, setKpiTargets] = useState<{ metric_key: string; target_value: string }[]>(
    (position?.kpi_targets ?? []).map(t => ({ metric_key: t.metric_key, target_value: String(t.target_value) }))
  );
  const [error, setError] = useState<string | null>(null);

  const { data: sitesPage, isLoading: sitesLoading } = useSiteList({ per_page: 100 });
  const createPosition = useCreatePosition();
  const updatePosition = useUpdatePosition();
  const pending = createPosition.isPending || updatePosition.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Nama posisi wajib diisi."); return; }
    if (kpiTargets.some(t => !t.target_value || Number(t.target_value) <= 0)) {
      setError("Semua metrik KPI yang dipilih wajib diisi target angkanya (lebih dari 0).");
      return;
    }
    setError(null);

    const values: PositionValues = {
      position_title: title.trim(), level,
      work_location: workLocation,
      site_id: siteId ? parseInt(siteId) : undefined,
      head_employee_id: head ? head.id : null,
      kpi_targets: kpiTargets.map(t => ({ metric_key: t.metric_key, target_value: Number(t.target_value) })),
    };

    if (isEdit) {
      updatePosition.mutate({ id: position.id, values }, { onSuccess: onClose, onError: (e) => setError(extractErrorMessage(e)) });
    } else {
      createPosition.mutate(values, { onSuccess: onClose, onError: (e) => setError(extractErrorMessage(e)) });
    }
  }

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(15,23,42,0.60)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16,
        width: "100%", maxWidth: 440, maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.04)",
      }}>
        <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a", padding: "1.5rem 1.5rem 0", flexShrink: 0 }}>
          {isEdit ? "Edit Posisi / Jabatan" : "Posisi / Jabatan Baru"}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div className="modal-scroll-hidden" style={{ display: "flex", flexDirection: "column", gap: "0.875rem", padding: "1.25rem 1.5rem", flex: 1, minHeight: 0 }}>
          {isEdit && (
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#475569" }}>Kode Posisi</label>
              <div style={{ padding: "0.5rem 0.7rem", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, fontFamily: "monospace", fontWeight: 700, color: "#475569" }}>
                {position?.position_code}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 4 }}>
                Auto-generated saat dibuat (Master Data &gt; Number Sequence) - tidak bisa diubah.
              </div>
            </div>
          )}
          {!isEdit && (
            <div style={{ fontSize: "0.72rem", color: "#64748b", padding: "0.4rem 0.6rem", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1" }}>
              Kode posisi akan dibuat otomatis (Master Data &gt; Number Sequence).
            </div>
          )}
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#475569" }}>Nama Posisi *</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: NOC Engineer, Manager IT" style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#475569" }}>Level</label>
            <select className="input" value={level} onChange={e => setLevel(e.target.value as PositionLevel)} style={{ width: "100%" }}>
              {Object.entries(LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#475569" }}>
              Lokasi Kerja
            </label>
            <select className="input" value={workLocation} onChange={e => setWorkLocation(e.target.value as WorkLocation)} style={{ width: "100%" }}>
              <option value="office">Kantor</option>
              <option value="field">Lapangan (Data Center)</option>
            </select>
            <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 4 }}>
              Posisi "Lapangan" akan muncul di papan Jadwal Shift saat staf HR memilih site DC tertentu — supaya employee-nya bisa dijadwalkan/dirotasi antar site.
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#475569" }}>
              Site Data Center Operations (Default)
            </label>
            <select className="input" value={siteId} onChange={e => setSiteId(e.target.value)} disabled={sitesLoading} style={{ width: "100%" }}>
              <option value="">— Tidak spesifik / rotasi antar site —</option>
              {(sitesPage?.data ?? []).map(s => (
                <option key={s.id} value={s.id}>{s.site_name} ({s.site_code})</option>
              ))}
            </select>
            <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 4 }}>
              Kalau diisi, dashboard Data Center Operations bisa tahu posisi ini biasanya bertugas di site mana. Kosongkan kalau posisi lapangan ini memang rotasi antar site.
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#475569" }}>
              <Crown size={13} style={{ verticalAlign: -2 }} /> Kepala Posisi
            </label>
            {!head || pickingHead ? (
              <EmployeePicker
                onSelect={(emp) => { setHead(emp); setPickingHead(false); }}
                onCancel={() => setPickingHead(false)}
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.7rem", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8 }}>
                <div style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{head.full_name}</div>
                <button type="button" className="btn btn-secondary" style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem" }} onClick={() => setPickingHead(true)}>
                  Ganti
                </button>
                <button type="button" onClick={() => setHead(null)}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4, display: "flex" }}>
                  <X size={13} />
                </button>
              </div>
            )}
            <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 4 }}>
              Approver Ijin (cuti/sakit/koreksi absensi, dll) untuk semua employee di posisi ini - muncul di "My Approvals" Kepala. Kepala wajib punya akun User yang tertaut.
            </div>
          </div>

          <KpiTargetPicker targets={kpiTargets} onChange={setKpiTargets} />
          </div>

          <div style={{ flexShrink: 0, padding: "0.875rem 1.5rem 1.5rem", borderTop: "1px solid #e2e8f0" }}>
            {error && <div style={{ color: "#ef4444", fontSize: "0.8rem", marginBottom: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
              <button type="submit" className="btn" style={{ background: "#F2A602", border: "none", color: "#ffffff", fontWeight: 700, borderRadius: 8, padding: "0.55rem 1.1rem" }} disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── KPI Target Picker (pilih >1 metrik dari katalog + isi target angkanya) ─
function KpiTargetPicker({ targets, onChange }: {
  targets: { metric_key: string; target_value: string }[];
  onChange: (next: { metric_key: string; target_value: string }[]) => void;
}) {
  const { data: metrics, isLoading } = useKpiMetrics();
  const selectedKeys = new Set(targets.map(t => t.metric_key));
  const available = (metrics ?? []).filter(m => !selectedKeys.has(m.key));
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null);

  const byModule = new Map<string, typeof available>();
  for (const m of available) {
    if (!byModule.has(m.module)) byModule.set(m.module, []);
    byModule.get(m.module)!.push(m);
  }

  function addMetric(key: string) {
    if (!key) return;
    onChange([...targets, { metric_key: key, target_value: "" }]);
    setJustAddedKey(key);
  }
  function removeMetric(key: string) {
    onChange(targets.filter(t => t.metric_key !== key));
  }
  function setTargetValue(key: string, value: string) {
    onChange(targets.map(t => (t.metric_key === key ? { ...t, target_value: value } : t)));
  }

  return (
    <div>
      <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#475569" }}>
        <Target size={13} style={{ verticalAlign: -2 }} /> Target KPI Posisi (per bulan)
      </label>
      <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: 8 }}>
        Pilih metrik yang bisa dihitung otomatis dari sistem — bisa lebih dari 1 (mis. Lead, Opportunity, Quotation sekaligus). Angka aktualnya dibandingkan otomatis di Performance Review.
      </div>

      {targets.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {targets.map(t => {
            const meta = metrics?.find(m => m.key === t.metric_key);
            return (
              <div key={t.metric_key} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "0.4rem 0.6rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {meta?.label ?? t.metric_key}
                  </div>
                  {meta && <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{meta.module}</div>}
                </div>
                <input className="input" type="number" min={0} placeholder="Target" value={t.target_value}
                  ref={el => { if (el && t.metric_key === justAddedKey) { el.focus(); setJustAddedKey(null); } }}
                  onChange={e => setTargetValue(t.metric_key, e.target.value)}
                  style={{
                    width: 90, fontSize: "0.82rem",
                    borderColor: !t.target_value ? "#f59e0b" : undefined,
                  }} />
                <button type="button" onClick={() => removeMetric(t.metric_key)}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4, flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <select className="input" value="" disabled={isLoading} onChange={e => addMetric(e.target.value)} style={{ width: "100%" }}>
        <option value="">{isLoading ? "Memuat katalog metrik..." : "+ Tambah metrik KPI..."}</option>
        {Array.from(byModule.entries()).map(([module, items]) => (
          <optgroup key={module} label={module}>
            {items.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
