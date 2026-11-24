import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, RotateCcw, CheckCircle2, Plus } from "lucide-react";
import { usePeriodList, useGeneratePeriods, useClosePeriod, useReopenPeriod } from "../api/useGlPeriods";
import { PageHeader } from "@shared/components/PageHeader";
import { Button } from "@shared/components/Button";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import { formatDate } from "@shared/lib/format";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const CURRENT_YEAR = new Date().getFullYear();

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  open:     { color: "#16a34a", bg: "#f0fdf4", icon: <CheckCircle2 size={14} />, label: "Terbuka" },
  closed:   { color: "#7c3aed", bg: "#f5f3ff", icon: <Lock size={14} />, label: "Ditutup" },
  reopened: { color: "#d97706", bg: "#fffbeb", icon: <RotateCcw size={14} />, label: "Dibuka Kembali" },
  locked:   { color: "#374151", bg: "#f9fafb", icon: <Lock size={14} />, label: "Dikunci" },
};

export function ClosingEntriesPage() {
  const navigate = useNavigate();
  const [tahun, setTahun] = useState(String(CURRENT_YEAR));
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: periods, isLoading } = usePeriodList(parseInt(tahun));
  const generateMutation = useGeneratePeriods();
  const closeMutation = useClosePeriod();
  const reopenMutation = useReopenPeriod();

  function handleGenerate() {
    setSuccessMsg(null);
    generateMutation.mutate(parseInt(tahun), {
      onSuccess: () => {
        setSuccessMsg("12 periode untuk tahun " + tahun + " berhasil dibuat.");
      },
    });
  }

  function handleClose(periodId: number, periodName: string) {
    if (!confirm(`Jalankan jurnal penutup untuk "${periodName}"?\n\n3 jurnal penutup akan dibuat:\n1. Tutup semua akun PENDAPATAN → Ikhtisar Laba Rugi\n2. Tutup semua akun BEBAN → Ikhtisar Laba Rugi\n3. Tutup Ikhtisar Laba Rugi → Laba Ditahan`)) return;
    setSuccessMsg(null);
    closeMutation.mutate(periodId, {
      onSuccess: () => {
        setSuccessMsg("Jurnal penutup berhasil dibuat untuk " + periodName + ".");
      },
      onError: (err: any) => {
        alert("Gagal: " + (err?.response?.data?.message ?? err?.message ?? "Error tidak diketahui"));
      },
    });
  }

  function handleReopen(periodId: number, periodName: string) {
    if (!confirm(`Buka kembali periode "${periodName}"?\n\nSemua jurnal penutup (year_closing) akan di-reversed.`)) return;
    setSuccessMsg(null);
    reopenMutation.mutate(periodId, {
      onSuccess: () => {
        setSuccessMsg("Periode " + periodName + " berhasil dibuka kembali.");
      },
      onError: (err: any) => {
        alert("Gagal: " + (err?.response?.data?.message ?? err?.message ?? "Error tidak diketahui"));
      },
    });
  }

  const isAnyPending = generateMutation.isPending || closeMutation.isPending || reopenMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Jurnal Penutup"
        subtitle="Tutup periode akuntansi — menghasilkan 3 jurnal penutup otomatis (tutup Revenue → Income Summary → Expense → Income Summary → Retained Earnings). Periode yang sudah ditutup bisa dibuka kembali."
      />

      <div style={{ padding: "0 2rem 1rem" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Tahun Fiskal</label>
            <select className="input" style={{ width: 110 }} value={tahun} onChange={(e) => setTahun(e.target.value)}>
              {Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={handleGenerate}
            disabled={isAnyPending}
          >
            <Plus size={15} />
            {generateMutation.isPending ? "Membuat..." : "Buat 12 Periode"}
          </Button>
          <Button variant="secondary" onClick={() => navigate("/finance/gl/journals")}>
            Lihat Jurnal
          </Button>
        </div>

        {successMsg && (
          <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600 }}>
            ✓ {successMsg}
          </div>
        )}
      </div>

      {/* Info box */}
      <div style={{ padding: "0 2rem 1rem" }}>
        <div style={{ padding: "0.875rem 1rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <Lock size={20} color="#1d4ed8" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1d4ed8", marginBottom: "0.25rem" }}>Cara Kerja Jurnal Penutup</div>
            <div style={{ fontSize: "0.8rem", color: "#374151", lineHeight: 1.6 }}>
              Klik <strong>"Tutup Periode"</strong> untuk menghasilkan <strong>3 jurnal penutup</strong>:<br/>
              ① Tutup PENDAPATAN → Ikhtisar Laba Rugi<br/>
              ② Tutup BEBAN → Ikhtisar Laba Rugi<br/>
              ③ Tutup Ikhtisar Laba Rugi → Laba Ditahan<br/>
              Jurnal asli tidak dihapus — hanya ditandai <strong>status: "reversed"</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* Period Cards */}
      <div style={{ padding: "0 2rem 2rem" }}>
        {isLoading && <LoadingState label="Memuat periode..." />}

        {!isLoading && (!periods || periods.length === 0) && (
          <EmptyState
            title="Belum Ada Periode"
            subtitle={`Klik "Buat 12 Periode" untuk membuat periode bulanan tahun ${tahun}.`}
          />
        )}

        {!isLoading && periods && periods.length > 0 && (
          <>
            <div style={{ marginBottom: "1rem", fontSize: "0.78rem", color: "var(--grey)" }}>
              {periods.length} periode — Tahun Fiskal {tahun}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.875rem" }}>
              {periods.map((p) => {
                const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.open;
                const isClosed = p.status === "closed";
                const isPending = closeMutation.isPending || reopenMutation.isPending;

                return (
                  <div
                    key={p.id}
                    style={{ background: "white", border: `1px solid ${isClosed ? "#c4b5fd" : "var(--border)"}`, borderRadius: 12, overflow: "hidden" }}
                  >
                    {/* Header */}
                    <div style={{ padding: "0.875rem 1rem", background: cfg.bg, borderBottom: `1px solid ${cfg.color}33` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1a1a1a" }}>
                            {MONTH_NAMES[p.month - 1] ?? "Bulan " + p.month}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: 2 }}>
                            {formatDate(p.start_date)} — {formatDate(p.end_date)}
                          </div>
                        </div>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}55` }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "0.75rem 1rem" }}>
                      {isClosed ? (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.78rem", color: "#7c3aed", fontWeight: 600 }}>
                            <CheckCircle2 size={14} /> Jurnal penutup sudah dibuat
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.78rem", color: "var(--grey)", marginBottom: "0.75rem" }}>
                          {p.year_end_closing_done
                            ? "Sudah ditutup"
                            : "Belum ditutup"}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {isClosed ? (
                          <Button
                            variant="secondary"
                            disabled={isPending}
                            onClick={() => handleReopen(p.id, p.period_name ?? MONTH_NAMES[p.month - 1])}
                            style={{ flex: 1, fontSize: "0.75rem" }}
                          >
                            <RotateCcw size={13} />
                            {reopenMutation.isPending ? "Membuka..." : "Buka Kembali"}
                          </Button>
                        ) : (
                          <Button
                            disabled={isPending}
                            onClick={() => handleClose(p.id, p.period_name ?? MONTH_NAMES[p.month - 1])}
                            style={{ flex: 1, fontSize: "0.75rem" }}
                          >
                            <Lock size={13} />
                            {closeMutation.isPending ? "Menutup..." : "Tutup Periode"}
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/finance/gl/trial-balance?as_of_date=${p.end_date}`)}
                          style={{ fontSize: "0.75rem" }}
                        >
                          Trial Balance
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
