import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, FileSignature } from "lucide-react";
import { extractErrorMessage } from "@shared/types/api";
import { formatDate } from "@shared/lib/format";
import { documentApi, type DocumentVerifyResult } from "../api/documentApi";

/** Halaman PUBLIK (di luar login) - dibuka lewat scan QR di stempel tanda
 * tangan surat (lihat DocumentService::sign()) atau langsung ketik nomor
 * surat manual. Route-nya didaftarkan LANGSUNG di app/router.tsx SEJAJAR
 * dengan /login (di luar AppLayout yang wajib token), BUKAN lewat
 * documentManagementRoutes biasa yang masuk area terproteksi. */
export function VerifyDocumentPage() {
  const [searchParams] = useSearchParams();
  const numberFromQuery = searchParams.get("number") ?? "";

  const [numberInput, setNumberInput] = useState(numberFromQuery);
  const [result, setResult] = useState<DocumentVerifyResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runVerify(number: string) {
    if (!number.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setNotFound(false);
    try {
      const res = await documentApi.verify(number.trim());
      setResult(res.data.data ?? null);
    } catch (e) {
      const message = extractErrorMessage(e);
      if (message.toLowerCase().includes("tidak ditemukan")) {
        setNotFound(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (numberFromQuery) runVerify(numberFromQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberFromQuery]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-subtle)", padding: "1.5rem",
    }}>
      <div style={{
        width: "100%", maxWidth: 420, background: "white", borderRadius: 14,
        border: "1px solid var(--border)", padding: "2rem", boxShadow: "0 8px 30px rgba(20,22,31,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
          <FileSignature size={22} color="var(--accent)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>Verifikasi Surat</div>
            <div style={{ fontSize: "0.78rem", color: "var(--grey)" }}>MSDC ERP — Sistem Surat</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
          <input
            className="input" style={{ flex: 1 }} placeholder="mis. SJ/0001/09/2026"
            value={numberInput} onChange={e => setNumberInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") runVerify(numberInput); }}
          />
          <button className="btn btn-primary" disabled={loading} onClick={() => runVerify(numberInput)}>
            {loading ? "Memeriksa..." : "Cek"}
          </button>
        </div>

        {error && <div className="input-error">{error}</div>}

        {notFound && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "1.5rem 0", color: "var(--bad)" }}>
            <XCircle size={40} />
            <div style={{ fontWeight: 700, marginTop: 8 }}>Nomor Surat Tidak Ditemukan</div>
            <div style={{ fontSize: "0.82rem", color: "var(--grey)", marginTop: 4 }}>
              Periksa kembali nomor surat yang dimasukkan.
            </div>
          </div>
        )}

        {result && (
          <div>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
              padding: "1.25rem 0", color: result.is_signed ? "var(--good)" : "var(--grey)",
            }}>
              <CheckCircle2 size={40} />
              <div style={{ fontWeight: 700, fontSize: "1.05rem", marginTop: 8, color: "var(--text)" }}>
                {result.is_signed ? "Surat Ini Sah & Ditandatangani" : "Surat Ditemukan"}
              </div>
              {!result.is_signed && (
                <div style={{ fontSize: "0.8rem", color: "var(--grey)", marginTop: 2 }}>Belum ditandatangani secara elektronik.</div>
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: 8 }}>
              <Row label="Nomor Surat" value={result.document_number} mono />
              <Row label="Judul" value={result.title} />
              <Row label="Cabang" value={result.organization_name ?? "—"} />
              {result.is_signed && (
                <>
                  <Row label="Ditandatangani Oleh" value={result.signed_by ?? "—"} />
                  <Row label="Waktu Tanda Tangan" value={result.signed_at ? formatDate(result.signed_at) : "—"} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: "0.85rem" }}>
      <span style={{ color: "var(--grey)" }}>{label}</span>
      <span style={{ fontWeight: 600, fontFamily: mono ? "monospace" : undefined, textAlign: "right" }}>{value}</span>
    </div>
  );
}
