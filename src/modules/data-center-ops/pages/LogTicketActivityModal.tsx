import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { useLogTicketActivity } from "../api/useTickets";
import { extractErrorMessage } from "@shared/types/api";
import type { Ticket } from "../types/ticket";

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  comment: "Komentar",
  remote_hands_task: "Remote Hands (Jam Kerja)",
  escalation: "Eskalasi",
};

/**
 * Log aktivitas ticket - kalau tipenya "Remote Hands (Jam Kerja)", durasi
 * kerja (duration_minutes) WAJIB diisi karena inilah data mentah yang nanti
 * dikumpulkan UsageReportingService::generateRemoteHandsUsage() jadi
 * UsageRecord bulanan untuk ditagih (lihat halaman Usage Records > Generate
 * Usage Record). Tanpa entri di sini, tidak ada jam yang bisa ditagih.
 */
export function LogTicketActivityModal({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const [activityType, setActivityType] = useState(ticket.ticket_type === "remote_hands" ? "remote_hands_task" : "comment");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const logActivity = useLogTicketActivity(ticket.id);

  const isRemoteHands = activityType === "remote_hands_task";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) { setError("Deskripsi wajib diisi."); return; }
    if (isRemoteHands && (!durationMinutes || Number(durationMinutes) < 1)) {
      setError("Durasi kerja (menit) wajib diisi untuk aktivitas Remote Hands.");
      return;
    }
    setError(null);

    try {
      await logActivity.mutateAsync({
        activity_type: activityType,
        description: description.trim(),
        duration_minutes: isRemoteHands ? Number(durationMinutes) : undefined,
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      title={`Catat Aktivitas — ${ticket.ticket_number}`}
      onClose={logActivity.isPending ? () => {} : onClose}
      maxWidth={480}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="input-label">Jenis Aktivitas</label>
          <select
            className="input"
            value={activityType}
            onChange={e => setActivityType(e.target.value)}
            disabled={logActivity.isPending}
            style={{ width: "100%" }}
          >
            {Object.entries(ACTIVITY_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Deskripsi *</label>
          <textarea
            className="input"
            rows={3}
            autoFocus
            placeholder={isRemoteHands ? "mis. Restart switch port 12, cek konektivitas ulang" : "mis. Sudah dihubungi customer, menunggu konfirmasi"}
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={logActivity.isPending}
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>

        {isRemoteHands && (
          <div>
            <label className="input-label">Durasi Kerja (menit) *</label>
            <input
              className="input"
              type="number"
              min={1}
              placeholder="mis. 45"
              value={durationMinutes}
              onChange={e => setDurationMinutes(e.target.value)}
              disabled={logActivity.isPending}
              style={{ width: 160 }}
            />
            <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
              Dipakai untuk hitung Usage Record Remote Hands bulanan (Usage Records → Generate).
            </div>
          </div>
        )}

        {error && <div className="input-error">{error}</div>}

        <div className="flex items-center gap-2.5 pt-3">
          <button
            type="submit"
            disabled={logActivity.isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E59B00] hover:bg-[#D48F00] active:bg-[#c28100] text-white text-xs sm:text-sm font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {logActivity.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Mencatat Aktivitas...</span>
              </>
            ) : (
              <span>Catat Aktivitas</span>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={logActivity.isPending}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
        </div>
      </form>
    </Modal>
  );
}
