import { PageHeader } from "@shared/components/PageHeader";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Pencil, Trash2, Building2, FileText, Info, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { useOrganizationList, useCreateOrganization, useUpdateOrganization, useDeleteOrganization } from "../api/useOrganizations";
import { useAuditDataChanges, useAuditLogins } from "../api/useAudit";
import { formatDate } from "@shared/lib/format";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { FileUploadField } from "@shared/components/FileUploadField";
import { Modal } from "@shared/components/Modal";
import { Pagination } from "@shared/components/Pagination";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import { QuickLogoUploadModal } from "../components/QuickLogoUploadModal";
import { LetterheadPreviewModal } from "../components/LetterheadPreviewModal";
import type { Organization, OrganizationFormValues, OrganizationType } from "@shared/types/organization";

const TYPE_LABEL: Record<OrganizationType, string> = {
  internal: "Internal (Cabang Sendiri)",
  customer: "Customer & Mitra",
  vendor: "Vendor / Rekanan",
};

const TYPE_OPTIONS: { value: OrganizationType; label: string }[] = [{ value: 'internal', label: TYPE_LABEL.internal }];

const EMPTY_FORM: OrganizationFormValues = { code: "", name: "", type: "internal", is_active: true };

export function OrganizationListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<OrganizationType | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<OrganizationFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, error: fetchError } = useOrganizationList({
    page, per_page: 20, search: search || undefined, type: typeFilter || undefined,
  });

  const [auditTab, setAuditTab] = useState<"data-change" | "login">("data-change");

  const { data: auditData, isLoading: loadingAudit } = useAuditDataChanges({
    per_page: 3,
    auditable_type: "Organization",
  });

  const { data: loginAuditData, isLoading: loadingLoginAudit } = useAuditLogins({
    per_page: 3,
  });
  
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();
  const deleteMutation = useDeleteOrganization();

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setIsModalOpen(true);
  }

  function openEdit(org: Organization) {
    setEditingId(org.id);
    setForm({
      code: org.code,
      name: org.name,
      type: org.type,
      is_active: org.is_active,
      address_line_1: org.address_line_1 ?? "",
      address_line_2: org.address_line_2 ?? "",
      npwp: org.npwp ?? "",
      pic_name: org.pic_name ?? "",
      pic_email: org.pic_email ?? "",
      pic_phone: org.pic_phone ?? "",
      logo_file_id: org.logo_file_id ?? undefined,
      parent_id: org.parent_id ?? undefined,
    });
    setError(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) await updateMutation.mutateAsync({ id: editingId, values: form });
      else await createMutation.mutateAsync(form);
      setIsModalOpen(false);
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  async function handleDelete(org: Organization) {
    if (!confirm(`Hapus organisasi "${org.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try { await deleteMutation.mutateAsync(org.id); }
    catch (err) { alert(extractErrorMessage(err)); }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const totalInternal = data?.data.filter(o => o.type === 'internal').length ?? 0;
  
  // Custom Tabs array untuk UI
  const tabs = [
    { id: "", label: "Semua Organisasi", count: data?.total ?? 0 },
    { id: "internal", label: "Cabang Sendiri" },
    { id: "customer", label: "Customer & Mitra" },
    { id: "vendor", label: "Vendor / Rekanan" },
  ];

  return (
    <div className="w-full bg-slate-50 min-h-screen font-sans">
      <PageHeader
        title="Organization"
        subtitle="Cabang/perusahaan sendiri, customer, dan vendor — dipakai juga sebagai kop surat laporan PDF."
      />
      <div className="px-7 py-5 space-y-6">
        {/* Grid 4 Kartu Metrik ala DataOps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">TOTAL ORGANISASI</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{data?.total ?? 0}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Seluruh Entitas</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">INTERNAL BRANCH</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{totalInternal}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>Cabang Terdaftar</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">STATUS OPERASIONAL</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">Aktif</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Beroperasi Normal</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">KOP SURAT PDF</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">Sinkron</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Template Resmi</span>
              </div>
            </div>
          </div>
        </div>

      {/* MAIN CARD (Mengikuti Gambar) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* TABS */}
        <div className="px-6 flex gap-8 border-b border-slate-100 mt-2">
          {tabs.map((tab) => {
            const isActive = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setTypeFilter(tab.id as OrganizationType | ""); setPage(1); }}
                className={`py-4 flex items-center gap-2 text-[13px] font-bold transition-all border-b-2 border-t-0 border-x-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 ring-0 shadow-none ${
                  isActive 
                    ? "border-amber-500 text-slate-900" 
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* TOOLBAR */}
        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-50">
          <div className="flex flex-1 flex-col md:flex-row items-center gap-4 w-full">
            <div className="relative flex-1 w-full max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-10 pr-4 py-2.5 text-[13px] text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all shadow-sm"
                placeholder="Cari nama organisasi..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="w-full md:w-56 px-4 py-2.5 text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all shadow-sm cursor-pointer"
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value as OrganizationType | ""); setPage(1); }}
            >
              <option value="">Semua Tipe</option>
              <option value="internal">Internal (Cabang Sendiri)</option>
              <option value="customer">Customer & Mitra</option>
              <option value="vendor">Vendor / Rekanan</option>
            </select>
          </div>
          <button
            onClick={openCreate}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-[#f4ae3e] hover:bg-amber-500 shadow-sm transition-all outline-none shrink-0"
          >
            <Plus size={16} strokeWidth={3} /> Organisasi Baru
          </button>
        </div>

        {isLoading && <LoadingState />}
        {isError && <div className="p-6 text-center text-rose-600 text-sm">{extractErrorMessage(fetchError)}</div>}

        {!isLoading && !isError && (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">KODE</th>
                  <th className="py-4 px-6">NAMA</th>
                  <th className="py-4 px-6">TIPE</th>
                  <th className="py-4 px-6">ALAMAT</th>
                  <th className="py-4 px-6">STATUS</th>
                  <th className="py-4 px-6 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.data.map(org => (
                  <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">{org.code}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {org.name}
                        {org.type === 'internal' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Pusat</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                        org.type === 'internal' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        org.type === 'customer' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${org.type === 'internal' ? 'bg-emerald-500' : org.type === 'customer' ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                        {TYPE_LABEL[org.type]}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-500 truncate max-w-[200px]">
                        {org.address_line_1 || org.address_line_2 ? `${org.address_line_1} ${org.address_line_2}` : "—"}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold ${
                        org.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {org.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEdit(org)} className="text-blue-500 hover:text-blue-700 transition-colors outline-none"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(org)} className="text-rose-500 hover:text-rose-700 transition-colors outline-none"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}
        {data && data.last_page > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-[12px] font-medium text-slate-500 bg-white">
            <span>Menampilkan <strong className="text-slate-800">{data.data.length}</strong> dari <strong className="text-slate-800">{data.total}</strong> entitas organisasi</span>
            <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* BOTTOM CARDS (Mengikuti Gambar) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Kiri */}
        <div className="col-span-1 md:col-span-2 bg-[#FDF9F0] border border-[#FDE6C8] rounded-2xl p-6 flex items-start gap-4 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Info size={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-bold text-slate-900 mb-1.5">Fungsi Kop Surat & Dokumen PDF Resmi</h2>
            <p className="text-[12.5px] text-slate-600 leading-relaxed font-medium mb-4">
              Organisasi dengan tipe <strong className="text-slate-800">Internal (Cabang Sendiri)</strong> secara otomatis dijadikan acuan resmi untuk generator kop surat nota penjualan, invoice tagihan PDF, Purchase Order (PO), surat jalan logistik, serta legalitas stempel dan tanda tangan digital di ekosistem MSDC ERP Surabaya.
            </p>
            <div className="flex items-center gap-6 text-[12px] font-bold text-amber-600">
              <button
                type="button"
                onClick={() => setIsFormatModalOpen(true)}
                className="hover:text-amber-700 transition-colors outline-none cursor-pointer"
              >
                Konfigurasi Format Dokumen {'>'}
              </button>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(true)}
                className="hover:text-amber-700 transition-colors outline-none cursor-pointer"
              >
                Upload Logo Kop Surat {'>'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Card Kanan: Keamanan & Audit (Dual Tab Switcher: Perubahan Data vs Sesi Login) */}
        <div className="col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between mb-3.5 gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <ShieldCheck size={14} className="text-emerald-500" />
                Keamanan & Audit
              </span>

              {/* Mini Tab Switcher */}
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setAuditTab("data-change")}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    auditTab === "data-change"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setAuditTab("login")}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    auditTab === "login"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Login
                </button>
              </div>
            </div>

            {auditTab === "data-change" ? (
              <>
                <h3 className="text-[13px] font-extrabold text-slate-800 mb-0.5">Riwayat Aktivitas Data</h3>
                <p className="text-[11px] text-slate-400 font-medium mb-3">
                  Perubahan data cabang & organisasi di sistem
                </p>

                {/* Feed Perubahan Data */}
                <div className="space-y-2 my-2">
                  {loadingAudit ? (
                    <div className="text-xs text-slate-400 py-3 text-center">Memuat aktivitas terbaru...</div>
                  ) : !auditData?.data || auditData.data.length === 0 ? (
                    <div className="text-[11px] text-slate-400 py-3 text-center italic bg-slate-50 rounded-xl border border-slate-100">
                      Belum ada log aktivitas perubahan cabang.
                    </div>
                  ) : (
                    auditData.data.slice(0, 3).map((item) => {
                      const actionBadge = 
                        item.action === "created" ? { label: "Tambah", color: "bg-emerald-50 text-emerald-700 border-emerald-200" } :
                        item.action === "updated" ? { label: "Update", color: "bg-amber-50 text-amber-700 border-amber-200" } :
                        { label: "Hapus", color: "bg-rose-50 text-rose-700 border-rose-200" };
                      
                      const targetName = (item.new_values?.name as string) || (item.old_values?.name as string) || `ID #${item.auditable_id}`;
                      
                      return (
                        <div key={item.id} className="p-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wide ${actionBadge.color}`}>
                              {actionBadge.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{formatDate(item.created_at)}</span>
                          </div>
                          <div className="mt-1 flex items-baseline justify-between gap-1 text-[11px]">
                            <span className="font-semibold text-slate-800 truncate" title={targetName}>
                              {targetName}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                              Oleh {item.user?.name ?? "Sistem"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-[13px] font-extrabold text-slate-800 mb-0.5">Riwayat Sesi Login</h3>
                <p className="text-[11px] text-slate-400 font-medium mb-3">
                  Sesi autentikasi & aktivitas login user
                </p>

                {/* Feed Sesi Login */}
                <div className="space-y-2 my-2">
                  {loadingLoginAudit ? (
                    <div className="text-xs text-slate-400 py-3 text-center">Memuat sesi login...</div>
                  ) : !loginAuditData?.data || loginAuditData.data.length === 0 ? (
                    <div className="text-[11px] text-slate-400 py-3 text-center italic bg-slate-50 rounded-xl border border-slate-100">
                      Belum ada log autentikasi.
                    </div>
                  ) : (
                    loginAuditData.data.slice(0, 3).map((item) => {
                      const isSuccess = item.status === "success";
                      const userName = item.user?.name ?? item.email_attempted ?? "Akun Tidak Dikenal";

                      return (
                        <div key={item.id} className="p-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wide ${
                              isSuccess ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {isSuccess ? "Sukses" : "Gagal"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{formatDate(item.created_at)}</span>
                          </div>
                          <div className="mt-1 flex items-baseline justify-between gap-1 text-[11px]">
                            <span className="font-semibold text-slate-800 truncate" title={userName}>
                              {userName}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium font-mono">
                              {item.ip_address}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[12px] font-bold">
            <span className="text-slate-500 text-[11px]">
              {auditTab === "data-change" ? "Log Perubahan Cabang" : "Log Autentikasi Pengguna"}
            </span>
            <button 
              onClick={() => {
                if (auditTab === "data-change") {
                  navigate("/core-platform/audit/data-change?search=Organization");
                } else {
                  navigate("/core-platform/audit/login");
                }
              }}
              className="text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 transition-colors outline-none cursor-pointer"
            >
              Lihat Audit {auditTab === "data-change" ? "Data" : "Login"} <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tetap Sama Sempurna (Disembunyikan kodenya dari preview tapi aslinya tertulis full) */}
      {isModalOpen && (
        <Modal title={editingId ? "Edit Organisasi / Entitas" : "Buat Organisasi Baru"} onClose={() => setIsModalOpen(false)} maxWidth={600}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Kode (Unik) *" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} disabled={!!editingId} required placeholder="mis. SBY-01" />
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tipe Entitas *</label>
                <select className="w-full text-sm font-medium border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as OrganizationType })}>
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <InputField label="Nama Organisasi *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="PT Multidaya Solusi..." />
            
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Alamat & NPWP (Kop Surat)</p>
              <InputField label="Alamat Baris 1" value={form.address_line_1 ?? ""} onChange={e => setForm({ ...form, address_line_1: e.target.value })} placeholder="mis. Jl. Ahmad Yani No. 123" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Alamat Baris 2" value={form.address_line_2 ?? ""} onChange={e => setForm({ ...form, address_line_2: e.target.value })} placeholder="Kota, Provinsi" />
                <InputField label="NPWP" value={form.npwp ?? ""} onChange={e => setForm({ ...form, npwp: e.target.value })} placeholder="mis. 01.234.567.8-901.000" />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kontak Person (PIC)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Nama PIC" value={form.pic_name ?? ""} onChange={e => setForm({ ...form, pic_name: e.target.value })} placeholder="mis. Budi Santoso" />
                <InputField label="Telepon PIC" value={form.pic_phone ?? ""} onChange={e => setForm({ ...form, pic_phone: e.target.value })} placeholder="mis. 031-5473838" />
              </div>
              <InputField label="Email PIC" type="email" value={form.pic_email ?? ""} onChange={e => setForm({ ...form, pic_email: e.target.value })} placeholder="mis. finance@msdc.co.id" />
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
              <FileUploadField
                label="Logo Kop Surat PDF"
                currentFileId={form.logo_file_id}
                moduleCode="CorePlatform"
                referenceType="organization_logo"
                referenceId={editingId ?? undefined}
                accept="image/*"
                onUploaded={(fileId) => setForm({ ...form, logo_file_id: fileId })}
                onRemove={() => setForm({ ...form, logo_file_id: null })}
              />
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Logo ini yang akan muncul di atas dokumen print otomatis. Disarankan berukuran persegi transparan (.png).
              </p>
            </div>

            <InputField label="Organisasi Induk (ID, opsional)" type="number" value={form.parent_id ?? ""} onChange={e => setForm({ ...form, parent_id: e.target.value ? Number(e.target.value) : undefined })} placeholder="Kosongkan kalau tidak ada induk" />

            {editingId && (
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 mt-1">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" checked={form.is_active ?? true} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                <span className="text-sm font-bold text-slate-800">Organisasi Sedang Aktif & Beroperasi</span>
              </label>
            )}

            {error && <div className="text-sm text-rose-500 font-medium bg-rose-50 p-3 rounded-lg">{error}</div>}

            <div className="flex gap-2 justify-end mt-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : (editingId ? "Simpan Perubahan" : "Buat Organisasi")}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Quick Upload Logo Kop Surat */}
      <QuickLogoUploadModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        organizations={data?.data ?? []}
      />

      {/* Modal Pratinjau Format Dokumen & Kop Surat Resmi */}
      <LetterheadPreviewModal
        isOpen={isFormatModalOpen}
        onClose={() => setIsFormatModalOpen(false)}
        organizations={data?.data ?? []}
        onOpenUploadLogo={() => {
          setIsFormatModalOpen(false);
          setIsLogoModalOpen(true);
        }}
      />
      </div>
    </div>
  );
}
