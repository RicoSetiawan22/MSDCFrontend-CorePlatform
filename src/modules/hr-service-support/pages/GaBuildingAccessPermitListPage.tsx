import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { Modal } from "@shared/components/Modal";
import { formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { useAuth } from "@shared/lib/auth-context";
import { EmployeePicker, type EmployeePickerResult } from "../components/EmployeePicker";
import { useFacilityList, useAccessPermits, useCreateAccessPermit } from "../api/useFacilities";

function getTodayDateStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const STATUS_LABELS: Record<string, string> = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };

export function GaBuildingAccessPermitListPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useAccessPermits({ page, per_page: 20 });

  const permits = data?.data ?? [];
  const totalCount = data?.total ?? 0;
  const pendingCount = permits.filter(p => p.status === "pending").length;
  const approvedCount = permits.filter(p => p.status === "approved").length;
  const rejectedCount = permits.filter(p => p.status === "rejected").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Surat Izin Masuk Gedung"
        subtitle="Izin akses gedung kantor dan fasilitas operasional untuk tamu, vendor mitra, dan teknisi eksternal."
      >
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm"
          onClick={() => setShowForm(true)}
        >
          <Plus size={15} /> Izin Baru
        </button>
      </PageHeader>

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Workflow Info Banner */}
        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
            <Plus size={18} />
          </div>
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Prosedur Keamanan Gedung:</strong> 1. Daftarkan nama tamu, perusahaan asal, keperluan, dan pegawai yang ditemui (Host) ➔ 2. Pengajuan diapprove oleh Manager via <span className="font-semibold text-slate-800">My Approvals</span> ➔ 3. Tim resepsionis / sekuriti memverifikasi persetujuan sebelum menerbitkan kartu tanda masuk (visitor badge).
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Izin Akses</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700">
                <Plus size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalCount}</span>
              <p className="text-xs text-slate-500 mt-1">Permohonan terdata</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Menunggu Approval</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <Plus size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{pendingCount}</span>
              <p className="text-xs text-amber-600 font-medium mt-1">Pending persetujuan</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Disetujui</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <Plus size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{approvedCount}</span>
              <p className="text-xs text-emerald-600 font-medium mt-1">Izin akses aktif</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ditolak</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
                <Plus size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{rejectedCount}</span>
              <p className="text-xs text-rose-600 font-medium mt-1">Akses tidak diberikan</p>
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            <span className="text-sm font-semibold text-slate-800">Daftar Tamu &amp; Vendor</span>
            <button
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm"
              onClick={() => setShowForm(true)}
            >
              <Plus size={14} /> Izin Baru
            </button>
          </div>

          {isLoading && <LoadingState />}
          {data && data.data.length === 0 && (
            <div className="p-8">
              <EmptyState title="Belum Ada Izin Gedung" subtitle='Klik "Izin Baru" untuk mendaftarkan tamu/vendor.' />
            </div>
          )}
          {data && data.data.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80">
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Tamu</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Perusahaan / Instansi</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Keperluan Kunjungan</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Kunjungan</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pegawai Ditemui</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map(p => {
                      const statusMeta: Record<string, { bg: string; text: string; dot: string }> = {
                        approved: { bg: "bg-emerald-50 border-emerald-200/60", text: "text-emerald-700", dot: "bg-emerald-500" },
                        pending: { bg: "bg-amber-50 border-amber-200/60", text: "text-amber-700", dot: "bg-amber-500" },
                        rejected: { bg: "bg-rose-50 border-rose-200/60", text: "text-rose-700", dot: "bg-rose-500" },
                      };
                      const sm = statusMeta[p.status] ?? statusMeta.rejected;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                          <td className="px-5 py-3.5 font-semibold text-sm text-slate-900">{p.visitor_name}</td>
                          <td className="px-5 py-3.5 text-xs text-slate-700">{p.visitor_company || "—"}</td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[220px] truncate">{p.purpose}</td>
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{formatDate(p.visit_date)}</td>
                          <td className="px-5 py-3.5 text-xs text-slate-800 font-medium">{p.host_name || "—"}</td>
                          <td className="px-5 py-3.5 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${sm.bg} ${sm.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                              {STATUS_LABELS[p.status] ?? p.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
                <span className="text-xs text-slate-500">
                  Menampilkan halaman <strong className="text-slate-700">{data.current_page}</strong> dari <strong className="text-slate-700">{data.last_page}</strong> (total {data.total} permohonan)
                </span>
                <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      {showForm && <AccessPermitFormModal onClose={() => setShowForm(false)} />}
    </div>
  );
}

function AccessPermitFormModal({ onClose }: { onClose: () => void }) {
  const { user, activeOrganization } = useAuth();
  const { data: facilities } = useFacilityList({ status: "active" });
  const createPermit = useCreateAccessPermit();

  const today = getTodayDateStr();
  const [facilityId, setFacilityId] = useState<number | "">("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorCompany, setVisitorCompany] = useState("");
  const [purpose, setPurpose] = useState("");
  const [visitDate, setVisitDate] = useState(today);
  const [host, setHost] = useState<EmployeePickerResult | null>(null);
  const [pickingHost, setPickingHost] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!visitorName.trim()) { setError("Nama tamu wajib diisi."); return; }
    if (!purpose.trim()) { setError("Keperluan wajib diisi."); return; }
    if (visitDate < today) {
      setError("Tanggal kunjungan tidak boleh tanggal mundur (sebelum hari ini).");
      return;
    }
    setError(null);

    const orgId = activeOrganization?.id ?? user?.organization?.id ?? (localStorage.getItem("msdc_active_org_id") ? Number(localStorage.getItem("msdc_active_org_id")) : 1);

    createPermit.mutate({
      organization_id: orgId,
      facility_id: facilityId || undefined,
      visitor_name: visitorName.trim(),
      visitor_company: visitorCompany || undefined,
      purpose: purpose.trim(),
      visit_date: visitDate,
      host_employee_id: host?.id,
      host_name: host?.full_name,
    }, {
      onSuccess: onClose,
      onError: e => setError(extractErrorMessage(e)),
    });
  }

  return (
    <Modal title="Izin Masuk Gedung" onClose={onClose} maxWidth={480}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label className="input-label">Nama Tamu *</label>
          <input className="input" style={{ width: "100%" }} value={visitorName} onChange={e => setVisitorName(e.target.value)} placeholder="Nama tamu" />
        </div>
        <div>
          <label className="input-label">Perusahaan (opsional)</label>
          <input className="input" style={{ width: "100%" }} value={visitorCompany} onChange={e => setVisitorCompany(e.target.value)} placeholder="Nama perusahaan" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label className="input-label">Lokasi / Gedung (opsional)</label>
          <select className="input" style={{ width: "100%" }} value={facilityId} onChange={e => setFacilityId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">— Umum —</option>
            {facilities?.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">Tanggal Kunjungan *</label>
          <input
            className="input"
            type="date"
            min={today}
            style={{ width: "100%" }}
            value={visitDate}
            onChange={e => setVisitDate(e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Ditemui Oleh (Host Pegawai)</label>
        {!host && !pickingHost && (
          <button type="button" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setPickingHost(true)}>
            + Pilih Pegawai Host
          </button>
        )}
        {pickingHost && (
          <EmployeePicker onSelect={emp => { setHost(emp); setPickingHost(false); }} onCancel={() => setPickingHost(false)} />
        )}
        {host && !pickingHost && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.7rem", background: "var(--bg-subtle, #f8fafc)", borderRadius: 6, border: "1px solid #e2e8f0" }}>
            <div style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{host.full_name}</div>
            <button type="button" className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem" }} onClick={() => setPickingHost(true)}>Ganti</button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Keperluan</label>
        <textarea className="input" style={{ width: "100%", minHeight: 70 }} value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="mis. Survey lokasi instalasi" />
      </div>

      {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn btn-primary" disabled={createPermit.isPending} onClick={handleSubmit}>
          {createPermit.isPending ? "Mengajukan..." : "Ajukan Izin"}
        </button>
      </div>
    </Modal>
  );
}
