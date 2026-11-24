
import {
  useState,
  type FormEvent,
} from "react";

import { XCircle, AlertTriangle } from "lucide-react";

import { Modal } from "@shared/components/Modal";

import { extractErrorMessage } from "@shared/types/api";

import { useCurrentUserName } from "../lib/useCurrentUserName";

import { useLoseQuotation } from "../api/useQuotations";

import type { Quotation } from "../types/quotation";

/**
 * Props QuotationLoseModal.
 */
interface QuotationLoseModalProps {
  quotation: Quotation;

  // Sales yang menangani Opportunity
  salesId?: number | null;

  onClose: () => void;
}

/**
 * ==========================================
 * QUOTATION LOSE MODAL
 * ==========================================
 *
 * Digunakan untuk menandai quotation
 * yang kalah atau ditolak oleh client.
 *
 * Berbeda dengan approval rejected,
 * yaitu penolakan internal perusahaan.
 */
export function QuotationLoseModal({
  quotation,
  salesId,
  onClose,
}: QuotationLoseModalProps) {
  /**
   * State form.
   */
  const [reason, setReason] = useState("");

  const [error, setError] = useState("");


  /**
   * Nama user yang sedang login.
   */
  const currentUserName = useCurrentUserName();

  /**
   * Mutation untuk menyimpan Lose.
   */
  const loseMutation = useLoseQuotation();

  const isSaving = loseMutation.isPending;

  /**
   * Simpan alasan Lose.
   */
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

      /**
       * Modal ditutup hanya jika
       * penyimpanan berhasil diverifikasi.
       */
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      title="Tandai Penawaran Lose"
      onClose={() => {
        if (!isSaving) {
          onClose();
        }
      }}
      maxWidth={540}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.15rem",
        }}
      >
        {/* Informasi peringatan */}
        <div
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

        {/* Informasi quotation */}
        <div
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
            id="quotation-lost-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);

              if (error) {
                setError("");
              }
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
              Jelaskan alasan penawaran
              ditolak oleh client.
            </span>

            <span>
              {reason.length}/1000
            </span>
          </div>
        </div>

        {/* Informasi pengguna */}
        <div
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
              {salesId != null
                ? `ID Sales: ${salesId}`
                : "Belum tersedia"}
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

        {/* Pesan error */}
        {error && (
          <div
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
            disabled={
              !reason.trim() || isSaving
            }
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
    </Modal>
  );
}
