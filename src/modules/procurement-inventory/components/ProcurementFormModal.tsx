import type { ReactNode } from "react";
import { X, type LucideIcon, FileText } from "lucide-react";

interface ProcurementFormModalProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  maxWidth?: string; // e.g. "max-w-[620px]"
  children: ReactNode;
  footer?: ReactNode;
  submitLabel?: string;
  isSubmitting?: boolean;
  hideFooter?: boolean;
}

export function ProcurementFormModal({
  title,
  subtitle,
  icon: Icon = FileText,
  onClose,
  onSubmit,
  maxWidth = "max-w-[620px]",
  children,
  footer,
  submitLabel = "Simpan",
  isSubmitting = false,
  hideFooter = false,
}: ProcurementFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className={`w-full ${maxWidth} bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100/80 shrink-0">
              <Icon size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        {onSubmit ? (
          <form
            onSubmit={onSubmit}
            className="p-6 overflow-y-auto flex flex-col gap-4"
          >
            {children}

            {/* Default or Custom Footer */}
            {!hideFooter &&
              (footer ? (
                footer
              ) : (
                <div className="flex items-center justify-end gap-3 pt-3 mt-1 shrink-0 border-t border-slate-100/80">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Menyimpan..." : submitLabel}
                  </button>
                </div>
              ))}
          </form>
        ) : (
          <div className="p-6 overflow-y-auto flex flex-col gap-4">
            {children}
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
