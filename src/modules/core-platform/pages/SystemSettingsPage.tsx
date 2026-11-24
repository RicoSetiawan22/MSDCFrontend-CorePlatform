import { PageHeader } from "@shared/components/PageHeader";
import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { systemSettingApi } from "../api/systemSettingApi";
import { useAuth } from "@shared/lib/auth-context";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";

function getRoleMeta(role: string) {
  const r = role.toLowerCase();
  if (r.includes('admin') && r.includes('super')) return { tag: "Root", classes: "text-rose-600 bg-rose-50 border border-rose-200/50 font-bold" };
  if (r.includes('admin')) return { tag: "Core", classes: "text-slate-600 bg-slate-200/60 font-semibold" };
  if (r.includes('board')) return { tag: "Executive", classes: "text-purple-600 bg-purple-50 border border-purple-200/50 font-semibold" };
  if (r.includes('customer')) return { tag: "Client", classes: "text-slate-600 bg-slate-200/60 font-semibold" };
  if (r.includes('epm')) return { tag: "Project", classes: "text-slate-600 bg-slate-200/60 font-semibold" };
  if (r.includes('manager') && r.includes('executive')) return { tag: "Lead", classes: "text-blue-600 bg-blue-50 border border-blue-200/50 font-semibold" };
  if (r.includes('finance')) return { tag: "Finance", classes: "text-emerald-600 bg-emerald-50 border border-emerald-200/50 font-semibold" };
  if (r.includes('legal')) return { tag: "Legal", classes: "text-slate-600 bg-slate-200/60 font-semibold" };
  if (r.includes('manager')) return { tag: "Internal", classes: "text-slate-600 bg-slate-200/60 font-semibold" };
  if (r.includes('staff')) return { tag: "Standard", classes: "text-slate-600 bg-slate-200/60 font-semibold" };
  if (r.includes('steering')) return { tag: "Advisory", classes: "text-purple-600 bg-purple-50 border border-purple-200/50 font-semibold" };
  
  return { tag: "Standard", classes: "text-slate-600 bg-slate-200/60 font-semibold" };
}

export function SystemSettingsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("system-config.manage");

  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [initialRoles, setInitialRoles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!canManage) { setLoading(false); return; }
    systemSettingApi.twoFactorPolicy()
      .then((res) => {
        setAvailableRoles(res.data.data.available_roles);
        const reqRoles = new Set(res.data.data.required_roles);
        setSelectedRoles(reqRoles);
        setInitialRoles(reqRoles);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [canManage]);

  function toggleRole(role: string) {
    setSaved(false);
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  function handleSelectAll() {
    setSaved(false);
    setSelectedRoles(new Set(availableRoles));
  }

  function handleDeselectAll() {
    setSaved(false);
    setSelectedRoles(new Set());
  }
  
  function handleReset() {
    setSaved(false);
    setSelectedRoles(new Set(initialRoles));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await systemSettingApi.updateTwoFactorPolicy(Array.from(selectedRoles));
      setInitialRoles(new Set(selectedRoles));
      setSaved(true);
      // Hide success message after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return (
      <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto">
          <EmptyState title="Akses Ditolak" subtitle="Anda tidak punya izin (system-config.manage) untuk membuka halaman ini." />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[#f8fafc] min-h-screen w-full">
      <PageHeader
        title="Pengaturan Sistem"
        subtitle="Konfigurasi kebijakan keamanan tingkat sistem dan otentikasi multi-faktor."
      />
      <div className="px-7 py-5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Enforcement Engine Active
            </span>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : availableRoles.length === 0 ? (
          <EmptyState title="Belum Ada Role" subtitle="Buat role terlebih dahulu di menu Role & Permission." />
        ) : (
          <>
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">STATUS 2FA GLOBAL</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">Enforced / Aktif</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">ROLE TERPROTEKSI</p>
                  <p className="text-lg font-bold text-amber-600 mt-1">{selectedRoles.size} dari {availableRoles.length} Role</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">KEAMANAN SISTEM</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">Level: High Standard</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
              </div>
            </div>

            {/* Main Card Section: Kebijakan 2FA Wajib */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-7 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-slate-50/40 to-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100/80 flex items-center justify-center shadow-sm p-2.5">
                    <ShieldCheck size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                      Kebijakan 2FA Wajib
                      <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full border border-amber-200/60">Enforced Policy</span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Two-Factor Authentication Policy</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button onClick={handleSelectAll} className="btn btn-secondary text-xs px-3.5 py-1.5">
                    Pilih Semua
                  </button>
                  <button onClick={handleDeselectAll} className="btn btn-secondary text-xs px-3.5 py-1.5">
                    Hapus Pilihan
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-slate-700 flex items-start gap-3.5 leading-relaxed">
                  <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-blue-950">Aturan Penegakan Autentikasi:</p>
                    <p className="text-slate-600">
                      Pilih role yang <span className="font-bold text-slate-900 uppercase">WAJIB</span> mengaktifkan autentikasi 2 langkah (2FA) saat login. User dengan role terpilih yang belum setup 2FA akan diarahkan paksa ke halaman setup setelah login, dan tidak bisa mengakses halaman lain sebelum menyelesaikannya.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
                    Daftar Role Terdaftar Di Sistem
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {availableRoles.map(role => {
                      const meta = getRoleMeta(role);
                      const isSelected = selectedRoles.has(role);
                      return (
                        <label key={role} className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition select-none group ${isSelected ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300"}`}>
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleRole(role)}
                              className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400 focus:ring-offset-0 transition" 
                            />
                            <span className={`text-sm ${isSelected ? "font-bold text-slate-900" : "font-medium text-slate-800 group-hover:text-slate-900"}`}>{role}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded ${meta.classes}`}>{meta.tag}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                  </div>
                )}
                
                {saved && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Kebijakan 2FA berhasil disimpan!</span>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Menyimpan..." : "Simpan Kebijakan"}
                    </Button>
                    <Button variant="secondary" onClick={handleReset} disabled={saving}>
                      Batal / Reset
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Guidance Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Dukungan Aplikasi TOTP Universal</p>
                  <p className="text-xs text-slate-500 mt-0.5">Sistem kompatibel dengan Google Authenticator, Microsoft Authenticator, 1Password, dan Token Hardware FIDO2/TOTP standar RFC 6238.</p>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <footer className="text-center text-xs text-slate-400 py-3">
              © 2026 PT Multi Sarana Data Center (MSDC Surabaya). Hak Cipta Dilindungi Undang-Undang.
            </footer>
          </>
        )}
      </div>
    </main>
  );
}

