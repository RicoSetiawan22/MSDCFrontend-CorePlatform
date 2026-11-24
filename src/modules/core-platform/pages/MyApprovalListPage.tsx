import { PageHeader } from "@shared/components/PageHeader";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyApprovals } from "../api/useWorkflow";
import { workflowApi } from "../api/workflowApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingState } from "@shared/components/LoadingState";
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  CheckCircle2,
  Clock,
  Activity,
  FileText,
  Search,
  RefreshCw,
  FolderSearch,
  BellRing,
  UserCog,
  ShieldCheck,
  AlertTriangle,
  Users,
  ArrowRight,
} from "lucide-react";
import { extractErrorMessage } from "@shared/types/api";
import { formatDate, formatCurrency } from "@shared/lib/format";
import { useFilePreview } from "../api/useFilePreview";
// eslint-disable-next-line no-restricted-imports
import { DocumentDetailModal } from "@modules/document-management/components/DocumentDetailModal";
import { DelegationManagementModal } from "../components/DelegationManagementModal";
import { DigitalSignatureGuideModal } from "../components/DigitalSignatureGuideModal";
import type { MyApprovalItem } from "../types/workflow";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

const STATUS_STYLE: Record<string, string> = {
  pending: "text-amber-700 bg-amber-50 border-amber-200/60",
  approved: "text-emerald-700 bg-emerald-50 border-emerald-200/60",
  rejected: "text-rose-700 bg-rose-50 border-rose-200/60",
  delegated: "text-violet-700 bg-violet-50 border-violet-200/60",
  escalated: "text-orange-700 bg-orange-50 border-orange-200/60",
};

export function MyApprovalListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [showDigitalSignatureModal, setShowDigitalSignatureModal] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useMyApprovals({ status: "all" });

  const approveMutation = useMutation({
    mutationFn: (instanceId: number) => workflowApi.approve(instanceId).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflowApprovals"] }),
  });
  const rejectMutation = useMutation({
    mutationFn: ({ instanceId, notes }: { instanceId: number; notes: string }) =>
      workflowApi.reject(instanceId, notes).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflowApprovals"] }),
  });

  async function handleApprove(item: MyApprovalItem) {
    try { await approveMutation.mutateAsync(item.instance_id); }
    catch (err) { alert(extractErrorMessage(err)); }
  }

  async function handleReject(item: MyApprovalItem) {
    const notes = prompt("Alasan reject:");
    if (!notes) return;
    try { await rejectMutation.mutateAsync({ instanceId: item.instance_id, notes }); }
    catch (err) { alert(extractErrorMessage(err)); }
  }

  const filteredData = data?.filter(item => {
    if (statusFilter && item.status !== statusFilter) {
      return false;
    }
    if (search) {
      const s = search.toLowerCase();
      return (
        item.workflow_name.toLowerCase().includes(s) ||
        item.document_number.toLowerCase().includes(s) ||
        item.submitted_by_name?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const pendingCount = data?.filter(i => i.status === "pending").length ?? 0;
  const approvedCount = data?.filter(i => i.status === "approved").length ?? 0;
  const rejectedCount = data?.filter(i => i.status === "rejected").length ?? 0;

  // Data untuk visual chart
  const chartData = [
    { name: "Menunggu", count: pendingCount, color: "#f59e0b" },
    { name: "Disetujui", count: approvedCount, color: "#10b981" },
    { name: "Ditolak", count: rejectedCount, color: "#f43f5e" },
    { name: "Total Task", count: (data?.length ?? 0), color: "#3b82f6" },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 min-h-screen w-full font-sans">
      <PageHeader
        title="My Approvals"
        subtitle="Approval task yang menunggu tindakan dan verifikasi Anda."
      />
      <div className="px-7 py-5 space-y-6">
        {/* Grid 4 Kartu Metrik ala DataOps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">MENUNGGU TINDAKAN</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{pendingCount}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Butuh Persetujuan Anda</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">DISETUJUI</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{approvedCount}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Verifikasi Selesai</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Activity size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">RESPON CEPAT</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">&lt; 15 Menit</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>SLA Waktu Respon</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">TOTAL DOKUMEN</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{data?.length ?? 0}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Seluruh Siklus Dokumen</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Chart Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Distribusi & Tren Status Persetujuan</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Ringkasan grafik beban kerja approval saat ini</p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200/60">
              Live Tracker
            </span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} domain={[0, (data?.length ?? 0) > 0 ? 'auto' : 4]} />
                <Tooltip 
                  cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="relative w-full md:w-48">
              <select 
                className="w-full text-xs font-medium border-slate-300 rounded-lg py-2.5 pl-3 pr-8 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-slate-800 shadow-sm cursor-pointer appearance-none"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>
            
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                className="w-full text-xs font-normal border-slate-300 rounded-lg py-2.5 pl-9 pr-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400 shadow-sm" 
                placeholder="Cari nomor dokumen, pemohon..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-3 md:mt-0 shrink-0">
            <button 
              type="button"
              onClick={() => refetch()}
              className="btn btn-secondary text-xs px-4 py-2.5"
            >
              <RefreshCw size={14} className="text-slate-500" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
      </section>

      {isLoading && <LoadingState />}

      {(!isLoading && filteredData && filteredData.length === 0) && (
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[380px] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
          <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mb-5 shadow-inner group">
            <FolderSearch size={40} strokeWidth={1.5} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {statusFilter === "approved"
              ? "Tidak Ada Riwayat Disetujui"
              : statusFilter === "rejected"
              ? "Tidak Ada Riwayat Ditolak"
              : "Tidak Ada Task Approval"}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
            {statusFilter === "approved"
              ? "Belum ada dokumen yang pernah Anda setujui sebelumnya."
              : statusFilter === "rejected"
              ? "Tidak ada dokumen yang Anda tolak."
              : "Semua approval sudah diproses. Kerja bagus! Saat ada dokumen atau pengajuan baru yang memerlukan persetujuan Anda, rinciannya akan langsung muncul di halaman ini."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {statusFilter ? (
              <button
                type="button"
                onClick={() => setStatusFilter("")}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Tampilkan Semua Task</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStatusFilter("approved")}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 cursor-pointer active:scale-95"
              >
                <CheckCircle2 size={16} />
                <span>Lihat Riwayat Selesai</span>
              </button>
            )}
          </div>
        </section>
      )}

      {(!isLoading && filteredData && filteredData.length > 0) && (
        <div className="space-y-4">
          {filteredData.map(item => (
            <ApprovalCard 
              key={item.id} 
              item={item}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
              approveLoading={approveMutation.isPending}
              rejectLoading={rejectMutation.isPending} 
            />
          ))}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {/* Card 1: Notifikasi Real-time */}
        <div className="bg-white border border-slate-200 hover:border-amber-300 rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <BellRing size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Notifikasi Real-time</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5">
                Terintegrasi dengan email kerja resmi & telegram bot notifikasi approval seketika dokumen diajukan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/core-platform/notifications")}
            className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-all cursor-pointer"
          >
            <span>Atur Saluran Notifikasi</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Card 2: Delegasi Wewenang */}
        <div className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <UserCog size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Delegasi Wewenang (Pjs)</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5">
                Sedang dinas luar atau cuti tahunan? Alihkan hak otorisasi Anda sementara ke rekan deputi secara aman.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDelegationModal(true)}
            className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-all cursor-pointer"
          >
            <span>Kelola Delegasi (Pjs)</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Card 3: Tanda Tangan Digital */}
        <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Tanda Tangan Digital</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5">
                Setiap dokumen yang Anda setujui langsung dibubuhi QR Code sertifikasi digital sah berspesifikasi audit.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDigitalSignatureModal(true)}
            className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-all cursor-pointer"
          >
            <span>Lihat Spesifikasi & Uji QR</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </section>

      {/* Modals */}
      {showDelegationModal && (
        <DelegationManagementModal onClose={() => setShowDelegationModal(false)} />
      )}
      {showDigitalSignatureModal && (
        <DigitalSignatureGuideModal onClose={() => setShowDigitalSignatureModal(false)} />
      )}
    </div>
    </main>
  );
}

function ApprovalCard({ item, onApprove, onReject, approveLoading, rejectLoading }: {
  item: MyApprovalItem;
  onApprove: () => void;
  onReject: () => void;
  approveLoading: boolean;
  rejectLoading: boolean;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const [showFullDocument, setShowFullDocument] = useState(false);
  const hasDetail = item.payload && Object.keys(item.payload).length > 0;
  const isSuratDocument = item.document_type === "surat";
  const isVendorPicking = item.document_type === "vendor_picking" && Array.isArray(item.payload?.vendor_totals);

  // Ambil penerima / sasaran dokumen jika ada (Poin 4)
  const recipientTarget = 
    (item.payload?.issued_to_name as string) ||
    (item.payload?.customer_name as string) ||
    (item.payload?.vendor_name as string) ||
    (item.payload?.department_name as string) ||
    null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500"></div>
      
      <div className="p-5 pl-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <FileText size={14} className="text-slate-400" />
              <h3 className="font-bold text-slate-800 text-base">{item.workflow_name}</h3>
            </div>
            {/* Target Approval & Sasaran Penerima (Poin 4 Mentor) */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11px] font-medium text-slate-500 mb-2">
              <span className="uppercase tracking-wider text-slate-600 font-semibold">{item.document_type}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="font-mono text-slate-600">{item.document_number}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/80 font-bold">
                🎯 Target Review: {item.current_step_name}
              </span>
              {recipientTarget && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/80 font-semibold">
                    👤 Ditujukan ke: {recipientTarget}
                  </span>
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              Diajukan oleh <span className="font-semibold text-slate-600">{item.submitted_by_name ?? "Unknown"}</span> pada {formatDate(item.submitted_at)}
            </div>
          </div>
          
          <div className="shrink-0">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLE[item.status] ?? "text-slate-600 bg-slate-50 border-slate-200"}`}>
              {item.status}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {isSuratDocument ? (
            <button 
              onClick={() => setShowFullDocument(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              Lihat Isi Surat: {typeof item.payload?.title === "string" ? item.payload.title : item.document_number}
              <ChevronRight size={14} />
            </button>
          ) : isVendorPicking ? (
            <button 
              onClick={() => setShowDetail((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              {showDetail ? "Sembunyikan Perbandingan Vendor" : "Lihat Perbandingan Vendor"}
              {showDetail ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : hasDetail ? (
            <button 
              onClick={() => setShowDetail((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              {showDetail ? "Sembunyikan Detail" : "Lihat Detail yang Diapprove"}
              {showDetail ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : null}

          {/* Tombol Pemantau Approval Tim (Poin 5 Mentor) */}
          <button
            type="button"
            onClick={() => setShowTracker((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200/80 transition-colors"
          >
            <Users size={14} />
            <span>{showTracker ? "Sembunyikan Status Tim" : "👥 Pantau Siapa yang Belum Approve"}</span>
            {showTracker ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {/* Panel Tracker Status Persetujuan Tim (Poin 5) */}
        {showTracker && (
          <div className="mt-3.5">
            <ApprovalMatrixTracker instanceId={item.instance_id} />
          </div>
        )}

        {showDetail && isVendorPicking && (
          <div className="mt-4"><VendorPickingApprovalDetail payload={item.payload!} /></div>
        )}

        {showDetail && hasDetail && !isVendorPicking && (
          <div className="mt-4"><ApprovalDetail payload={item.payload!} /></div>
        )}

        {item.status === "pending" && (
          <div className="flex items-center gap-3 mt-5 pt-5 border-t border-slate-100">
            <button 
              disabled={approveLoading} 
              onClick={onApprove}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70"
            >
              <Check size={14} strokeWidth={3} />
              Setujui (Approve)
            </button>
            <button 
              disabled={rejectLoading} 
              onClick={onReject}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-70"
            >
              <X size={14} strokeWidth={3} />
              Tolak (Reject)
            </button>
          </div>
        )}
      </div>

      {showFullDocument && (
        <DocumentDetailModal documentId={item.document_id} onClose={() => setShowFullDocument(false)} />
      )}
    </div>
  );
}

/**
 * Komponen Pemantau Status Approval Antar-Tim (Poin 4 & 5 Mentor)
 * Mengambil data alur riil multi-tier approval untuk mengetahui siapa saja
 * yang sudah approve dan tim mana yang belum approve.
 */
function ApprovalMatrixTracker({ instanceId }: { instanceId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["workflow-instance-detail", instanceId],
    queryFn: () => workflowApi.instanceDetail(instanceId).then((r) => r.data.data),
    enabled: !!instanceId,
  });

  if (isLoading) {
    return (
      <div className="p-3 text-[11px] text-slate-500 bg-slate-50 rounded-xl border border-slate-200 animate-pulse flex items-center gap-2">
        <Clock size={14} className="text-amber-500" />
        <span>Memuat data matriks persetujuan tim...</span>
      </div>
    );
  }

  if (!data || !data.instance_levels || data.instance_levels.length === 0) {
    return (
      <div className="p-3 text-[11px] text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
        Belum ada hierarki tingkatan tim approval untuk dokumen ini.
      </div>
    );
  }

  return (
    <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-2.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-amber-600" />
          <span className="text-xs font-bold text-slate-800">
            Pelacak Persetujuan Tim (Siapa yang Sudah & Belum Approve)
          </span>
        </div>
        <span className="text-[10px] text-slate-400">Total {data.instance_levels.length} Tingkatan</span>
      </div>

      <div className="space-y-2">
        {data.instance_levels.map((il, idx) => {
          const levelName = il.level?.name ?? `Tingkatan ${idx + 1}`;
          const isApproved = il.status === "approved";
          const isRejected = il.status === "rejected";
          const isPending = il.status === "pending";

          return (
            <div
              key={il.id}
              className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                isApproved
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                  : isPending
                  ? "bg-amber-50/80 border-amber-300 text-amber-900 shadow-sm"
                  : isRejected
                  ? "bg-rose-50/60 border-rose-200 text-rose-900"
                  : "bg-white border-slate-200 text-slate-600"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {isApproved ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : isPending ? (
                    <AlertTriangle size={16} className="text-amber-600 animate-pulse" />
                  ) : isRejected ? (
                    <X size={16} className="text-rose-600" />
                  ) : (
                    <Clock size={16} className="text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <span>{levelName}</span>
                    {isPending && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        MENUNGGU TINDAKAN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] mt-0.5">
                    {isApproved && (
                      <span className="text-emerald-700 font-medium">
                        ✓ Disetujui oleh: <strong>{il.approver?.name ?? "Approver Terdaftar"}</strong>
                        {il.acted_at ? ` (${formatDate(il.acted_at)})` : ""}
                      </span>
                    )}
                    {isPending && (
                      <span className="text-amber-800 font-semibold">
                        ⏳ Belum Meng-approve — Tim/Penanggung Jawab ini belum memberikan persetujuan.
                      </span>
                    )}
                    {isRejected && (
                      <span className="text-rose-700 font-medium">
                        ✕ Ditolak oleh: {il.approver?.name ?? "Approver"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-auto">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    isApproved
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : isPending
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : isRejected
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : "bg-slate-100 text-slate-600 border-slate-300"
                  }`}
                >
                  {isApproved ? "Sudah Approve" : isPending ? "Belum Approve" : il.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface VendorTotalSnapshot {
  quotation_id: number;
  vendor_id: number;
  vendor_name: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  quotation_date: string | null;
  valid_until: string | null;
}

interface VendorQuoteSnapshot {
  quotation_id: number;
  vendor_id: number;
  vendor_name: string | null;
  unit_price: number;
  discount_pct: number;
  line_total: number;
}

interface VendorComparisonRowSnapshot {
  pr_line_id: number;
  description: string;
  pr_qty: number | string;
  pr_uom: string;
  pr_est_price: number;
  quotes: VendorQuoteSnapshot[];
}

function VendorPickingApprovalDetail({ payload }: { payload: Record<string, unknown> }) {
  const vendors = (payload.vendor_totals as VendorTotalSnapshot[]) || [];
  const rows = (payload.comparison as VendorComparisonRowSnapshot[]) || [];
  const picked_quotation_id = payload.picked_quotation_id as number | undefined;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="p-3 border-b border-r border-slate-200 bg-slate-50 font-semibold text-slate-600">Item Deskripsi</th>
              <th className="p-3 border-b border-r border-slate-200 bg-slate-50 font-semibold text-center text-slate-600">Qty</th>
              <th className="p-3 border-b border-r border-slate-200 bg-slate-50 font-semibold text-right text-slate-600">Est. Harga (Internal)</th>
              {vendors.map(v => (
                <th key={v.vendor_id} className={`p-3 border-b border-slate-200 text-right ${v.quotation_id === picked_quotation_id ? "bg-amber-50 border-amber-200" : "bg-slate-50"}`}>
                  <div className="font-bold text-slate-800">{v.vendor_name ?? "Unknown Vendor"}</div>
                  {v.quotation_id === picked_quotation_id && (
                    <div className="mt-1 inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white">TERPILIH</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="p-3 border-r border-slate-100 text-slate-700">{row.description}</td>
                <td className="p-3 border-r border-slate-100 text-center font-mono text-slate-600">{row.pr_qty} {row.pr_uom}</td>
                <td className="p-3 border-r border-slate-100 text-right font-mono text-slate-500">{formatCurrency(row.pr_est_price)}</td>
                {vendors.map(v => {
                  const quote = row.quotes?.find(q => q.vendor_id === v.vendor_id);
                  return (
                    <td key={v.vendor_id} className={`p-3 text-right ${v.quotation_id === picked_quotation_id ? "bg-amber-50/30" : ""}`}>
                      {quote ? (
                        <>
                          <div className="font-mono font-medium text-slate-700">{formatCurrency(quote.unit_price)}</div>
                          {quote.discount_pct > 0 && <div className="text-[9px] text-rose-500 mt-0.5">Disc {quote.discount_pct}%</div>}
                        </>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-bold">
              <td colSpan={3} className="p-3 text-right border-t border-r border-slate-200 text-slate-700">TOTAL KESELURUHAN (Inc. Tax)</td>
              {vendors.map(v => (
                <td key={v.vendor_id} className={`p-3 text-right border-t border-slate-200 ${v.quotation_id === picked_quotation_id ? "bg-amber-100/50 text-amber-700" : "text-slate-800"}`}>
                  <div className="font-mono text-sm">{formatCurrency(v.total_amount)}</div>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function ApprovalDetail({ payload }: { payload: Record<string, unknown> }) {
  const lines = payload.lines as Array<{
    description?: string;
    quantity?: number | string;
    unit_price?: number | string;
    discount_pct?: number;
    amount?: number | string;
  }> | undefined;
  
  const title = payload.title as string | undefined;
  const purpose = payload.purpose as string | undefined;
  const customerName = payload.customer_name as string | undefined;
  const requesterName = payload.requester_name as string | undefined;
  const departmentName = payload.department_name as string | undefined;
  const costCenterName = payload.cost_center_name as string | undefined;
  const siteName = payload.site_name as string | undefined;
  const assetName = payload.asset_name as string | undefined;
  const assetNumber = payload.asset_number as string | undefined;
  const itemDescription = payload.item_description as string | undefined;
  const startDate = payload.start_date as string | undefined;
  const endDate = payload.end_date as string | undefined;
  const paymentTermDays = payload.payment_term_days as number | undefined;
  const damageDescription = payload.damage_description as string | undefined;
  const issueDescription = payload.issue_description as string | undefined;

  const subtotal = payload.subtotal;
  
  const discountAmount = payload.discount_amount;
  const discountPct = payload.discount_pct;
  const totalAmount = payload.total_amount;

  const attachmentFileId = typeof payload.attachment_file_id === "number" ? payload.attachment_file_id : null;
  const { url: attachmentUrl, isLoading: attachmentLoading } = useFilePreview(attachmentFileId);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-2">
        {title && (
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Judul</div>
            <div className="text-xs font-semibold text-slate-800">{title}</div>
          </div>
        )}
        {customerName && (
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer</div>
            <div className="text-xs font-semibold text-slate-800">{customerName}</div>
          </div>
        )}
        {purpose && (
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tujuan</div>
            <div className="text-xs font-semibold text-slate-800">{purpose}</div>
          </div>
        )}
        {(assetName || assetNumber || itemDescription) && (
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Barang</div>
            <div className="text-xs font-semibold text-slate-800">
              {assetName ?? itemDescription}{assetNumber ? " (" + assetNumber + ")" : ""}
            </div>
          </div>
        )}
        {requesterName && (
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pemohon</div>
            <div className="text-xs font-semibold text-slate-800">{requesterName}</div>
          </div>
        )}
        {departmentName && (
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Departemen</div>
            <div className="text-xs font-semibold text-slate-800">{departmentName}</div>
          </div>
        )}
        {costCenterName && (
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cost Center</div>
            <div className="text-xs font-semibold text-slate-800">{costCenterName}</div>
          </div>
        )}
        {siteName && (
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Site</div>
            <div className="text-xs font-semibold text-slate-800">{siteName}</div>
          </div>
        )}
        {(startDate || endDate) && (
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Periode</div>
            <div className="text-xs font-semibold text-slate-800">{startDate ? formatDate(startDate) : "?"} - {endDate ? formatDate(endDate) : "?"}</div>
          </div>
        )}
        {paymentTermDays !== undefined && paymentTermDays !== null && (
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Termin Bayar</div>
            <div className="text-xs font-semibold text-slate-800">{paymentTermDays as number} hari</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200/60">
        {subtotal !== undefined && (
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subtotal</div>
            <div className="text-xs font-mono font-semibold text-slate-700">{formatCurrency(subtotal as number | string)}</div>
          </div>
        )}
        {(discountAmount !== undefined || discountPct !== undefined) && (
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Diskon</div>
            <div className="text-xs font-mono font-bold text-rose-500">
              {discountPct !== undefined ? `${discountPct}%` : ""}
              {discountAmount !== undefined ? " (" + formatCurrency(discountAmount as number | string) + ")" : ""}
            </div>
          </div>
        )}
        {totalAmount !== undefined && (
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total</div>
            <div className="text-sm font-mono font-bold text-amber-600">{formatCurrency(totalAmount as number | string)}</div>
          </div>
        )}
      </div>

      {attachmentFileId && (
        <div className="mt-4 pt-4 border-t border-slate-200/60">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Lampiran</div>
          {attachmentLoading && <div className="text-xs text-slate-500">Memuat gambar...</div>}
          {!attachmentLoading && attachmentUrl && (
            <img src={attachmentUrl} alt="Lampiran" className="max-w-[240px] max-h-[240px] rounded-lg border border-slate-300 object-contain shadow-sm" />
          )}
          {!attachmentLoading && !attachmentUrl && (
            <div className="text-xs text-slate-500 italic">Lampiran tidak bisa dimuat (bukan gambar, atau tidak ada akses).</div>
          )}
        </div>
      )}

      {damageDescription && (
        <div className="mt-4 pt-4 border-t border-slate-200/60">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kerusakan / Kondisi Barang</div>
          <div className="text-xs text-slate-700 leading-relaxed">{damageDescription}</div>
        </div>
      )}

      {issueDescription && (
        <div className="mt-4 pt-4 border-t border-slate-200/60">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Masalah yang Diklaim</div>
          <div className="text-xs text-slate-700 leading-relaxed">{issueDescription}</div>
        </div>
      )}

      {lines && lines.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="p-2.5 font-semibold">Item Deskripsi</th>
                <th className="p-2.5 font-semibold text-right">Qty</th>
                <th className="p-2.5 font-semibold text-right">Harga Satuan</th>
                <th className="p-2.5 font-semibold text-right">Diskon</th>
                <th className="p-2.5 font-semibold text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {lines.map((line, i) => (
                <tr key={i}>
                  <td className="p-2.5 text-slate-700">{line.description ?? "?"}</td>
                  <td className="p-2.5 text-right font-mono text-slate-600">{line.quantity ?? "?"}</td>
                  <td className="p-2.5 text-right font-mono text-slate-600">{line.unit_price !== undefined ? formatCurrency(line.unit_price) : "?"}</td>
                  <td className="p-2.5 text-right font-mono text-rose-500">{line.discount_pct !== undefined && line.discount_pct > 0 ? `${line.discount_pct}%` : "-"}</td>
                  <td className="p-2.5 text-right font-mono font-semibold text-slate-800">{line.amount !== undefined ? formatCurrency(line.amount) : "?"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}