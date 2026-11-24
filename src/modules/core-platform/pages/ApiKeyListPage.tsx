import { PageHeader } from "@shared/components/PageHeader";
import { useState } from "react";
import { 
  Shield, Trash2, Edit2, Zap, Server, Activity, 
  ChevronDown, ChevronUp, Plus, Fingerprint, Network, Info
} from "lucide-react";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import { Pagination } from "@shared/components/Pagination";
import { Button } from "@shared/components/Button";
import { useApiKeyList, useRevokeApiKey, useDeleteApiKey } from "../api/useApiKeys";
import { ApiKeyCreateModal } from "./ApiKeyCreateModal";
import { ApiKeyEditIpsModal } from "./ApiKeyEditIpsModal";
import type { ApiKey } from "../types/apiKey";

export function ApiKeyListPage() {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  
  // Accordion state
  const [showGuide, setShowGuide] = useState(false);
  const [showIotGuide, setShowIotGuide] = useState(false);
  
  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useApiKeyList({ page, per_page: 20 });
  const revoke = useRevokeApiKey();
  const del = useDeleteApiKey();

  function handleRevoke(key: ApiKey) {
    if (!confirm(`Cabut API key "${key.name}"? Semua request yang pakai key ini akan langsung ditolak (Unauthorized 401).`)) return;
    revoke.mutate(key.id);
  }

  function handleDelete(key: ApiKey) {
    if (!confirm(`Hapus permanen API key "${key.name}"? Ini tidak bisa dikembalikan.`)) return;
    del.mutate(key.id);
  }

  // Client-side filtering
  const filteredData = (data?.data ?? []).filter(key => {
    if (search && !key.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === "active" && !key.is_active) return false;
    if (statusFilter === "revoked" && key.is_active) return false;
    return true;
  });

  const activeKeysCount = (data?.data ?? []).filter(k => k.is_active).length;
  const ipRestrictedCount = (data?.data ?? []).filter(k => k.allowed_ips && k.allowed_ips.length > 0).length;

  return (
    <main className="w-full bg-slate-50 min-h-screen">
      <PageHeader
        title="API Key & IoT Access"
        subtitle="Manajemen key integrasi eksternal, webhook, dan akses gateway sensor IoT."
      />
      <div className="px-7 py-5 space-y-6">
        {/* Grid 4 Kartu Metrik ala DataOps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Zap size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">TOTAL API KEYS</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{data?.total ?? 0}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>Kunci Integrasi Terdaftar</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">AKTIF DIGUNAKAN</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{activeKeysCount}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Siap Menerima Request</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Network size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">IP RESTRICTED</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{ipRestrictedCount}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Kebijakan Whitelist Aktif</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Server size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">IOT ACCESS READY</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">mTLS / Key</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Gateway Sensor Terhubung</span>
              </div>
            </div>
          </div>
        </div>

      {/* ===== GUIDES & DOCUMENTATION (STACKED BERURUT KE BAWAH) ===== */}
      <div className="flex flex-col space-y-4">
        
        {/* API Integration Guide */}
        <div className={`bg-white rounded-xl border transition-all ${showGuide ? 'border-amber-300 shadow-md ring-4 ring-amber-500/10' : 'border-slate-200 shadow-sm'}`}>
          <button onClick={() => setShowGuide(!showGuide)} className="w-full flex items-center justify-between p-4 focus:outline-none">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                <Shield size={18} />
              </div>
              <span className="font-bold text-sm text-slate-800">Panduan Keamanan & Integrasi API</span>
            </div>
            {showGuide ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </button>
          
          {showGuide && (
            <div className="px-5 pb-5 text-xs text-slate-600 border-t border-slate-100 mt-1 pt-4 space-y-3">
              <p>
                Kirim API Key pada header HTTP <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-amber-700">Authorization: Bearer [KEY]</code> di setiap request ke sistem.
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-blue-800">
                <strong>Praktik Keamanan Terbaik:</strong><br/>
                API key jangan pernah ditaruh di sisi <em>client</em> (browser/SPA) yang bisa dibaca publik. Fitur ini didesain khusus untuk server-to-server (backend to backend).
              </div>
              <p>Selalu batasi (Whitelist) IP Address yang diperbolehkan mengakses key ini agar bila key bocor, penyerang dari luar tetap tidak bisa masuk.</p>
            </div>
          )}
        </div>

        {/* IoT Guide */}
        <div className={`bg-white rounded-xl border transition-all ${showIotGuide ? 'border-emerald-300 shadow-md ring-4 ring-emerald-500/10' : 'border-slate-200 shadow-sm'}`}>
          <button onClick={() => setShowIotGuide(!showIotGuide)} className="w-full flex items-center justify-between p-4 focus:outline-none">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                <Server size={18} />
              </div>
              <span className="font-bold text-sm text-slate-800">Panduan Sensor IoT (Data Center)</span>
            </div>
            {showIotGuide ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </button>
          
          {showIotGuide && (
            <div className="px-5 pb-5 text-xs text-slate-600 border-t border-slate-100 mt-1 pt-4 space-y-3">
              <p>
                <strong>1.</strong> Buat key dengan label perangkat/lokasi. IP/CIDR wajib diset ke IP publik gateway sensor tersebut.
              </p>
              <p>
                <strong>2.</strong> Gunakan header <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-emerald-700">X-API-Key</code> di firmware sensor (misal: ESP32/Raspberry Pi) saat hit endpoint:
              </p>
              <div className="bg-slate-900 text-slate-300 p-3 rounded-lg font-mono text-[10px] leading-relaxed shadow-inner">
                <div className="text-amber-400 font-bold mb-1">POST /api/v1/data-center-ops/iot/metric-readings</div>
                {`-> body: { site_id?, device_id?, rack_id?, metric_type, value, unit?, recorded_at? }\n`}
                {`-> (site_id / device_id / rack_id: salah satu WAJIB diisi)`}\n
                {`-> metric_type: power_kw, voltage, temperature, humidity, cpu_pct...`}
              </div>
              <div className="flex items-start gap-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 text-emerald-700">
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>Setiap data yang masuk akan otomatis dicek limit Threshold-nya untuk triggering Alarm Monitoring.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== MAIN TABLE SECTION ===== */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Toolbar */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Cari nama API Key..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 text-xs rounded-lg border-slate-200 px-3 py-1.5 focus:border-amber-500 focus:ring-amber-500 bg-slate-50 placeholder-slate-400" 
            />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border-slate-200 py-1.5 pl-3 pr-8 focus:border-amber-500 focus:ring-amber-500 bg-slate-50 text-slate-600"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="revoked">Dicabut (Revoked)</option>
            </select>
          </div>
          
          <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto inline-flex items-center gap-1.5">
            <Plus size={16} />
            <span>API Key Baru</span>
          </Button>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <LoadingState />
        ) : filteredData.length === 0 ? (
          <EmptyState title="Tidak Ada Data API Key" subtitle="Belum ada kunci integrasi yang dibuat atau tidak cocok dengan filter pencarian." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-extrabold tracking-wider uppercase text-slate-500">
                <tr>
                  <th className="py-3.5 px-6">NAMA & MILIK</th>
                  <th className="py-3.5 px-4">PREFIX</th>
                  <th className="py-3.5 px-4">IP DIIZINKAN (WHITELIST)</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4">TERAKHIR DIPAKAI</th>
                  <th className="py-3.5 px-6 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs bg-white">
                {filteredData.map(key => (
                  <tr key={key.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 shrink-0 flex items-center justify-center">
                          <Fingerprint size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{key.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 max-w-[200px] truncate" title={key.owner_description ?? undefined}>
                            {key.owner_description ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-mono text-slate-600 font-semibold bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {key.key_prefix}•••
                      </span>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      {key.allowed_ips && key.allowed_ips.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {key.allowed_ips.map(ip => (
                            <span key={ip} className="font-mono text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                              {ip}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] italic text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          Tanpa batasan IP (Publik)
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {key.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          Dicabut
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-[11px] text-slate-500">
                      {key.last_used_at ? key.last_used_at.split(" ")[0] : <span className="italic">Belum pernah</span>}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {key.is_active && (
                          <>
                            <Button variant="secondary" onClick={() => setEditingKey(key)} className="px-2.5 py-1 text-[10px] gap-1.5">
                              <Edit2 size={12} /> Edit IP
                            </Button>
                            <Button variant="secondary" onClick={() => handleRevoke(key)} disabled={revoke.isPending} className="px-2.5 py-1 text-[10px] gap-1.5 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200">
                              Cabut
                            </Button>
                          </>
                        )}
                        <Button variant="danger" onClick={() => handleDelete(key)} disabled={del.isPending} className="px-2.5 py-1 text-[10px] gap-1.5">
                          <Trash2 size={12} /> Hapus
                        </Button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/60">
          <Pagination currentPage={data?.current_page ?? 1} lastPage={data?.last_page ?? 1} total={data?.total ?? 0} onPageChange={setPage} />
        </div>
      </section>

      {/* Modals */}
      {showCreate && <ApiKeyCreateModal onClose={() => setShowCreate(false)} />}
      {editingKey && <ApiKeyEditIpsModal apiKey={editingKey} onClose={() => setEditingKey(null)} />}
    </div>
    </main>
  );
}