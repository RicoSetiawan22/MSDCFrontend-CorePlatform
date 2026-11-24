import { PageHeader } from "@shared/components/PageHeader";
import { useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2, Building2, Briefcase, Users, Search, Info, GitCompare } from "lucide-react";
import {
  useBranches, useCreateBranch, useUpdateBranch, useDeleteBranch,
  useBusinessUnits, useCreateBusinessUnit, useUpdateBusinessUnit, useDeleteBusinessUnit,
  useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment,
} from "../api/useDepartments";
import { useInternalOrganizations } from "@shared/api/organizationApi";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import type { Branch, BusinessUnit, Department } from "../types/organization";
import { OrgStructureTreeModal } from "../components/OrgStructureTreeModal";

export function OrganizationStructurePage() {
  const [tab, setTab] = useState<"branch" | "bu" | "department">("branch");
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);

  const { data: branches, isLoading: loadingBranch } = useBranches();
  const { data: businessUnits, isLoading: loadingBu } = useBusinessUnits();
  const { data: departments, isLoading: loadingDept } = useDepartments({ per_page: 100 });

  const tabs = [
    { key: "branch" as const, label: "Branch (Cabang)", icon: Building2, count: branches?.total ?? 0 },
    { key: "bu" as const, label: "Business Unit", icon: Briefcase, count: businessUnits?.total ?? 0 },
    { key: "department" as const, label: "Department", icon: Users, count: departments?.total ?? 0 },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 min-h-screen w-full font-sans">
      <PageHeader
        title="Struktur Organisasi"
        subtitle="Kelola data hierarki Branch, Business Unit, dan Department perusahaan."
      />
      <div className="px-7 py-5 space-y-6">
        {/* Grid 4 Kartu Metrik ala DataOps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">CABANG (BRANCH)</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{branches?.total ?? 0}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Kantor Operasional</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">BUSINESS UNIT</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{businessUnits?.total ?? 0}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Unit Bisnis Terdaftar</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">DEPARTMENT</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{departments?.total ?? 0}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Divisi & Departemen</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <GitCompare size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">LEVEL HIERARKI</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">3 Tingkat</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Branch &gt; BU &gt; Dept</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Data Container Box */}
        <section className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
          {/* Tab Switcher Navigation */}
          <div className="border-b border-slate-200 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto">
            {tabs.map(t => {
              const isActive = tab === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`py-4 flex items-center gap-2 text-[13px] font-bold transition-all border-b-2 border-t-0 border-x-0 px-3 whitespace-nowrap outline-none focus:outline-none focus:ring-0 ring-0 shadow-none ${
                    isActive 
                      ? "border-amber-500 text-amber-600" 
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon size={15} className={isActive ? "text-amber-500" : "text-slate-400"} />
                  <span>{t.label}</span>
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Rendering */}
          <div>
            {tab === "branch" && <BranchTab branches={branches?.data ?? []} loading={loadingBranch} total={branches?.total ?? 0} />}
            {tab === "bu" && <BusinessUnitTab units={businessUnits?.data ?? []} loading={loadingBu} total={businessUnits?.total ?? 0} />}
            {tab === "department" && (
              <DepartmentTab
                departments={departments?.data ?? []}
                businessUnits={businessUnits?.data ?? []}
                loading={loadingDept}
                total={departments?.total ?? 0}
              />
            )}
          </div>
        </section>

        {/* Informative Bottom Hierarchy Banner Card */}
        <section className="bg-gradient-to-r from-slate-900 to-[#1c2541] rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Info size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Hierarki Organisasi & Alur Persetujuan MSDC</h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-2xl">
                Setiap Branch menaungi Business Unit dan Department. Struktur ini menentukan pemisahan data administratif (surat menyurat, approval berkas, dan hak akses user) di platform MSDC ERP.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsTreeModalOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/15 backdrop-blur-sm transition-all cursor-pointer"
          >
            <GitCompare size={16} className="text-amber-400" />
            <span>Lihat Bagan Struktur (Tree View)</span>
          </button>
        </section>

        {/* Render Modal Tree View saat tombol diklik */}
        {isTreeModalOpen && (
          <OrgStructureTreeModal
            onClose={() => setIsTreeModalOpen(false)}
            branches={branches?.data ?? []}
            businessUnits={businessUnits?.data ?? []}
            departments={departments?.data ?? []}
          />
        )}
      </div>
    </main>
  );
}

// ----------------------------------------------------------------------
// BRANCH TAB
// ----------------------------------------------------------------------
function BranchTab({ branches, loading, total }: { branches: Branch[]; loading: boolean; total: number }) {
  const { data: organizations } = useInternalOrganizations();
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState({ organization_id: 0, code: "", name: "", address: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredData = branches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.code.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm({ organization_id: organizations?.[0]?.id ?? 0, code: "", name: "", address: "", phone: "" });
    setError(null);
    setIsModalOpen(true);
  }

  function openEdit(b: Branch) {
    setEditing(b);
    setForm({ organization_id: b.organization_id, code: b.code, name: b.name, address: b.address ?? "", phone: b.phone ?? "" });
    setError(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, values: { code: form.code, name: form.name, address: form.address, phone: form.phone } });
      } else {
        await createMutation.mutateAsync(form);
      }
      setIsModalOpen(false);
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  async function handleDelete(b: Branch) {
    if (!confirm(`Hapus branch "${b.name}"?`)) return;
    try { await deleteMutation.mutateAsync(b.id); }
    catch (err) { alert(extractErrorMessage(err)); }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Cari kode atau nama branch..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-slate-300 placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors shadow-sm"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} /> Tambah Branch
        </Button>
      </div>

      {loading && <LoadingState />}
      
      {!loading && (
        <div className="overflow-x-auto border-t border-slate-100 min-h-[250px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6" scope="col">Kode</th>
                <th className="py-3.5 px-6" scope="col">Nama Branch</th>
                <th className="py-3.5 px-6" scope="col">Organisasi Induk</th>
                <th className="py-3.5 px-6" scope="col">Status</th>
                <th className="py-3.5 px-6 text-right" scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(b => (
                <tr key={b.id} className="hover:bg-amber-50/30 transition-colors group">
                  <td className="py-4 px-6 font-mono font-bold text-amber-600 whitespace-nowrap">
                    <span className="bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-md">{b.code}</span>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:border-amber-300 transition-colors">
                        <Building2 size={14} />
                      </div>
                      <span>{b.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                    {b.organization?.name ?? "-"}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${b.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {b.is_active ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                      <button onClick={() => openEdit(b)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit Cabang">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(b)} disabled={deleteMutation.isPending} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Hapus Cabang">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-500 italic">Tidak ada data branch ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>Menampilkan <span className="font-semibold text-slate-700">{filteredData.length}</span> dari <span className="font-semibold text-slate-700">{total}</span> Branch terdaftar</div>
        </div>
      )}

      {isModalOpen && (
        <Modal title={editing ? "Edit Branch" : "Branch Baru"} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!editing && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Organisasi Induk *</label>
                <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 appearance-none shadow-sm" required value={form.organization_id || ""} onChange={(e) => setForm({ ...form, organization_id: Number(e.target.value) })}>
                  <option value="" disabled>Pilih organisasi...</option>
                  {(organizations ?? []).map(org => (
                    <option key={org.id} value={org.id}>{org.name} ({org.code})</option>
                  ))}
                </select>
              </div>
            )}
            <InputField label="Kode Branch *" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="mis. BR-SBY" />
            <InputField label="Nama Branch *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Cabang Surabaya" />
            <InputField label="Alamat" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Opsional" />
            <InputField label="Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Opsional" />

            {error && <div className="text-sm text-rose-500 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</div>}

            <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan Branch"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ----------------------------------------------------------------------
// BUSINESS UNIT TAB
// ----------------------------------------------------------------------
function BusinessUnitTab({ units, loading, total }: { units: BusinessUnit[]; loading: boolean; total: number }) {
  const { data: organizations } = useInternalOrganizations();
  const createMutation = useCreateBusinessUnit();
  const updateMutation = useUpdateBusinessUnit();
  const deleteMutation = useDeleteBusinessUnit();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessUnit | null>(null);
  const [form, setForm] = useState({ organization_id: 0, code: "", name: "" });
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredData = units.filter(bu => 
    bu.name.toLowerCase().includes(search.toLowerCase()) || 
    bu.code.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm({ organization_id: organizations?.[0]?.id ?? 0, code: "", name: "" });
    setError(null);
    setIsModalOpen(true);
  }

  function openEdit(bu: BusinessUnit) {
    setEditing(bu);
    setForm({ organization_id: bu.organization_id, code: bu.code, name: bu.name });
    setError(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, values: { code: form.code, name: form.name } });
      } else {
        await createMutation.mutateAsync(form);
      }
      setIsModalOpen(false);
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  async function handleDelete(bu: BusinessUnit) {
    if (!confirm(`Hapus business unit "${bu.name}"?`)) return;
    try { await deleteMutation.mutateAsync(bu.id); }
    catch (err) { alert(extractErrorMessage(err)); }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Cari kode atau nama BU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-slate-300 placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors shadow-sm"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} /> Tambah BU
        </Button>
      </div>

      {loading && <LoadingState />}
      
      {!loading && (
        <div className="overflow-x-auto border-t border-slate-100 min-h-[250px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6" scope="col">Kode</th>
                <th className="py-3.5 px-6" scope="col">Nama Business Unit</th>
                <th className="py-3.5 px-6" scope="col">Organisasi Induk</th>
                <th className="py-3.5 px-6" scope="col">Status</th>
                <th className="py-3.5 px-6 text-right" scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(bu => (
                <tr key={bu.id} className="hover:bg-amber-50/30 transition-colors group">
                  <td className="py-4 px-6 font-mono font-bold text-amber-600 whitespace-nowrap">
                    <span className="bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-md">{bu.code}</span>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:border-amber-300 transition-colors">
                        <Briefcase size={14} />
                      </div>
                      <span>{bu.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                    {bu.organization?.name ?? "-"}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${bu.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${bu.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {bu.is_active ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                      <button onClick={() => openEdit(bu)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit BU">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(bu)} disabled={deleteMutation.isPending} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Hapus BU">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-500 italic">Tidak ada data Business Unit ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>Menampilkan <span className="font-semibold text-slate-700">{filteredData.length}</span> dari <span className="font-semibold text-slate-700">{total}</span> BU terdaftar</div>
        </div>
      )}

      {isModalOpen && (
        <Modal title={editing ? "Edit Business Unit" : "Business Unit Baru"} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!editing && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Organisasi Induk *</label>
                <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 appearance-none shadow-sm" required value={form.organization_id || ""} onChange={(e) => setForm({ ...form, organization_id: Number(e.target.value) })}>
                  <option value="" disabled>Pilih organisasi...</option>
                  {(organizations ?? []).map(org => (
                    <option key={org.id} value={org.id}>{org.name} ({org.code})</option>
                  ))}
                </select>
              </div>
            )}
            <InputField label="Kode BU *" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="mis. BU-OPS" />
            <InputField label="Nama BU *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Operations" />

            {error && <div className="text-sm text-rose-500 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</div>}

            <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan BU"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ----------------------------------------------------------------------
// DEPARTMENT TAB
// ----------------------------------------------------------------------
function DepartmentTab({ departments, businessUnits, loading, total }: { departments: Department[]; businessUnits: BusinessUnit[]; loading: boolean; total: number }) {
  const { data: organizations } = useInternalOrganizations();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<{ organization_id: number | ""; business_unit_id: number | ""; code: string; name: string }>({ organization_id: "", business_unit_id: "", code: "", name: "" });
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredData = departments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm({ organization_id: organizations?.[0]?.id ?? "", business_unit_id: "", code: "", name: "" });
    setError(null);
    setIsModalOpen(true);
  }

  function openEdit(d: Department) {
    setEditing(d);
    setForm({ organization_id: d.organization_id ?? "", business_unit_id: d.business_unit_id ?? "", code: d.code, name: d.name });
    setError(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          values: { code: form.code, name: form.name, business_unit_id: form.business_unit_id || null },
        });
      } else {
        await createMutation.mutateAsync({
          organization_id: Number(form.organization_id),
          business_unit_id: form.business_unit_id ? Number(form.business_unit_id) : undefined,
          code: form.code,
          name: form.name,
        });
      }
      setIsModalOpen(false);
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  async function handleDelete(d: Department) {
    if (!confirm(`Hapus department "${d.name}"?`)) return;
    try { await deleteMutation.mutateAsync(d.id); }
    catch (err) { alert(extractErrorMessage(err)); }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Cari kode atau nama Dept..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-slate-300 placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors shadow-sm"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} /> Tambah Dept
        </Button>
      </div>

      {loading && <LoadingState />}
      
      {!loading && (
        <div className="overflow-x-auto border-t border-slate-100 min-h-[250px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6" scope="col">Kode</th>
                <th className="py-3.5 px-6" scope="col">Nama Department</th>
                <th className="py-3.5 px-6" scope="col">Business Unit</th>
                <th className="py-3.5 px-6" scope="col">Organisasi Induk</th>
                <th className="py-3.5 px-6" scope="col">Status</th>
                <th className="py-3.5 px-6 text-right" scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(d => (
                <tr key={d.id} className="hover:bg-amber-50/30 transition-colors group">
                  <td className="py-4 px-6 font-mono font-bold text-amber-600 whitespace-nowrap">
                    <span className="bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-md">{d.code}</span>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:border-amber-300 transition-colors">
                        <Users size={14} />
                      </div>
                      <span>{d.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-600 whitespace-nowrap">{d.business_unit?.name ?? "-"}</td>
                  <td className="py-4 px-6 text-slate-500 whitespace-nowrap">{d.organization?.name ?? "Semua Organisasi"}</td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${d.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${d.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {d.is_active ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                      <button onClick={() => openEdit(d)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit Dept">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(d)} disabled={deleteMutation.isPending} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Hapus Dept">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500 italic">Tidak ada data Department ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* FOOTER */}
      {!loading && (
        <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>Menampilkan <span className="font-semibold text-slate-700">{filteredData.length}</span> dari <span className="font-semibold text-slate-700">{total}</span> Department terdaftar</div>
        </div>
      )}

      {isModalOpen && (
        <Modal title={editing ? "Edit Department" : "Department Baru"} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!editing && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Organisasi Induk *</label>
                <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 appearance-none shadow-sm" required value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value ? Number(e.target.value) : "" })}>
                  <option value="" disabled>Pilih organisasi...</option>
                  {(organizations ?? []).map(org => (
                    <option key={org.id} value={org.id}>{org.name} ({org.code})</option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Induk Business Unit (Opsional)</label>
              <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 appearance-none shadow-sm" value={form.business_unit_id} onChange={(e) => setForm({ ...form, business_unit_id: e.target.value ? Number(e.target.value) : "" })}>
                <option value="">— Tidak ada —</option>
                {businessUnits.map(bu => (
                  <option key={bu.id} value={bu.id}>{bu.name} ({bu.code})</option>
                ))}
              </select>
            </div>
            
            <InputField label="Kode Dept *" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="mis. DEPT-IT" />
            <InputField label="Nama Dept *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. IT & Infrastruktur" />

            {error && <div className="text-sm text-rose-500 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</div>}

            <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan Dept"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}