import { useState } from "react";
import { Plus, Search, RefreshCw, Settings, Edit, FileText, CheckCircle2, ShieldCheck, Layers } from "lucide-react";
import { LoadingState } from "@shared/components/LoadingState";
import { Modal } from "@shared/components/Modal";
import { extractErrorMessage } from "@shared/types/api";
import { useAuth } from "@shared/lib/auth-context";
import { useDocumentTypes, useSaveDocumentType, useDocumentTemplates } from "../api/useDocuments";
import { MODULE_LABELS } from "../types/document";
import type { DocumentTypeOption, DocumentDirection } from "../types/document";
import { PageHeader } from "@shared/components/PageHeader";

const DIRECTION_LABELS: Record<DocumentDirection, string> = { masuk: "Masuk", keluar: "Keluar", internal: "Internal" };

export function DocumentTypeListPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("template.manage");
  const { data: types, isLoading, refetch } = useDocumentTypes();
  const [editing, setEditing] = useState<DocumentTypeOption | "new" | null>(null);
  
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");

  const filteredTypes = types?.filter(t => {
    const matchSearch = t.label.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase());
    const matchModule = moduleFilter ? t.meta.module === moduleFilter : true;
    return matchSearch && matchModule;
  });

  // Metrik KPI ala DataOps
  const totalTypes = types?.length ?? 0;
  const activeTypes = types?.filter(t => t.is_active).length ?? 0;
  const approvalRequiredTypes = types?.filter(t => t.meta.requires_approval ?? true).length ?? 0;
  const totalModules = new Set(types?.map(t => t.meta.module).filter(Boolean)).size;

  return (
    <main className="w-full bg-slate-50 min-h-screen font-sans">
      <PageHeader title="Kelola Jenis Surat" subtitle="Atur jenis surat & modul mana yang menampilkannya — tambah jenis baru di sini TANPA perlu deploy kode baru." />
      <div className="px-7 py-5 space-y-6">

        {/* Grid 4 Kartu Metrik ala DataOps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">TOTAL JENIS</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{totalTypes}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Kategori Terdaftar</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">JENIS AKTIF</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{activeTypes}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Dapat Dipilih User</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">WAJIB APPROVAL</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{approvalRequiredTypes}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Butuh Persetujuan</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">CAKUPAN MODUL</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{totalModules}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Modul Terhubung</span>
              </div>
            </div>
          </div>
        </div>
      {/* END: Page Header & KPI Cards */}

      {/* MainCard */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </div>
              <input 
                type="text"
                className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none" 
                placeholder="Cari jenis surat atau kode..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="relative w-48 shrink-0">
              <select 
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                value={moduleFilter}
                onChange={e => setModuleFilter(e.target.value)}
              >
                <option value="">Semua Modul</option>
                {Object.entries(MODULE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <button onClick={() => { setSearch(""); setModuleFilter(""); refetch(); }} className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors" title="Refresh data">
              <RefreshCw size={16} />
            </button>
          </div>
          {canManage && (
            <button onClick={() => setEditing("new")} className="btn btn-primary w-full md:w-auto px-4 py-2 text-xs shadow-sm shrink-0">
              <Plus size={16} strokeWidth={2.5} />
              <span>Jenis Surat Baru</span>
            </button>
          )}
        </div>

        {isLoading && <LoadingState />}

        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Kode</th>
                  <th className="py-3.5 px-5">Label</th>
                  <th className="py-3.5 px-4">Arah</th>
                  <th className="py-3.5 px-5">Modul</th>
                  <th className="py-3.5 px-4">Prefix Nomor</th>
                  <th className="py-3.5 px-4">Approval Atasan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredTypes?.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">{t.code}</span>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-900">{t.label}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${t.meta.direction === 'masuk' ? 'bg-blue-50 text-blue-700 border-blue-200' : t.meta.direction === 'keluar' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-purple-50 text-purple-700 border-purple-200'} border`}>
                        {DIRECTION_LABELS[t.meta.direction]}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-600">
                      {t.meta.module ? <span className="text-slate-800 font-medium block">{MODULE_LABELS[t.meta.module] ?? t.meta.module}</span> : "—"}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] border border-slate-200">{t.meta.prefix}</span>
                    </td>
                    <td className="py-4 px-4">
                      {(t.meta.requires_approval ?? true) ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold">Wajib</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">Tanpa Approval</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${t.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'} border`}>
                        {t.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {canManage && (
                        <button onClick={() => setEditing(t)} className="px-2.5 py-1 text-xs font-semibold rounded text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center gap-1 border-none">
                          <Edit size={12} /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Info Tip */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 flex items-start gap-3.5">
        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg shrink-0 mt-0.5">
          <Settings size={16} />
        </div>
        <div className="text-xs text-blue-900 leading-relaxed">
          <span className="font-bold">Tips Konfigurasi Dinamis:</span> Setiap perubahan pada jenis surat atau penambahan prefix nomor otomatis diterapkan ke penomoran surat berikutnya di modul terkait tanpa memerlukan restart server.
        </div>
      </div>

      {editing && <DocumentTypeFormModal type={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      </div>
    </main>
  );
}

// Modal Form Tetap Dipertahankan (tanpa mengubah logika/styles aslinya)
function DocumentTypeFormModal({ type, onClose }: { type: DocumentTypeOption | null; onClose: () => void }) {
  const save = useSaveDocumentType();
  const { data: templates } = useDocumentTemplates();
  const [code, setCode] = useState(type?.code ?? "");
  const [label, setLabel] = useState(type?.label ?? "");
  const [direction, setDirection] = useState<DocumentDirection>(type?.meta.direction ?? "internal");
  const [module, setModule] = useState(type?.meta.module ?? "core-platform");
  const [prefix, setPrefix] = useState(type?.meta.prefix ?? "");
  const [workflowTemplateCode, setWorkflowTemplateCode] = useState(type?.meta.workflow_template_code ?? "");
  const [defaultTemplateId, setDefaultTemplateId] = useState<number | "">(type?.meta.default_template_id ?? "");
  const [requiresApproval, setRequiresApproval] = useState(type?.meta.requires_approval ?? true);
  const [isActive, setIsActive] = useState(type?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!code.trim() || !label.trim() || !prefix.trim()) { setError("Kode, label, dan prefix nomor wajib diisi."); return; }
    setError(null);
    save.mutate({
      code: code.trim(), label: label.trim(), is_active: isActive,
      meta: {
        direction, module, prefix: prefix.trim().toUpperCase(),
        workflow_template_code: workflowTemplateCode.trim() || undefined,
        default_template_id: defaultTemplateId || undefined,
        requires_approval: requiresApproval,
      },
    }, { onSuccess: onClose, onError: e => setError(extractErrorMessage(e)) });
  }

  return (
    <Modal title={type ? "Edit Jenis Surat" : "Jenis Surat Baru"} onClose={onClose} maxWidth={480}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label className="input-label">Kode (unik, tidak bisa diubah setelah dibuat)</label>
          <input className="input" style={{ width: "100%" }} value={code} onChange={e => setCode(e.target.value)} disabled={!!type} placeholder="mis. surat_undangan" />
        </div>
        <div>
          <label className="input-label">Prefix Nomor</label>
          <input className="input" style={{ width: "100%" }} value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="mis. UND" />
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Label</label>
        <input className="input" style={{ width: "100%" }} value={label} onChange={e => setLabel(e.target.value)} placeholder="mis. Surat Undangan" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label className="input-label">Arah Surat</label>
          <select className="input" style={{ width: "100%" }} value={direction} onChange={e => setDirection(e.target.value as DocumentDirection)}>
            {Object.entries(DIRECTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">Tampil di Modul</label>
          <select className="input" style={{ width: "100%" }} value={module} onChange={e => setModule(e.target.value)}>
            {Object.entries(MODULE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Template Default (dipakai otomatis waktu jenis surat dibuat)</label>
        <select className="input" style={{ width: "100%" }} value={defaultTemplateId} onChange={e => setDefaultTemplateId(e.target.value ? Number(e.target.value) : "")}>
          <option value="">— Tidak ada (isi manual / lampiran file) —</option>
          {templates?.filter(t => t.is_active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "1rem", fontSize: "0.85rem" }}>
        <input type="checkbox" checked={requiresApproval} onChange={e => setRequiresApproval(e.target.checked)} />
        Butuh Approval Atasan
      </label>
      {requiresApproval && (
        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label">Kode Workflow Approval (opsional)</label>
          <input className="input" style={{ width: "100%" }} value={workflowTemplateCode} onChange={e => setWorkflowTemplateCode(e.target.value)} placeholder="mis. legal-review-approval-v1" />
        </div>
      )}
      <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "1rem", fontSize: "0.85rem" }}>
        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Aktif
      </label>
      {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn btn-primary" disabled={save.isPending} onClick={handleSubmit}>{save.isPending ? "Menyimpan..." : "Simpan"}</button>
      </div>
    </Modal>
  );
}
