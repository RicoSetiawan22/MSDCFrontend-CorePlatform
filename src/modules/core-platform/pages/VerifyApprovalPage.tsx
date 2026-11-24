import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, FileSignature, QrCode, ArrowRight } from "lucide-react";
import { extractErrorMessage } from "@shared/types/api";
import { formatDate } from "@shared/lib/format";
import { workflowApi, type WorkflowApprovalVerifyResult } from "../api/workflowApi";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  purchase_request: "Purchase Request (FPPBJ)",
  purchase_order: "Purchase Order (Surat Pesanan)",
  payment_request: "Payment Request (FPP)",
};

/** Halaman PUBLIK (di luar login) - dibuka lewat scan QR di 1 KOLOM tanda
 * tangan spesifik di PDF PO/PR/FPP (lihat ResolvesApprovalSignatures di
 * ProcurementInventory - beda dari /verify yang untuk 1 dokumen "Surat"
 * secara keseluruhan). Route-nya didaftarkan LANGSUNG di app/router.tsx
 * sejajar dengan /verify, di luar AppLayout yang wajib token. */
export function VerifyApprovalPage() {
  const [searchParams] = useSearchParams();
  const type = (searchParams.get("type") === "vote" ? "vote" : "level") as "level" | "vote";
  const id = Number(searchParams.get("id") ?? 0);

  const [result, setResult] = useState<WorkflowApprovalVerifyResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    setNotFound(false);
    workflowApi.verifyApproval(type, id)
      .then(res => setResult(res.data.data ?? null))
      .catch(e => {
        const message = extractErrorMessage(e);
        if (message.toLowerCase().includes("tidak ditemukan")) setNotFound(true);
        else setError(message);
      })
      .finally(() => setLoading(false));
  }, [type, id]);

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
            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>Verifikasi Tanda Tangan</div>
            <div style={{ fontSize: "0.78rem", color: "var(--grey)" }}>MSDC ERP — Approval Procurement</div>
          </div>
        </div>

        {loading && <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--grey)" }}>Memeriksa...</div>}

        {error && <div className="input-error">{error}</div>}

        {!loading && !id && !result && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "1.25rem 0", color: "var(--text)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <QrCode size={32} color="var(--accent)" />
            </div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>Pindai QR Code Dokumen</div>
            <div style={{ fontSize: "0.82rem", color: "var(--grey)", marginTop: 6, lineHeight: 1.5 }}>
              Halaman ini terbuka otomatis saat Anda memindai QR Code pada stempel dokumen fisik atau lembar PDF yang telah disetujui (Approved).
            </div>

            <div style={{ marginTop: 20, width: "100%", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <div style={{ fontSize: "0.8rem", color: "var(--grey)", marginBottom: 10 }}>
                Ingin mencari dan memverifikasi dokumen berdasarkan nomor surat?
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.84rem" }}
                onClick={() => window.location.href = "/verify"}
              >
                <span>Buka Verifikasi Surat (/verify)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {!loading && id > 0 && notFound && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "1.5rem 0", color: "var(--bad)" }}>
            <XCircle size={40} />
            <div style={{ fontWeight: 700, marginTop: 8 }}>Tanda Tangan Tidak Ditemukan</div>
            <div style={{ fontSize: "0.82rem", color: "var(--grey)", marginTop: 4 }}>
              Link QR ini tidak valid, atau tanda tangan dokumen (ID #{id}) belum/tidak pernah disetujui.
            </div>
          </div>
        )}

        {!loading && result && (
          <div>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
              padding: "1.25rem 0", color: "var(--good)",
            }}>
              <CheckCircle2 size={40} />
              <div style={{ fontWeight: 700, fontSize: "1.05rem", marginTop: 8, color: "var(--text)" }}>
                Tanda Tangan Sah & Terverifikasi
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: 8 }}>
              <Row label="Nomor Dokumen" value={result.reference_number ?? "—"} mono />
              <Row label="Jenis Dokumen" value={DOCUMENT_TYPE_LABELS[result.document_type] ?? result.document_type} />
              <Row label="Tahap Approval" value={result.level_name} />
              <Row label="Ditandatangani Oleh" value={result.signer_name} />
              <Row label="Jabatan" value={result.signer_jabatan} />
              <Row label="Waktu Tanda Tangan" value={result.signed_at ? formatDate(result.signed_at) : "—"} />
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
