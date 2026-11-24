import { useState } from "react";
import { Search, Plus, UserCheck, FileText } from "lucide-react";
import { useIncidentList, useIncident, useUpdateIncidentStatus, useAssignIncident, useCreateIncident, useIncidentWorklogs, useAddWorklog } from "../api/useIncidents";
import { EmployeePicker } from "../components/EmployeePicker";
import { CreateKbArticleModal } from "../components/CreateKbArticleModal";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";
import { formatDate } from "@shared/lib/format";
import type { Incident, IncidentStatus, IncidentWorklog } from "../types/itil";

const STATUS_LABELS: Record<IncidentStatus, string> = {
  new: "Baru", assigned: "Ditugaskan", in_progress: "Sedang Dikerjakan",
  resolved: "Selesai", closed: "Ditutup",
};
const LOG_TYPE_STYLE: Record<string, { bg: string; border: string }> = {
  progress_note: { bg: "#eff6ff", border: "#bfdbfe" },
  root_cause: { bg: "#fdf4ff", border: "#e9d5ff" },
  workaround: { bg: "#fff7ed", border: "#fed7aa" },
  resolution: { bg: "#dcfce7", border: "#bbf7d0" },
  internal_note: { bg: "#f3f4f6", border: "#d1d5db" },
  customer_update: { bg: "#ecfdf5", border: "#a7f3d0" },
};
const LOG_TYPE_LABELS: Record<string, string> = {
  progress_note: "📋 Progress", root_cause: "🔍 Root Cause", workaround: "⚠️ Workaround",
  resolution: "✅ Resolusi", internal_note: "📝 Internal", customer_update: "📢 Customer Update",
};

type DrawerTab = "details" | "worklog";

export function IncidentListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "">("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("details");

  const { data, isLoading } = useIncidentList({
    page, per_page: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const incidents = data?.data ?? [];
  const totalCount = data?.total ?? 0;
  const activeCount = incidents.filter(r => r.status === "new" || r.status === "assigned" || r.status === "in_progress").length;
  const resolvedCount = incidents.filter(r => r.status === "resolved" || r.status === "closed").length;
  const criticalCount = incidents.filter(r => r.priority === "critical" || r.priority === "high").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Incident Management"
        subtitle="ITIL Incident Management — pencatatan gangguan, eskalasi SLA, worklog perbaikan, dan penugasan PIC."
      />

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Workflow Info Banner */}
        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
            <FileText size={18} />
          </div>
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Alur ITIL Incident:</strong> 1. Tiket Baru (New) dicatat ➔ 2. Assign ke Engineer / PIC terkait ➔ 3. Update catatan teknis di tab <span className="font-semibold text-slate-800">Worklog</span> (Root Cause, Workaround) ➔ 4. Ubah status jadi <span className="font-semibold text-slate-800">Resolved</span> setelah normalisasi layanan ➔ 5. Buat artikel solusi ke <span className="font-semibold text-slate-800">Knowledge Base</span>.
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Incident</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700">
                <FileText size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalCount}</span>
              <p className="text-xs text-slate-500 mt-1">Insiden tercatat di sistem</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sedang Ditangani</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <UserCheck size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{activeCount}</span>
              <p className="text-xs text-blue-600 font-medium mt-1">Status New / In Progress</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Terselesaikan</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <FileText size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{resolvedCount}</span>
              <p className="text-xs text-emerald-600 font-medium mt-1">Resolved &amp; Closed</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prioritas Tinggi</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
                <Plus size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{criticalCount}</span>
              <p className="text-xs text-rose-600 font-medium mt-1">High &amp; Critical SLA</p>
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2140]/10 focus:border-[#0A2140] transition-all"
                placeholder="Cari nomor incident atau judul..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:border-[#0A2140]"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value as IncidentStatus | ""); setPage(1); }}
              >
                <option value="">Semua Status</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#f4ae3e] hover:bg-[#f7a41f] rounded-xl transition-all shadow-sm"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={15} /> Incident Baru
              </button>
            </div>
          </div>

          {isLoading && <LoadingState />}
          {data && data.data.length === 0 && (
            <div className="p-8">
              <EmptyState title="Belum Ada Incident" subtitle="Tidak ada data incident yang cocok." />
            </div>
          )}
          {data && data.data.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80">
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">No. Incident</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Judul Insiden</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Prioritas</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">PIC Terkait</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Waktu Dibuat</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map(inc => (
                      <IncidentRow key={inc.id} incident={inc} onView={() => { setSelectedIncidentId(inc.id); setDrawerTab("details"); }} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
                <span className="text-xs text-slate-500">
                  Menampilkan halaman <strong className="text-slate-700">{data.current_page}</strong> dari <strong className="text-slate-700">{data.last_page}</strong> (total {data.total} insiden)
                </span>
                <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      {showCreateModal && <CreateIncidentModal onClose={() => setShowCreateModal(false)} />}
      {selectedIncidentId && (
        <IncidentDetailDrawer
          incidentId={selectedIncidentId}
          tab={drawerTab}
          onTabChange={setDrawerTab}
          onClose={() => setSelectedIncidentId(null)}
        />
      )}
    </div>
  );
}

function IncidentRow({ incident, onView }: { incident: Incident; onView: () => void }) {
  const statusMutation = useUpdateIncidentStatus(incident.id);

  const priorityColors: Record<string, { bg: string; text: string; dot: string }> = {
    low: { bg: "bg-slate-100 border-slate-200", text: "text-slate-700", dot: "bg-slate-400" },
    medium: { bg: "bg-amber-50 border-amber-200/60", text: "text-amber-700", dot: "bg-amber-500" },
    high: { bg: "bg-orange-50 border-orange-200/60", text: "text-orange-700", dot: "bg-orange-500" },
    critical: { bg: "bg-rose-50 border-rose-200/60", text: "text-rose-700", dot: "bg-rose-500" },
  };
  const prio = priorityColors[incident.priority] ?? priorityColors.low;

  return (
    <tr className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-900 cursor-pointer hover:text-[#0A2140]" onClick={onView}>
        {incident.incident_number}
      </td>
      <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 max-w-[280px]">
        <button onClick={onView} className="text-left hover:text-[#0A2140] transition-colors truncate block w-full">
          {incident.title}
        </button>
      </td>
      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${prio.bg} ${prio.text} uppercase`}>
          <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
          {incident.priority}
        </span>
      </td>
      <td className="px-5 py-3.5">
        {incident.status === "closed" ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {STATUS_LABELS[incident.status]}
          </span>
        ) : (
          <select
            className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer outline-none focus:bg-white"
            value={incident.status}
            disabled={statusMutation.isPending}
            onChange={(e) => statusMutation.mutate(e.target.value)}
          >
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}
      </td>
      <td className="px-5 py-3.5 text-xs text-slate-700">
        {incident.assignee ? (
          <span className="font-medium text-slate-900">{incident.assignee.full_name}</span>
        ) : (
          <span className="text-slate-400 italic">Belum ditugaskan</span>
        )}
      </td>
      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{formatDate(incident.created_at)}</td>
      <td className="px-5 py-3.5 text-right">
        <button
          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          onClick={onView}
        >
          Detail
        </button>
      </td>
    </tr>
  );
}

function CreateIncidentModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [impact, setImpact] = useState("low");
  const [urgency, setUrgency] = useState("low");
  const [error, setError] = useState<string | null>(null);
  const createIncident = useCreateIncident();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Judul wajib diisi."); return; }
    setError(null);
    createIncident.mutate(
      { title: title.trim(), description: description || undefined, category: category || undefined, priority, impact, urgency } as Partial<Incident>,
      { onSuccess: onClose, onError: (e: Error) => setError(extractErrorMessage(e)) }
    );
  }

  return (
    <Modal title="Incident Baru" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label">Judul *</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%" }} placeholder="Ringkasan singkat masalah" />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label">Deskripsi</label>
          <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} style={{ width: "100%", minHeight: 80 }} placeholder="Detail masalah..." />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label">Kategori</label>
          <input className="input" value={category} onChange={e => setCategory(e.target.value)} style={{ width: "100%" }} placeholder="mis. network, power, application" />
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label className="input-label">Priority</label>
            <select className="input" value={priority} onChange={e => setPriority(e.target.value)} style={{ width: "100%" }}>
              <option value="low">Low</option><option value="medium">Medium</option>
              <option value="high">High</option><option value="critical">Critical</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="input-label">Impact</label>
            <select className="input" value={impact} onChange={e => setImpact(e.target.value)} style={{ width: "100%" }}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="input-label">Urgency</label>
            <select className="input" value={urgency} onChange={e => setUrgency(e.target.value)} style={{ width: "100%" }}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </div>
        </div>
        {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}
        <Button type="submit" disabled={createIncident.isPending} style={{ width: "100%" }}>
          {createIncident.isPending ? "Menyimpan..." : "Buat Incident"}
        </Button>
      </form>
    </Modal>
  );
}

// ─── Detail Drawer ──────────────────────────────────────────────────────────────
// Ambil data segar lewat useIncident(incidentId), bukan snapshot lama dari
// baris tabel - supaya assign/ubah status langsung ke-refresh di drawer.
function IncidentDetailDrawer({ incidentId, tab, onTabChange, onClose }: {
  incidentId: number; tab: DrawerTab; onTabChange: (t: DrawerTab) => void; onClose: () => void;
}) {
  const { data: incident, isLoading } = useIncident(incidentId);

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 560,
      background: "var(--surface)", borderLeft: "1px solid var(--border)",
      boxShadow: "-4px 0 20px rgba(0,0,0,0.3)", zIndex: 100,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{incident?.incident_number ?? "…"}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--grey)", maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {incident?.title}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={onClose} style={{ padding: "0.3rem 0.6rem" }}>✕</button>
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border)" }}>
        {([
          { key: "details" as DrawerTab, label: "Detail" },
          { key: "worklog" as DrawerTab, label: "💬 Worklog" },
        ]).map(t => (
          <button key={t.key} onClick={() => onTabChange(t.key)}
            style={{
              flex: 1, padding: "0.6rem", border: "none", background: "none", cursor: "pointer",
              borderBottom: `2px solid ${tab === t.key ? "var(--accent)" : "transparent"}`,
              marginBottom: "-2px", fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? "var(--accent)" : "var(--grey)", fontSize: "0.85rem",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {isLoading && <LoadingState />}
        {!isLoading && incident && (
          tab === "details" ? <IncidentDetailsTab incident={incident} /> : <WorklogTab incidentId={incident.id} />
        )}
      </div>
    </div>
  );
}

// ─── Details Tab ───────────────────────────────────────────────────────────────
function IncidentDetailsTab({ incident }: { incident: Incident }) {
  return (
    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
        {[
          ["Status", STATUS_LABELS[incident.status] ?? incident.status],
          ["Priority", incident.priority],
          ["Dibuka", incident.opened_at ? formatDate(incident.opened_at) : "—"],
          ["Resolved", incident.resolved_at ? formatDate(incident.resolved_at) : "—"],
          ["First Response", incident.first_response_at ? formatDate(incident.first_response_at) : "—"],
          ["Category", incident.category ?? "—"],
        ].map(([label, value]) => (
          <div key={label} style={{ background: "var(--bg-subtle)", padding: "0.6rem", borderRadius: 8 }}>
            <div style={{ fontSize: "0.68rem", color: "var(--grey)", marginBottom: 2 }}>{label}</div>
            <div style={{ fontWeight: 600, fontSize: "0.82rem", textTransform: "capitalize" }}>{value}</div>
          </div>
        ))}
      </div>

      <AssigneeBox incident={incident} />

      {incident.description && (
        <div>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: 6 }}>Deskripsi</div>
          <div style={{ fontSize: "0.875rem", lineHeight: 1.6, padding: "0.75rem", background: "var(--bg-subtle)", borderRadius: 8, whiteSpace: "pre-wrap" }}>
            {incident.description}
          </div>
        </div>
      )}

      {(incident.status === "resolved" || incident.status === "closed") && (
        <CreateArticleFromIncidentButton incident={incident} />
      )}
    </div>
  );
}

/** Incident yang sudah resolved/closed biasanya punya worklog berisi
 * root cause/workaround/resolusi yang sayang kalau cuma terkubur di sini -
 * tombol ini prefill form Artikel KB dari incident + worklog-nya, staf
 * TETAP review & submit manual (artikel masuk sebagai draft, lihat
 * CreateKbArticleModal). Bukan auto-publish. */
function CreateArticleFromIncidentButton({ incident }: { incident: Incident }) {
  const [open, setOpen] = useState(false);
  // Diambil TANPA digerbangi `open` - supaya sudah termuat SEBELUM tombol
  // diklik (drawer detail biasanya sudah kebuka beberapa saat). Kalau
  // digerbangi `open`, initialContent CreateKbArticleModal (di-set sekali
  // lewat useState di dalamnya, tidak reaktif ke prop) akan kepotong data
  // worklog-nya karena fetch belum selesai pas modal pertama kali render.
  const { data: worklogs, isLoading: worklogsLoading } = useIncidentWorklogs(incident.id);

  function buildContent(): string {
    const parts = [`Ringkasan Masalah:\n${incident.description || incident.title}`];

    const resolution = worklogs?.find((w) => w.log_type === "resolution");
    if (resolution) {
      parts.push(`Resolusi:\n${resolution.description}`);
    }

    const others = (worklogs ?? []).filter((w) => w.log_type !== "resolution");
    if (others.length > 0) {
      parts.push(`Riwayat Penanganan:\n${others.map((w) => `- [${formatDate(w.created_at)}] (${w.log_type}) ${w.description}`).join("\n")}`);
    }

    return parts.join("\n\n");
  }

  return (
    <>
      <button type="button" className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem", display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}
        disabled={worklogsLoading} onClick={() => setOpen(true)}>
        <FileText size={14} /> {worklogsLoading ? "Memuat riwayat..." : "Buat Artikel KB dari Incident Ini"}
      </button>
      {open && (
        <CreateKbArticleModal
          initialTitle={incident.title}
          initialContent={buildContent()}
          initialTags={incident.category ? [incident.category] : []}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function AssigneeBox({ incident }: { incident: Incident }) {
  const [editing, setEditing] = useState(false);
  const assignMutation = useAssignIncident(incident.id);

  function handleAssign(employee: { id: number }) {
    assignMutation.mutate(employee.id, {
      onSuccess: () => setEditing(false),
      onError: (e: Error) => alert("Gagal assign: " + e.message),
    });
  }

  return (
    <div>
      <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        <UserCheck size={14} /> Ditugaskan ke
      </div>
      {!editing ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.75rem", background: "var(--bg-subtle)", borderRadius: 8 }}>
          <div style={{ flex: 1, fontSize: "0.875rem", fontWeight: incident.assignee ? 600 : 400, color: incident.assignee ? "var(--text-primary)" : "var(--grey)" }}>
            {incident.assignee?.full_name ?? "Belum ditugaskan"}
          </div>
          <button className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem" }}
            disabled={assignMutation.isPending} onClick={() => setEditing(true)}>
            {incident.assignee ? "Ganti" : "Tugaskan"}
          </button>
        </div>
      ) : (
        <EmployeePicker onSelect={handleAssign} onCancel={() => setEditing(false)} />
      )}
    </div>
  );
}

// ─── Worklog Tab ────────────────────────────────────────────────────────────────
function WorklogTab({ incidentId }: { incidentId: number }) {
  const [description, setDescription] = useState("");
  const [logType, setLogType] = useState("progress_note");
  const [hoursSpent, setHoursSpent] = useState("");
  const { data: worklogs, isLoading } = useIncidentWorklogs(incidentId);
  const addWorklog = useAddWorklog(incidentId);

  function submitWorklog() {
    if (!description.trim()) { alert("Deskripsi wajib diisi."); return; }
    addWorklog.mutate(
      { description: description.trim(), log_type: logType, hours_spent: hoursSpent ? parseFloat(hoursSpent) : undefined },
      {
        onSuccess: () => setDescription(""),
        onError: (e: Error) => alert("Gagal: " + e.message),
      }
    );
  }

  const totalHours = (worklogs ?? []).reduce((sum: number, w: IncidentWorklog) => sum + (w.hours_spent ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Total hours summary */}
      {totalHours > 0 && (
        <div style={{ padding: "0.6rem 1rem", background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
          <span>Total jam tercatat:</span>
          <strong style={{ color: "var(--accent)" }}>{totalHours.toFixed(2)} jam</strong>
        </div>
      )}

      {/* Thread */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {isLoading && <LoadingState />}
        {!isLoading && (!worklogs || worklogs.length === 0) && (
          <div style={{ textAlign: "center", color: "var(--grey)", fontSize: "0.875rem", padding: "2rem" }}>
            Belum ada worklog. Tambahkan progress pertama.
          </div>
        )}
        {(worklogs ?? []).map((w: IncidentWorklog) => {
          const style = LOG_TYPE_STYLE[w.log_type] ?? LOG_TYPE_STYLE.progress_note;
          return (
            <div key={w.id} style={{ padding: "0.75rem", background: style.bg, borderRadius: 10, border: `1px solid ${style.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--grey)", textTransform: "uppercase" }}>
                  {LOG_TYPE_LABELS[w.log_type] ?? w.log_type}
                </span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {w.hours_spent && (
                    <span style={{ fontSize: "0.72rem", color: "var(--accent)", fontWeight: 600 }}>{w.hours_spent}h</span>
                  )}
                  <span style={{ fontSize: "0.72rem", color: "var(--grey)" }}>{formatDate(w.created_at)}</span>
                </div>
              </div>
              <div style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>{w.description}</div>
              {w.creator?.full_name && (
                <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: 4 }}>oleh {w.creator.full_name}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add worklog form */}
      <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="input" value={logType} onChange={e => setLogType(e.target.value)} style={{ width: 150, fontSize: "0.8rem" }}>
            {Object.entries(LOG_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input className="input" type="number" placeholder="Jam" value={hoursSpent} step="0.5" min="0"
            onChange={e => setHoursSpent(e.target.value)} style={{ width: 80, fontSize: "0.8rem" }} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            className="input"
            placeholder="Catat progress, root cause, workaround, atau resolusi..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitWorklog(); }}
            style={{ flex: 1, minHeight: 60, maxHeight: 100, resize: "vertical", fontSize: "0.875rem" }}
          />
          <button className="btn btn-primary" style={{ padding: "0.5rem 0.75rem", height: "auto" }}
            disabled={addWorklog.isPending || !description.trim()} onClick={submitWorklog}>
            {addWorklog.isPending ? "..." : "Tambah"}
          </button>
        </div>
      </div>
    </div>
  );
}
