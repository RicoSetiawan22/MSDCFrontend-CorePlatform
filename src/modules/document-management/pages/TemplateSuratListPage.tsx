import { useState } from "react";
import { Plus, Search, RefreshCw, Copy, Check, Edit, Code, CalendarCheck, ShieldCheck, FileCode, CheckCircle2, Layers } from "lucide-react";
import { LoadingState } from "@shared/components/LoadingState";
import { Modal } from "@shared/components/Modal";
import { useAuth } from "@shared/lib/auth-context";
import { extractErrorMessage } from "@shared/types/api";
import { useDocumentTemplates, useSaveDocumentTemplate } from "../api/useDocuments";
import type { DocTemplate } from "../api/templateApi";
import { PageHeader } from "@shared/components/PageHeader";

export function TemplateSuratListPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("template.manage");
  const { data: templates, isLoading } = useDocumentTemplates();
  const [editing, setEditing] = useState<DocTemplate | "new" | null>(null);

  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTemplates = templates?.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase()));

  // Metrik KPI ala DataOps
  const totalTemplates = templates?.length ?? 0;
  const activeTemplates = templates?.filter(t => t.is_active).length ?? 0;
  const totalModules = new Set(templates?.map(t => t.module).filter(Boolean)).size;

  return (
    <main className="w-full bg-slate-50 min-h-screen font-sans">
      <PageHeader title="Template Surat" subtitle="Template isi surat — placeholder pakai syntax {{nama_variabel}}, diisi otomatis saat surat dibuat." />
      <div className="px-7 py-5 space-y-6">

        {/* Grid 4 Kartu Metrik ala DataOps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileCode size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">TOTAL TEMPLATE</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{totalTemplates}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Template Terdaftar</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">TEMPLATE AKTIF</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{activeTemplates}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Siap Digunakan</span>
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
                <span>Modul Terintegrasi</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Code size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">ENGINE TEMPLATE</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">Mustache</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Syntax {`{{ variabel }}`}</span>
              </div>
            </div>
          </div>
        </div>
      {/* END: Header & KPI Cards ala DataOps */}

      {/* Tools Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700 placeholder:text-slate-400 transition" 
              placeholder="Cari template atau modul..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setSearch("")} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors" title="Reset/Refresh Table">
            <RefreshCw size={14} />
          </button>
        </div>
        {canManage && (
          <div className="w-full md:w-auto flex justify-end">
            <button onClick={() => setEditing("new")} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg shadow-sm shadow-amber-500/30 active:scale-[0.99] transition-all">
              <Plus size={14} />
              <span>Template Baru</span>
            </button>
          </div>
        )}
      </div>

      {isLoading && <LoadingState />}

      {/* Main Table Container */}
      {!isLoading && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  <th className="py-3.5 px-6">KODE</th>
                  <th className="py-3.5 px-6">NAMA</th>
                  <th className="py-3.5 px-6">MODUL</th>
                  <th className="py-3.5 px-6">FORMAT</th>
                  <th className="py-3.5 px-6 text-center">STATUS</th>
                  <th className="py-3.5 px-6 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTemplates?.map(t => (
                  <tr key={t.id} className="hover:bg-amber-50/20 transition-colors group">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-slate-600 font-medium px-2 py-1 rounded bg-slate-100 border border-slate-200/80 text-[11px] select-all group-hover:border-amber-300 transition-colors">{t.code}</code>
                        <button onClick={() => handleCopyCode(t.id, t.code)} className="text-slate-400 hover:text-amber-600 opacity-0 group-hover:opacity-100 transition" title="Salin Kode Template">
                          {copiedId === t.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap">{t.name}</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {t.module ?? "—"}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-mono uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">{t.format}</span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-semibold border ${t.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {t.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right space-x-1.5">
                      {canManage && (
                        <button onClick={() => setEditing(t)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-transparent hover:bg-slate-100 rounded-md transition border-none shadow-none">
                          <Edit size={12} className="text-slate-500" /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
            <Code size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 m-0">Dynamic Variable Tag</h3>
            <p className="text-[11px] text-slate-500 mt-1 mb-1">Gunakan tag ganda untuk variabel dinamis penerima, nomor surat, dll.</p>
            <code className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1 py-0.5 rounded inline-block">{`{{nomor_surat}}`}</code>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
            <CalendarCheck size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 m-0">Tanggal Otomatis</h3>
            <p className="text-[11px] text-slate-500 mt-1 mb-1">Format penanggalan standar Indonesia diformulasikan otomatis.</p>
            <code className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded inline-block">{`{{tanggal_hari_ini}}`}</code>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600 mt-0.5">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 m-0">Tanda Tangan & QR</h3>
            <p className="text-[11px] text-slate-500 mt-1 mb-1">Sertakan barcode validasi digital untuk arsip berkas tersertifikasi.</p>
            <code className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded inline-block">{`{{qr_verifikasi}}`}</code>
          </div>
        </div>
      </div>

      {editing && <TemplateFormModal template={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      </div>
    </main>
  );
}

// Modal Form Tetap Dipertahankan (tanpa mengubah logika asli)
function TemplateFormModal({ template, onClose }: { template: DocTemplate | null; onClose: () => void }) {
  const save = useSaveDocumentTemplate();
  const [code, setCode] = useState(template?.code ?? "");
  const [name, setName] = useState(template?.name ?? "");
  const [module, setModule] = useState(template?.module ?? "");
  const [format, setFormat] = useState<"text" | "html">(template?.format ?? "html");
  const [content, setContent] = useState(template?.content ?? "");
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!code.trim() || !name.trim() || !content.trim()) { setError("Kode, nama, dan isi template wajib diisi."); return; }
    setError(null);
    save.mutate(
      { code: code.trim(), name: name.trim(), module: module || undefined, format, content, is_active: isActive },
      { onSuccess: onClose, onError: e => setError(extractErrorMessage(e)) }
    );
  }

  return (
    <Modal title={template ? "Edit Template" : "Template Baru"} onClose={onClose} maxWidth={560}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label className="input-label">Kode (unik)</label>
          <input className="input" style={{ width: "100%" }} value={code} onChange={e => setCode(e.target.value)} disabled={!!template} placeholder="mis. surat-tugas-v1" />
        </div>
        <div>
          <label className="input-label">Modul</label>
          <input className="input" style={{ width: "100%" }} value={module} onChange={e => setModule(e.target.value)} placeholder="mis. CorePlatform" />
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Nama Template</label>
        <input className="input" style={{ width: "100%" }} value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Format</label>
        <select className="input" style={{ width: "100%" }} value={format} onChange={e => setFormat(e.target.value as "text" | "html")}>
          <option value="html">HTML</option>
          <option value="text">Text</option>
        </select>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Isi Template (placeholder: {`{{nama_variabel}}`})</label>
        <textarea className="input" style={{ width: "100%", minHeight: 160, fontFamily: "monospace", fontSize: "0.8rem" }} value={content} onChange={e => setContent(e.target.value)} />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "1rem", fontSize: "0.85rem" }}>
        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Aktif
      </label>
      {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn btn-primary" disabled={save.isPending} onClick={handleSubmit}>
          {save.isPending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </Modal>
  );
}




