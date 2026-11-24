import { PageHeader } from "@shared/components/PageHeader";
import { useState } from "react";
import { Bell, CheckCheck, Search, Settings, ArrowUpRight, RotateCw, Mail, MessageSquare, Smartphone, Slack, Send, CheckCircle2, History, Inbox, SlidersHorizontal, Info } from "lucide-react";
import { apiClient } from "@shared/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LoadingState } from "@shared/components/LoadingState";
import { Button } from "@shared/components/Button";
import { formatDate } from "@shared/lib/format";
import { useAuth } from "@shared/lib/auth-context";
import { useNotificationChannelList } from "../api/useNotificationChannels";
import { ChannelConfigEditModal } from "./ChannelConfigEditModal";
import type { NotificationChannelConfig } from "../types/notificationChannel";
import type { PaginatedResponse } from "@shared/types/api";

const CHANNEL_LABEL: Record<string, { name: string; icon: React.ReactNode; color: string; bg: string }> = {
  email: { name: "Email", icon: <Mail size={15} />, color: "text-blue-600", bg: "bg-blue-50" },
  sms: { name: "SMS", icon: <MessageSquare size={15} />, color: "text-emerald-600", bg: "bg-emerald-50" },
  whatsapp: { name: "WhatsApp", icon: <MessageSquare size={15} />, color: "text-emerald-500", bg: "bg-emerald-50" },
  push: { name: "Push Notification", icon: <Smartphone size={15} />, color: "text-amber-600", bg: "bg-amber-50" },
  telegram: { name: "Telegram", icon: <Send size={15} />, color: "text-sky-500", bg: "bg-sky-50" },
  slack: { name: "Slack", icon: <Slack size={15} />, color: "text-violet-600", bg: "bg-violet-50" },
  teams: { name: "Microsoft Teams", icon: <MessageSquare size={15} />, color: "text-indigo-600", bg: "bg-indigo-50" },
  in_app: { name: "In-App", icon: <Inbox size={15} />, color: "text-slate-700", bg: "bg-slate-100" },
};

interface NotificationEntry {
  id: number;
  title: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export function NotificationCenterPage() {
  const [tab, setTab] = useState<"inbox" | "history" | "channels">("inbox");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canManageChannels = hasPermission("notification.manage");

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notificationsInbox"] as const,
    queryFn: () => apiClient.get<{ data: PaginatedResponse<NotificationEntry> }>("/v1/core-platform/notifications/in-app", { params: { per_page: 100 } }).then(r => r.data.data.data),
    refetchInterval: 60_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/v1/core-platform/notifications/in-app/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificationsInbox"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.post("/v1/core-platform/notifications/in-app/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificationsInbox"] }),
  });

  const unread = (notifications ?? []).filter(n => !n.read_at);
  const read = (notifications ?? []).filter(n => !!n.read_at);
  const displayed = tab === "inbox" ? unread : read;
  const filtered = displayed.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
      <PageHeader
        title="Notification Center"
        subtitle="Notifikasi dalam aplikasi — inbox dan riwayat terintegrasi."
      />
      <div className="px-7 py-5 space-y-6">
        {/* Grid 4 Kartu Metrik ala DataOps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Bell size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">TOTAL NOTIFIKASI</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{(notifications ?? []).length}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Semua Pesan Masuk</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Inbox size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">BELUM DIBACA</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{unread.length}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Perlu Perhatian</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCheck size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">SUDAH DIBACA</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{read.length}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Tersimpan di Riwayat</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Settings size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">SALURAN / CHANNEL</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">8 Channel</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Email, WA, Push, In-App</span>
              </div>
            </div>
          </div>
        </div>

      {/* Main Card Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 pt-2 bg-slate-50/50">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => { setTab("inbox"); setSearch(""); }}
              className={`inline-flex items-center gap-2 py-4 px-1 text-sm font-bold border-b-2 transition ${
                tab === "inbox" ? "text-amber-600 border-t-transparent border-x-transparent border-b-amber-500 -mb-px focus:outline-none focus:ring-0" : "text-slate-500 border-transparent hover:text-slate-800"
              }`}
            >
              <Bell size={16} className={tab === "inbox" ? "text-amber-500" : "text-slate-400"} />
              <span>Inbox</span>
              {unread.length > 0 && (
                <span className={`ml-1 px-2 py-0.5 text-[11px] font-bold rounded-full ${
                  tab === "inbox" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"
                }`}>
                  {unread.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setTab("history"); setSearch(""); }}
              className={`inline-flex items-center gap-2 py-4 px-1 text-sm font-bold border-b-2 transition ${
                tab === "history" ? "text-amber-600 border-t-transparent border-x-transparent border-b-amber-500 -mb-px focus:outline-none focus:ring-0" : "text-slate-500 border-transparent hover:text-slate-800"
              }`}
            >
              <History size={16} className={tab === "history" ? "text-amber-500" : "text-slate-400"} />
              <span>History</span>
              {read.length > 0 && (
                <span className={`ml-1 px-2 py-0.5 text-[11px] font-bold rounded-full ${
                  tab === "history" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"
                }`}>
                  {read.length}
                </span>
              )}
            </button>
            {canManageChannels && (
              <button
                onClick={() => { setTab("channels"); setSearch(""); }}
                className={`inline-flex items-center gap-2 py-4 px-1 text-sm font-bold border-b-2 transition ${
                  tab === "channels" ? "text-amber-600 border-t-transparent border-x-transparent border-b-amber-500 -mb-px focus:outline-none focus:ring-0" : "text-slate-500 border-transparent hover:text-slate-800"
                }`}
              >
                <SlidersHorizontal size={16} className={tab === "channels" ? "text-amber-500" : "text-slate-400"} />
                <span>Pengaturan Channel</span>
              </button>
            )}
          </div>
          <div className="hidden sm:flex items-center text-xs text-slate-500 gap-3">
            <span>Sinkronisasi otomatis setiap 60s</span>
            <button className="btn btn-secondary text-xs py-1.5 px-3" onClick={() => qc.invalidateQueries({ queryKey: ["notificationsInbox"] })}>
              <RotateCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {tab === "channels" ? (
          <ChannelConfigPanel />
        ) : (
          <>
            {/* Search, Filter & Actions Toolbar */}
            <div className="p-5 border-b border-slate-200 bg-white">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-lg">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search size={16} />
                  </span>
                  <input 
                    className="w-full pl-9 pr-4 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition" 
                    placeholder="Cari notifikasi berdasarkan subjek..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2.5">
                  {tab === "inbox" && (
                    <button 
                      onClick={() => markAllReadMutation.mutate()} 
                      disabled={unread.length === 0 || markAllReadMutation.isPending}
                      className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg border transition-colors ${
                        unread.length === 0 
                          ? "text-slate-400 bg-slate-100 cursor-not-allowed border-slate-200" 
                          : "text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200 cursor-pointer"
                      }`}
                    >
                      <CheckCheck size={16} />
                      <span>Tandai Semua Dibaca</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isLoading && <LoadingState />}

            {!isLoading && filtered.length === 0 && (
              <div className="py-16 px-6 flex flex-col items-center justify-center text-center max-w-xl mx-auto">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/80 shadow-inner">
                    {tab === "inbox" ? <CheckCircle2 size={48} className="text-slate-400 stroke-[1.5]" /> : <History size={48} className="text-slate-400 stroke-[1.5]" />}
                  </div>
                  {tab === "inbox" && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-md">
                      <CheckCheck size={16} className="stroke-[3]" />
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{tab === "inbox" ? "Tidak Ada Notifikasi Baru" : "Tidak Ada Riwayat"}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  {tab === "inbox" 
                    ? "Semua notifikasi masuk sudah dibaca atau diarsipkan. Notifikasi baru akan muncul di sini secara real-time."
                    : "Belum ada riwayat notifikasi yang sesuai dengan filter pencarian Anda."
                  }
                </p>
                {tab === "inbox" && read.length > 0 && (
                  <Button onClick={() => setTab("history")}>
                    <History size={16} />
                    <span>Buka Riwayat Notifikasi</span>
                  </Button>
                )}
              </div>
            )}

            {!isLoading && filtered.length > 0 && (
              <div className="divide-y divide-slate-100">
                {filtered.map(n => (
                  <div key={n.id} className={`p-4 sm:px-6 sm:py-5 flex items-start gap-4 transition-colors ${!n.read_at ? "bg-amber-50/50 hover:bg-amber-50" : "bg-white hover:bg-slate-50"}`}>
                    <div className="mt-1">
                      {!n.read_at ? (
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50 ring-4 ring-amber-100" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <h4 className={`text-sm truncate pr-4 ${!n.read_at ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                          {n.title}
                        </h4>
                        <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded-md self-start sm:self-auto">
                          {formatDate(n.created_at)}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${!n.read_at ? "text-slate-700 font-medium" : "text-slate-500"}`}>
                        {n.body}
                      </p>
                      
                      {!n.read_at && (
                        <div className="mt-3">
                          <button 
                            onClick={() => markReadMutation.mutate(n.id)}
                            className="text-[11px] font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 bg-white border border-amber-200 hover:border-amber-300 px-2.5 py-1 rounded shadow-sm transition-colors"
                          >
                            <CheckCheck size={14} /> Tandai Dibaca
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Info Footer for Inbox/History */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-amber-500" />
                <span><strong>Kebijakan Retensi:</strong> Log data notifikasi sistem dan approval disimpan selama 90 hari kalender.</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </main>
  );
}

function ChannelConfigPanel() {
  const { data: channels, isLoading } = useNotificationChannelList();
  const [editing, setEditing] = useState<NotificationChannelConfig | null>(null);

  if (isLoading) return <LoadingState />;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6" scope="col">Channel</th>
              <th className="py-3.5 px-6" scope="col">Provider</th>
              <th className="py-3.5 px-6" scope="col">Status</th>
              <th className="py-3.5 px-6" scope="col">Setting Terisi</th>
              <th className="py-3.5 px-6 text-right" scope="col">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {(channels ?? []).map(c => {
              const meta = CHANNEL_LABEL[c.channel] || { name: c.channel, icon: <Settings size={15} />, color: "text-slate-600", bg: "bg-slate-100" };
              
              return (
                <tr key={c.id} className="hover:bg-slate-50/75 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-md ${meta.bg} ${meta.color} flex items-center justify-center`}>
                      {meta.icon}
                    </span>
                    <span>{meta.name}</span>
                  </td>
                  <td className="py-3.5 px-6">
                    {c.provider === "not_configured" ? (
                      <span className="italic text-slate-400 font-mono text-[11px]">belum diatur</span>
                    ) : (
                      <span className="font-mono text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-medium">{c.provider}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      c.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${c.is_active ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                      {c.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-600 font-mono text-[11px]">
                    {c.config && Object.keys(c.config).length > 0 ? `${Object.keys(c.config).length} key terkonfigurasi` : "—"}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <Button variant="secondary" onClick={() => setEditing(c)}>
                      Atur
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Footer Info for Channels */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-amber-500" />
          <span><strong>Integrasi Multi-Channel Gateway:</strong> Setiap channel dapat dikonfigurasi menggunakan webhook, token API, atau server SMTP.</span>
        </div>
        <a href="#" className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 whitespace-nowrap">
          <span>Dokumentasi API Notifikasi</span>
          <ArrowUpRight size={12} />
        </a>
      </div>

      {editing && <ChannelConfigEditModal channelConfig={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

