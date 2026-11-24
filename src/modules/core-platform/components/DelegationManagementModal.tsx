import { useState } from "react";
import { Modal } from "@shared/components/Modal";
import { workflowApi, type WorkflowDelegation } from "../api/workflowApi";
import { useUserList } from "../api/useUsers";
import { useAuth } from "@shared/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LoadingState } from "@shared/components/LoadingState";
import { formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import {
  UserCheck,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

interface DelegationManagementModalProps {
  onClose: () => void;
}

export function DelegationManagementModal({ onClose }: DelegationManagementModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [delegateUserId, setDelegateUserId] = useState<number | "">("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Ambil daftar delegasi milik user yang sedang login
  const { data: delegationData, isLoading: loadingDelegations } = useQuery({
    queryKey: ["workflowDelegations", "mine"] as const,
    queryFn: () => workflowApi.getDelegations({ mine: 1 }).then((r) => r.data.data),
  });

  // Ambil daftar user lain sebagai kandidat deputi
  const { data: usersData, isLoading: loadingUsers } = useUserList({ per_page: 100 });

  const candidateUsers = (usersData?.data || []).filter((u) => u.id !== user?.id);

  const createMutation = useMutation({
    mutationFn: (data: { delegate_user_id: number; start_date: string; end_date: string; reason?: string }) =>
      workflowApi.createDelegation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflowDelegations"] });
      setActionSuccess("Delegasi wewenang approval berhasil diaktifkan.");
      setActionError(null);
      setIsCreating(false);
      setReason("");
      setDelegateUserId("");
    },
    onError: (err) => {
      setActionError(extractErrorMessage(err));
      setActionSuccess(null);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: number) => workflowApi.revokeDelegation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflowDelegations"] });
      setActionSuccess("Delegasi berhasil dicabut.");
      setActionError(null);
    },
    onError: (err) => {
      setActionError(extractErrorMessage(err));
      setActionSuccess(null);
    },
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!delegateUserId) {
      setActionError("Pilih rekan kerja pengganti (deputi) terlebih dahulu.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setActionError("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      return;
    }

    createMutation.mutate({
      delegate_user_id: Number(delegateUserId),
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim() || undefined,
    });
  }

  const delegations = delegationData?.data || [];

  return (
    <Modal title="Delegasi Wewenang Approval (Pjs / Out of Office)" onClose={onClose}>
      <div className="space-y-5 max-w-2xl text-slate-800">
        {/* Banner Info */}
        <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
          <UserCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Mekanisme Pejabat Pengganti Sementara (Pjs):</span>
            <p className="text-blue-700 mt-0.5">
              Selama masa aktif delegasi, setiap dokumen atau transaksi yang memerlukan persetujuan Anda akan
              secara otomatis dapat ditinjau dan ditandatangani oleh pejabat deputi yang Anda tunjuk.
            </p>
          </div>
        </div>

        {/* Notifikasi feedback */}
        {actionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Tab / Toggle Mode */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {isCreating ? "Formulir Delegasi Baru" : `Daftar Delegasi Aktif (${delegations.length})`}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsCreating((v) => !v);
              setActionError(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border shadow-xs bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
          >
            {isCreating ? (
              <span>Kembali ke Daftar</span>
            ) : (
              <>
                <Plus size={14} />
                <span>Tambah Delegasi Baru</span>
              </>
            )}
          </button>
        </div>

        {/* Mode Form Tambah Delegasi Baru */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Rekan Pengganti (Deputi Pjs) <span className="text-rose-500">*</span>
              </label>
              {loadingUsers ? (
                <div className="text-xs text-slate-400">Memuat daftar pengguna...</div>
              ) : (
                <select
                  required
                  value={delegateUserId}
                  onChange={(e) => setDelegateUserId(Number(e.target.value) || "")}
                  className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- Pilih Pejabat / Rekan Deputi --</option>
                  {candidateUsers.map((cand) => (
                    <option key={cand.id} value={cand.id}>
                      {cand.name} ({cand.email})
                    </option>
                  ))}
                </select>
              )}
              <span className="text-[11px] text-slate-400 mt-1 block">
                User yang dipilih akan memiliki hak otorisasi untuk menyetujui dokumen atas nama Anda.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Mulai <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Selesai <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan / Keperluan Delegasi (Opsional)
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Cuti Tahunan, Dinas Luar Proyek DC Surabaya, Sakit..."
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                {createMutation.isPending ? "Menyimpan..." : "Aktifkan Delegasi Wewenang"}
              </button>
            </div>
          </form>
        ) : (
          /* Mode Daftar Delegasi */
          <div className="space-y-3">
            {loadingDelegations && <LoadingState />}

            {!loadingDelegations && delegations.length === 0 && (
              <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6">
                <Clock size={32} className="mx-auto text-slate-300 mb-2" />
                <h4 className="text-xs font-bold text-slate-700">Tidak Ada Delegasi Aktif</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Anda sedang tidak mendelegasikan wewenang approval ke siapa pun. Seluruh dokumen approval akan tetap masuk langsung ke inbox pribadi Anda.
                </p>
              </div>
            )}

            {!loadingDelegations &&
              delegations.map((del: WorkflowDelegation) => {
                const isDelegator = del.delegator_user_id === user?.id;
                const isActive = del.is_active && new Date(del.end_date) >= new Date();

                return (
                  <div
                    key={del.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-200 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {isActive ? "● AKTIF" : "○ SELESAI / DICABUT"}
                        </span>
                        {isDelegator ? (
                          <span className="text-[11px] font-bold text-slate-800">
                            Deputi Pengganti: {del.delegate?.name || `User #${del.delegate_user_id}`}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-800">
                            Menerima Wewenang Dari: {del.delegator?.name || `User #${del.delegator_user_id}`}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span>
                          {formatDate(del.start_date)} <ArrowRight size={10} className="inline mx-0.5" /> {formatDate(del.end_date)}
                        </span>
                      </div>

                      {del.reason && (
                        <div className="text-[11px] text-slate-600 italic">
                          "{del.reason}"
                        </div>
                      )}
                    </div>

                    {isDelegator && del.is_active && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Cabut delegasi wewenang ini sekarang?")) {
                            revokeMutation.mutate(del.id);
                          }
                        }}
                        disabled={revokeMutation.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition self-start sm:self-auto"
                      >
                        <Trash2 size={12} />
                        <span>Cabut Delegasi</span>
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </Modal>
  );
}
