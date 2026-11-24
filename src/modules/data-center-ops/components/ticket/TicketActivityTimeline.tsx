import React, { useState } from "react";
import { MessageSquare, Clock, Send, Loader2, User } from "lucide-react";
import type { Ticket } from "../../types/ticket";
import { useLogTicketActivity } from "../../api/useTickets";
import { formatSlaDue } from "./TicketTable";
import { extractErrorMessage } from "@shared/types/api";

export interface TicketActivityTimelineProps {
  ticket: Ticket;
  onActivityAdded?: () => void;
}

const ACTIVITY_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  comment: { label: "Komentar", bg: "bg-blue-50", text: "text-blue-700" },
  remote_hands_task: { label: "Remote Hands", bg: "bg-sky-50", text: "text-sky-700" },
  escalation: { label: "Eskalasi", bg: "bg-rose-50", text: "text-rose-700" },
};

export const TicketActivityTimeline: React.FC<TicketActivityTimelineProps> = ({
  ticket,
  onActivityAdded,
}) => {
  const [activityType, setActivityType] = useState(
    ticket.ticket_type === "remote_hands" ? "remote_hands_task" : "comment"
  );
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const logActivityMutation = useLogTicketActivity(ticket.id);
  const isRemoteHands = activityType === "remote_hands_task";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Deskripsi catatan wajib diisi.");
      return;
    }
    if (isRemoteHands && (!durationMinutes || Number(durationMinutes) < 1)) {
      setError("Durasi waktu kerja (menit) wajib diisi untuk Remote Hands.");
      return;
    }
    setError(null);

    try {
      await logActivityMutation.mutateAsync({
        activity_type: activityType,
        description: description.trim(),
        duration_minutes: isRemoteHands ? Number(durationMinutes) : undefined,
      });
      setDescription("");
      setDurationMinutes("");
      onActivityAdded?.();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const activities = ticket.activities ?? [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200/80">
            <MessageSquare size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Aktivitas &amp; Log Remote Hands
            </h2>
            <p className="text-[11px] text-slate-500">
              Riwayat penanganan insiden, eskalasi &amp; jam kerja teknisi on-site
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {activities.length} Catatan
        </span>
      </div>

      {/* ── Form Tambah Catatan Cepat ── */}
      <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Jenis:
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="comment">Komentar / Catatan NOC</option>
              <option value="remote_hands_task">Remote Hands (Jam Kerja)</option>
              <option value="escalation">Eskalasi ke Vendor / L2</option>
            </select>
          </div>

          {isRemoteHands && (
            <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
              <Clock size={13} className="text-sky-600" />
              <label className="text-[11px] font-bold text-slate-700">
                Durasi:
              </label>
              <input
                type="number"
                min="1"
                placeholder="mis. 30"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-20 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-[11px] text-slate-500">menit</span>
            </div>
          )}
        </div>

        <div>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              isRemoteHands
                ? "Rincian tindakan remote hands (mis. Cabut kabel patch fiber rack A04 port 2, bersihkan konektor optic...)"
                : "Tuliskan catatan progres atau update penanganan..."
            }
            className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
          />
        </div>

        {error && (
          <div className="text-xs text-rose-600 font-medium">{error}</div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={logActivityMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#E59B00] hover:bg-[#d48e00] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {logActivityMutation.isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Simpan Aktivitas</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Timeline Aktivitas ── */}
      <div className="flex flex-col gap-3 pt-2">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Belum ada aktivitas yang dicatat pada tiket ini.
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activities.map((act) => {
              const actStyle =
                ACTIVITY_LABELS[act.activity_type] ?? ACTIVITY_LABELS.comment;
              const dateInfo = formatSlaDue(act.created_at);

              return (
                <div key={act.id} className="relative group">
                  {/* Dot on timeline */}
                  <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-amber-500 shadow-2xs" />

                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${actStyle.bg} ${actStyle.text} border-current/20`}
                        >
                          {actStyle.label}
                        </span>

                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <User size={11} className="text-slate-400" />
                          {act.user?.name ?? "Teknisi NOC"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {act.duration_minutes && act.duration_minutes > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold text-[10px]">
                            <Clock size={10} />
                            <span>{act.duration_minutes} Menit</span>
                          </span>
                        )}

                        <span className="text-slate-400 font-mono text-[10px]">
                          {dateInfo.formatted}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
                      {act.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketActivityTimeline;
