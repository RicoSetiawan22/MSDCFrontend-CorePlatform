import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  message: string;
}

/**
 * Pasangan LoadingState.tsx - dipakai saat query GAGAL (isError), bukan
 * cuma saat masih loading. TANPA ini, halaman yang query-nya gagal akan
 * tampil KOSONG SENYAP (data undefined, isLoading sudah false) - user
 * (dan developer) tidak tahu apa-apa terjadi, cuma lihat halaman blank
 * tanpa petunjuk. Selalu tampilkan INI kalau ada isError, supaya pesan
 * error dari backend (extractErrorMessage) benar-benar sampai ke user.
 */
export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <div
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.85rem",
          background: "white", border: "1px solid var(--border)", borderRadius: 12,
          padding: "1.75rem 2.5rem", boxShadow: "0 4px 20px rgba(20,22,31,0.08)", maxWidth: 420, textAlign: "center",
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bad-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AlertTriangle size={22} color="var(--bad)" />
        </div>
        <div>
          <div style={{ fontSize: "0.85rem", color: "var(--grey-dark)", fontWeight: 600, marginBottom: "0.2rem" }}>Gagal memuat data</div>
          <div style={{ fontSize: "0.8rem", color: "var(--grey)" }}>{message}</div>
        </div>
      </div>
    </div>
  );
}
