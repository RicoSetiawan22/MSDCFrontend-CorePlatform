import { useState, useEffect } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { usePostOvertimeToFinance, useDefaultOvertimeRate } from "../api/useOvertime";
import type { OvertimeRecord } from "../types/overtime";
import { ArrowUpRight, AlertCircle } from "lucide-react";

interface PostToFinanceModalProps {
  record: OvertimeRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export function PostToFinanceModal({
  record,
  onClose,
  onSuccess,
}: PostToFinanceModalProps) {
  const { data: defaultRate } = useDefaultOvertimeRate();
  const [ratePerHour, setRatePerHour] = useState<number>(25000);
  const [error, setError] = useState<string | null>(null);

  const postMutation = usePostOvertimeToFinance();

  useEffect(() => {
    if (defaultRate?.rate_per_hour) {
      setRatePerHour(defaultRate.rate_per_hour);
    }
  }, [defaultRate]);

  const totalCost = (Number(record.overtime_hours) || 0) * (ratePerHour || 0);

  function handlePost() {
    if (ratePerHour <= 0) {
      setError("Tarif lembur per jam harus lebih dari 0.");
      return;
    }
    setError(null);

    postMutation.mutate(
      { id: record.id, rate: ratePerHour },
      {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
        onError: (err) => {
          setError(extractErrorMessage(err));
        },
      }
    );
  }

  return (
    <Modal title="Posting Overtime ke Finance" onClose={onClose} maxWidth={540}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        {/* Info notice */}
        <div style={{
          background: "#F0F5FA",
          border: "1px solid #D2E1F0",
          borderRadius: 10,
          padding: "0.85rem 1rem",
          fontSize: "0.82rem",
          color: "#0A2140",
          lineHeight: 1.5,
        }}>
          <strong>Alur Bisnis Finance:</strong> Pengajuan lembur yang sudah <em>Disetujui</em> oleh Manager dapat diposting ke modul Finance & Accounting. Sistem akan secara otomatis membuat entri Jurnal Umum (General Ledger) untuk beban lembur karyawan ini.
        </div>

        {/* Record Overview */}
        <div style={{
          background: "#F7F8FA",
          border: "1px solid #E4E8EE",
          borderRadius: 10,
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontSize: "0.85rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#4A5C74" }}>Karyawan:</span>
            <strong style={{ color: "#0A2140" }}>{record.employee?.full_name ?? "—"}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#4A5C74" }}>Periode:</span>
            <strong style={{ color: "#0A2140" }}>{String(record.period_month).padStart(2, "0")}/{record.period_year}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#4A5C74" }}>Total Jam Lembur:</span>
            <strong style={{ color: "#0A2140" }}>{(Number(record.overtime_hours) || 0).toFixed(2)} jam</strong>
          </div>
        </div>

        {/* Input Rate */}
        <div>
          <label className="input-label" style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0A2140", marginBottom: 6, display: "block" }}>
            Tarif Lembur per Jam (Rp)
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              className="input"
              style={{ width: "100%", paddingLeft: "1.8rem" }}
              value={ratePerHour || ""}
              onChange={(e) => setRatePerHour(Math.max(0, Number(e.target.value)))}
              placeholder="Contoh: 25000"
              disabled={postMutation.isPending}
            />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem", color: "#4A5C74", fontWeight: 700 }}>
              Rp
            </span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#4A5C74", marginTop: 4 }}>
            {defaultRate ? `Tarif standar master data: ${formatCurrency(defaultRate.rate_per_hour)}/jam` : "Tarif standar belum dikonfigurasi"}
          </div>
        </div>

        {/* Calculation Summary */}
        <div style={{
          background: "#FFFBF0",
          border: "1px solid #F2A602",
          borderRadius: 10,
          padding: "0.9rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8C5E00", textTransform: "uppercase" }}>
              Total Nilai Jurnal Beban
            </div>
            <div style={{ fontSize: "0.75rem", color: "#8C5E00" }}>
              {(Number(record.overtime_hours) || 0).toFixed(2)} jam × {formatCurrency(ratePerHour)}
            </div>
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A2140" }}>
            {formatCurrency(totalCost)}
          </div>
        </div>

        {error && (
          <div style={{
            background: "#FCEAEA",
            border: "1px solid #E14B4B",
            borderRadius: 8,
            padding: "0.6rem 0.8rem",
            fontSize: "0.8rem",
            color: "#9C2121",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Modal actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 10, borderTop: "1px solid #E4E8EE" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={postMutation.isPending}
            style={{ fontSize: "0.82rem" }}
          >
            Batal
          </button>
          <Button
            onClick={handlePost}
            disabled={postMutation.isPending || totalCost <= 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#0A2140",
              borderColor: "#0A2140",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.82rem",
            }}
          >
            <ArrowUpRight size={14} />
            {postMutation.isPending ? "Memproses Posting..." : "Posting ke Finance"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
