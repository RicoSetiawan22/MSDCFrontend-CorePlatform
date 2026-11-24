import { PageHeader } from "@shared/components/PageHeader";
import { useMemo, useState, type FormEvent } from "react";
import { Plus, ChevronDown, ChevronRight, Search, Shield, Trash2, LayoutGrid, Users } from "lucide-react";
import { useRoleList, useDeleteRole, usePermissions, useCreateRole, useUpdateRolePermissions, useUpdateRoleSidebarSections } from "../api/useRoles";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import { SIDEBAR_SECTIONS } from "../types/role";
import type { Permission, Role } from "../types/role";
import { Pagination } from "@shared/components/Pagination";

// Role inti yang dilindungi backend
const PROTECTED_ROLE_NAMES = ["super-admin", "admin"];

export function RoleListPage() {
  const [tab, setTab] = useState<"roles" | "permissions">("roles");
  const [search, setSearch] = useState("");
  const [permPage, setPermPage] = useState(1);

  const { data: roles, isLoading: loadingRoles } = useRoleList();
  const { data: permissions, isLoading: loadingPerms } = usePermissions();
  const deleteMutation = useDeleteRole();

  const [showCreate, setShowCreate] = useState(false);
  const [manageRole, setManageRole] = useState<Role | null>(null);
  const [manageSectionsRole, setManageSectionsRole] = useState<Role | null>(null);

  const totalRoles = roles?.data.length ?? 0;
  const totalPermissions = permissions?.length ?? 0;

  const filteredRoles = roles?.data.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(role: Role) {
    if (!confirm(`Hapus role "${role.name}"?`)) return;
    try { await deleteMutation.mutateAsync(role.id); }
    catch (err) { alert(extractErrorMessage(err)); }
  }

  const filteredPerms = permissions?.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) || [];
  const permsPerPage = 10;
  const totalPermsPages = Math.ceil(filteredPerms.length / permsPerPage);
  const paginatedPerms = filteredPerms.slice((permPage - 1) * permsPerPage, permPage * permsPerPage);

  return (
    <div className="w-full bg-slate-50 min-h-screen">
      <PageHeader
        title="Role & Permission"
        subtitle="Kelola matriks hak akses dan menu per pengguna secara terpusat."
      />
      <div className="px-7 py-5 space-y-6">
        {/* Grid 4 Kartu Metrik ala DataOps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">TOTAL ROLE</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{totalRoles}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Role Terdaftar</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Shield size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">HAK AKSES SISTEM</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{totalPermissions}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Permission Matrix</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <LayoutGrid size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">CAKUPAN SIDEBAR</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{SIDEBAR_SECTIONS.length}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Menu Navigation</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Shield size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">PROTEKSI SYSTEM</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{PROTECTED_ROLE_NAMES.length}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Protected Built-in</span>
              </div>
            </div>
          </div>
        </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden">
        
        {/* Tab Modern (Pill Style - No borders) */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="inline-flex bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setTab("roles")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all outline-none ${
                tab === "roles" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              Daftar Role
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${tab === "roles" ? "bg-amber-100 text-amber-700" : "bg-slate-300/50 text-slate-600"}`}>
                {totalRoles}
              </span>
            </button>
            <button
              onClick={() => setTab("permissions")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all outline-none ${
                tab === "permissions" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              Referensi Permission
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${tab === "permissions" ? "bg-amber-100 text-amber-700" : "bg-slate-300/50 text-slate-600"}`}>
                {totalPermissions}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all placeholder:text-slate-400"
                placeholder={tab === "roles" ? "Cari nama role..." : "Cari module permission..."}
                value={search}
                onChange={e => { setSearch(e.target.value); setPermPage(1); }}
              />
            </div>
            {tab === "roles" && (
              <button
                onClick={() => setShowCreate(true)}
                className="shrink-0 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95 outline-none"
              >
                <Plus size={16} strokeWidth={3} /> Buat Role
              </button>
            )}
          </div>
        </div>

        {/* Tabel View */}
        <div className="min-h-[400px]">
          {tab === "roles" && (
            <>
              {loadingRoles && <LoadingState />}
              {!loadingRoles && (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">Nama Role</th>
                      <th className="py-4 px-6">Hak Akses Modul</th>
                      <th className="py-4 px-6">Akses Sidebar</th>
                      <th className="py-4 px-6 text-right">Opsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {filteredRoles?.map(role => {
                      const isProtected = PROTECTED_ROLE_NAMES.includes(role.name);
                      const permCount = role.permissions?.length ?? 0;
                      
                      return (
                        <tr key={role.id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-900">{role.name}</span>
                            {isProtected && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">SYSTEM</span>}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(permCount / totalPermissions) * 100}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-slate-500">{permCount} akses</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {!role.sidebar_sections ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Semua Menu Terbuka
                              </span>
                            ) : role.sidebar_sections.length === 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Tidak Ada Menu
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs" title={role.sidebar_sections.join(", ")}>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                {role.sidebar_sections.length} Menu Terpilih
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setManageRole(role)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors outline-none" title="Kelola Permission (Action)"><Shield size={16} /></button>
                              <button onClick={() => setManageSectionsRole(role)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors outline-none" title="Kelola Menu Sidebar (View)"><LayoutGrid size={16} /></button>
                              {isProtected ? (
                                <button disabled className="p-2 text-slate-300 cursor-not-allowed"><Trash2 size={16} /></button>
                              ) : (
                                <button onClick={() => handleDelete(role)} className="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors outline-none" title="Hapus Role"><Trash2 size={16} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}

          {tab === "permissions" && (
            <>
              {loadingPerms && <LoadingState />}
              {!loadingPerms && (
                <> 
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-white border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                        <th className="py-4 px-6">Identitas Akses (Key)</th>
                        <th className="py-4 px-6">Kategori Modul</th>
                        <th className="py-4 px-6">Aksi (Action)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {paginatedPerms.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-6"><span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">{p.name}</span></td>
                          <td className="py-3 px-6 font-medium text-slate-800">{p.module}</td>
                          <td className="py-3 px-6 text-slate-600 capitalize">{p.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <Pagination currentPage={permPage} lastPage={totalPermsPages} total={filteredPerms.length} onPageChange={setPermPage} />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info Banner Modern */}
      <div className="bg-amber-500/10 border border-amber-200/50 rounded-2xl p-5 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm"><Shield size={20} /></div>
        <div>
          <h3 className="font-bold text-amber-900 text-sm">Catatan Keamanan (RBAC)</h3>
          <p className="text-amber-800/80 text-xs mt-1 leading-relaxed">Perubahan pada hak akses akan berlaku instan pada sesi pengguna berikutnya. Role <span className="font-bold">super-admin</span> dilindungi oleh sistem secara permanen.</p>
        </div>
      </div>

      {/* =========== BAGIAN MODALS =========== */}
      {showCreate && <CreateRoleModal onClose={() => setShowCreate(false)} />}
      {manageRole && <RolePermissionsModal role={manageRole} permissions={permissions ?? []} onClose={() => setManageRole(null)} />}
      {manageSectionsRole && <RoleSectionsModal role={manageSectionsRole} onClose={() => setManageSectionsRole(null)} />}
      </div>
    </div>
  );
}

function CreateRoleModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createMutation = useCreateRole();

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    try {
      await createMutation.mutateAsync({ name: name.trim() });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title="Buat Role Baru" onClose={onClose} maxWidth={400}>
      <form onSubmit={handleCreate} className="flex flex-col gap-4">
        <InputField label="Nama Role (Tanpa Spasi, contoh: finance-staff)" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan identifier role..." autoFocus required />
        {error && <div className="text-sm text-rose-500 font-medium bg-rose-50 p-3 rounded-lg">{error}</div>}
        <div className="flex gap-2 justify-end mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
            {createMutation.isPending ? "Menyimpan..." : "Simpan Role"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RolePermissionsModal({ role, permissions, onClose }: { role: Role; permissions: Permission[]; onClose: () => void }) {
  const updateMutation = useUpdateRolePermissions();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(role.permissions?.map(p => p.name) ?? [])
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    try {
      await updateMutation.mutateAsync({ id: role.id, permissions: Array.from(selected) });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title={`Hak Akses Modul — ${role.name}`} onClose={onClose} maxWidth={800}>
      <div className="flex flex-col gap-4">
        <PermissionPicker permissions={permissions} selected={selected} onChange={setSelected} maxHeight={500} />
        {error && <div className="text-sm text-rose-500 font-medium bg-rose-50 p-3 rounded-lg">{error}</div>}
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
          <div className="text-sm font-semibold text-slate-500">{selected.size} akses dipilih</div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="button" disabled={updateMutation.isPending} onClick={handleSave}>
              {updateMutation.isPending ? "Menyimpan..." : "Simpan Hak Akses"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function RoleSectionsModal({ role, onClose }: { role: Role; onClose: () => void }) {
  const updateMutation = useUpdateRoleSidebarSections();
  const [restricted, setRestricted] = useState(role.sidebar_sections != null);
  const [selected, setSelected] = useState<Set<string>>(new Set(role.sidebar_sections ?? []));
  const [error, setError] = useState<string | null>(null);

  function toggleSection(title: string) {
    const next = new Set(selected);
    if (next.has(title)) next.delete(title); else next.add(title);
    setSelected(next);
  }

  async function handleSave() {
    setError(null);
    try {
      await updateMutation.mutateAsync({ id: role.id, sections: restricted ? Array.from(selected) : null });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title={`Akses Menu Sidebar — ${role.name}`} onClose={onClose} maxWidth={480}>
      <div className="flex flex-col gap-4">
        <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
          Atur menu apa saja yang <strong>muncul di sidebar kiri</strong>. Ini hanya untuk visibilitas menu, sedangkan hak askses CRUD tetap diatur di "Hak Akses Modul".
        </div>

        <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" checked={!restricted} onChange={e => setRestricted(!e.target.checked)} />
          <span className="text-sm font-bold text-slate-800">Tampilkan Semua Menu Sidebar</span>
        </label>

        {restricted && (
          <div className="flex flex-col gap-1 p-3 border border-slate-200 rounded-xl bg-slate-50/50">
            {SIDEBAR_SECTIONS.map(section => (
              <label key={section} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" checked={selected.has(section)} onChange={() => toggleSection(section)} />
                <span className="text-sm font-medium text-slate-700">{section}</span>
              </label>
            ))}
            {selected.size === 0 && (
              <div className="text-xs text-rose-500 font-semibold p-2">Belum ada menu yang dipilih!</div>
            )}
          </div>
        )}

        {error && <div className="text-sm text-rose-500 font-medium bg-rose-50 p-3 rounded-lg">{error}</div>}
        <div className="flex gap-2 justify-end mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="button" disabled={updateMutation.isPending} onClick={handleSave}>
            {updateMutation.isPending ? "Menyimpan..." : "Simpan Visibilitas"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function groupByModule(permissions: Permission[], search: string): { module: string; items: Permission[] }[] {
  const q = search.trim().toLowerCase();
  const filtered = q
    ? permissions.filter(p => p.name.toLowerCase().includes(q) || p.module.toLowerCase().includes(q) || p.action.toLowerCase().includes(q))
    : permissions;

  const byModule = new Map<string, Permission[]>();
  for (const p of filtered) {
    if (!byModule.has(p.module)) byModule.set(p.module, []);
    byModule.get(p.module)!.push(p);
  }

  return Array.from(byModule.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([module, items]) => ({ module, items }));
}

function PermissionPicker({ permissions, selected, onChange, maxHeight }: {
  permissions: Permission[]; selected: Set<string>; onChange: (next: Set<string>) => void; maxHeight: number;
}) {
  const [search, setSearch] = useState("");
  // const [permPage, setPermPage] = useState(1); // Ini tidak dipakai di dalam picker, dihapus biar bersih

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const grouped = useMemo(() => groupByModule(permissions, search), [permissions, search]);

  function toggleModule(module: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module); else next.add(module);
      return next;
    });
  }

  function togglePermission(name: string) {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name); else next.add(name);
    onChange(next);
  }

  function toggleModuleAll(items: Permission[], checkAll: boolean) {
    const next = new Set(selected);
    for (const item of items) {
      if (checkAll) next.add(item.name); else next.delete(item.name);
    }
    onChange(next);
  }

  return (
    <div>
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-400 focus:bg-white transition-all"
          placeholder="Cari module atau permission..."
          value={search}
          onChange={e => { setSearch(e.target.value); if (e.target.value) setExpanded(new Set(groupByModule(permissions, e.target.value).map(g => g.module))); }}
        />
      </div>
      <div style={{ maxHeight }} className="overflow-y-auto pr-1 space-y-2">
        {grouped.map(({ module, items }) => {
          const checkedCount = items.filter(i => selected.has(i.name)).length;
          const allChecked = checkedCount === items.length;
          const isExpanded = expanded.has(module);
          return (
            <div key={module} className="border border-slate-100 rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                onClick={() => toggleModule(module)}
              >
                <div className="text-slate-400">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  checked={allChecked}
                  ref={el => { if (el) el.indeterminate = checkedCount > 0 && !allChecked; }}
                  onClick={e => e.stopPropagation()}
                  onChange={e => toggleModuleAll(items, e.target.checked)}
                />
                <span className="font-bold text-sm text-slate-800 capitalize flex-1">{module}</span>
                <span className="text-xs font-semibold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">{checkedCount}/{items.length}</span>
              </div>
              {isExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-white">
                  {items.map(item => (
                    <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        checked={selected.has(item.name)}
                        onChange={() => togglePermission(item.name)}
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 capitalize transition-colors">{item.action}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.name}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {grouped.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm font-medium">Tidak ada permission yang cocok.</div>
        )}
      </div>
    </div>
  );
}