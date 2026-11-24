import React from "react";
import { FolderSearch } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  subtitle: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
  };
}

/** Pola "tidak ada data" yang konsisten dipakai di SEMUA modul - ikon
 * lucide-react dipakai sebagai pengganti ilustrasi custom (starter ini
 * tidak menyertakan file gambar terpisah, supaya tetap ringan & mudah
 * di-install di mesin manapun). */
export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div className="empty-state">
      <FolderSearch size={64} strokeWidth={1.25} color="var(--grey)" />
      <div className="empty-state__title">{title}</div>
      <div className="empty-state__subtitle">{subtitle}</div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold px-4 py-2 mt-4 cursor-pointer transition-colors active:scale-95 shadow-xs"
        >
          {ActionIcon && <ActionIcon size={14} className="shrink-0" />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}
