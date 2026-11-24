import { useState, useEffect, type FormEvent } from "react";
import { 
  BellRing, X, Plus, Globe, CheckCircle2, Trash2, 
  Send, RefreshCw, AlertCircle, Radio
} from "lucide-react";
import { apiClient } from "@shared/lib/api-client";
import { extractErrorMessage } from "@shared/types/api";

interface WebhookItem {
  id: number | string;
  name: string;
  target_url: string;
  url?: string;
  event_types?: string[] | string;
  events: string[] | string;
  is_active?: boolean;
  created_at?: string;
}

interface WebhookConfigModalProps {
  onClose: () => void;
}

const AVAILABLE_EVENTS = [
  { key: "workflow.submitted", label: "Dokumen Diajukan (Submitted)", desc: "Dipicu saat pemohon baru mengirim berkas approval" },
  { key: "workflow.approved", label: "Dokumen Disetujui (Approved)", desc: "Dipicu saat tier approver menyetujui dokumen" },
  { key: "workflow.rejected", label: "Dokumen Ditolak (Rejected)", desc: "Dipicu saat tier approver menolak berkas" },
];

export function WebhookConfigModal({ onClose }: WebhookConfigModalProps) {
  // State Data
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State Form
  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "workflow.submitted",
    "workflow.approved",
    "workflow.rejected",
  ]);

  // Helper untuk panggil endpoint backend
  async function fetchWebhooks() {
    setIsLoading(true);
    setError(null);
    try {
      // apiClient otomatis menggabungkan baseURL (/api) + /v1/core-platform/webhooks
      const res = await apiClient.get("/v1/core-platform/webhooks");
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setWebhooks(data);
    } catch (err: unknown) {
      // Fallback jika backend terdaftar langsung di /api/v1/...
      try {
        const fallbackRes = await apiClient.get("/api/v1/core-platform/webhooks");
        const data = Array.isArray(fallbackRes.data) ? fallbackRes.data : (fallbackRes.data?.data ?? []);
        setWebhooks(data);
      } catch {
        setError(extractErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchWebhooks();
  }, []);

  function handleToggleEvent(eventKey: string) {
    setSelectedEvents((prev) =>
      prev.includes(eventKey)
        ? prev.filter((k) => k !== eventKey)
        : [...prev, eventKey]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama webhook wajib diisi.");
      return;
    }
    if (!targetUrl.trim() || (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://"))) {
      setError("Target URL harus berupa tautan valid (diawali http:// atau https://).");
      return;
    }
    if (selectedEvents.length === 0) {
      setError("Pilih minimal satu event pemicu webhook.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      name: name.trim(),
      target_url: targetUrl.trim(),
      event_types: selectedEvents, // <-- Sudah sesuai validasi backend Laravel
      is_active: true,
    };

    try {
      try {
        await apiClient.post("/v1/core-platform/webhooks", payload);
      } catch {
        // Fallback endpoint jika route tanpa prefix axios
        await apiClient.post("/api/v1/core-platform/webhooks", payload);
      }

      setSuccessMessage("Webhook baru berhasil didaftarkan!");
      setName("");
      setTargetUrl("");
      setSelectedEvents(["workflow.submitted", "workflow.approved", "workflow.rejected"]);
      fetchWebhooks(); // Refresh tabel
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number | string) {
    if (!confirm("Hapus webhook ini? Notifikasi bot tidak akan dikirimkan lagi ke URL ini.")) return;
    try {
      try {
        await apiClient.delete(`/v1/core-platform/webhooks/${id}`);
      } catch {
        await apiClient.delete(`/api/v1/core-platform/webhooks/${id}`);
      }
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-[#1e293b] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <BellRing size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">Konfigurasi Webhook &amp; Bot Otomatis</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Real-time Alert
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Kirim notifikasi HTTP POST otomatis ke bot Telegram, Discord, atau custom endpoint saat event terjadi.
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY AREA (DUAL COLUMN: FORM DI KIRI/ATAS, LIST DI KANAN/BAWAH) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          
          {/* NOTIFIKASI ERROR / SUKSES */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle size={16} className="text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-700 font-bold">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* KOLOM FORM INPUT (5 KOLOM) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Plus size={16} className="text-emerald-600" />
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Tambah Webhook Baru</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Webhook *</label>
                  <input
                    type="text"
                    required
                    placeholder="mis. Bot Telegram DC Surabaya"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-xs rounded-xl px-3 py-2.5 placeholder-slate-400 text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target URL Endpoint *</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="url"
                      required
                      placeholder="https://api.telegram.org/bot.../sendMessage"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-xs rounded-xl pl-9 pr-3 py-2.5 placeholder-slate-400 text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Mendukung webhook Telegram, Discord channel, atau server webhook custom internal.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Event Pemicu (Trigger) *</label>
                  <div className="space-y-2">
                    {AVAILABLE_EVENTS.map((ev) => {
                      const isChecked = selectedEvents.includes(ev.key);
                      return (
                        <label 
                          key={ev.key}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isChecked ? "bg-emerald-50/50 border-emerald-300 text-slate-800" : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleEvent(ev.key)}
                            className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <div className="font-bold text-[11px] text-slate-800">{ev.label}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{ev.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  <Send size={14} />
                  <span>{isSubmitting ? "Menyimpan Webhook..." : "Daftarkan Webhook"}</span>
                </button>
              </form>
            </div>

            {/* KOLOM TABEL DAFTAR WEBHOOK (7 KOLOM) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Radio size={16} className="text-emerald-600" />
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Webhook Aktif ({webhooks.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={fetchWebhooks}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Refresh Data"
                  >
                    <RefreshCw size={13} className={isLoading ? "animate-spin text-emerald-600" : ""} />
                  </button>
                </div>

                {isLoading && (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <RefreshCw size={20} className="animate-spin text-emerald-600 mx-auto mb-2" />
                    Memuat daftar webhook terdaftar...
                  </div>
                )}

                {!isLoading && webhooks.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                      <BellRing size={18} />
                    </div>
                    <div className="font-bold text-slate-700">Belum Ada Webhook</div>
                    <p className="text-[11px] text-slate-400">Daftarkan endpoint webhook pertama Anda menggunakan form di samping.</p>
                  </div>
                )}

                {!isLoading && webhooks.length > 0 && (
                  <div className="space-y-3">
                    {webhooks.map((item) => {
                      const rawEvents = item.event_types || item.events;
                      const eventsList = Array.isArray(rawEvents)
                      ? rawEvents
                      : typeof rawEvents === "string"
                      ? JSON.parse(rawEvents || "[]")
                      : [];

                      return (
                        <div key={item.id} className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl hover:border-emerald-300 transition-all space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-xs text-slate-900">{item.name}</div>
                              <div className="font-mono text-[10px] text-slate-500 break-all truncate max-w-sm">
                                {item.target_url || item.url}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Webhook"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {eventsList.map((ev: string) => (
                              <span key={ev} className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-white border border-slate-200 text-emerald-700">
                                {ev}
                              </span>
                            ))}
                            {eventsList.length === 0 && (
                              <span className="text-[9px] text-slate-400 italic">Semua Event</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tips Payload */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed">
                💡 <em>Payload JSON berisi detail nama template, nomor dokumen, pemohon, dan alasan persetujuan/penolakan.</em>
              </div>
            </div>

          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            HTTP POST Webhook Engine • MSDC ERP Platform
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}