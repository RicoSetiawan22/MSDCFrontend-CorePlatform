import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, ClipboardList, ExternalLink, FileText, Layers3, Plus, RefreshCw, Trash2, TrendingUp, XCircle } from "lucide-react";
import { useContract } from "../api/useContracts";
import { useCloseContract, useRenewContract, useRenewalData } from "../api/useRenewals";
import { PageHeader } from "@shared/components/PageHeader";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { LoadingState } from "@shared/components/LoadingState";
import { ErrorState } from "@shared/components/ErrorState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { URGENCY_LABEL, addDays, getUrgency, periodEnd, todayISO, readSalesName } from "../api/renewalUtils";
import type { Contract, ContractDetail, ContractService } from "../types/contract";
import type { ContractCloseReason } from "../types/renewal";

const COLORS = {
  navy: "#0b2748",
  navyText: "#16213d",
  slate: "#64748b",
  muted: "#94a3b8",
  border: "#dfe5ec",
  page: "#f4f7fb",
  white: "#ffffff",
  green: "#16a34a",
  red: "#dc2626",
  orange: "#f5a400",
};

const DURATIONS = [
  { value: "6", label: "6 bulan" },
  { value: "12", label: "12 bulan" },
  { value: "24", label: "24 bulan" },
  { value: "36", label: "36 bulan" },
  { value: "custom", label: "Kustom (atur tanggal sendiri)" },
];

const CLOSE_REASONS: Array<{ value: ContractCloseReason; label: string }> = [
  { value: "client_not_continuing", label: "Klien tidak melanjutkan layanan" },
  { value: "moved_vendor", label: "Klien pindah ke vendor lain" },
  { value: "service_discontinued", label: "Layanan dihentikan" },
  { value: "budget_issue", label: "Kendala anggaran klien" },
  { value: "other", label: "Lainnya (jelaskan di catatan)" },
];

const WORKFLOW_STEPS = [
  "Hubungi klien & sepakati syarat",
  "Buat kontrak perpanjangan",
  "Approval Finance & Legal",
  "Kirim ke klien & tanda tangan",
  "Kontrak baru aktif",
];

const card = { background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1.1rem 1.2rem", boxShadow: "0 4px 18px rgba(15,23,42,.045)" } as const;
const sectionTitle = { margin: "0 0 0.8rem", color: COLORS.navyText, fontSize: "0.82rem", fontWeight: 800 } as const;
const labelStyle = { display: "block", marginBottom: 4, color: COLORS.slate, fontSize: "0.68rem", fontWeight: 700 } as const;
const controlStyle = {
  width: "100%",
  padding: "0.5rem 0.65rem",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  fontSize: "0.78rem",
  background: "#fff",
  color: COLORS.navyText,
  boxSizing: "border-box",
} as const;

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div style={{ color: COLORS.slate, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
      <div style={{ color: COLORS.navyText, fontSize: "0.8rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "0.35rem 0", fontSize: "0.74rem" }}>
      <span style={{ color: COLORS.slate }}>{label}</span>
      <span style={{ color: COLORS.navyText, fontWeight: strong ? 800 : 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

interface Line extends ContractService {
  include: boolean;
  originalUnitPrice?: number;
}

/* ──────────────────────────────────────────────────────────────── */
/* Workspace: dirender SETELAH kontrak termuat supaya state awal form */
/* langsung diturunkan dari kontrak (tanpa useEffect sinkronisasi).   */
/* ──────────────────────────────────────────────────────────────── */
function RenewalWorkspace({ contract, existingRenewal }: { contract: ContractDetail; existingRenewal: Contract | null }) {
  const navigate = useNavigate();
  const renewMutation = useRenewContract(contract.id);
  const closeMutation = useCloseContract(contract.id);

  const [mode, setMode] = useState<"renew" | "close">("renew");
  const [formError, setFormError] = useState<string | null>(null);

  // ── Form perpanjangan ──
  const [startDate, setStartDate] = useState(contract.end_date ? addDays(contract.end_date, 1) : todayISO());
  const [duration, setDuration] = useState("12");
  const [customEnd, setCustomEnd] = useState("");
  const [uplift, setUplift] = useState("0");
  const [lines, setLines] = useState<Line[]>(() =>
  (contract.services ?? []).map((s) => ({
    ...s,
    originalUnitPrice: Number(s.unit_price ?? 0),
    include: true,
  }))
);
  const [paymentTerm, setPaymentTerm] = useState(String(contract.payment_term_days ?? 30));
  const [autoRenew, setAutoRenew] = useState(contract.auto_renew);
  const [notes, setNotes] = useState("");

  // ── Form selesaikan ──
  const [reason, setReason] = useState<ContractCloseReason>("client_not_continuing");
  const [effectiveDate, setEffectiveDate] = useState(contract.end_date ?? todayISO());
  const [closeNotes, setCloseNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const oldMonthly = Number(contract.monthly_value ?? 0);
  const endDate = duration === "custom" ? customEnd : startDate ? periodEnd(startDate, Number(duration)) : "";
  const recurringLines = lines.filter((l) => l.include && (l.billing_type ?? "recurring") === "recurring");
  const newMonthly = lines.length
    ? recurringLines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unit_price), 0)
    : Math.round(oldMonthly * (1 + (Number(uplift) || 0) / 100));
  const delta = newMonthly - oldMonthly;
  const deltaPct = oldMonthly > 0 ? (delta / oldMonthly) * 100 : 0;

  const daysLeft = contract.days_until_expiry;
  const urgency = daysLeft !== null ? getUrgency(daysLeft) : null;
  const canAct = !existingRenewal && ["active", "expiring_soon", "expired"].includes(contract.status);

  function applyUplift() {
    const pct = Number(uplift) || 0;
    const original = contract.services ?? [];
    setLines((prev) =>
      prev.map((l, i) => ({ ...l, unit_price: Math.round(Number(original[i]?.unit_price ?? l.unit_price) * (1 + pct / 100)) }))
    );
  }

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function addLine() {
  setLines((prev) => [
    ...prev,
    {
      service_type: "other",
      description: "",
      quantity: 1,
      unit_price: 0,
      billing_type: "recurring",
      cc_source_location: null,
      cc_destination_location: null,
      include: true,
      originalUnitPrice: 0,
    },
  ]);
}
function removeLine(index: number) {
  setLines((prev) => prev.filter((_, i) => i !== index));
}

  // Menambahkan layanan baru ke kontrak perpanjangan

// Menghapus layanan dari daftar perpanjangan

  function validateRenew(): string | null {
    if (lines.some((l) => l.include && !l.description.trim())) {
  return "Deskripsi layanan wajib diisi.";
}
    if (!startDate) return "Tanggal mulai perpanjangan wajib diisi.";
    if (!endDate) return "Tanggal berakhir perpanjangan wajib diisi.";
    if (endDate <= startDate) return "Tanggal berakhir harus setelah tanggal mulai.";
    if (contract.end_date && startDate <= contract.end_date.slice(0, 10)) {
      if (!confirm("Tanggal mulai perpanjangan tumpang tindih dengan periode kontrak lama. Lanjutkan?")) return "Perbaiki tanggal mulai perpanjangan.";
    }
    if (lines.length > 0 && lines.every((l) => !l.include)) return "Pilih minimal satu layanan yang diperpanjang.";
    if (lines.some((l) => l.include && (Number(l.quantity) <= 0 || Number(l.unit_price) < 0))) return "Jumlah harus lebih dari 0 dan harga tidak boleh negatif.";
    if (Number(paymentTerm) < 0 || paymentTerm === "") return "Termin pembayaran tidak valid.";
    return null;
  }

  async function handleRenew() {
    const err = validateRenew();
    setFormError(err);
    if (err) return;
    if (!confirm(`Buat kontrak perpanjangan untuk ${contract.contract_number}? Kontrak baru dibuat sebagai Draft dan harus melalui approval Finance & Legal.`)) return;
    try {
      const created = await renewMutation.mutateAsync({
        start_date: startDate,
        end_date: endDate,
        monthly_value: newMonthly,
        payment_term_days: Number(paymentTerm),
        auto_renew: autoRenew,
        notes: notes.trim() || undefined,
        services: lines
          .filter((l) => l.include)
          .map((l) => ({
            service_type: l.service_type,
            description: l.description,
            quantity: Number(l.quantity),
            unit_price: Number(l.unit_price),
            billing_type: l.billing_type,
            cc_source_location: l.cc_source_location,
            cc_destination_location: l.cc_destination_location,
          })),
      });
      navigate(`/crm-sales/contracts/${created.id}`);
    } catch (e) {
      setFormError(extractErrorMessage(e));
    }
  }

  async function handleClose() {
    if (!effectiveDate) return setFormError("Tanggal efektif penyelesaian wajib diisi.");
    if (reason === "other" && !closeNotes.trim()) return setFormError("Jelaskan alasan pada kolom catatan.");
    if (!confirmed) return setFormError("Centang konfirmasi terlebih dahulu.");
    setFormError(null);
    if (!confirm(`Selesaikan kontrak ${contract.contract_number} tanpa perpanjangan? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await closeMutation.mutateAsync({ reason, effective_date: effectiveDate, notes: closeNotes.trim() || undefined });
      navigate("/crm-sales/contracts/renewals");
    } catch (e) {
      setFormError(extractErrorMessage(e));
    }
  }

  const optionCard = (key: "renew" | "close", icon: ReactNode, title: string, desc: string) => (
    <button
      type="button"
      className={`crm-renewal-choice ${mode === key ? "crm-renewal-choice--selected" : ""} ${key === "close" ? "crm-renewal-choice--close" : ""}`}
      aria-pressed={mode === key}
      onClick={() => {
        setMode(key);
        setFormError(null);
      }}
      style={{
        flex: 1,
        textAlign: "left",
        padding: "0.9rem 1rem",
        borderRadius: 10,
        border: `2px solid ${mode === key ? (key === "renew" ? COLORS.orange : COLORS.red) : COLORS.border}`,
        background: mode === key ? (key === "renew" ? "#fffbeb" : "#fef2f2") : "#fff",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.navyText, fontWeight: 800, fontSize: "0.82rem" }}>
        {icon} {title}
      </div>
      <div style={{ marginTop: 4, color: COLORS.slate, fontSize: "0.7rem", lineHeight: 1.4 }}>{desc}</div>
    </button>
  );

  return (
    <>
      {/* Info kontrak saat ini */}
      <div className="crm-renewal-current-card" style={{ ...card, marginBottom: "1rem" }}>
        <div className="crm-renewal-section-heading">
          <span className="crm-renewal-section-icon crm-renewal-section-icon--blue"><FileText size={19} /></span>
          <div><h2 style={sectionTitle}>Kontrak Saat Ini</h2><p>Informasi kontrak yang menjadi dasar perpanjangan.</p></div>
        </div>
        <div className="crm-renewal-current-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1rem" }}>
          <Info label="Pelanggan" value={contract.customer?.company_name ?? "—"} />
          <Info label="Nomor Kontrak" value={contract.contract_number} />
          <Info label="Periode" value={`${formatDate(contract.start_date)} – ${formatDate(contract.end_date)}`} />
          <Info
            label="Sisa Waktu"
            value={
              daysLeft === null ? "—" : (
                <span style={{ color: urgency === "darurat" ? COLORS.red : COLORS.navyText }}>
                  {daysLeft < 0 ? `Lewat ${Math.abs(daysLeft)} hari` : `${daysLeft} hari`} {urgency && `· ${URGENCY_LABEL[urgency]}`}
                </span>
              )
            }
          />
          <Info label="Nilai Bulanan" value={formatCurrency(oldMonthly)} />
          <Info label="Termin Pembayaran" value={`${contract.payment_term_days} hari`} />
          <Info label="Auto Renew" value={contract.auto_renew ? "Ya" : "Tidak"} />
          <Info label="Layanan" value={`${contract.services?.length ?? 0} item`} />
          <Info label="Penjual" value={readSalesName(contract)} />
        </div>
      </div>

      {/* Perpanjangan sudah berjalan */}
      {existingRenewal && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: "1rem",
            padding: "0.85rem 1.1rem",
            background: "#ede9fe",
            border: "1px solid #ddd6fe",
            borderRadius: 10,
            color: "#4c1d95",
            fontSize: "0.76rem",
          }}
        >
          <span>
            Perpanjangan untuk kontrak ini sedang diproses sebagai <strong>{existingRenewal.contract_number}</strong>. Lanjutkan approval &amp; tanda tangan di kontrak tersebut.
          </span>
          <Link
            to={`/crm-sales/contracts/${existingRenewal.id}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#4c1d95", fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Buka kontrak <ExternalLink size={13} />
          </Link>
        </div>
      )}

      {!existingRenewal && !canAct && (
        <div style={{ ...card, marginBottom: "1rem", color: COLORS.slate, fontSize: "0.78rem" }}>
          Kontrak berstatus <strong>{contract.status}</strong> tidak bisa diperpanjang dari halaman ini. Hanya kontrak Aktif / Akan Berakhir / Berakhir yang bisa diproses.
        </div>
      )}

      {canAct && (
        <div className="crm-renewal-workspace" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: "1rem", alignItems: "start" }}>
          {/* ───── Kolom kiri: keputusan + form ───── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="crm-renewal-form-panel" style={card}>
              <div className="crm-renewal-section-heading">
                <span className="crm-renewal-section-icon crm-renewal-section-icon--gold"><RefreshCw size={19} /></span>
                <div><h2 style={sectionTitle}>Keputusan Klien</h2><p>Pilih tindak lanjut sesuai kesepakatan dengan pelanggan.</p></div>
              </div>
              <div className="crm-renewal-choices" style={{ display: "flex", gap: "0.8rem" }}>
                {optionCard("renew", <RefreshCw size={16} color={COLORS.orange} />, "Perpanjang Kontrak", "Klien melanjutkan layanan. Buat kontrak perpanjangan dengan periode & harga baru.")}
                {optionCard("close", <XCircle size={16} color={COLORS.red} />, "Selesaikan Kontrak", "Klien tidak melanjutkan. Kontrak diselesaikan dan alasan dicatat.")}
              </div>
            </div>

            {mode === "renew" ? (
              <>
                <div className="crm-renewal-form-panel crm-renewal-period-panel" style={card}>
                  <div className="crm-renewal-section-heading">
                    <span className="crm-renewal-section-icon crm-renewal-section-icon--blue"><CalendarDays size={19} /></span>
                    <div><h2 style={sectionTitle}>Periode Perpanjangan</h2><p>Tentukan tanggal mulai dan durasi kontrak baru.</p></div>
                  </div>
                  <div className="crm-renewal-period-grid">
                    <div className="crm-renewal-period-field">
                      <InputField label="Mulai *" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} hint="Sehari setelah kontrak lama berakhir" />
                    </div>
                    <div className="crm-renewal-period-field">
                      <label style={labelStyle}>Durasi *</label>
                      <select style={controlStyle} value={duration} onChange={(e) => setDuration(e.target.value)}>
                        {DURATIONS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="crm-renewal-period-field crm-renewal-period-end">
                      {duration === "custom" ? (
                        <InputField label="Berakhir *" type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                      ) : (
                        <>
                          <span className="crm-renewal-field-label">Tanggal Berakhir</span>
                          <strong>{endDate ? formatDate(endDate) : "—"}</strong>
                          <small>Otomatis sesuai durasi</small>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="crm-renewal-form-panel crm-renewal-services-panel" style={card}>
                  <div className="crm-renewal-section-heading">
                    <span className="crm-renewal-section-icon crm-renewal-section-icon--gold"><Layers3 size={19} /></span>
                    <div><h2 style={sectionTitle}>Layanan &amp; Harga</h2><p>Atur layanan yang ikut, jumlah, dan harga kontrak baru.</p></div>
                  </div>
                  <div className="crm-renewal-uplift-bar">
                    <div className="crm-renewal-uplift-row">
                      <div className="crm-renewal-uplift-input">
                        <InputField label="Kenaikan harga (%)" type="number" value={uplift} onChange={(e) => setUplift(e.target.value)} />
                      </div>
                      {lines.length > 0 && (
                        <button type="button" className="crm-renewal-apply-button" onClick={applyUplift}>
                          <RefreshCw size={16} aria-hidden="true" /> Terapkan ke Semua Layanan
                        </button>
                      )}
                    </div>
                    <span className="crm-renewal-uplift-hint">Menghitung ulang harga berdasarkan tarif awal.</span>
                  </div>
                  <div className="crm-renewal-services-toolbar">
                    <div>
                      <strong>Daftar Layanan</strong>
                      <span>{lines.length} layanan terdaftar · {lines.filter((l) => l.include).length} ikut perpanjangan</span>
                    </div>
                    <button type="button" className="crm-renewal-add-button" onClick={addLine}>
                      <Plus size={17} aria-hidden="true" /> Tambah Layanan
                    </button>
                  </div>
                  {lines.length === 0 ? (
                    <div className="crm-renewal-services-empty">Belum ada layanan. Klik <strong>Tambah Layanan</strong> untuk menambahkan layanan pada kontrak baru.</div>
                  ) : (
                    <div className="crm-renewal-service-list">
                      {lines.map((l, i) => (
                        <div key={l.id ?? `new-${i}`} className={`crm-renewal-service-card ${!l.include ? "crm-renewal-service-card--excluded" : ""}`}>
                          <div className="crm-renewal-service-top">
                            <label className="crm-renewal-service-toggle">
                              <input type="checkbox" checked={l.include} onChange={(e) => updateLine(i, { include: e.target.checked })} />
                              <span>Layanan {String(i + 1).padStart(2, "0")}</span>
                              <small>{l.include ? "Ikut diperpanjang" : "Tidak diikutkan"}</small>
                            </label>
                            <button type="button" className="crm-renewal-remove-button" onClick={() => removeLine(i)} aria-label={`Hapus layanan ${i + 1}`}>
                              <Trash2 size={15} aria-hidden="true" /> <span>Hapus</span>
                            </button>
                          </div>
                          <div className="crm-renewal-service-fields">
                            <label className="crm-renewal-service-field">
                              <span>Jenis Layanan</span>
                              <select style={controlStyle} value={l.service_type} onChange={(e) => updateLine(i, { service_type: e.target.value as ContractService["service_type"] })}>
                                <option value="colocation">Colocation</option>
                                <option value="dedicated_server">Dedicated Server</option>
                                <option value="cloud">Cloud</option>
                                <option value="bandwidth">Bandwidth</option>
                                <option value="cross_connect">Cross Connect</option>
                                <option value="managed_service">Managed Service</option>
                                <option value="other">Lainnya</option>
                              </select>
                            </label>
                            <label className="crm-renewal-service-field">
                              <span>Deskripsi Layanan</span>
                              <input type="text" style={controlStyle} value={l.description} placeholder="Nama atau rincian layanan..." onChange={(e) => updateLine(i, { description: e.target.value })} />
                            </label>
                            <label className="crm-renewal-service-field">
                              <span>Billing</span>
                              <select style={controlStyle} value={l.billing_type ?? "recurring"} onChange={(e) => updateLine(i, { billing_type: e.target.value as "recurring" | "one_time" })}>
                                <option value="recurring">Bulanan</option>
                                <option value="one_time">Sekali</option>
                              </select>
                            </label>
                            <label className="crm-renewal-service-field">
                              <span>Qty</span>
                              <input type="number" min={1} style={controlStyle} value={l.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} />
                            </label>
                            <div className="crm-renewal-service-field crm-renewal-service-old-price">
                              <span>Harga Lama</span>
                              <strong>{formatCurrency(Number(l.originalUnitPrice ?? 0))}</strong>
                            </div>
                            <label className="crm-renewal-service-field">
                              <span>Harga Baru</span>
                              <input type="number" min={0} style={controlStyle} value={l.unit_price} onChange={(e) => updateLine(i, { unit_price: Number(e.target.value) })} />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="crm-renewal-form-panel crm-renewal-terms-panel" style={card}>
                  <div className="crm-renewal-section-heading">
                    <span className="crm-renewal-section-icon crm-renewal-section-icon--blue"><ClipboardList size={19} /></span>
                    <div><h2 style={sectionTitle}>Ketentuan Lain</h2><p>Termin pembayaran, pembaruan otomatis, dan catatan untuk kontrak.</p></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "0.8rem" }}>
                    <InputField label="Termin Pembayaran (hari)" type="number" value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value)} />
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem", color: COLORS.navyText, paddingTop: "1.2rem" }}>
                      <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} />
                      Auto Renew
                    </label>
                  </div>
                  <label style={labelStyle}>Catatan</label>
                  <textarea style={{ ...controlStyle, minHeight: 70, resize: "vertical" }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Mis. hasil negosiasi dengan klien, diskon, syarat khusus…" />
                </div>
              </>
            ) : (
              <div className="crm-renewal-form-panel" style={card}>
                <div className="crm-renewal-section-heading">
                  <span className="crm-renewal-section-icon crm-renewal-section-icon--blue"><XCircle size={19} /></span>
                  <div><h2 style={sectionTitle}>Penyelesaian Kontrak</h2><p>Isi alasan dan tanggal efektif penghentian layanan.</p></div>
                </div>
                <div className="crm-renewal-close-fields" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "0.8rem", marginBottom: "1rem" }}>
                  <div className="crm-renewal-close-field">
                    <label style={labelStyle}>Alasan *</label>
                    <select style={controlStyle} value={reason} onChange={(e) => setReason(e.target.value as ContractCloseReason)}>
                      {CLOSE_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="crm-renewal-close-field crm-renewal-close-date"><InputField label="Tanggal Efektif *" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} /></div>
                </div>
                <label style={labelStyle}>Catatan {reason === "other" && "*"}</label>
                <textarea style={{ ...controlStyle, minHeight: 80, resize: "vertical", marginBottom: "0.8rem" }} value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} placeholder="Ringkasan percakapan dengan klien, tindak lanjut offboarding, dll." />
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.76rem", color: COLORS.navyText }}>
                  <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} style={{ marginTop: 2 }} />
                  Saya sudah mengonfirmasi dengan klien bahwa kontrak tidak diperpanjang dan layanan akan berakhir pada tanggal efektif.
                </label>
              </div>
            )}

            {formError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.7rem 1rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: COLORS.red, fontSize: "0.76rem" }}>
                <AlertTriangle size={14} /> {formError}
              </div>
            )}

            <div className="crm-renewal-actions">
              <Button variant="secondary" onClick={() => navigate("/crm-sales/contracts/renewals")}>Batal</Button>
              {mode === "renew" ? (
                <>
                  <div className="crm-renewal-quotation-button">
                    <Button variant="secondary" onClick={() => navigate(`/crm-sales/quotations/new?mode=renewal&contract_id=${contract.id}`)}>
                      <FileText size={16} aria-hidden="true" /> Buat Quotation Perpanjangan
                    </Button>
                  </div>
                  <div className="crm-renewal-submit-button">
                    <Button onClick={handleRenew} disabled={renewMutation.isPending}>
                      <RefreshCw size={16} aria-hidden="true" /> {renewMutation.isPending ? "Memproses..." : "Buat Kontrak Perpanjangan"}
                    </Button>
                  </div>
                </>
              ) : (
                <button type="button" className="crm-renewal-close-button" onClick={handleClose} disabled={closeMutation.isPending}>
                  <XCircle size={16} aria-hidden="true" /> {closeMutation.isPending ? "Memproses..." : "Selesaikan Kontrak"}
                </button>
              )}
            </div>
          </div>

          {/* ───── Kolom kanan: ringkasan ───── */}
          <div className="crm-renewal-sidebar" style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: 12 }}>
            {mode === "renew" && (
              <div className="crm-renewal-summary-card" style={card}>
                <div className="crm-renewal-summary-heading">
                  <span className="crm-renewal-summary-icon"><TrendingUp size={20} /></span>
                  <div><h2 style={sectionTitle}>Ringkasan Perpanjangan</h2><p>Estimasi nilai dan periode kontrak baru.</p></div>
                </div>
                <div className="crm-renewal-summary-total">
                  <span>Nilai Bulanan Baru</span>
                  <strong>{formatCurrency(newMonthly)}</strong>
                  <small>Nilai mengikuti layanan yang dipilih</small>
                </div>
                <div className="crm-renewal-summary-rows">
                <Row label="Periode lama" value={`${formatDate(contract.start_date)} – ${formatDate(contract.end_date)}`} />
                <Row label="Periode baru" value={endDate ? `${formatDate(startDate)} – ${formatDate(endDate)}` : "—"} />
                <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: "0.4rem 0" }} />
                <Row label="Nilai bulanan lama" value={formatCurrency(oldMonthly)} />
                <Row
                  label="Selisih"
                  value={
                    <span style={{ color: delta > 0 ? COLORS.green : delta < 0 ? COLORS.red : COLORS.slate }}>
                      {delta >= 0 ? "+" : "−"}{formatCurrency(Math.abs(delta))} ({deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(1)}%)
                    </span>
                  }
                />
                <Row label="Layanan ikut" value={lines.length ? `${lines.filter((l) => l.include).length} / ${lines.length}` : "—"} />
                </div>
              </div>
            )}

            <div className="crm-renewal-workflow-card" style={card}>
              <div className="crm-renewal-section-heading">
                <span className="crm-renewal-section-icon crm-renewal-section-icon--blue"><ClipboardList size={18} /></span>
                <div><h2 style={sectionTitle}>Alur Perpanjangan</h2><p>Langkah setelah kesepakatan dengan klien.</p></div>
              </div>
              <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {WORKFLOW_STEPS.map((step, i) => (
                  <li key={step} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.72rem", color: COLORS.navyText }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: i === 0 ? COLORS.orange : "#eef2f6", color: i === 0 ? "#fff" : COLORS.slate, fontSize: "0.66rem", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {i === 4 ? <CheckCircle2 size={12} /> : i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <p style={{ margin: "0.8rem 0 0", color: COLORS.muted, fontSize: "0.66rem", lineHeight: 1.4 }}>
                Setelah tombol ditekan, Anda diarahkan ke kontrak baru (Draft) untuk melanjutkan langkah 3–5.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const RENEWAL_DETAIL_STYLES = `
.crm-renewal-detail-page { min-height:100%; background:#f5f7fa !important; color:#16213d; }
.crm-renewal-detail-page section,.crm-renewal-detail-page .content-card { border:1px solid #e2e8f0 !important; border-radius:16px !important; background:#fff !important; box-shadow:0 4px 18px rgba(15,23,42,.045); }
.crm-renewal-detail-page input,.crm-renewal-detail-page select,.crm-renewal-detail-page textarea { border-color:#dbe3ec !important; border-radius:10px !important; }
.crm-renewal-detail-page input:focus,.crm-renewal-detail-page select:focus,.crm-renewal-detail-page textarea:focus { border-color:#e4a008 !important; box-shadow:0 0 0 3px rgba(240,168,0,.12) !important; outline:none !important; }
.crm-renewal-detail-page button { border-radius:10px !important; transition:transform .16s ease,box-shadow .16s ease; }
.crm-renewal-detail-page button:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 12px rgba(15,39,71,.09); }
.crm-renewal-detail-page button:focus-visible,.crm-renewal-detail-page a:focus-visible { outline:3px solid rgba(247,171,0,.35); outline-offset:2px; }
.crm-renewal-detail-page .crm-contract-tabs { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:16px !important; }
.crm-renewal-detail-page .crm-contract-tabs > a,.crm-renewal-detail-page .crm-contract-tabs > div { min-height:36px; padding:8px 15px !important; border-radius:10px !important; font-size:12px !important; }
/* Detail perpanjangan: identitas dan keputusan dibuat lebih jelas tanpa mengubah handler. */
.crm-renewal-detail-page .crm-renewal-back { display:inline-flex !important; align-items:center; gap:8px !important; min-height:42px; padding:10px 15px; border-radius:12px; border:1px solid #f3cf7a; background:#fff4d9; color:#875600 !important; font-size:.75rem !important; font-weight:800 !important; text-decoration:none; box-shadow:0 4px 12px rgba(223,166,17,.065); }
.crm-renewal-detail-page .crm-renewal-back:hover { background:#ffe9b3; color:#6e4400 !important; }
.crm-renewal-detail-page .crm-renewal-detail-heading { padding:21px 23px; border:1px solid #e4ebf4; border-radius:19px; background:linear-gradient(115deg,#f7faff 0%,#fff 60%,#fff8e7 100%); box-shadow:0 4px 14px rgba(17,39,68,.035); }
.crm-renewal-detail-page .crm-renewal-detail-heading h1 { font-size:1.28rem !important; }
.crm-renewal-detail-page section,.crm-renewal-detail-page .content-card { border-color:#e4ebf4 !important; border-radius:18px !important; box-shadow:0 4px 17px rgba(15,39,71,.04) !important; }
.crm-renewal-detail-page input,.crm-renewal-detail-page select,.crm-renewal-detail-page textarea { border-radius:11px !important; background:#fff !important; }
.crm-renewal-detail-page table th { background:#f5f8fc; color:#62758c; font-size:.67rem; }
.crm-renewal-detail-page table tbody tr:nth-child(even) td { background:#fbfcff; }
@media (max-width:760px) { .crm-renewal-detail-page .crm-renewal-detail-heading { padding:16px; } }
@media (max-width:760px) { .crm-renewal-detail-page > div[style*='padding: 0 2rem'] { padding-left:16px !important; padding-right:16px !important; } }
/* Konsistensi dengan form Quotation, Customer, dan Prospek MSDC. */
.crm-renewal-detail-page .crm-renewal-nav { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin:0 0 16px; }
.crm-renewal-detail-page .crm-renewal-back { min-height:44px; padding:10px 17px; border:1px solid #f3cf7a; border-radius:13px; background:linear-gradient(180deg,#fffbf2 0%,#fff0cb 100%); color:#956000 !important; font-size:12px !important; font-weight:800 !important; box-shadow:0 4px 12px rgba(218,158,31,.07); text-decoration:none; }
.crm-renewal-detail-page .crm-renewal-nav-label { padding:8px 13px; background:white; color:#7990a8; border:1px solid #e5edf4; border-radius:999px; font-size:11px; font-weight:800; }
.crm-renewal-detail-page .crm-renewal-detail-heading { display:flex; align-items:center; gap:18px; padding:23px 25px; background:linear-gradient(108deg,#f5f9ff 0%,#fff 52%,#fff8e7 100%); }
.crm-renewal-detail-page .crm-renewal-hero-icon { display:grid; place-items:center; width:59px; height:59px; flex:0 0 59px; border:1px solid #f7d991; border-radius:17px; color:#b77b00; background:#fff0c8; }
.crm-renewal-detail-page .crm-renewal-hero-copy { min-width:0; }
.crm-renewal-detail-page .crm-renewal-current-card,.crm-renewal-detail-page .crm-renewal-form-panel,.crm-renewal-detail-page .crm-renewal-workflow-card { border:1px solid #e4ecf5 !important; border-radius:19px !important; background:#fff !important; box-shadow:0 5px 17px rgba(15,39,71,.04); padding:20px 22px !important; }
.crm-renewal-detail-page .crm-renewal-section-heading { display:flex; align-items:center; gap:12px; min-height:52px; padding-bottom:15px; margin-bottom:17px; border-bottom:1px solid #edf2f7; }
.crm-renewal-detail-page .crm-renewal-section-heading h2 { font-size:14px !important; line-height:1.4; margin:0 !important; color:#0c2b4e; }
.crm-renewal-detail-page .crm-renewal-section-heading p { font-size:11.5px; line-height:1.5; color:#879aaf; margin:3px 0 0; }
.crm-renewal-detail-page .crm-renewal-section-icon { width:43px; height:43px; flex:0 0 43px; display:grid; place-items:center; border-radius:13px; }
.crm-renewal-detail-page .crm-renewal-section-icon--gold { background:#fff4d9; border:1px solid #f9e6b7; color:#b87a00; }
.crm-renewal-detail-page .crm-renewal-section-icon--blue { background:#edf5ff; border:1px solid #e1eeff; color:#2876d5; }
.crm-renewal-detail-page .crm-renewal-current-grid { gap:0 !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; }
.crm-renewal-detail-page .crm-renewal-current-grid > div { min-width:0; border-right:1px solid #edf2f7; border-bottom:1px solid #edf2f7; padding:11px 12px 14px; }
.crm-renewal-detail-page .crm-renewal-current-grid > div:nth-child(4n) { border-right:0; }
.crm-renewal-detail-page .crm-renewal-current-grid > div:nth-last-child(-n+4) { border-bottom:0; }
.crm-renewal-detail-page .crm-renewal-choice { min-height:116px; display:flex; flex-direction:column; justify-content:center; border-radius:14px !important; padding:16px !important; background:#fff !important; border-color:#e5edf4 !important; }
.crm-renewal-detail-page .crm-renewal-choice--selected:not(.crm-renewal-choice--close) { background:#fff9e9 !important; border-color:#edac17 !important; box-shadow:0 0 0 3px rgba(245,169,10,.07); }
.crm-renewal-detail-page .crm-renewal-choice--close.crm-renewal-choice--selected { background:#fff4f4 !important; border-color:#ea7e7e !important; box-shadow:0 0 0 3px rgba(220,38,38,.06); }
.crm-renewal-detail-page .crm-renewal-period-panel { background:linear-gradient(140deg,#fff 0%,#fff 63%,#fffaf0 100%) !important; }
.crm-renewal-detail-page .crm-renewal-period-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; align-items:stretch; }
.crm-renewal-detail-page .crm-renewal-period-field { min-width:0; padding:14px 13px; border:1px solid #e8eef6; border-radius:14px; background:#fafdff; }
.crm-renewal-detail-page .crm-renewal-period-field input,.crm-renewal-detail-page .crm-renewal-period-field select { min-width:0; }
.crm-renewal-detail-page .crm-renewal-period-end { background:#fff8e8; border-color:#f6e4bc; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; }
.crm-renewal-detail-page .crm-renewal-period-end strong { font-size:15px; color:#0b2c4c; margin:5px 0; }
.crm-renewal-detail-page .crm-renewal-period-end small { color:#a77b2e; font-size:10px; }
.crm-renewal-detail-page .crm-renewal-field-label { display:block; font-size:11px; font-weight:800; color:#8e6c34; }
.crm-renewal-detail-page .crm-renewal-uplift-bar { display:flex; flex-direction:column; gap:10px; padding:15px; background:#f7faff; border:1px solid #e7eff7; border-radius:15px; margin-bottom:18px; }
.crm-renewal-detail-page .crm-renewal-uplift-row { display:flex; align-items:flex-end; gap:12px; flex-wrap:wrap; }
.crm-renewal-detail-page .crm-renewal-uplift-input { width:170px; max-width:100%; }
.crm-renewal-detail-page .crm-renewal-uplift-input > div { margin-bottom:0 !important; }
.crm-renewal-detail-page .crm-renewal-uplift-input input { height:44px !important; }
.crm-renewal-detail-page .crm-renewal-apply-button { min-height:44px; height:44px; padding:0 18px; border:1px solid #f0c875; border-radius:11px !important; background:#fff8e9; color:#936000; font-size:11.5px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; align-self:flex-end; white-space:nowrap; }
.crm-renewal-detail-page .crm-renewal-apply-button:hover { background:#ffedbd; }
.crm-renewal-detail-page .crm-renewal-uplift-hint { font-size:10.5px; line-height:1.45; color:#8799af; }

.crm-renewal-detail-page .crm-renewal-services-toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; padding-bottom:14px; margin-bottom:13px; border-bottom:1px solid #edf2f7; }
.crm-renewal-detail-page .crm-renewal-services-toolbar > div { display:flex; flex-direction:column; gap:4px; }
.crm-renewal-detail-page .crm-renewal-services-toolbar strong { color:#0b2b4e; font-size:13px; }
.crm-renewal-detail-page .crm-renewal-services-toolbar span { color:#8da0b5; font-size:10.5px; }
.crm-renewal-detail-page .crm-renewal-add-button { display:inline-flex; align-items:center; gap:8px; min-height:41px; padding:10px 15px; border:1px solid #eeaa04; background:#f5a900; color:#0b2748; border-radius:11px !important; font-weight:800; font-size:11.5px; cursor:pointer; box-shadow:0 4px 12px rgba(244,166,0,.1); }
.crm-renewal-detail-page .crm-renewal-add-button:hover { background:#ffbf22; }
.crm-renewal-detail-page .crm-renewal-service-list { display:grid; gap:12px; }
.crm-renewal-detail-page .crm-renewal-service-card { padding:14px; background:linear-gradient(180deg,#fff 0%,#fbfcff 100%); border:1px solid #e7edf5; border-radius:15px; }
.crm-renewal-detail-page .crm-renewal-service-card--excluded { background:#f8fafc; opacity:.75; }
.crm-renewal-detail-page .crm-renewal-service-top { display:flex; align-items:center; justify-content:space-between; gap:12px; border-bottom:1px solid #edf2f7; padding-bottom:11px; margin-bottom:13px; }
.crm-renewal-detail-page .crm-renewal-service-toggle { display:flex; align-items:center; gap:9px; flex-wrap:wrap; font-size:12.5px; font-weight:800; color:#0d2d4f; cursor:pointer; }
.crm-renewal-detail-page .crm-renewal-service-toggle small { color:#879aaf; font-size:10.5px; font-weight:600; }
.crm-renewal-detail-page .crm-renewal-service-toggle input { accent-color:#d99b00; width:15px; height:15px; }
.crm-renewal-detail-page .crm-renewal-remove-button { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:34px; padding:6px 10px; border:1px solid #ffd5d5; border-radius:9px !important; color:#dc2626; background:#fffafa; font-size:11px; font-weight:800; cursor:pointer; }
.crm-renewal-detail-page .crm-renewal-remove-button:hover { background:#fff1f1; }
.crm-renewal-detail-page .crm-renewal-service-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
.crm-renewal-detail-page .crm-renewal-service-field { display:flex; flex-direction:column; gap:6px; min-width:0; }
.crm-renewal-detail-page .crm-renewal-service-field > span { color:#61768e; font-size:10.5px; font-weight:800; }
.crm-renewal-detail-page .crm-renewal-service-field select,.crm-renewal-detail-page .crm-renewal-service-field input { height:40px; min-width:0; }
.crm-renewal-detail-page .crm-renewal-service-old-price strong { min-height:40px; display:flex; align-items:center; padding:0 12px; border:1px dashed #e3ebf4; border-radius:10px; background:#f8fafc; color:#60758f; font-size:12px; }
.crm-renewal-detail-page .crm-renewal-services-empty { padding:23px 16px; border:1px dashed #dce7f3; border-radius:14px; background:#f8fbff; color:#71859b; font-size:12px; line-height:1.6; text-align:center; }
.crm-renewal-detail-page .crm-renewal-actions { display:flex; align-items:center; justify-content:flex-end; gap:10px; flex-wrap:wrap; padding:14px 0 8px; }
.crm-renewal-detail-page .crm-renewal-actions button { min-height:43px; display:inline-flex; align-items:center; justify-content:center; gap:8px; font-size:12px; font-weight:800; }
.crm-renewal-detail-page .crm-renewal-quotation-button button { background:#fff9e9 !important; border:1px solid #efd28e !important; color:#946000 !important; }
.crm-renewal-detail-page .crm-renewal-submit-button button { color:#102c48 !important; background:#f5ab0b !important; border:1px solid #f5ab0b !important; box-shadow:0 6px 13px rgba(245,171,11,.14); }
.crm-renewal-detail-page .crm-renewal-close-button { border:1px solid #dc2626; color:#fff; background:#dc2626; border-radius:11px; padding:10px 16px; }
.crm-renewal-detail-page .crm-renewal-summary-card { position:relative; overflow:hidden; background:linear-gradient(145deg,#fffaf0 0%,#fff8e6 44%,#fff 100%) !important; border:1px solid #f3d998 !important; border-radius:19px !important; padding:19px !important; box-shadow:0 7px 21px rgba(157,110,0,.06); }
.crm-renewal-detail-page .crm-renewal-summary-heading { display:flex; align-items:center; gap:11px; margin-bottom:16px; }
.crm-renewal-detail-page .crm-renewal-summary-heading h2 { margin:0 !important; font-size:13px !important; line-height:1.4; }
.crm-renewal-detail-page .crm-renewal-summary-heading p { margin:3px 0 0; color:#98743d; line-height:1.5; font-size:10px; }
.crm-renewal-detail-page .crm-renewal-summary-icon { display:grid; place-items:center; width:42px; height:42px; flex:0 0 42px; border:1px solid #f3d48f; background:#ffedc0; color:#bd7e00; border-radius:13px; }
.crm-renewal-detail-page .crm-renewal-summary-total { display:flex; flex-direction:column; gap:4px; padding:15px; margin-bottom:13px; background:rgba(255,255,255,.8); border:1px solid #f5e2bc; border-radius:13px; }
.crm-renewal-detail-page .crm-renewal-summary-total > span { font-size:11px; font-weight:800; color:#9c741e; }
.crm-renewal-detail-page .crm-renewal-summary-total > strong { color:#0d2d4f; font-size:20px; font-weight:850; letter-spacing:-.025em; overflow-wrap:anywhere; }
.crm-renewal-detail-page .crm-renewal-summary-total > small { color:#9ba8b7; font-size:10px; }
.crm-renewal-detail-page .crm-renewal-summary-rows { display:grid; gap:4px; }
.crm-renewal-detail-page .crm-renewal-summary-rows > div { border-bottom:1px solid rgba(227,200,146,.38); padding:8px 0 !important; font-size:11px !important; }
.crm-renewal-detail-page .crm-renewal-summary-rows > div:last-child { border-bottom:0; }
.crm-renewal-detail-page .crm-renewal-summary-rows > div > span:last-child { max-width:60%; overflow-wrap:anywhere; }
.crm-renewal-detail-page .crm-renewal-workflow-card { background:linear-gradient(180deg,#fff 0%,#fbfdff 100%) !important; }
@media (max-width:1120px) { .crm-renewal-detail-page .crm-renewal-workspace { grid-template-columns:minmax(0,1fr) !important; } .crm-renewal-detail-page .crm-renewal-sidebar { position:static !important; display:grid !important; grid-template-columns:repeat(2,minmax(0,1fr)); align-items:start; } }
@media (max-width:760px) { .crm-renewal-detail-page .crm-renewal-detail-heading { padding:17px !important; } .crm-renewal-detail-page .crm-renewal-hero-icon { width:44px; height:44px; flex-basis:44px; } .crm-renewal-detail-page .crm-renewal-current-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; } .crm-renewal-detail-page .crm-renewal-current-grid > div { border-right:0; border-bottom:1px solid #edf2f7 !important; } .crm-renewal-detail-page .crm-renewal-current-grid > div:nth-child(odd) { border-right:1px solid #edf2f7; } .crm-renewal-detail-page .crm-renewal-period-grid { grid-template-columns:minmax(0,1fr); } .crm-renewal-detail-page .crm-renewal-sidebar { display:flex !important; flex-direction:column; } .crm-renewal-detail-page .crm-renewal-form-panel { padding:17px !important; } .crm-renewal-detail-page .crm-renewal-choices { flex-direction:column; } .crm-renewal-detail-page .crm-renewal-choice { min-height:94px; } }
@media (max-width:480px) { .crm-renewal-detail-page .crm-renewal-nav-label { display:none; } .crm-renewal-detail-page .crm-renewal-service-fields { grid-template-columns:1fr; } .crm-renewal-detail-page .crm-renewal-add-button { width:100%; } .crm-renewal-detail-page .crm-renewal-uplift-row { flex-direction:column; align-items:stretch; } .crm-renewal-detail-page .crm-renewal-uplift-input { width:100%; } .crm-renewal-detail-page .crm-renewal-apply-button { width:100%; } .crm-renewal-detail-page .crm-renewal-actions > *,.crm-renewal-detail-page .crm-renewal-actions > div > button { width:100%; } }
@media (prefers-reduced-motion:reduce) { .crm-renewal-detail-page button { transition:none !important; } }

/* Kontrol alasan dan tanggal efektif dibuat sama tinggi dan sejajar. */
.crm-renewal-detail-page .crm-renewal-close-fields { align-items:start; gap:16px !important; }
.crm-renewal-detail-page .crm-renewal-close-field { min-width:0; display:flex; flex-direction:column; justify-content:flex-start; }
.crm-renewal-detail-page .crm-renewal-close-field label { display:block; min-height:22px; margin:0 0 7px !important; font-size:12px !important; font-weight:750 !important; line-height:22px !important; color:#4d6681 !important; }
.crm-renewal-detail-page .crm-renewal-close-fields select,
.crm-renewal-detail-page .crm-renewal-close-fields input[type="date"] { box-sizing:border-box !important; width:100% !important; min-width:0 !important; height:46px !important; min-height:46px !important; padding:9px 13px !important; border:1px solid #dbe5f0 !important; border-radius:11px !important; background-color:#fff !important; color:#18314e !important; font-size:13px !important; line-height:24px !important; }
.crm-renewal-detail-page .crm-renewal-close-fields input[type="date"] { color-scheme:light; }
.crm-renewal-detail-page .crm-renewal-close-field:focus-within label { color:#ad7500 !important; }
@media(max-width:650px){.crm-renewal-detail-page .crm-renewal-close-fields{grid-template-columns:minmax(0,1fr) !important;}}


/* Shared MSDC back navigation button: matched to Detail Produk & Jasa. */
.crm-msdc-back-button.crm-msdc-back-button {
  display: inline-flex !important;
  min-height: 43px !important;
  align-items: center !important;
  justify-content: center !important;
  align-self: flex-start !important;
  gap: 9px !important;
  padding: 0 17px !important;
  border: 1px solid #f7d27b !important;
  border-radius: 12px !important;
  background: linear-gradient(180deg, #fff9ed 0%, #fff2d2 100%) !important;
  color: #996100 !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  line-height: 1.25 !important;
  text-decoration: none !important;
  box-shadow: 0 3px 10px rgba(215, 153, 17, .07) !important;
  cursor: pointer !important;
  transition: background .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease !important;
  white-space: normal !important;
  text-align: center !important;
}
.crm-msdc-back-button.crm-msdc-back-button:hover:not(:disabled) {
  border-color: #e9b948 !important;
  background: #ffeab0 !important;
  color: #805000 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 7px 18px rgba(215, 153, 17, .14) !important;
}
.crm-msdc-back-button.crm-msdc-back-button:focus-visible {
  outline: 3px solid rgba(247, 171, 0, .3) !important;
  outline-offset: 2px !important;
}
.crm-msdc-back-button.crm-msdc-back-button svg {
  flex: 0 0 auto;
}
@media (max-width: 640px) {
  .crm-msdc-back-button.crm-msdc-back-button {
    min-height: 42px !important;
    gap: 8px !important;
    padding: 0 14px !important;
  }
}
`;

export function RenewalDetailPage() {
  const params = useParams<{ id: string }>();
  const contractId = params.id ? Number(params.id) : undefined;
  const { data: contract, isLoading, isError, error } = useContract(contractId);
  const { data: renewalData } = useRenewalData();

  const existingRenewal = contract ? renewalData?.childByParent.get(contract.id) ?? null : null;

  return (
    <div className="crm-renewal-detail-page" style={{ minHeight: "100%", background: COLORS.page }}>
      <style>{RENEWAL_DETAIL_STYLES}</style>
      <PageHeader
        title="Perpanjangan"
        subtitle="Kontrak yang akan berakhir"
        containerClassName="px-7 pt-5 pb-2"
      />

      <div style={{ padding: "0 2rem 3rem" }}>
        {/* Submenu */}
        <div className="crm-contract-tabs"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: "1rem",
          }}
        >
          <Link
            to="/crm-sales/contracts"
            style={{
              padding: "8px 15px",
              borderRadius: 8,
              background: "transparent",
              color: COLORS.slate,
              fontSize: "0.76rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Kontrak
          </Link>

          <Link
            to="/crm-sales/contracts/slas"
            style={{
              padding: "8px 15px",
              borderRadius: 8,
              background: "transparent",
              color: COLORS.slate,
              fontSize: "0.76rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            SLA
          </Link>

          <div
            style={{
              padding: "8px 15px",
              borderRadius: 8,
              background: COLORS.navy,
              color: "#fff",
              fontSize: "0.76rem",
              fontWeight: 700,
            }}
          >
            Perpanjangan
          </div>
        </div>

        <div className="crm-renewal-nav">
          <Link className="crm-renewal-back crm-msdc-back-button" to="/crm-sales/contracts/renewals">
            <ArrowLeft size={17} aria-hidden="true" /> Kembali ke Perpanjangan
          </Link>
          <span className="crm-renewal-nav-label">Detail Perpanjangan</span>
        </div>

        <div className="crm-renewal-detail-heading" style={{ marginBottom: "1rem" }}>
          <span className="crm-renewal-hero-icon"><RefreshCw size={25} /></span>
          <div className="crm-renewal-hero-copy">
            <h1 style={{ margin: 0, color: COLORS.navyText, fontSize: "1.35rem", lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.02em" }}>Perpanjang / Selesaikan Kontrak</h1>
            <p style={{ margin: "0.3rem 0 0", color: COLORS.slate, fontSize: "0.78rem" }}>
              {contract ? `${contract.contract_number} · ${contract.customer?.company_name ?? "—"}` : "Memuat kontrak…"}
            </p>
          </div>
        </div>

        {isLoading && <LoadingState />}
        {isError && <ErrorState message={extractErrorMessage(error)} />}
        {contract && <RenewalWorkspace key={contract.id} contract={contract} existingRenewal={existingRenewal} />}
      </div>
    </div>
  );
}