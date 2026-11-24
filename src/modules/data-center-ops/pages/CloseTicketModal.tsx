import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { useUpdateTicketStatus } from "../api/useTickets";
import { extractErrorMessage } from "@shared/types/api";
import type { Ticket } from "../types/ticket";

/**
 * Menutup ticket WAJIB menyertakan tindakan apa yang dilakukan
 * (resolution_action) - divalidasi juga di backend
 * (TicketService::updateStatus()), modal ini cuma UI-nya.
 */
export function CloseTicketModal({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const [action, setAction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const statusMutation = useUpdateTicketStatus(ticket.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!action.trim()) { setError("Tindakan yang dilakukan wajib diisi untuk menutup ticket."); return; }
    setError(null);

    try {
      await statusMutation.mutateAsync({ status: "closed", resolutionAction: action.trim() });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      title={`Tutup Ticket — ${ticket.ticket_number}`}
      onClose={statusMutation.isPending ? () => {} : onClose}
      maxWidth={480}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ fontSize: "0.82rem", color: "var(--grey)" }}>
          {ticket.subject}
        </div>
        <div>
          <label className="input-label">Tindakan yang Dilakukan *</label>
          <textarea
            className="input"
            rows={4}
            autoFocus
            placeholder="mis. Restart switch port 12, konektivitas sudah normal kembali."
            value={action}
            onChange={e => setAction(e.target.value)}
            disabled={statusMutation.isPending}
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>

        {error && <div className="input-error">{error}</div>}

        <div className="flex items-center gap-2.5 pt-3">
          <button
            type="submit"
            disabled={statusMutation.isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E59B00] hover:bg-[#D48F00] active:bg-[#c28100] text-white text-xs sm:text-sm font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {statusMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Menutup Tiket...</span>
              </>
            ) : (
              <span>Tutup Tiket</span>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={statusMutation.isPending}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
        </div>
      </form>
    </Modal>
  );
}
