import { useState } from "react";
import { UserCheck, Loader2, Check } from "lucide-react";
import { useUserList } from "@modules/core-platform/api/useUsers";
import { Modal } from "@shared/components/Modal";
import { useAssignTicket } from "../api/useTickets";
import { extractErrorMessage } from "@shared/types/api";
import type { Ticket } from "../types/ticket";

/** assigned_to di dc_ticket adalah users.id (akun login), BUKAN
 * hr_employee.id - beda dengan Support Ticket-nya HR yang assign ke
 * Employee. Lihat Ticket::assignee() di backend. */
export function AssignTicketModal({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: results, isLoading } = useUserList({ search: search || undefined, per_page: 10 });
  const assignMutation = useAssignTicket(ticket.id);

  function handleAssign(userId: number) {
    setError(null);
    assignMutation.mutate(userId, {
      onSuccess: onClose,
      onError: (e: unknown) => {
        setError(extractErrorMessage(e));
      },
    });
  }

  return (
    <Modal
      title={`Tugaskan PIC — ${ticket.ticket_number}`}
      onClose={assignMutation.isPending ? () => {} : onClose}
      maxWidth={480}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Info PIC Saat Ini */}
        <div>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary, #64748B)" }}>
            <UserCheck size={14} className="text-amber-600" /> PIC Saat Ini
          </div>
          <div style={{ fontSize: "0.85rem", color: ticket.assignee ? "var(--text-primary)" : "#94a3b8", padding: "0.55rem 0.75rem", background: "var(--bg-subtle, #f8fafc)", border: "1px solid #e2e8f0", borderRadius: 8 }}>
            {ticket.assignee?.name ?? "Belum ditugaskan"}
          </div>
        </div>

        {/* Input Cari User */}
        <div>
          <label className="input-label">Cari Calon PIC</label>
          <input
            className="input"
            autoFocus
            placeholder="Ketik nama atau email user (min 2 huruf)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={assignMutation.isPending}
            style={{ width: "100%" }}
          />

          {search.length >= 2 && (
            <div style={{ marginTop: 8, border: "1px solid var(--border, #e2e8f0)", borderRadius: 8, maxHeight: 200, overflowY: "auto", background: "white" }}>
              {isLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.75rem", fontSize: "0.8rem", color: "var(--grey, #64748b)" }}>
                  <Loader2 size={14} className="animate-spin text-amber-500" />
                  <span>Mencari user...</span>
                </div>
              )}
              {!isLoading && (results?.data.length ?? 0) === 0 && (
                <div style={{ padding: "0.75rem", fontSize: "0.8rem", color: "var(--grey, #64748b)" }}>
                  User tidak ditemukan.
                </div>
              )}
              {!isLoading &&
                results?.data.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  const isCurrentPic = ticket.assigned_to === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      disabled={assignMutation.isPending}
                      onClick={() => setSelectedUser(u)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        textAlign: "left",
                        padding: "0.6rem 0.85rem",
                        border: "none",
                        borderBottom: "1px solid #f1f5f9",
                        background: isSelected ? "#fffbeb" : "transparent",
                        cursor: assignMutation.isPending ? "not-allowed" : "pointer",
                        fontSize: "0.85rem",
                        transition: "background-color 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: isSelected ? 600 : 500, color: isSelected ? "#b45309" : "#1e293b" }}>
                          {u.name} {isCurrentPic && <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "normal" }}>(PIC Aktif)</span>}
                        </span>
                        <span style={{ color: "#64748b", fontSize: "0.74rem" }}>{u.email}</span>
                      </div>
                      {isSelected && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#d97706" }}>
                          {assignMutation.isPending ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Check size={16} strokeWidth={2.5} />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Selected User Banner */}
        {selectedUser && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0.75rem", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, fontSize: "0.8rem" }}>
            <span style={{ color: "#92400e" }}>
              Akan ditugaskan ke: <strong>{selectedUser.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              disabled={assignMutation.isPending}
              style={{ border: "none", background: "none", color: "#b45309", cursor: assignMutation.isPending ? "not-allowed" : "pointer", fontSize: "0.75rem", fontWeight: 600 }}
            >
              Batal Pilih
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{ padding: "0.6rem 0.75rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#b91c1c", fontSize: "0.8rem" }}>
            {error}
          </div>
        )}

        {/* Footer Tombol Aksi */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            disabled={!selectedUser || assignMutation.isPending || selectedUser.id === ticket.assigned_to}
            onClick={() => selectedUser && handleAssign(selectedUser.id)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E59B00] hover:bg-[#D48F00] active:bg-[#c28100] text-white text-xs sm:text-sm font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Menugaskan PIC...</span>
              </>
            ) : (
              <span>Tugaskan PIC</span>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={assignMutation.isPending}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
        </div>
      </div>
    </Modal>
  );
}
