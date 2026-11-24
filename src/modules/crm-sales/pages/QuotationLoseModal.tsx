
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { XCircle, AlertTriangle } from "lucide-react";

import { CrmModalShell } from "./CreateContractFromQuotationModal";
import { extractErrorMessage } from "@shared/types/api";

import { useCurrentUserName } from "../lib/useCurrentUserName";
import { useLoseQuotation } from "../api/useQuotations";
import { leadApi } from "../api/leadApi";

import type { Quotation } from "../types/quotation";


const QUOTATION_LOSE_STYLES = `
.quotation-lose-ui { color:#1e293b; }
.quotation-lose-ui form { gap:16px !important; }
.quotation-lose-ui .quotation-lose-warning { padding:14px 16px !important; border:1px solid #fed7aa !important; border-radius:13px !important; background:#fff7ed !important; }
.quotation-lose-ui .quotation-lose-number { padding:14px 16px !important; border:1px solid #e2e8f0 !important; border-radius:13px !important; background:#f8fafc !important; }
.quotation-lose-ui textarea { min-height:120px !important; border:1px solid #dbe3ed !important; border-radius:11px !important; transition:border-color .18s ease, box-shadow .18s ease; }
.quotation-lose-ui textarea:focus { border-color:#f0a800 !important; outline:none !important; box-shadow:0 0 0 4px rgba(240,168,0,.12) !important; }
.quotation-lose-ui .quotation-lose-user { padding:16px !important; border:1px solid #e2e8f0 !important; border-radius:13px !important; background:#f8fafc !important; }
.quotation-lose-ui .quotation-lose-error { border:1px solid #fecaca !important; border-radius:11px !important; }
.quotation-lose-ui .quotation-lose-actions { padding-top:14px !important; }
.quotation-lose-ui .quotation-lose-actions button { min-height:42px; padding:10px 16px !important; border-radius:11px !important; transition:transform .18s ease, box-shadow .18s ease; }
.quotation-lose-ui .quotation-lose-actions button:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 12px rgba(15,39,71,.09); }
.quotation-lose-ui button:focus-visible { outline:3px solid rgba(240,168,0,.28); outline-offset:2px; }
@media (max-width:560px) { .quotation-lose-ui .quotation-lose-actions { flex-direction:column-reverse !important; align-items:stretch !important; } .quotation-lose-ui .quotation-lose-actions button { width:100%; } }
@media (prefers-reduced-motion: reduce) { .quotation-lose-ui * { transition:none !important; animation:none !important; } }
`;

interface QuotationLoseModalProps {
  quotation: Quotation;
  leadId?: number | null;
  onClose: () => void;
}

export function QuotationLoseModal({ quotation, leadId, onClose }: QuotationLoseModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Pengguna yang sedang login
  const currentUserName = useCurrentUserName();

  // Hook untuk mengirim status Lose ke API
  const loseMutation = useLoseQuotation();

  const { data: lead, isLoading: loadingLead } = useQuery({
    queryKey: ["quotation-lose-lead", leadId],
    enabled: leadId != null && leadId > 0,
    queryFn: async () => (await leadApi.show(leadId!)).data.data,
  });

  const isSaving = loseMutation.isPending;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSaving) return;

    const cleanedReason = reason.trim();

    if (!cleanedReason) {
      setError("Alasan Lose wajib diisi.");
      return;
    }

    setError("");

    try {
      await loseMutation.mutateAsync({
        id: quotation.id,
        reason: cleanedReason,
      });

      // Tutup modal jika penyimpanan berhasil
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <CrmModalShell
      title="Tandai Penawaran Lose"
      onClose={() => {
        if (!isSaving) onClose();
      }}
      maxWidth={540}
    >
      <style>{QUOTATION_LOSE_STYLES}</style>
      <div className="quotation-lose-ui">
      <form
        className="quotation-lose-form"
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.15rem",
        }}
      >
        {/* Informasi peringatan */}
        <div
          className="quotation-lose-warning"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
            padding: "0.9rem",
            borderRadius: 9,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
          }}
        >
          <AlertTriangle
            size={19}
            color="#c2410c"
            style={{ flexShrink: 0 }}
          />

          <div
            style={{
              fontSize: "0.79rem",
              lineHeight: 1.6,
              color: "#9a3412",
            }}
          >
            Anda akan menandai quotation ini
            sebagai <strong>Lose</strong>,
            yaitu penawaran yang kalah atau
            ditolak oleh client.
          </div>
        </div>

        {/* Nomor Quotation */}
        <div
          className="quotation-lose-number"
          style={{
            padding: "0.9rem 1rem",
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
            borderRadius: 9,
          }}
        >
          <div
            style={{
              fontSize: "0.68rem",
              color: "#64748b",
              fontWeight: 700,
              marginBottom: 5,
            }}
          >
            NOMOR QUOTATION
          </div>

          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "#092747",
            }}
          >
            {quotation.quotation_number}
          </div>
        </div>

        {/* Alasan Lose */}
        <div>
          <label
            htmlFor="quotation-lost-reason"
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: "0.78rem",
              fontWeight: 800,
              color: "#16213d",
            }}
          >
            Alasan Lose{" "}
            <span style={{ color: "#dc2626" }}>
              *
            </span>
          </label>

          <textarea
            className="quotation-lose-textarea"
            id="quotation-lost-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError("");
            }}
            rows={4}
            maxLength={1000}
            required
            disabled={isSaving}
            placeholder="Contoh: Client memilih kompetitor karena harga lebih rendah."
            style={{
              width: "100%",
              minHeight: 110,
              padding: "0.75rem",
              fontSize: "0.78rem",
              fontFamily: "inherit",
              color: "#16213d",
              border: "1px solid #cbd5e1",
              borderRadius: 9,
              background: "#ffffff",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 5,
              color: "#94a3b8",
              fontSize: "0.68rem",
            }}
          >
            <span>
              Jelaskan alasan penawaran ditolak client.
            </span>
            <span>{reason.length}/1000</span>
          </div>
        </div>

        {/* Informasi pengguna */}
        <div
          className="quotation-lose-user"
          style={{
            padding: "1rem",
            border: "1px solid #e5e7eb",
            background: "#f8fafc",
            borderRadius: 9,
            display: "flex",
            flexDirection: "column",
            gap: "0.9rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.68rem",
                color: "#64748b",
                fontWeight: 700,
                marginBottom: 5,
              }}
            >
              SALES PENANGGUNG JAWAB
            </div>

            <div
              style={{
                fontSize: "0.8rem",
                color: "#16213d",
                fontWeight: 800,
              }}
            >
              {loadingLead ? "Memuat..." : (lead?.pic?.trim() || "Belum tersedia")}
            </div>
          </div>

          <div
            style={{
              height: 1,
              background: "#e5e7eb",
            }}
          />

          <div>
            <div
              style={{
                fontSize: "0.68rem",
                color: "#64748b",
                fontWeight: 700,
                marginBottom: 5,
              }}
            >
              DILAKUKAN OLEH
            </div>

            <div
              style={{
                fontSize: "0.8rem",
                color: "#16213d",
                fontWeight: 800,
              }}
            >
              {currentUserName ||
                "Pengguna yang sedang login"}
            </div>
          </div>

          <div
            style={{
              fontSize: "0.68rem",
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            Identitas pelaku aksi dan waktu
            penyimpanan resmi perlu dicatat
            oleh backend.
          </div>
        </div>

        {/* Pesan Error */}
        {error && (
          <div
            className="quotation-lose-error"
            role="alert"
            style={{
              display: "flex",
              gap: "0.6rem",
              alignItems: "flex-start",
              padding: "0.85rem",
              borderRadius: 8,
              background: "#fee2e2",
              color: "#b91c1c",
              fontSize: "0.75rem",
              lineHeight: 1.5,
            }}
          >
            <XCircle
              size={17}
              style={{ flexShrink: 0 }}
            />
            <span>{error}</span>
          </div>
        )}

        {/* Tombol aksi */}
        <div
          className="quotation-lose-actions"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "0.65rem",
            paddingTop: "0.85rem",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: "0.6rem 1rem",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              borderRadius: 8,
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: isSaving
                ? "not-allowed"
                : "pointer",
              fontFamily: "inherit",
            }}
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={!reason.trim() || isSaving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.6rem 1rem",
              border: "none",
              borderRadius: 8,
              background: "#dc2626",
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: 800,
              fontFamily: "inherit",
              cursor:
                !reason.trim() || isSaving
                  ? "not-allowed"
                  : "pointer",
              opacity:
                !reason.trim() || isSaving
                  ? 0.6
                  : 1,
            }}
          >
            <XCircle size={15} />
            {isSaving
              ? "Menyimpan..."
              : "Konfirmasi Lose"}
          </button>
        </div>
      </form>
      </div>
    </CrmModalShell>
  );
}
