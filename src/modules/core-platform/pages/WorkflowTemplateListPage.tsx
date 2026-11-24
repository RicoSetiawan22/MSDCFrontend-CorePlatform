import { PageHeader } from "@shared/components/PageHeader";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GitCommit,
  ShieldCheck,
  Cpu,
  ChevronDown,
  Search,
  Plus,
  GitBranch,
  Bell,
  Pencil,
  Layers,
  Sliders,
  BellRing,
  FileEdit,
} from "lucide-react";
import { useWorkflowTemplates, useCreateWorkflowTemplate, useUpdateWorkflowTemplate } from "../api/useWorkflowDesign";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { extractErrorMessage } from "@shared/types/api";
import { formatDate } from "@shared/lib/format";
import type { TemplateFormValues } from "../api/workflowDesignApi";
import type { WorkflowTemplate } from "../types/workflow";

export const WORKFLOW_MODULE_OPTIONS = [
  { value: "crm-sales", label: "CRM & Sales (Quotation, Kontrak, Promo)", shortLabel: "CRM & SALES" },
  { value: "hr-service-support", label: "HR & General Affairs (Izin, Lembur, Fasilitas)", shortLabel: "HR & GA" },
  { value: "procurement-inventory", label: "Procurement & Inventory (PO, PR, RFQ)", shortLabel: "PROCUREMENT" },
  { value: "finance-accounting", label: "Finance & Accounting (Jurnal, Invoice, Kas)", shortLabel: "FINANCE" },
  { value: "data-center-ops", label: "Data Center Operations (Rack, DC Facility)", shortLabel: "DC OPS" },
  { value: "core-platform", label: "Core Platform (Persuratan, Organisasi, Sistem)", shortLabel: "CORE PLATFORM" },
  { value: "integration-analytics", label: "Integration & Analytics (API & Sinkronisasi)", shortLabel: "INTEGRATION" },
];

function getModuleBadge(moduleCode?: string) {
  const m = (moduleCode || "").toLowerCase();
  if (m.includes("crm")) {
    return { label: "CRM & SALES", bg: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" };
  }
  if (m.includes("hr")) {
    return { label: "HR & GENERAL AFFAIRS", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
  }
  if (m.includes("procurement")) {
    return { label: "PROCUREMENT & INVENTORY", bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
  }
  if (m.includes("data-center") || m.includes("dc")) {
    return { label: "DATA CENTER OPS", bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" };
  }
  if (m.includes("finance")) {
    return { label: "FINANCE & ACCOUNTING", bg: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" };
  }
  if (m.includes("core")) {
    return { label: "CORE PLATFORM", bg: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" };
  }
  if (m.includes("integration") || m.includes("analytic")) {
    return { label: "INTEGRATION & ANALYTICS", bg: "bg-cyan-50 text-cyan-700 border-cyan-200", dot: "bg-cyan-500" };
  }
  return {
    label: moduleCode ? moduleCode.replace(/-/g, " ").toUpperCase() : "UMUM / GLOBAL",
    bg: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  };
}

const EMPTY_FORM: TemplateFormValues = { code: "", name: "", module_code: "crm-sales", description: "" };

export function WorkflowTemplateListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeGuide, setActiveGuide] = useState<"tier" | "condition" | "webhook" | null>(null);
  const [form, setForm] = useState<TemplateFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  // State untuk modal edit info template
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; module_code: string; description: string; is_active: boolean }>({
    name: "", module_code: "", description: "", is_active: true,
  });
  const [editError, setEditError] = useState<string | null>(null);

  const { data, isLoading } = useWorkflowTemplates({ page, module_code: moduleFilter || undefined });
  const createMutation = useCreateWorkflowTemplate();
  const updateMutation = useUpdateWorkflowTemplate();

  const filteredData = data?.data.filter(t =>
    t.code.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const created = await createMutation.mutateAsync(form);
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      if (created?.id) {
        navigate(`/core-platform/workflow-templates/${created.id}`);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  function handleOpenEditModal(t: WorkflowTemplate) {
    setEditingTemplate(t);
    setEditForm({
      name: t.name,
      module_code: t.module_code,
      description: t.description ?? "",
      is_active: t.is_active,
    });
    setEditError(null);
  }

  async function handleUpdateSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editingTemplate) return;
    setEditError(null);
    try {
      await updateMutation.mutateAsync({
        id: editingTemplate.id,
        payload: {
          name: editForm.name,
          module_code: editForm.module_code,
          description: editForm.description,
          is_active: editForm.is_active,
        },
      });
      setEditingTemplate(null);
    } catch (err) {
      setEditError(extractErrorMessage(err));
    }
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen font-sans">
      <PageHeader
        title="Workflow Design"
        subtitle="Rancang template approval workflow — CRM, HR, Finance, Procurement, Data Center, dan Core Platform."
      />
      <div className="px-7 py-5 space-y-6">
        {/* Grid 4 Kartu Metrik ala DataOps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <GitCommit size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">TOTAL TEMPLATE</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{data?.total ?? 0}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Template Alur Aktif</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">APPROVAL LEVEL</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">Multi-Tier</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>SLA & Escalation On</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Cpu size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">ENGINE RUNTIME</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">v2.4</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Production Pipeline</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">MODUL CAKUPAN</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">7 Modul</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>CRM, HR, Finance, PO, dll</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card: Table and Filters */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
          {/* Filter and Action Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Dropdown Filter Module Terdaftar */}
              <div className="relative min-w-[260px]">
                <select 
                  className="w-full bg-white border border-slate-300 text-slate-700 text-sm rounded-lg px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none font-medium cursor-pointer shadow-sm"
                  value={moduleFilter}
                  onChange={e => { setModuleFilter(e.target.value); setPage(1); }}
                >
                  <option value="">Semua Modul Terdaftar</option>
                  {WORKFLOW_MODULE_OPTIONS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
              {/* Search Input */}
              <div className="relative flex-1 max-w-md min-w-[200px]">
                <Search size={16} className="text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input 
                  className="w-full bg-slate-50/60 border border-slate-200 text-slate-700 text-sm rounded-lg pl-10 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400 transition" 
                  placeholder="Cari kode workflow atau nama..." 
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            {/* Action Button: Template Baru */}
            <button 
              onClick={() => { setForm(EMPTY_FORM); setError(null); setIsModalOpen(true); }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-150" 
              type="button"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Template Baru</span>
            </button>
          </div>

          {/* WorkflowDataTable */}
          {isLoading && <LoadingState />}
          
          {!isLoading && (
            <div className="overflow-x-auto min-h-[350px]">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="py-4 px-6 font-semibold" scope="col">Sistem / Kode</th>
                    <th className="py-4 px-6 font-semibold" scope="col">Nama Alur (Deskripsi)</th>
                    <th className="py-4 px-6 font-semibold text-center" scope="col">Revisi Aktif</th>
                    <th className="py-4 px-6 font-semibold" scope="col">Integrasi Modul</th>
                    <th className="py-4 px-6 font-semibold text-right" scope="col">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredData?.map(t => {
                    const badge = getModuleBadge(t.module_code);
                    return (
                      <tr key={t.id} className="hover:bg-amber-50/30 transition-colors group">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                              <GitBranch size={16} strokeWidth={2.5} />
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold mb-0.5">KODE RUTE</div>
                              <span className="font-mono text-xs font-bold text-slate-800">{t.code}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 text-[14px]">{t.name}</div>
                          {t.description && (
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{t.description}</div>
                          )}
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                            <Bell size={12} /> {formatDate(t.created_at)}
                            {!t.is_active && (
                              <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 font-bold">Nonaktif</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-600 border border-blue-100">
                            Versi {typeof t.published_version === 'object' ? t.published_version?.version_number : (t.published_version ?? 1)}.0
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${badge.bg}`}>
                            <div className={`w-2 h-2 rounded-full ${badge.dot}`}></div>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* Tombol Edit Info Template (Nama, Modul, Deskripsi) */}
                            <button 
                              onClick={() => handleOpenEditModal(t)}
                              className="inline-flex items-center justify-center p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 rounded-xl shadow-2xs transition-all outline-none"
                              title="Edit Info Template"
                              type="button"
                            >
                              <Pencil size={15} strokeWidth={2.2} />
                            </button>
                            {/* Tombol Buka Workflow Designer (Perbaikan bug rute) */}
                            <Link 
                              to={`/core-platform/workflow-templates/${t.id}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs hover:shadow transition-all outline-none"
                              title="Buka Workflow Designer (Atur Node & Level Approval)"
                            >
                              <Sliders size={14} />
                              <span>Desain Alur</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer Pagination Info */}
          {data && data.last_page > 1 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
              <div>
                Menampilkan <span className="font-semibold text-slate-700">{filteredData?.length}</span> dari <span className="font-semibold text-slate-700">{data.total}</span> template workflow terdaftar
              </div>
              <div className="flex items-center gap-2">
                <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
              </div>
            </div>
          )}
        </section>

        {/* Helper Guidelines Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Guideline Card 1 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Layers size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Aturan Multi-Tier Approval</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tentukan urutan hierarki approval berjenjang berdasarkan departemen, divisi, atau approval paralel untuk tim cross-functional (CRM, HR, Procurement, dll).
              </p>
            </div>
            <button
              onClick={() => setActiveGuide("tier")}
              className="mt-4 text-xs font-semibold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 cursor-pointer"
              type="button"
            >
              Dokumentasi Skema Tier →
            </button>
          </div>
          
          {/* Guideline Card 2 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Sliders size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Kondisi Budget & SLA</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pasang limit approval otomatis (misal: PO {'>'} Rp 50.000.000 butuh VP, Quotation diskon {'>'} 20% butuh Direksi) beserta batas waktu SLA eskalasi otomatis.
              </p>
            </div>
            <button
              onClick={() => setActiveGuide("condition")}
              className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
              type="button"
            >
              Panduan Rumus Kondisi →
            </button>
          </div>
          
          {/* Guideline Card 3 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <BellRing size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Notifikasi Bot Otomatis</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Setiap event workflow dapat memicu webhook instan ke bot Telegram internal MSDC Surabaya atau broadcast approval via email korporat.
              </p>
            </div>
            <button
              onClick={() => setActiveGuide("webhook")}
              className="mt-4 text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
              type="button"
            >
              Konfigurasi Webhook →
            </button>
          </div>
        </section>

        {/* CREATE MODAL */}
        {isModalOpen && (
          <Modal title="Inisiasi Template Workflow Baru" onClose={() => setIsModalOpen(false)} maxWidth={520}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-[12px] text-blue-800 font-medium mb-1 leading-relaxed">
                Buat wadah <strong>Template</strong> terlebih dahulu. Setelah tersimpan, Anda akan otomatis diarahkan ke <strong>Visual Designer</strong> untuk menyusun <em>Node &amp; Level Approval</em>.
              </div>
              <InputField label="Kode Unik (Identitas Sistem) *" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, "-") })} required placeholder="mis. CRM-QUOTATION-APPROVAL atau PO-APPROVAL-DIRECTOR" />
              <InputField label="Nama Alur Persetujuan *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="mis. Persetujuan Quotation Khusus Klien Enterprise" />
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Integrasi Modul Bisnis *</label>
                <select
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                  value={form.module_code}
                  onChange={e => setForm({ ...form, module_code: e.target.value })}
                >
                  {WORKFLOW_MODULE_OPTIONS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                  <option value="other">Modul Lainnya (Kustom)</option>
                </select>
                {form.module_code === "other" && (
                  <input
                    className="w-full mt-2 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    placeholder="Ketik module_code kustom, mis. logistics"
                    onChange={e => setForm({ ...form, module_code: e.target.value })}
                  />
                )}
              </div>

              <InputField label="Deskripsi / Catatan Alur" value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Jelaskan tujuan atau kondisi alur persetujuan ini (opsional)" />
              
              {error && <div className="text-sm text-rose-500 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100 mt-2">{error}</div>}
              
              <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Memproses..." : "Lanjutkan ke Designer"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* EDIT MODAL (Perbaikan Bug Tombol Edit) */}
        {editingTemplate && (
          <Modal title="Edit Info Template Workflow" onClose={() => setEditingTemplate(null)} maxWidth={520}>
            <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-4">
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                <FileEdit size={16} className="text-amber-600 shrink-0" />
                <span>
                  Mengubah informasi metadata untuk template <strong>{editingTemplate.code}</strong>.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Kode Workflow (Permanen)</label>
                <input
                  disabled
                  value={editingTemplate.code}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 font-mono rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                />
              </div>

              <InputField
                label="Nama Alur Persetujuan *"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Integrasi Modul Bisnis *</label>
                <select
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                  value={editForm.module_code}
                  onChange={e => setEditForm({ ...editForm, module_code: e.target.value })}
                >
                  {WORKFLOW_MODULE_OPTIONS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                  <option value="other">Modul Lainnya</option>
                </select>
              </div>

              <InputField
                label="Deskripsi / Catatan Alur"
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Catatan tambahan alur persetujuan"
              />

              <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  id="templateIsActive"
                  checked={editForm.is_active}
                  onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                />
                <label htmlFor="templateIsActive" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                  Template Aktif (Dapat digunakan oleh transaksi modul)
                </label>
              </div>

              {editError && <div className="text-sm text-rose-500 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">{editError}</div>}

              <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setEditingTemplate(null)}>Batal</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* GUIDELINES MODAL */}
        {activeGuide && (
          <Modal
            title={
              activeGuide === "tier" ? "Dokumentasi Skema Tier Approval" :
              activeGuide === "condition" ? "Panduan Rumus Kondisi Budget & Batas SLA" :
              "Konfigurasi Bot Notifikasi & Webhook"
            }
            onClose={() => setActiveGuide(null)}
          >
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-700">
              {activeGuide === "tier" && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-xl text-amber-800">
                    <div className="font-bold text-sm mb-1">Struktur Jenjang Persetujuan Berjenjang (Multi-Tier)</div>
                    <p className="text-[11px] leading-relaxed">
                      Setiap workflow dapat dikonfigurasi dengan beberapa level berurutan atau paralel lintas divisi (CRM, HR, Finance, Procurement, Data Center).
                    </p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { lvl: 1, role: "Supervisor / Team Lead", desc: "Pemeriksaan kelengkapan teknis berkas pengajuan transaksi." },
                      { lvl: 2, role: "Department Manager", desc: "Verifikasi alokasi anggaran dan ketersediaan budget departemen." },
                      { lvl: 3, role: "VP / General Manager", desc: "Persetujuan transaksi nominal sedang (Rp 10.000.000 - Rp 50.000.000)." },
                      { lvl: 4, role: "Board of Directors (BOD)", desc: "Otorisasi final untuk transaksi strategis atau belanja modal (> Rp 50.000.000)." },
                    ].map(item => (
                      <div key={item.lvl} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                          {item.lvl}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{item.role}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeGuide === "condition" && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200/70 rounded-xl text-blue-800">
                    <div className="font-bold text-sm mb-1">Logika Kondisi Evaluasi &amp; Batas Waktu SLA</div>
                    <p className="text-[11px] leading-relaxed">
                      Kondisi otomatis mengevaluasi nominal transaksi sebelum diteruskan ke level approver berikutnya.
                    </p>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Kondisi / Rumus</th>
                          <th className="p-3">Rute Approval</th>
                          <th className="p-3">Batas SLA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-3 font-mono text-slate-700 font-semibold">amount &lt;= 10.000.000</td>
                          <td className="p-3">Cukup Approval Manager</td>
                          <td className="p-3 font-semibold text-emerald-600">24 Jam (Standard)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-slate-700 font-semibold">amount &gt; 50.000.000</td>
                          <td className="p-3">Wajib Bertingkat hingga Direksi</td>
                          <td className="p-3 font-semibold text-rose-600">48 Jam (Auto-Eskalasi)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeGuide === "webhook" && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200/70 rounded-xl text-emerald-800">
                    <div className="font-bold text-sm mb-1">Integrasi Webhook Bot Telegram &amp; Notifikasi Email</div>
                    <p className="text-[11px] leading-relaxed">
                      Hubungkan event workflow dengan endpoint internal MSDC untuk memicu broadcast otomatis saat ada pengajuan baru atau keputusan approval.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
                    <code>
                      POST https://api.telegram.org/bot&lt;TOKEN&gt;/sendMessage<br />
                      Payload: {"{"} "chat_id": "@msdc_approval_channel", "text": "Permintaan approval baru menunggu tindakan Anda." {"}"}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
