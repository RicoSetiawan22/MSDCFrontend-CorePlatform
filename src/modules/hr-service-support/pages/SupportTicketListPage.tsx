import { useState } from "react";
import { Search, Plus, MessageSquare, UserCheck, FileText } from "lucide-react";
import { useSupportTicketList, useSupportTicket, useUpdateSupportTicketStatus, useCreateSupportTicket, useAssignSupportTicket } from "../api/useSupportTickets";
import { useTicketActivities, useLogActivity } from "../api/useTicketActivities";
import { useContractList } from "@modules/crm-sales/api/useContracts";
import { EmployeePicker } from "../components/EmployeePicker";
import { CreateKbArticleModal } from "../components/CreateKbArticleModal";
import { CustomerPicker, type CustomerPickerResult } from "@shared/components/CustomerPicker";
import { ticketApi } from "../api/ticketApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatDate } from "@shared/lib/format";
import type { SupportTicket, TicketStatus } from "../types/ticket";

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open", in_progress: "In Progress", waiting_customer: "Menunggu Customer", resolved: "Resolved", closed: "Closed",
};
const CHANNEL_LABELS: Record<string, string> = {
  email: "Email", phone: "Telepon", portal: "Portal", chat: "Live Chat", walk_in: "Walk-in",
};
const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  comment: "💬 Komentar", status_change: "🔄 Status", assignment: "👤 Assignment",
  escalation: "⬆ Eskalasi", satisfaction_rating: "⭐ Rating", internal_note: "📝 Catatan Internal",
};

type DrawerTab = "details" | "activity";

export function SupportTicketListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("details");

  const { data, isLoading } = useSupportTicketList({
    page, per_page: 20, status: statusFilter || undefined, search: search || undefined,
  });

  const tickets = data?.data ?? [];
  const totalCount = data?.total ?? 0;
  const activeCount = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;
  const waitingCustomerCount = tickets.filter(t => t.status === "waiting_customer").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Support Ticket"
        subtitle="Customer support & helpdesk — manajemen tiket multi-channel (Portal, Email, Chat, Telepon) dan pelacakan SLA."
      />

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Workflow Info Banner */}
        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
            <MessageSquare size={18} />
          </div>
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Alur Helpdesk &amp; Support:</strong> 1. Tiket masuk dari multi-channel (Status: Open) ➔ 2. Assign ke staf Helpdesk / Engineer ➔ 3. Update aktivitas dan status komunikasi di tab <span className="font-semibold text-slate-800">Detail &amp; Aktivitas</span> ➔ 4. Solusi dikirim ke customer hingga status <span className="font-semibold text-slate-800">Resolved &amp; Closed</span>.
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Tiket</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700">
                <MessageSquare size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalCount}</span>
              <p className="text-xs text-slate-500 mt-1">Seluruh tiket masuk</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sedang Aktif</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <UserCheck size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{activeCount}</span>
              <p className="text-xs text-blue-600 font-medium mt-1">Open &amp; In Progress</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Menunggu Klien</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <MessageSquare size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{waitingCustomerCount}</span>
              <p className="text-xs text-amber-600 font-medium mt-1">Waiting on customer feedback</p>
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
                placeholder="Cari tiket atau subject..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:border-[#0A2140]"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value as TicketStatus | ""); setPage(1); }}
              >
                <option value="">Semua Status</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#f4ae3e] hover:bg-[#f7a41f] rounded-xl transition-all shadow-sm"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={15} /> Tiket Baru
              </button>
            </div>
          </div>

          {isLoading && <LoadingState />}
          {data && data.data.length === 0 && (
            <div className="p-8">
              <EmptyState title="Belum Ada Tiket" subtitle="Tiket customer support akan muncul di sini." />
            </div>
          )}
          {data && data.data.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80">
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">No. Tiket</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Prioritas</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Saluran</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">PIC</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Waktu Dibuat</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map(t => (
                      <TicketRow key={t.id} ticket={t}
                        onView={() => { setSelectedTicketId(t.id); setDrawerTab("details"); }} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
                <span className="text-xs text-slate-500">
                  Menampilkan halaman <strong className="text-slate-700">{data.current_page}</strong> dari <strong className="text-slate-700">{data.last_page}</strong> (total {data.total} tiket)
                </span>
                <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      {showCreateModal && <CreateTicketModal onClose={() => setShowCreateModal(false)} />}
      {selectedTicketId && (
        <TicketDetailDrawer
          ticketId={selectedTicketId}
          tab={drawerTab}
          onTabChange={setDrawerTab}
          onClose={() => setSelectedTicketId(null)}
        />
      )}
    </div>
  );
}

function TicketRow({ ticket, onView }: { ticket: SupportTicket; onView: () => void }) {
  const statusMutation = useUpdateSupportTicketStatus(ticket.id);
  const isDone = ticket.status === "closed" || ticket.status === "resolved";

  const priorityColors: Record<string, { bg: string; text: string; dot: string }> = {
    low: { bg: "bg-slate-100 border-slate-200", text: "text-slate-700", dot: "bg-slate-400" },
    medium: { bg: "bg-amber-50 border-amber-200/60", text: "text-amber-700", dot: "bg-amber-500" },
    high: { bg: "bg-orange-50 border-orange-200/60", text: "text-orange-700", dot: "bg-orange-500" },
    critical: { bg: "bg-rose-50 border-rose-200/60", text: "text-rose-700", dot: "bg-rose-500" },
  };
  const prio = priorityColors[ticket.priority] ?? priorityColors.low;

  return (
    <tr className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-900 cursor-pointer hover:text-[#0A2140]" onClick={onView}>
        {ticket.ticket_number}
      </td>
      <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">
        {ticket.customer?.company_name ?? "—"}
      </td>
      <td className="px-5 py-3.5 text-sm text-slate-800 max-w-[240px]">
        <button onClick={onView} className="text-left font-medium hover:text-[#0A2140] transition-colors truncate block w-full">
          {ticket.subject}
        </button>
      </td>
      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${prio.bg} ${prio.text} uppercase`}>
          <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
          {ticket.priority}
        </span>
      </td>
      <td className="px-5 py-3.5 text-xs text-slate-600">
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
          {CHANNEL_LABELS[ticket.channel] ?? ticket.channel}
        </span>
      </td>
      <td className="px-5 py-3.5">
        {isDone ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {STATUS_LABELS[ticket.status]}
          </span>
        ) : (
          <select
            className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer outline-none focus:bg-white"
            value={ticket.status}
            disabled={statusMutation.isPending}
            onChange={(e) => statusMutation.mutate(e.target.value as TicketStatus)}
          >
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}
      </td>
      <td className="px-5 py-3.5 text-xs text-slate-700">
        {ticket.assignee ? (
          <span className="font-medium text-slate-900">{ticket.assignee.full_name}</span>
        ) : (
          <span className="text-slate-400 italic">Belum ditugaskan</span>
        )}
      </td>
      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{formatDate(ticket.created_at)}</td>
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

function CreateTicketModal({ onClose }: { onClose: () => void }) {
  const [customer, setCustomer] = useState<CustomerPickerResult | null>(null);
  const [contractId, setContractId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [channel, setChannel] = useState("email");
  const [error, setError] = useState<string | null>(null);

  const createTicket = useCreateSupportTicket();
  const qc = useQueryClient();
  const { data: contracts } = useContractList({ customer_id: customer?.id, per_page: 50 });

  function handleCustomerSelect(c: CustomerPickerResult) {
    if (c.isLead) {
      setError("Tiket support cuma bisa dibuat untuk Customer yang sudah terdaftar, bukan Lead (bakal customer). Convert Lead ini jadi Customer dulu di CRM & Sales.");
      return;
    }
    setError(null);
    setCustomer(c);
    setContractId("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer || !subject) { setError("Customer dan Subject wajib diisi."); return; }
    setError(null);
    createTicket.mutate({
      customer_id: customer.id,
      contract_id: contractId ? parseInt(contractId) : undefined,
      subject, description, priority, channel,
    } as Partial<SupportTicket>, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: ["hrTickets"] }); onClose(); },
      onError: (e: Error) => setError("Gagal: " + e.message),
    });
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "var(--surface)", borderRadius: 12, padding: "1.5rem",
        width: 520, maxHeight: "80vh", overflowY: "auto", border: "1px solid var(--border)",
      }}>
        <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "1rem" }}>Tiket Support Baru</div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <CustomerPicker
            label="Customer *"
            selectedCustomerId={customer?.id}
            selectedCustomerName={customer?.company_name}
            onSelect={handleCustomerSelect}
            onClear={() => { setCustomer(null); setContractId(""); }}
          />
          {customer && (
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Kontrak (opsional)</label>
              <select className="input" value={contractId} onChange={e => setContractId(e.target.value)} style={{ width: "100%" }}>
                <option value="">Tanpa Kontrak</option>
                {(contracts?.data ?? []).map(c => (
                  <option key={c.id} value={c.id}>{c.contract_number} ({c.status})</option>
                ))}
              </select>
              {(contracts?.data.length ?? 0) === 0 && (
                <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: 4 }}>Customer ini belum punya kontrak aktif.</div>
              )}
            </div>
          )}
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Subject *</label>
            <input className="input" value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="Judul tiket" style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Deskripsi</label>
            <textarea className="input" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Detail masalah..." style={{ width: "100%", minHeight: 80 }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Priority</label>
              <select className="input" value={priority} onChange={e => setPriority(e.target.value)} style={{ width: "100%" }}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Channel</label>
              <select className="input" value={channel} onChange={e => setChannel(e.target.value)} style={{ width: "100%" }}>
                <option value="email">Email</option><option value="phone">Telepon</option>
                <option value="chat">Live Chat</option><option value="portal">Portal</option>
              </select>
            </div>
          </div>
          {error && <div className="input-error">{error}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={createTicket.isPending}>
              {createTicket.isPending ? "Membuat..." : "Buat Tiket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Detail Drawer (2 tabs: Details | Activity) ─────────────────────────────────
// Ambil data SEGAR lewat useSupportTicket(ticketId), bukan pakai object ticket
// dari baris tabel yang dipassing turun - kalau tetap pakai snapshot lama,
// drawer akan tetap tampil "Belum ditugaskan"/status lama setelah assign atau
// ubah status walau data di server sudah berubah (invalidateQueries di hook
// mutation TETAP menyegarkan query ini juga karena key-nya sama prefix).
function TicketDetailDrawer({ ticketId, tab, onTabChange, onClose }: {
  ticketId: number; tab: DrawerTab; onTabChange: (t: DrawerTab) => void; onClose: () => void;
}) {
  const { data: ticket, isLoading } = useSupportTicket(ticketId);

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
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{ticket?.ticket_number ?? "…"}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--grey)", maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {ticket?.subject}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={onClose} style={{ padding: "0.3rem 0.6rem" }}>✕</button>
      </div>

      {/* Tab navigation */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border)" }}>
        {(["details", "activity"] as DrawerTab[]).map(t => (
          <button key={t} onClick={() => onTabChange(t)}
            style={{
              flex: 1, padding: "0.6rem", border: "none", background: "none", cursor: "pointer",
              borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`,
              marginBottom: "-2px", fontWeight: tab === t ? 700 : 400,
              color: tab === t ? "var(--accent)" : "var(--grey)", fontSize: "0.85rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            {t === "details" ? "Detail" : (
              <><MessageSquare size={14} /> Aktivitas</>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {isLoading && <LoadingState />}
        {!isLoading && ticket && (
          tab === "details" ? (
            <DetailsTab ticket={ticket} onClose={onClose} />
          ) : (
            <ActivityTab ticketId={ticket.id} />
          )
        )}
      </div>
    </div>
  );
}

// ─── Details Tab ────────────────────────────────────────────────────────────────
function DetailsTab({ ticket, onClose }: { ticket: SupportTicket; onClose: () => void }) {
  const qc = useQueryClient();
  const escalateMutation = useMutation({
    mutationFn: () => ticketApi.escalate(ticket.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hrTickets"] }); onClose(); },
    onError: (e: Error) => alert("Gagal eskalasi: " + (e.message || "Unknown error")),
  });

  return (
    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
        {[
          ["Customer", ticket.customer?.company_name ?? "—"],
          ["Kontrak", ticket.contract?.contract_number ?? "—"],
          ["Status", STATUS_LABELS[ticket.status]],
          ["Priority", ticket.priority],
          ["Channel", CHANNEL_LABELS[ticket.channel] ?? ticket.channel],
          ["Dibuka", formatDate(ticket.opened_at)],
          ["SLA Response", ticket.sla_response_due_at ? formatDate(ticket.sla_response_due_at) : "—"],
          ["SLA Resolution", ticket.sla_resolution_due_at ? formatDate(ticket.sla_resolution_due_at) : "—"],
          ["Resolved", ticket.resolved_at ? formatDate(ticket.resolved_at) : "—"],
          ["Closed", ticket.closed_at ? formatDate(ticket.closed_at) : "—"],
        ].map(([label, value]) => (
          <div key={label} style={{ background: "var(--bg-subtle)", padding: "0.6rem", borderRadius: 8 }}>
            <div style={{ fontSize: "0.68rem", color: "var(--grey)", marginBottom: 2 }}>{label}</div>
            <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Assign ke Employee */}
      <AssigneeBox ticket={ticket} />

      {/* Description */}
      {ticket.description && (
        <div>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: 6 }}>Deskripsi</div>
          <div style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-secondary)", padding: "0.75rem", background: "var(--bg-subtle)", borderRadius: 8, whiteSpace: "pre-wrap" }}>
            {ticket.description}
          </div>
        </div>
      )}

      {/* SLA warning */}
      {ticket.sla_response_due_at && ticket.status !== "closed" && ticket.status !== "resolved" && (
        <SlaCountdown dueDate={ticket.sla_response_due_at} label="SLA Response" />
      )}

      {/* Escalate */}
      {!ticket.incident_id && !ticket.status.startsWith("closed") && !ticket.status.startsWith("resolved") && (
        <div style={{ padding: "0.75rem", background: "#fff7ed", borderRadius: 8, border: "1px solid #fed7aa" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c2410c", marginBottom: 4 }}>⬆ Eskalasi ke Incident</div>
          <div style={{ fontSize: "0.78rem", color: "var(--grey)", marginBottom: 8 }}>
            Ubah ticket ini jadi ITIL Incident formal untuk penanganan teknis lebih lanjut.
          </div>
          <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
            disabled={escalateMutation.isPending}
            onClick={() => { if (confirm("Eskalasi ticket ini jadi Incident ITIL?")) escalateMutation.mutate(); }}>
            {escalateMutation.isPending ? "Mengeskalasi..." : "Eskalasi → Incident"}
          </button>
        </div>
      )}
      {ticket.incident_id && (
        <div style={{ padding: "0.75rem", background: "var(--bg-subtle)", borderRadius: 8, fontSize: "0.875rem", color: "var(--green)", fontWeight: 600 }}>
          ✓ Sudah dieskalasi ke Incident
        </div>
      )}

      {(ticket.status === "resolved" || ticket.status === "closed") && (
        <CreateArticleFromTicketButton ticket={ticket} />
      )}
    </div>
  );
}

/** Sama pola dengan CreateArticleFromIncidentButton - tiket yang sudah
 * resolved/closed prefill form Artikel KB dari subject/deskripsi + riwayat
 * aktivitasnya, staf tetap review & submit manual (draft, bukan auto-publish). */
function CreateArticleFromTicketButton({ ticket }: { ticket: SupportTicket }) {
  const [open, setOpen] = useState(false);
  // TANPA digerbangi `open` - sama alasan seperti versi Incident, supaya
  // sudah termuat sebelum modal pertama kali render (initialContent
  // CreateKbArticleModal tidak reaktif ke perubahan prop setelahnya).
  const { data: activities, isLoading: activitiesLoading } = useTicketActivities(ticket.id);

  function buildContent(): string {
    const parts = [`Ringkasan Masalah:\n${ticket.description || ticket.subject}`];

    const history = (activities ?? []).filter((a) => a.activity_type !== "assignment");
    if (history.length > 0) {
      parts.push(`Riwayat Penanganan:\n${history.map((a) => `- [${formatDate(a.performed_at)}] (${a.activity_type}) ${a.description}`).join("\n")}`);
    }

    return parts.join("\n\n");
  }

  return (
    <>
      <button type="button" className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem", display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}
        disabled={activitiesLoading} onClick={() => setOpen(true)}>
        <FileText size={14} /> {activitiesLoading ? "Memuat riwayat..." : "Buat Artikel KB dari Tiket Ini"}
      </button>
      {open && (
        <CreateKbArticleModal
          initialTitle={ticket.subject}
          initialContent={buildContent()}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ─── Assign ke Employee ──────────────────────────────────────────────────────────
function AssigneeBox({ ticket }: { ticket: SupportTicket }) {
  const [editing, setEditing] = useState(false);
  const assignMutation = useAssignSupportTicket(ticket.id);

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
          <div style={{ flex: 1, fontSize: "0.875rem", fontWeight: ticket.assignee ? 600 : 400, color: ticket.assignee ? "var(--text-primary)" : "var(--grey)" }}>
            {ticket.assignee?.full_name ?? "Belum ditugaskan"}
          </div>
          <button className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem" }}
            disabled={assignMutation.isPending} onClick={() => setEditing(true)}>
            {ticket.assignee ? "Ganti" : "Tugaskan"}
          </button>
        </div>
      ) : (
        <EmployeePicker onSelect={handleAssign} onCancel={() => setEditing(false)} />
      )}
    </div>
  );
}

// ─── Activity Tab ────────────────────────────────────────────────────────────────
function ActivityTab({ ticketId }: { ticketId: number }) {
  const [message, setMessage] = useState("");
  const { data: activities, isLoading } = useTicketActivities(ticketId);
  const logActivity = useLogActivity(ticketId);

  function submitMessage() {
    if (!message.trim()) return;
    logActivity.mutate(
      { description: message.trim(), activity_type: "comment" },
      {
        onSuccess: () => setMessage(""),
        onError: (e: Error) => alert("Gagal: " + e.message),
      }
    );
  }

  const TYPE_STYLE: Record<string, { bg: string; border: string }> = {
    comment: { bg: "var(--surface)", border: "var(--border)" },
    status_change: { bg: "#fef9c3", border: "#fde047" },
    assignment: { bg: "#eff6ff", border: "#bfdbfe" },
    escalation: { bg: "#fff7ed", border: "#fed7aa" },
    satisfaction_rating: { bg: "#f0fdf4", border: "#bbf7d0" },
    internal_note: { bg: "#fdf4ff", border: "#e9d5ff" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Thread */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {isLoading && <LoadingState />}
        {!isLoading && (!activities || activities.length === 0) && (
          <div style={{ textAlign: "center", color: "var(--grey)", fontSize: "0.875rem", padding: "2rem" }}>
            Belum ada aktivitas. Tambahkan komentar pertama.
          </div>
        )}
        {(activities ?? []).map((act: { id: number; activity_type: string; description: string; performed_by_name?: string; performed_at: string }) => {
          const style = TYPE_STYLE[act.activity_type] ?? TYPE_STYLE.comment;
          return (
            <div key={act.id} style={{ padding: "0.75rem", background: style.bg, borderRadius: 10, border: `1px solid ${style.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--grey)", textTransform: "uppercase" }}>
                  {ACTIVITY_TYPE_LABELS[act.activity_type] ?? act.activity_type}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--grey)" }}>{formatDate(act.performed_at)}</span>
              </div>
              <div style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>{act.description}</div>
              {act.performed_by_name && (
                <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: 4 }}>
                  oleh {act.performed_by_name}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Message input */}
      <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <textarea
            className="input"
            placeholder="Tulis komentar atau catatan internal..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitMessage();
            }}
            style={{ width: "100%", minHeight: 60, maxHeight: 120, resize: "vertical", fontSize: "0.875rem" }}
          />
        </div>
        <button className="btn btn-primary" style={{ padding: "0.5rem 0.75rem", height: "auto" }}
          disabled={logActivity.isPending || !message.trim()}
          onClick={submitMessage}>
          {logActivity.isPending ? "..." : "Kirim"}
        </button>
      </div>
    </div>
  );
}

// ─── SLA Countdown ─────────────────────────────────────────────────────────────
function SlaCountdown({ dueDate, label }: { dueDate: string; label: string }) {
  const [remaining, setRemaining] = useState("");
  useState(() => {
    const update = () => {
      const diff = new Date(dueDate).getTime() - Date.now();
      if (diff <= 0) { setRemaining("⚠️ MELEBIHI SLA!"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m remaining`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  });
  const isOverdue = remaining.startsWith("⚠️");
  return (
    <div style={{
      padding: "0.6rem 0.75rem", borderRadius: 8,
      background: isOverdue ? "#fef2f2" : "#fffbeb",
      border: `1px solid ${isOverdue ? "#fecaca" : "#fde047"}`,
    }}>
      <span style={{ fontSize: "0.75rem", color: isOverdue ? "#dc2626" : "#854d0e", fontWeight: 600 }}>
        ⚡ {label}: {remaining}
      </span>
    </div>
  );
}
