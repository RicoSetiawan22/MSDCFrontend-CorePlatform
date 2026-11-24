import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  /** Default "Memuat data..." - override untuk konteks lain, mis.
   * "Menghitung...", "Memuat riwayat...". */
  label?: string;
}

/**
 * Pengganti pola lama `<div style={{color:grey}}>Memuat data...</div>`
 * yang dipakai berulang di 39 halaman - SEKARANG kartu mengambang dengan
 * spinner animasi, bukan popup/modal yang MENGHALANGI interaksi (loading
 * data list itu rutin, bukan peristiwa yang pantas mengunci layar) -
 * "menarik" di sini berarti tampilannya, bukan mekanisme blocking-nya.
 */
export function LoadingState({ label = "Memuat data..." }: LoadingStateProps) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <div
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.85rem",
          background: "white", border: "1px solid var(--border)", borderRadius: 12,
          padding: "1.75rem 2.5rem", boxShadow: "0 4px 20px rgba(20,22,31,0.08)",
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 size={22} color="var(--accent)" className="loading-state__spinner" />
        </div>
        <span style={{ fontSize: "0.85rem", color: "var(--grey-dark)", fontWeight: 600 }}>{label}</span>
      </div>
    </div>
  );
}
