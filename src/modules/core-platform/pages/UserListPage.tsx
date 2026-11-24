import { PageHeader } from "@shared/components/PageHeader";
import { useState, type FormEvent } from "react";
import { Search, Plus, UserX, UserCheck, Building2, Users, Shield } from "lucide-react";
import { useUserList, useSetUserActive, useCreateUser, useSyncUserOrganizations } from "../api/useUsers";
import { useRoleList, useAssignUserRoles } from "../api/useRoles";
import { useInternalOrganizations } from "@shared/api/organizationApi";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { Pagination } from "@shared/components/Pagination";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import type { User, UserFormValues } from "../types/user";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

const EMPTY_USER_FORM: UserFormValues = { name: "", email: "", password: "", phone: "", roles: [], organization_ids: [] };

export function UserListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editRolesUser, setEditRolesUser] = useState<User | null>(null);
  const [editOrgsUser, setEditOrgsUser] = useState<User | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useUserList({ page, per_page: 20, search: search || undefined });
  const setActiveMutation = useSetUserActive();

  const totalActive = data?.data.filter(u => u.is_active).length ?? 0;
  const totalInactive = data?.data.filter(u => !u.is_active).length ?? 0;

  const filteredUsers = data?.data.filter(u => {
    const matchStatus = statusFilter === "aktif" ? u.is_active : statusFilter === "nonaktif" ? !u.is_active : true;
    const matchRole = roleFilter ? u.roles?.includes(roleFilter) : true;
    return matchStatus && matchRole;
  });

  async function handleToggleActive(user: User) {
    const willActivate = !user.is_active;
    const msg = willActivate
      ? `Aktifkan lagi user "${user.name}"?`
      : `Nonaktifkan user "${user.name}"? Tidak bisa login sampai diaktifkan ulang.`;
    if (!confirm(msg)) return;
    try { await setActiveMutation.mutateAsync({ id: user.id, isActive: willActivate }); }
    catch (err) { alert(extractErrorMessage(err)); }
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen">
      <PageHeader
        title="User Management"
        subtitle="Kelola data pengguna, status akun, dan assignment hak akses sistem."
      />
      <div className="px-7 py-5 space-y-6">
        {/* Grid 4 Kartu Metrik ala DataOps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">TOTAL PENGGUNA</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{data?.total ?? 0}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Akun Terdaftar</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">PENGGUNA AKTIF</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{totalActive}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Dapat Mengakses ERP</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <UserX size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">NONAKTIF</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">{totalInactive}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Akses Ditangguhkan</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Shield size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">KEAMANAN AKSES</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-800">RBAC Aktif</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Role & Org Matrix</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Chart Card: Distribusi Akun & Status Akses Pengguna */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                DISTRIBUSI & STATUS AKSES PENGGUNA
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Ringkasan grafik akun aktif, nonaktif, dan total pengguna sistem</p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200/60">
              Live Tracker
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={[
                  { name: "Pengguna Aktif", count: totalActive, color: "#10b981" },
                  { name: "Nonaktif / Ditangguhkan", count: totalInactive, color: "#f43f5e" },
                  { name: "Total Pengguna", count: data?.total ?? (totalActive + totalInactive), color: "#f59e0b" },
                ]} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
                <Tooltip 
                  cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  formatter={(val: unknown) => [String(val) + " Pengguna", "Jumlah"]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                  <Cell fill="#f59e0b" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      {/* Table Card Modern */}
      <section className="bg-white rounded-2xl shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="block w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-400/10 focus:border-amber-400 transition-all"
                placeholder="Cari nama atau email user..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="w-full sm:w-auto text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-8 focus:outline-none focus:ring-4 focus:ring-amber-400/10 focus:border-amber-400 transition-all cursor-pointer"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="aktif">User Aktif</option>
              <option value="nonaktif">User Nonaktif</option>
            </select>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="shrink-0 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95 outline-none"
          >
            <Plus size={16} strokeWidth={3} /> Buat User Baru
          </button>
        </div>

        {isLoading && <LoadingState />}

        {!isLoading && (
          <div className="overflow-x-auto min-h-[350px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-4 pl-6 pr-4">Informasi User</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 w-1/4">Roles</th>
                  <th className="py-4 px-4 w-1/4">Akses Cabang / Org</th>
                  <th className="py-4 pl-4 pr-6 text-right">Opsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredUsers?.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-4 pl-6 pr-4">
                      <div className="font-bold text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${user.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {user.is_active ? (
                           <><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>Aktif</>
                        ) : (
                           <><div className="w-1.5 h-1.5 rounded-full bg-slate-400"/>Nonaktif</>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {user.roles && user.roles.length > 0
                        ? <div className="flex flex-wrap gap-1.5">
                            {user.roles.map(r => (
                              <span key={r} className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200/50">{r}</span>
                            ))}
                          </div>
                        : <span className="text-xs text-slate-400 italic">— Kosong</span>}
                    </td>
                    <td className="py-4 px-4">
                      {user.organizations && user.organizations.length > 0
                        ? <div className="flex flex-wrap gap-1.5">
                            {user.organizations.map(o => (
                              <span key={o.id} className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200/50">{o.code}</span>
                            ))}
                          </div>
                        : <span className="text-xs text-slate-400 italic">— Kosong</span>}
                    </td>
                    <td className="py-4 pl-4 pr-6 text-right">
                      <div className="inline-flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditRolesUser(user)} className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors outline-none" title="Assign Role"><Shield size={16} /></button>
                        <button onClick={() => setEditOrgsUser(user)} className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors outline-none" title="Assign Organisasi"><Building2 size={16} /></button>
                        <button onClick={() => handleToggleActive(user)} className={`p-2 transition-colors rounded-lg outline-none ${user.is_active ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'}`} title={user.is_active ? "Nonaktifkan User" : "Aktifkan User"}>
                          {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.last_page > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50/50">
            <span>Menampilkan data <strong className="text-slate-800">{data.data.length}</strong> dari <strong className="text-slate-800">{data.total}</strong> pengguna</span>
            <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </section>

      {isCreateOpen && <CreateUserModal onClose={() => setIsCreateOpen(false)} />}
      {editRolesUser && <EditUserRolesModal user={editRolesUser} onClose={() => setEditRolesUser(null)} />}
      {editOrgsUser && <EditUserOrganizationsModal user={editOrgsUser} onClose={() => setEditOrgsUser(null)} />}
      </div>
    </div>
  );
}

// ================= MODALS =================

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<UserFormValues>(EMPTY_USER_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data: roles, isLoading: loadingRoles } = useRoleList();
  const { data: organizations, isLoading: loadingOrgs } = useInternalOrganizations();
  const createMutation = useCreateUser();

  function toggleRole(roleName: string) {
    setForm((f) => {
      const roles = f.roles ?? [];
      return { ...f, roles: roles.includes(roleName) ? roles.filter((r) => r !== roleName) : [...roles, roleName] };
    });
  }

  function toggleOrg(orgId: number) {
    setForm((f) => {
      const orgs = f.organization_ids ?? [];
      return { ...f, organization_ids: orgs.includes(orgId) ? orgs.filter((id) => id !== orgId) : [...orgs, orgId] };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.organization_ids || form.organization_ids.length === 0) {
      setError("Pilih minimal satu organisasi — user tanpa organisasi tidak akan bisa membuat data apa pun yang kelihatan oleh user lain.");
      return;
    }
    try {
      const res = await createMutation.mutateAsync(form);
      if (res.data.warning) alert(res.data.warning);
      onClose();
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  return (
    <Modal title="Buat User Baru" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Nama *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Budi Santoso" />
          <InputField label="Email *" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@perusahaan.com" />
          <InputField label="Password *" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} hint="Minimal 8 karakter" />
          <InputField label="Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Opsional" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Akses Organisasi / Cabang *</label>
          <p className="text-[11px] text-slate-500 mb-2">Wajib dipilih — agar dokumen yang dibuat user terlihat di sistem cabang yang tepat.</p>
          {loadingOrgs && <LoadingState />}
          {organizations && (
            <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {organizations.map((org) => (
                <label key={org.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" checked={(form.organization_ids ?? []).includes(org.id)} onChange={() => toggleOrg(org.id)} />
                  <span className="text-sm font-semibold text-slate-800">{org.name}</span>
                  <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{org.code}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Assign Role (Hak Akses Modul)</label>
          {loadingRoles && <LoadingState />}
          {roles && (
            <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {roles.data.map((role) => (
                <label key={role.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" checked={(form.roles ?? []).includes(role.name)} onChange={() => toggleRole(role.name)} />
                  <span className="text-sm font-semibold text-slate-800">{role.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <div className="text-sm text-rose-500 font-medium bg-rose-50 p-3 rounded-lg mt-2">{error}</div>}

        <Button type="submit" disabled={createMutation.isPending} style={{ width: "100%", marginTop: "0.5rem" }}>
          {createMutation.isPending ? "Menyimpan..." : "Buat User Baru"}
        </Button>
      </form>
    </Modal>
  );
}

function EditUserRolesModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { data: roles, isLoading } = useRoleList();
  const assignMutation = useAssignUserRoles();
  const [selected, setSelected] = useState<string[]>(user.roles ?? []);
  const [error, setError] = useState<string | null>(null);

  function toggle(roleName: string) {
    setSelected((prev) => prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]);
  }

  async function handleSave() {
    setError(null);
    try {
      await assignMutation.mutateAsync({ userId: user.id, roleNames: selected });
      onClose();
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  return (
    <Modal title={`Assign Role - ${user.name}`} onClose={onClose} maxWidth={400}>
      <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
        Centang semua role yang harus dimiliki user ini. Pilihan di sini <strong>MENGGANTI</strong> seluruh role lama, bukan menambah.
      </p>

      {isLoading && <LoadingState />}
      {roles && (
        <div className="flex flex-col gap-1.5 mb-4 max-h-[300px] overflow-y-auto pr-1">
          {roles.data.map((role) => (
            <label key={role.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" checked={selected.includes(role.name)} onChange={() => toggle(role.name)} />
              <span className="text-sm font-bold text-slate-800">{role.name}</span>
            </label>
          ))}
        </div>
      )}

      {error && <div className="text-sm text-rose-500 font-medium bg-rose-50 p-3 rounded-lg mb-4">{error}</div>}

      <Button onClick={handleSave} disabled={assignMutation.isPending} style={{ width: "100%" }}>
        {assignMutation.isPending ? "Menyimpan..." : "Simpan Role"}
      </Button>
    </Modal>
  );
}

function EditUserOrganizationsModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { data: organizations, isLoading } = useInternalOrganizations();
  const syncMutation = useSyncUserOrganizations();
  const [selected, setSelected] = useState<number[]>((user.organizations ?? []).map((o) => o.id));
  const [error, setError] = useState<string | null>(null);

  function toggle(orgId: number) {
    setSelected((prev) => prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]);
  }

  async function handleSave() {
    setError(null);
    try {
      await syncMutation.mutateAsync({ userId: user.id, organizationIds: selected });
      onClose();
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  return (
    <Modal title={`Akses Cabang - ${user.name}`} onClose={onClose} maxWidth={400}>
      <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
        Centang cabang (organization) yang bisa dipilih user ini saat login. Pilihan di sini <strong>MENGGANTI</strong> seluruh daftar lama.
      </p>

      {isLoading && <LoadingState />}
      {organizations && (
        <div className="flex flex-col gap-1.5 mb-4 max-h-[300px] overflow-y-auto pr-1">
          {organizations.map((org) => (
            <label key={org.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" checked={selected.includes(org.id)} onChange={() => toggle(org.id)} />
              <div>
                <div className="text-sm font-bold text-slate-800 leading-tight">{org.name}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{org.code}</div>
              </div>
            </label>
          ))}
        </div>
      )}

      {error && <div className="text-sm text-rose-500 font-medium bg-rose-50 p-3 rounded-lg mb-4">{error}</div>}

      <Button onClick={handleSave} disabled={syncMutation.isPending} style={{ width: "100%" }}>
        {syncMutation.isPending ? "Menyimpan..." : "Simpan Akses Cabang"}
      </Button>
    </Modal>
  );
}
