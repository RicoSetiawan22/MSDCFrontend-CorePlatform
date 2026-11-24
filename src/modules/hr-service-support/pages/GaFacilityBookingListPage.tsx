import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { Modal } from "@shared/components/Modal";
import { formatDate, formatTime } from "@shared/lib/format";
import { useAuth } from "@shared/lib/auth-context";
import { extractErrorMessage } from "@shared/types/api";
import { EmployeePicker, type EmployeePickerResult } from "../components/EmployeePicker";
import { useFacilityList, useFacilityBookings, useCreateFacilityBooking } from "../api/useFacilities";
import { BOOKING_STATUS_LABELS } from "../types/facility";

function toLocalDatetimeString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getDefaultDateTime(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  return toLocalDatetimeString(d);
}

function getNowDateTimeString(): string {
  return toLocalDatetimeString(new Date());
}

export function GaFacilityBookingListPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useFacilityBookings({ page, per_page: 20 });

  const bookings = data?.data ?? [];
  const totalCount = data?.total ?? 0;
  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const approvedCount = bookings.filter(b => b.status === "approved").length;
  const rejectedCount = bookings.filter(b => b.status === "rejected" || b.status === "cancelled").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Peminjaman Fasilitas"
        subtitle="Pengajuan reservasi ruang meeting, aula, dan peralatan kantor — dilengkapi pencegahan jadwal bentrok otomatis."
      >
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm"
          onClick={() => setShowForm(true)}
        >
          <Plus size={15} /> Pinjam Fasilitas
        </button>
      </PageHeader>

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Workflow Info Banner */}
        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
            <Plus size={18} />
          </div>
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Alur Peminjaman Fasilitas:</strong> 1. Pegawai memilih fasilitas dan rentang waktu reservasi ➔ 2. Sistem memeriksa ketersediaan dan mencegah bentrok jadwal ➔ 3. Pengajuan masuk ke Manager di <span className="font-semibold text-slate-800">My Approvals</span> untuk persetujuan.
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Reservasi</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700">
                <Plus size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalCount}</span>
              <p className="text-xs text-slate-500 mt-1">Pengajuan tercatat</p>
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
              <p className="text-xs text-amber-600 font-medium mt-1">Perlu tindakan Manager</p>
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
              <p className="text-xs text-emerald-600 font-medium mt-1">Jadwal telah dikonfirmasi</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ditolak / Batal</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
                <Plus size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{rejectedCount}</span>
              <p className="text-xs text-rose-600 font-medium mt-1">Tidak aktif</p>
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            <span className="text-sm font-semibold text-slate-800">Daftar Reservasi Fasilitas</span>
            <button
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm"
              onClick={() => setShowForm(true)}
            >
              <Plus size={14} /> Pinjam Fasilitas
            </button>
          </div>

          {isLoading && <LoadingState />}
          {data && data.data.length === 0 && (
            <div className="p-8">
              <EmptyState title="Belum Ada Peminjaman" subtitle='Klik "Pinjam Fasilitas" untuk mengajukan reservasi.' />
            </div>
          )}
          {data && data.data.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80">
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fasilitas</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Peminjam</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Keperluan</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Waktu Reservasi</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map(b => {
                      const statusMeta: Record<string, { bg: string; text: string; dot: string }> = {
                        approved: { bg: "bg-emerald-50 border-emerald-200/60", text: "text-emerald-700", dot: "bg-emerald-500" },
                        pending: { bg: "bg-amber-50 border-amber-200/60", text: "text-amber-700", dot: "bg-amber-500" },
                        rejected: { bg: "bg-rose-50 border-rose-200/60", text: "text-rose-700", dot: "bg-rose-500" },
                        cancelled: { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
                      };
                      const sm = statusMeta[b.status] ?? statusMeta.cancelled;

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                          <td className="px-5 py-3.5 font-semibold text-sm text-slate-900">{b.facility?.name ?? "—"}</td>
                          <td className="px-5 py-3.5 text-xs text-slate-700">{b.requester_name}</td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[200px] truncate">{b.purpose}</td>
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                            {formatDate(b.start_at)} {formatTime(b.start_at)}
                            {" – "}
                            {formatTime(b.end_at)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${sm.bg} ${sm.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                              {BOOKING_STATUS_LABELS[b.status as keyof typeof BOOKING_STATUS_LABELS] ?? b.status}
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
                  Menampilkan halaman <strong className="text-slate-700">{data.current_page}</strong> dari <strong className="text-slate-700">{data.last_page}</strong> (total {data.total} peminjaman)
                </span>
                <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      {showForm && <BookingFormModal onClose={() => setShowForm(false)} />}
    </div>
  );
}

function BookingFormModal({ onClose }: { onClose: () => void }) {
  const { user, activeOrganization } = useAuth();
  const { data: facilities, isLoading: isLoadingFacilities } = useFacilityList({ status: "active" });
  const createBooking = useCreateFacilityBooking();

  const minDateTime = getNowDateTimeString();
  const [facilityId, setFacilityId] = useState<number | "">("");
  const [requester, setRequester] = useState<EmployeePickerResult | null>(null);
  const [pickingRequester, setPickingRequester] = useState(true);
  const [purpose, setPurpose] = useState("");
  const [startAt, setStartAt] = useState(() => getDefaultDateTime(1));
  const [endAt, setEndAt] = useState(() => getDefaultDateTime(2));
  const [error, setError] = useState<string | null>(null);

  function handleStartAtChange(val: string) {
    setStartAt(val);
    if (val && (!endAt || endAt <= val)) {
      const s = new Date(val);
      if (!isNaN(s.getTime())) {
        const nextEnd = new Date(s.getTime() + 3600 * 1000);
        setEndAt(toLocalDatetimeString(nextEnd));
      }
    }
  }

  function handleSubmit() {
    if (!facilityId) { setError("Pilih fasilitas terlebih dahulu."); return; }
    if (!requester) { setError("Pilih peminjam terlebih dahulu."); return; }
    if (!purpose.trim()) { setError("Keperluan peminjaman wajib diisi."); return; }
    if (!startAt) { setError("Waktu mulai wajib diisi."); return; }

    const nowBuffer = toLocalDatetimeString(new Date(Date.now() - 60 * 1000));
    if (startAt < nowBuffer) {
      setError("Waktu mulai tidak boleh tanggal mundur (sebelum waktu sekarang).");
      return;
    }
    if (!endAt) { setError("Waktu selesai wajib diisi."); return; }
    if (endAt <= startAt) {
      setError("Waktu selesai harus setelah waktu mulai.");
      return;
    }
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      setError("Waktu selesai harus setelah waktu mulai."); return;
    }
    setError(null);

    const orgId = activeOrganization?.id ?? user?.organization?.id ?? (localStorage.getItem("msdc_active_org_id") ? Number(localStorage.getItem("msdc_active_org_id")) : 1);

    createBooking.mutate({
      organization_id: orgId,
      facility_id: Number(facilityId),
      requested_by: requester.id,
      requester_name: requester.full_name,
      purpose: purpose.trim(),
      start_at: start.toISOString(),
      end_at: end.toISOString(),
    }, {
      onSuccess: onClose,
      onError: e => setError(extractErrorMessage(e)),
    });
  }

  return (
    <Modal title="Pinjam Fasilitas" onClose={onClose} maxWidth={480}>
      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Fasilitas *</label>
        <select
          className="input"
          style={{ width: "100%" }}
          value={facilityId}
          onChange={e => setFacilityId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">{isLoadingFacilities ? "Memuat fasilitas..." : "— Pilih Fasilitas —"}</option>
          {facilities?.map(f => (
            <option key={f.id} value={f.id}>
              {f.name} {f.location ? `(${f.location})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Peminjam *</label>
        {!requester && !pickingRequester && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => setPickingRequester(true)}
          >
            + Pilih Peminjam
          </button>
        )}
        {(!requester || pickingRequester) && pickingRequester ? (
          <EmployeePicker
            onSelect={emp => { setRequester(emp); setPickingRequester(false); }}
            onCancel={() => setPickingRequester(false)}
          />
        ) : requester ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.7rem", background: "var(--bg-subtle, #f8fafc)", borderRadius: 6, border: "1px solid #e2e8f0" }}>
            <div style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>{requester.full_name}</div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem" }}
              onClick={() => setPickingRequester(true)}
            >
              Ganti
            </button>
          </div>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label className="input-label">Waktu Mulai *</label>
          <input
            className="input"
            type="datetime-local"
            style={{ width: "100%" }}
            value={startAt}
            min={minDateTime}
            onChange={e => handleStartAtChange(e.target.value)}
          />
        </div>
        <div>
          <label className="input-label">Waktu Selesai *</label>
          <input
            className="input"
            type="datetime-local"
            style={{ width: "100%" }}
            value={endAt}
            min={startAt || minDateTime}
            onChange={e => setEndAt(e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Keperluan *</label>
        <textarea
          className="input"
          style={{ width: "100%", minHeight: 70 }}
          value={purpose}
          onChange={e => setPurpose(e.target.value)}
          placeholder="mis. Rapat mingguan tim operasional JTV"
        />
      </div>

      {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn btn-primary" disabled={createBooking.isPending} onClick={handleSubmit}>
          {createBooking.isPending ? "Mengajukan..." : "Ajukan Peminjaman"}
        </button>
      </div>
    </Modal>
  );
}

