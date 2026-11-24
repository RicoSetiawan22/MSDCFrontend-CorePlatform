import { useState } from "react";
import { Search, Plus, Link2 } from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";
import { formatDate } from "@shared/lib/format";
import { useProblemList, useProblem, useCreateProblem, useUpdateProblemStatus, useLinkIncidentToProblem } from "../api/useProblems";
import { useIncidentList } from "../api/useIncidents";
import { EmployeePicker } from "../components/EmployeePicker";
import type { ProblemStatus } from "../types/itil";

const STATUS_LABELS: Record<ProblemStatus, string> = {
  open: "Open",
  under_investigation: "Investigasi",
  known_error: "Known Error",
  resolved: "Resolved",
  closed: "Closed",
};


export function ProblemListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);

  const { data, isLoading } = useProblemList({
    status: statusFilter || undefined, search: search || undefined, page, per_page: 20,
  });

  const problems = data?.data ?? [];
  const totalCount = data?.total ?? 0;
  const investigationCount = problems.filter(p => p.status === "under_investigation" || p.status === "open").length;
  const knownErrorCount = problems.filter(p => p.status === "known_error").length;
  const resolvedCount = problems.filter(p => p.status === "resolved" || p.status === "closed").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Problem Management"
        subtitle="ITIL Problem Management — investigasi akar masalah (RCA), pencatatan known error, dan pencegahan insiden berulang."
      />

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Workflow Info Banner */}
        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
            <Link2 size={18} />
          </div>
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Alur ITIL Problem:</strong> 1. Masalah dicatat dari insiden berulang (Open) ➔ 2. Analisis teknis di status <span className="font-semibold text-slate-800">Investigasi</span> ➔ 3. Tandai sebagai <span className="font-semibold text-slate-800">Known Error</span> jika workaround ditemukan sebelum perbaikan permanen ➔ 4. Tautkan perubahan sistem via Change Management hingga masalah <span className="font-semibold text-slate-800">Resolved &amp; Closed</span>.
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Problem</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700">
                <Search size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalCount}</span>
              <p className="text-xs text-slate-500 mt-1">Investigasi RCA terdaftar</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dalam Investigasi</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <Search size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{investigationCount}</span>
              <p className="text-xs text-amber-600 font-medium mt-1">Open &amp; Under Investigation</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Known Error</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <Link2 size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{knownErrorCount}</span>
              <p className="text-xs text-blue-600 font-medium mt-1">Workaround terdokumentasi</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Terselesaikan</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <Plus size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{resolvedCount}</span>
              <p className="text-xs text-emerald-600 font-medium mt-1">Resolved &amp; Closed</p>
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
                placeholder="Cari problem atau root cause..."
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
                <Plus size={15} /> Problem Baru
              </button>
            </div>
          </div>

          {isLoading && <LoadingState />}
          {data && data.data.length === 0 && (
            <div className="p-8">
              <EmptyState title="Belum Ada Problem" subtitle="Tidak ada data problem yang cocok." />
            </div>
          )}
          {data && data.data.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80">
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">No. Problem</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Judul</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Root Cause</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assignee</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Insiden Terkait</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dibuat</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map(p => {
                      const statusColorMap: Record<string, { bg: string; text: string; dot: string }> = {
                        open: { bg: "bg-amber-50 border-amber-200/60", text: "text-amber-700", dot: "bg-amber-500" },
                        under_investigation: { bg: "bg-orange-50 border-orange-200/60", text: "text-orange-700", dot: "bg-orange-500" },
                        known_error: { bg: "bg-blue-50 border-blue-200/60", text: "text-blue-700", dot: "bg-blue-500" },
                        resolved: { bg: "bg-emerald-50 border-emerald-200/60", text: "text-emerald-700", dot: "bg-emerald-500" },
                        closed: { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
                      };
                      const st = statusColorMap[p.status] ?? statusColorMap.closed;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                          <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-900 cursor-pointer hover:text-[#0A2140]" onClick={() => setSelectedProblemId(p.id)}>
                            {p.problem_number}
                          </td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 max-w-[240px]">
                            <button onClick={() => setSelectedProblemId(p.id)} className="text-left hover:text-[#0A2140] transition-colors truncate block w-full">
                              {p.title}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[200px] truncate">
                            {p.root_cause || "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${st.bg} ${st.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {STATUS_LABELS[p.status as ProblemStatus] ?? p.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-700">
                            {p.assignee?.full_name ?? <span className="text-slate-400 italic">—</span>}
                          </td>
                          <td className="px-5 py-3.5 text-xs font-semibold">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                              {p.incidents_count ?? 0} insiden
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{formatDate(p.created_at)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              onClick={() => setSelectedProblemId(p.id)}
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
                <span className="text-xs text-slate-500">
                  Menampilkan halaman <strong className="text-slate-700">{data.current_page}</strong> dari <strong className="text-slate-700">{data.last_page}</strong> (total {data.total} problem)
                </span>
                <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      {showCreateModal && <CreateProblemModal onClose={() => setShowCreateModal(false)} />}
      {selectedProblemId && <ProblemDetailModal problemId={selectedProblemId} onClose={() => setSelectedProblemId(null)} />}
    </div>
  );
}

// ─── Create Modal ──────────────────────────────────────────────────────────────
function CreateProblemModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [assigneeName, setAssigneeName] = useState<string | null>(null);
  const [pickingAssignee, setPickingAssignee] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createProblem = useCreateProblem();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Judul wajib diisi."); return; }
    setError(null);
    createProblem.mutate(
      { title: title.trim(), root_cause: rootCause || undefined, assigned_to: assigneeId },
      { onSuccess: onClose, onError: (e: Error) => setError(extractErrorMessage(e)) }
    );
  }

  return (
    <Modal title="Problem Baru" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label">Judul *</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%" }} placeholder="Ringkasan akar masalah yang diselidiki" />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label">Root Cause (opsional, bisa diisi belakangan)</label>
          <textarea className="input" value={rootCause} onChange={e => setRootCause(e.target.value)} style={{ width: "100%", minHeight: 80 }} placeholder="Analisis akar masalah..." />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label">Ditugaskan ke (opsional)</label>
          {!pickingAssignee ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.7rem", background: "var(--bg-subtle)", borderRadius: 6 }}>
              <div style={{ flex: 1, fontSize: "0.85rem", color: assigneeName ? "var(--text-primary)" : "var(--grey)" }}>
                {assigneeName ?? "Belum ditugaskan"}
              </div>
              <button type="button" className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem" }} onClick={() => setPickingAssignee(true)}>
                Pilih
              </button>
            </div>
          ) : (
            <EmployeePicker
              onSelect={(employee) => { setAssigneeId(employee.id); setAssigneeName(employee.full_name); setPickingAssignee(false); }}
              onCancel={() => setPickingAssignee(false)}
            />
          )}
        </div>
        {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}
        <Button type="submit" disabled={createProblem.isPending} style={{ width: "100%" }}>
          {createProblem.isPending ? "Menyimpan..." : "Buat Problem"}
        </Button>
      </form>
    </Modal>
  );
}

// ─── Detail Modal ───────────────────────────────────────────────────────────────
function ProblemDetailModal({ problemId, onClose }: { problemId: number; onClose: () => void }) {
  const { data: problem, isLoading } = useProblem(problemId);
  const statusMutation = useUpdateProblemStatus();
  const [linking, setLinking] = useState(false);

  return (
    <Modal title={problem?.problem_number ?? "Detail Problem"} onClose={onClose} maxWidth={560}>
      {isLoading && <LoadingState />}
      {!isLoading && problem && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 4 }}>{problem.title}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--grey)" }}>Dibuat {formatDate(problem.created_at)}</div>
          </div>

          <div>
            <label className="input-label">Status</label>
            {problem.status === "closed" ? (
              <span className="badge badge-active">{STATUS_LABELS[problem.status]}</span>
            ) : (
              <select
                className="input"
                style={{ width: "100%" }}
                value={problem.status}
                disabled={statusMutation.isPending}
                onChange={(e) => statusMutation.mutate({ id: problem.id, status: e.target.value }, {
                  onError: (err: Error) => alert("Gagal: " + extractErrorMessage(err)),
                })}
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="input-label">Assignee</label>
            <div style={{ fontSize: "0.875rem" }}>{problem.assignee?.full_name ?? "Belum ditugaskan"}</div>
          </div>

          {problem.root_cause && (
            <div>
              <label className="input-label">Root Cause</label>
              <div style={{ fontSize: "0.875rem", lineHeight: 1.6, padding: "0.75rem", background: "var(--bg-subtle)", borderRadius: 8, whiteSpace: "pre-wrap" }}>
                {problem.root_cause}
              </div>
            </div>
          )}

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label className="input-label" style={{ marginBottom: 0 }}>Incident Terkait ({problem.incidents?.length ?? 0})</label>
              <button type="button" className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", display: "flex", alignItems: "center", gap: 4 }}
                onClick={() => setLinking((v) => !v)}>
                <Link2 size={12} /> Kaitkan Incident
              </button>
            </div>

            {linking && <IncidentLinker problemId={problem.id} onDone={() => setLinking(false)} />}

            {(problem.incidents?.length ?? 0) === 0 && !linking && (
              <div style={{ fontSize: "0.82rem", color: "var(--grey)" }}>Belum ada incident yang dikaitkan.</div>
            )}
            {problem.incidents?.map((inc) => (
              <div key={inc.id} style={{ padding: "0.5rem 0.7rem", background: "var(--bg-subtle)", borderRadius: 6, fontSize: "0.82rem", marginBottom: 4 }}>
                <span style={{ fontFamily: "monospace" }}>{inc.incident_number}</span> — {inc.title}
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function IncidentLinker({ problemId, onDone }: { problemId: number; onDone: () => void }) {
  const [search, setSearch] = useState("");
  const { data: results, isLoading } = useIncidentList({ search: search || undefined, per_page: 10 });
  const linkMutation = useLinkIncidentToProblem();

  function handleLink(incidentId: number) {
    linkMutation.mutate({ problemId, incidentId }, {
      onSuccess: onDone,
      onError: (e: Error) => alert("Gagal: " + extractErrorMessage(e)),
    });
  }

  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <input className="input" autoFocus placeholder="Cari nomor/judul incident..." value={search}
        onChange={e => setSearch(e.target.value)} style={{ width: "100%", marginBottom: 4 }} />
      {search.length >= 2 && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, maxHeight: 180, overflowY: "auto" }}>
          {isLoading && <div style={{ padding: "0.5rem 0.7rem", fontSize: "0.8rem", color: "var(--grey)" }}>Mencari...</div>}
          {!isLoading && (results?.data.length ?? 0) === 0 && (
            <div style={{ padding: "0.5rem 0.7rem", fontSize: "0.8rem", color: "var(--grey)" }}>Tidak ditemukan.</div>
          )}
          {!isLoading && results?.data.map((inc) => (
            <button key={inc.id} type="button" disabled={linkMutation.isPending} onClick={() => handleLink(inc.id)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "0.45rem 0.7rem", border: "none", borderBottom: "1px solid var(--border)", background: "none", cursor: "pointer", fontSize: "0.8rem" }}>
              <span style={{ fontFamily: "monospace" }}>{inc.incident_number}</span> — {inc.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
