import React, { useState, useEffect } from "react";
import { Trash2, AlertTriangle, X, Loader2, AlertCircle } from "lucide-react";
import { useDeleteSite } from "../../api/useSites";
import { extractErrorMessage } from "@shared/types/api";
import type { Site } from "../../types/site";

export interface SiteDeleteConfirmModalProps {
  site: Site | null;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Wrapper hanya menangani visibilitas; seluruh hooks ada di SiteDeleteConfirmContent
// agar urutan hooks selalu konsisten (Rules of Hooks). `key` me-reset pesan error
// secara otomatis ketika target site berganti.
export const SiteDeleteConfirmModal: React.FC<SiteDeleteConfirmModalProps> = ({
  site,
  isOpen = true,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !site) return null;

  return (
    <SiteDeleteConfirmContent
      key={site.id}
      site={site}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

interface SiteDeleteConfirmContentProps {
  site: Site;
  onClose: () => void;
  onSuccess?: () => void;
}

function SiteDeleteConfirmContent({ site, onClose, onSuccess }: SiteDeleteConfirmContentProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteSite();
  const isPending = deleteMutation.isPending;

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPending]);

  const handleConfirmDelete = () => {
    setErrorMessage(null);
    deleteMutation.mutate(site.id, {
      onSuccess: () => {
        onClose();
        if (onSuccess) onSuccess();
      },
      onError: (err) => {
        setErrorMessage(extractErrorMessage(err));
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={isPending ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-[480px] p-6 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        {/* Tombol Tutup (X) di Pojok Kanan Atas */}
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          aria-label="Tutup"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors cursor-pointer disabled:opacity-40"
        >
          <X size={18} />
        </button>

        {/* ── Header: Badge Ikon Sampah + Teks Konfirmasi ── */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
            <Trash2 size={20} strokeWidth={2.2} />
          </div>

          <div className="flex flex-col">
            <h3
              id="delete-dialog-title"
              className="text-base font-bold text-slate-900 leading-snug"
            >
              Konfirmasi Hapus Site
            </h3>
            <p
              id="delete-dialog-description"
              className="text-xs text-slate-600 mt-1 leading-relaxed"
            >
              Apakah anda yakin ingin menghapus site{" "}
              <span className="font-semibold text-slate-900">
                {site.site_name} ({site.site_code})
              </span>{" "}
              ?
            </p>
          </div>
        </div>

        {/* ── Alert Box: Peringatan Tindakan Permanen Sesuai Gambar ── */}
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3.5 mt-4 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-700 leading-relaxed">
            <span className="font-bold text-rose-800">
              Tindakan tidak dapat dibatalkan:
            </span>{" "}
            Semua data ruangan, rak, dan konfigurasi server yang terhubung ke site ini akan ikut
            dinonaktifkan atau terhapus secara permanen.
          </p>
        </div>

        {/* ── Error Banner jika API Menolak Penghapusan (mis. Masih Terikat Customer) ── */}
        {errorMessage && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 mt-3.5 flex items-start gap-2 text-xs animate-in fade-in duration-150">
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold text-amber-900">Gagal menghapus: </span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* ── Footer: Tombol Batal & Ya, Hapus Site ── */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isPending}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 size={13} strokeWidth={2.2} />
                <span>Ya, Hapus Site</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SiteDeleteConfirmModal;
