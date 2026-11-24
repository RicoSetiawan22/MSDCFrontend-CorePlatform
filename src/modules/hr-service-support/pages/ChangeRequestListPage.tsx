import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";
import { formatDate } from "@shared/lib/format";
import { useChangeList, useCreateChangeRequest, useSubmitChange, useSyncChangeApproval, useScheduleChange, useImplementChange } from "../api/useChanges";
import type { ChangeStatus, ChangeType } from "../types/itil";

const STATUS_LABELS: Record<ChangeStatus, string> = {
  draft: "Draft", submitted: "Submitted", approved: "Approved",
  scheduled: "Dijadwalkan", implemented: "Diimplementasi",
  failed: "Gagal", closed: "Closed",
};


const TYPE_LABELS: Record<ChangeType, string> = {
  standard: "Standard", normal: "Normal", emergency: "Emergency",
};

export function ChangeRequestListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading } = useChangeList({
    status: statusFilter || undefined, search: search || undefined, page, per_page: 20,
  });

  const submitChange = useSubmitChange();
  const syncApproval = useSyncChangeApproval();
  const scheduleChange = useScheduleChange();
  const implementChange = useImplementChange();

  const changes = data?.data ?? [];
  const totalCount = data?.total ?? 0;
  const pendingApproval = changes.filter(c => c.status === "submitted").length;
  const scheduledCount = changes.filter(c => c.status === "scheduled" || c.status === "approved").length;
  const implementedCount = changes.filter(c => c.status === "implemented" || c.status === "closed").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Change Management"
        subtitle="ITIL Change Management — pengajuan perubahan infrastruktur/aplikasi, evaluasi risiko CAB, dan monitoring implementasi."
      />

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Workflow Info Banner */}
        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
            <Plus size={18} />
          </div>
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Alur ITIL Change:</strong> 1. Buat RFC (Request for Change) di status Draft ➔ 2. Klik <span className="font-semibold text-slate-800">Submit</span> untuk mengirim ke CAB (Change Advisory Board) via <span className="font-semibold text-slate-800">My Approvals</span> ➔ 3. Setelah disetujui (Approved), jadwalkan tanggal implementasi ➔ 4. Klik <span className="font-semibold text-slate-800">Implementasi</span> setelah maintenance selesai.
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Change Request</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700">
                <Search size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalCount}</span>
              <p className="text-xs text-slate-500 mt-1">RFC terdaftar di sistem</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Menunggu Approval</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <Search size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{pendingApproval}</span>
              <p className="text-xs text-amber-600 font-medium mt-1">Review CAB pending</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dijadwalkan</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <Plus size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{scheduledCount}</span>
              <p className="text-xs text-blue-600 font-medium mt-1">Approved &amp; Scheduled</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Diimplementasi</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <Plus size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{implementedCount}</span>
              <p className="text-xs text-emerald-600 font-medium mt-1">Implemented &amp; Closed</p>
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
                placeholder="Cari change request..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:border-[#0A2140]"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">Semua Status</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#f4ae3e] hover:bg-[#f7a41f] rounded-xl transition-all shadow-sm"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={15} /> Change Request Baru
              </button>
            </div>
          </div>

          {isLoading && <LoadingState />}
          {data && data.data.length === 0 && (
            <div className="p-8">
              <EmptyState title="Belum Ada Change Request" subtitle="Daftarkan permohonan perubahan sistem baru." />
            </div>
          )}
          {data && data.data.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80">
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">No. Change</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Judul</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tipe</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tingkat Risiko</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jadwal Implementasi</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map(cr => {
                      const riskMap: Record<string, { bg: string; text: string; dot: string }> = {
                        low: { bg: "bg-emerald-50 border-emerald-200/60", text: "text-emerald-700", dot: "bg-emerald-500" },
                        medium: { bg: "bg-amber-50 border-amber-200/60", text: "text-amber-700", dot: "bg-amber-500" },
                        high: { bg: "bg-rose-50 border-rose-200/60", text: "text-rose-700", dot: "bg-rose-500" },
                      };
                      const rk = riskMap[cr.risk_level] ?? riskMap.low;

                      const statusColorMap: Record<string, { bg: string; text: string; dot: string }> = {
                        draft: { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
                        submitted: { bg: "bg-amber-50 border-amber-200/60", text: "text-amber-700", dot: "bg-amber-500" },
                        approved: { bg: "bg-blue-50 border-blue-200/60", text: "text-blue-700", dot: "bg-blue-500" },
                        scheduled: { bg: "bg-indigo-50 border-indigo-200/60", text: "text-indigo-700", dot: "bg-indigo-500" },
                        implemented: { bg: "bg-emerald-50 border-emerald-200/60", text: "text-emerald-700", dot: "bg-emerald-500" },
                        failed: { bg: "bg-rose-50 border-rose-200/60", text: "text-rose-700", dot: "bg-rose-500" },
                        closed: { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
                      };
                      const st = statusColorMap[cr.status] ?? statusColorMap.draft;

                      return (
                        <tr key={cr.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                          <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-900">{cr.change_number}</td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 max-w-[220px]">{cr.title}</td>
                          <td className="px-5 py-3.5 text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
                              {TYPE_LABELS[cr.change_type]}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${rk.bg} ${rk.text} uppercase`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${rk.dot}`} />
                              {cr.risk_level}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${st.bg} ${st.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {STATUS_LABELS[cr.status]}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                            {cr.scheduled_date ? formatDate(cr.scheduled_date) : <span className="text-slate-400 italic">—</span>}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {cr.status === "draft" && (
                                <button
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-[#0A2140] hover:bg-[#07162c] rounded-lg transition-colors"
                                  disabled={submitChange.isPending}
                                  onClick={() => submitChange.mutate(cr.id, {
                                    onError: (e: Error) => alert("Gagal: " + e.message),
                                  })}
                                >
                                  Submit
                                </button>
                              )}
                              {cr.status === "submitted" && (
                                <button
                                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                  disabled={syncApproval.isPending}
                                  onClick={() => syncApproval.mutate(cr.id, {
                                    onError: (e: Error) => alert("Gagal: " + e.message),
                                  })}
                                >
                                  Sync
                                </button>
                              )}
                              {cr.status === "approved" && (
                                <button
                                  className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-lg transition-colors"
                                  disabled={scheduleChange.isPending}
                                  onClick={() => {
                                    const date = prompt("Tanggal Implementasi (YYYY-MM-DD):");
                                    if (!date) return;
                                    scheduleChange.mutate({ id: cr.id, date }, {
                                      onError: (e: Error) => alert("Gagal: " + extractErrorMessage(e)),
                                    });
                                  }}
                                >
                                  Jadwalkan
                                </button>
                              )}
                              {cr.status === "scheduled" && (
                                <button
                                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-lg transition-colors"
                                  disabled={implementChange.isPending}
                                  onClick={() => {
                                    const ok = confirm("Implementasi berhasil?");
                                    implementChange.mutate({ id: cr.id, values: { successful: ok, notes: ok ? "Berhasil" : "Gagal" } }, {
                                      onError: (e: Error) => alert("Gagal: " + e.message),
                                    });
                                  }}
                                >
                                  Implementasikan
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
                <span className="text-xs text-slate-500">
                  Menampilkan halaman <strong className="text-slate-700">{data.current_page}</strong> dari <strong className="text-slate-700">{data.last_page}</strong> (total {data.total} change request)
                </span>
                <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      {showCreateModal && <CreateChangeRequestModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}

// ─── Create Modal ──────────────────────────────────────────────────────────────
function CreateChangeRequestModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [changeType, setChangeType] = useState<ChangeType>("normal");
  const [riskLevel, setRiskLevel] = useState("medium");
  const [scheduledDate, setScheduledDate] = useState("");
  const [rollbackPlan, setRollbackPlan] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createChange = useCreateChangeRequest();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Judul wajib diisi."); return; }
    setError(null);
    createChange.mutate(
      {
        title: title.trim(), description: description || undefined, change_type: changeType,
        risk_level: riskLevel, scheduled_date: scheduledDate || undefined, rollback_plan: rollbackPlan || undefined,
      },
      { onSuccess: onClose, onError: (e: Error) => setError(extractErrorMessage(e)) }
    );
  }

  return (
    <Modal title="Change Request Baru" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label">Judul *</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%" }} placeholder="Ringkasan perubahan yang diajukan" />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label">Deskripsi</label>
          <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} style={{ width: "100%", minHeight: 80 }} placeholder="Detail perubahan..." />
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label className="input-label">Tipe</label>
            <select className="input" value={changeType} onChange={e => setChangeType(e.target.value as ChangeType)} style={{ width: "100%" }}>
              <option value="standard">Standard</option><option value="normal">Normal</option><option value="emergency">Emergency</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="input-label">Risk Level</label>
            <select className="input" value={riskLevel} onChange={e => setRiskLevel(e.target.value)} style={{ width: "100%" }}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label">Tanggal Rencana (opsional)</label>
          <input className="input" type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label">Rollback Plan</label>
          <textarea className="input" value={rollbackPlan} onChange={e => setRollbackPlan(e.target.value)} style={{ width: "100%", minHeight: 60 }} placeholder="Rencana pembatalan kalau implementasi gagal..." />
        </div>
        {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}
        <Button type="submit" disabled={createChange.isPending} style={{ width: "100%" }}>
          {createChange.isPending ? "Menyimpan..." : "Buat Change Request"}
        </Button>
      </form>
    </Modal>
  );
}
