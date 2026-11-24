import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Lebar maksimum modal - default 480px (form simpel: Account, Cost
   * Center). Perbesar untuk form yang butuh tabel/kolom lebih banyak
   * (mis. JournalFormModal butuh ruang untuk baris debit/kredit). */
  maxWidth?: number;
}

export function Modal({ title, onClose, children, maxWidth = 480 }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--grey)" }}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
