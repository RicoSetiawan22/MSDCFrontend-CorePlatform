import { useState, useEffect } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { FileUploadField } from "@shared/components/FileUploadField";
import { useFilePreview } from "../api/useFilePreview";
import { useUpdateOrganization } from "../api/useOrganizations";
import { Building2, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import type { Organization } from "@shared/types/organization";

interface QuickLogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: Organization[];
}

function LogoThumbnail({ fileId }: { fileId: number | null | undefined }) {
  const { url, isLoading } = useFilePreview(fileId);

  if (isLoading) {
    return (
      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400 animate-pulse border border-slate-200">
        Loading...
      </div>
    );
  }

  if (url) {
    return (
      <div className="w-16 h-16 rounded-xl bg-white p-1 border border-slate-200 flex items-center justify-center shadow-xs overflow-hidden">
        <img src={url} alt="Logo" className="max-w-full max-h-full object-contain" />
      </div>
    );
  }

  return (
    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
      <ImageIcon size={22} />
    </div>
  );
}

export function QuickLogoUploadModal({ isOpen, onClose, organizations }: QuickLogoUploadModalProps) {
  const internalOrgs = organizations.filter((o) => o.type === "internal");
  const [selectedOrgId, setSelectedOrgId] = useState<number>(internalOrgs[0]?.id ?? 0);
  const [logoFileId, setLogoFileId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateMutation = useUpdateOrganization();

  const currentOrg = internalOrgs.find((o) => o.id === selectedOrgId) ?? internalOrgs[0];

  useEffect(() => {
    if (currentOrg) {
      setLogoFileId(currentOrg.logo_file_id ?? null);
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [selectedOrgId, currentOrg]);

  if (!isOpen) return null;

  async function handleSave() {
    if (!currentOrg) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateMutation.mutateAsync({
        id: currentOrg.id,
        values: {
          code: currentOrg.code,
          name: currentOrg.name,
          type: currentOrg.type,
          is_active: currentOrg.is_active,
          address_line_1: currentOrg.address_line_1 ?? undefined,
          address_line_2: currentOrg.address_line_2 ?? undefined,
          npwp: currentOrg.npwp ?? undefined,
          pic_name: currentOrg.pic_name ?? undefined,
          pic_email: currentOrg.pic_email ?? undefined,
          pic_phone: currentOrg.pic_phone ?? undefined,
          logo_file_id: logoFileId ?? undefined,
          parent_id: currentOrg.parent_id ?? undefined,
        },
      });

      setSuccessMsg(`Logo untuk ${currentOrg.name} berhasil diperbarui!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal menyimpan logo organisasi.");
    }
  }

  return (
    <Modal title="Upload Logo Kop Surat Resmi" onClose={onClose} maxWidth={540}>
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            Pilih Cabang / Entitas Internal
          </label>
          <div className="relative">
            <select
              className="w-full text-sm font-semibold border border-slate-300 rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-xs cursor-pointer text-slate-800"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(Number(e.target.value))}
            >
              {internalOrgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.code})
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Logo ini akan dijadikan acuan resmi pencetakan surat & nota di cabang terkait.
          </p>
        </div>

        {currentOrg && (
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-4">
            <LogoThumbnail fileId={logoFileId} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-amber-600 shrink-0" />
                <h4 className="text-sm font-bold text-slate-900 truncate">{currentOrg.name}</h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {currentOrg.address_line_1 || "Alamat belum dikonfigurasi"}
              </p>
              <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {logoFileId ? "Logo Sudah Terpasang" : "Belum Ada Logo"}
              </span>
            </div>
          </div>
        )}

        <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-xs">
          <FileUploadField
            label="Unggah File Logo Baru (.PNG / .JPG)"
            currentFileId={logoFileId}
            moduleCode="CorePlatform"
            referenceType="organization_logo"
            referenceId={currentOrg?.id}
            accept="image/*"
            onUploaded={(fileId) => setLogoFileId(fileId)}
            onRemove={() => setLogoFileId(null)}
          />
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Rekomendasi: Format PNG transparan beresolusi minimal 300x300 px agar tidak pecah saat dicetak ke PDF.
          </p>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="button" onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Menyimpan Logo..." : "Simpan Logo Resmi"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
