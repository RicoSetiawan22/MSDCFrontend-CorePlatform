import React, { useState, useEffect, type FormEvent } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { useCreateSite, useUpdateSite } from "../../api/useSites";
import { extractErrorMessage } from "@shared/types/api";
import type { Site, SiteStatus } from "../../types/site";

// ── 1. Advanced TypeScript Definitions ────────────────────────────────
export interface SiteFormValues {
  site_name: string;
  address: string;
  city: string;
  province: string;
  total_power_capacity_kw: string;
  status: SiteStatus;
  notes: string;
}

export type SiteFormFieldKey = keyof SiteFormValues;
export type SiteFormErrors = Partial<Record<SiteFormFieldKey, string>>;

export interface SiteFormModalProps {
  site?: Site | null;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: (savedSite: Site) => void;
}

const DEFAULT_FORM_VALUES: SiteFormValues = {
  site_name: "",
  address: "",
  city: "",
  province: "",
  total_power_capacity_kw: "",
  status: "active",
  notes: "",
};

function getInitialFormValues(site?: Site | null): SiteFormValues {
  if (!site) return DEFAULT_FORM_VALUES;
  return {
    site_name: site.site_name,
    address: site.address ?? "",
    city: site.city ?? "",
    province: site.province ?? "",
    total_power_capacity_kw:
      site.total_power_capacity_kw != null ? String(site.total_power_capacity_kw) : "",
    status: site.status,
    notes: site.notes ?? "",
  };
}

// ── 2. Component Implementation ──────────────────────────────────────
// Wrapper hanya menangani visibilitas; seluruh hooks ada di SiteFormModalContent
// agar urutan hooks selalu konsisten (Rules of Hooks). `key` me-reset state form
// secara otomatis ketika site yang diedit berganti, tanpa perlu useEffect sinkronisasi.
export const SiteFormModal: React.FC<SiteFormModalProps> = ({
  site,
  isOpen = true,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <SiteFormModalContent
      key={site?.id ?? "new"}
      site={site}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

type SiteFormModalContentProps = Omit<SiteFormModalProps, "isOpen">;

function SiteFormModalContent({ site, onClose, onSuccess }: SiteFormModalContentProps) {
  const isEdit = Boolean(site);

  // React Best Practice: Lazy state initialization
  const [form, setForm] = useState<SiteFormValues>(() => getInitialFormValues(site));
  const [errors, setErrors] = useState<SiteFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const createMutation = useCreateSite();
  const updateMutation = useUpdateSite(site?.id ?? 0);
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Handle ESC key to dismiss modal safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPending]);

  // Type-safe field updater with functional setState
  const handleFieldChange = <K extends SiteFormFieldKey>(key: K, value: SiteFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear validation error on type
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const nextErrors: SiteFormErrors = {};
    if (!form.site_name.trim()) {
      nextErrors.site_name = "Nama site wajib diisi";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setApiError(null);

    const payload = {
      site_name: form.site_name.trim(),
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      province: form.province.trim() || undefined,
      total_power_capacity_kw: form.total_power_capacity_kw
        ? Number(form.total_power_capacity_kw)
        : undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      if (isEdit) {
        // Status dan site_code tidak dikirim saat update (punya endpoint tersendiri)
        const updated = await updateMutation.mutateAsync(payload);
        if (onSuccess && updated) onSuccess(updated as unknown as Site);
      } else {
        const created = await createMutation.mutateAsync({
          ...payload,
          status: form.status,
        });
        if (onSuccess && created) onSuccess(created as unknown as Site);
      }
      onClose();
    } catch (err) {
      setApiError(extractErrorMessage(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-[580px] overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-modal-title"
      >
        {/* ── Modal Header ── */}
        <div className="px-7 pt-6 pb-2 flex items-center justify-between">
          <h2
            id="site-modal-title"
            className="text-xl font-bold text-[#0A2140] tracking-tight"
          >
            {site ? `Edit Site — ${site.site_code}` : "Site Baru"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Tutup"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Modal Form Body ── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-7 py-4 flex flex-col gap-4 overflow-y-auto">
            {/* Baris 1: Kode Site & Status (2 Kolom) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Kode Site
                </label>
                {site ? (
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={site.site_code}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-medium text-slate-600 cursor-not-allowed select-none"
                  />
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm italic text-slate-400 cursor-not-allowed select-none">
                    Otomatis (Number Sequence)
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Status
                </label>
                {isEdit ? (
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={
                      form.status === "active"
                        ? "Aktif"
                        : form.status === "maintenance"
                        ? "Maintenance"
                        : "Didecommission"
                    }
                    title="Ubah status lewat dropdown Status di tabel Site"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-600 cursor-not-allowed select-none"
                  />
                ) : (
                  <select
                    value={form.status}
                    onChange={(e) =>
                      handleFieldChange("status", e.target.value as SiteStatus)
                    }
                    disabled={isPending}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option value="active">Aktif</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="decommissioned">Didecommission</option>
                  </select>
                )}
              </div>
            </div>

            {/* Baris 2: Nama Site * */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Nama Site <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                placeholder="mis. Data Center Surabaya 1"
                value={form.site_name}
                onChange={(e) => handleFieldChange("site_name", e.target.value)}
                disabled={isPending}
                className={`w-full bg-white border ${
                  errors.site_name
                    ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-200 focus:ring-amber-500/20 focus:border-amber-500"
                } rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.site_name && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.site_name}</p>
              )}
            </div>

            {/* Baris 3: Alamat */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Alamat
              </label>
              <textarea
                rows={2}
                placeholder="Alamat lengkap site..."
                value={form.address}
                onChange={(e) => handleFieldChange("address", e.target.value)}
                disabled={isPending}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
              />
            </div>

            {/* Baris 4: Kota & Provinsi (2 Kolom) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Kota
                </label>
                <input
                  type="text"
                  placeholder="mis. Surabaya"
                  value={form.city}
                  onChange={(e) => handleFieldChange("city", e.target.value)}
                  disabled={isPending}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Provinsi
                </label>
                <input
                  type="text"
                  placeholder="mis. Jawa Timur"
                  value={form.province}
                  onChange={(e) => handleFieldChange("province", e.target.value)}
                  disabled={isPending}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Baris 5: Kapasitas Daya Total (kW) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Kapasitas Daya Total (kW)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="mis. 500"
                value={form.total_power_capacity_kw}
                onChange={(e) =>
                  handleFieldChange("total_power_capacity_kw", e.target.value)
                }
                disabled={isPending}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Baris 6: Catatan */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Catatan
              </label>
              <textarea
                rows={2}
                placeholder="Catatan tambahan..."
                value={form.notes}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                disabled={isPending}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
              />
            </div>

            {/* Error Banner jika API mengembalikan kegagalan */}
            {apiError && (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle size={15} className="shrink-0 text-rose-500" />
                <span>{apiError}</span>
              </div>
            )}
          </div>

          {/* ── Modal Footer ── */}
          <div className="px-7 pb-6 pt-3 flex items-center gap-3 border-t border-slate-100 bg-white">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-[#E59B00] hover:bg-[#D48F00] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-xs active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : isEdit ? (
                "Simpan Perubahan"
              ) : (
                "Simpan Perubahan"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Alias export for semantic usage
export const AddSiteModal = SiteFormModal;
export default SiteFormModal;
