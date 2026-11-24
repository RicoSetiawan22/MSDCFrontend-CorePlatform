import { useState } from "react";
import { FileDown } from "lucide-react";
import { usePpnSummary, usePphSummary, useDownloadTaxReportPdf } from "../api/useTax";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatCurrency, formatDate } from "@shared/lib/format";
import type { PpnInvoiceRow, PphByTaxType, PphCertificateRow } from "../types/taxReport";

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const NOW = new Date();

// PENTING: pakai tanggal LOKAL (getFullYear/getMonth/getDate), BUKAN
// toISOString() - toISOString() konversi ke UTC, jadi kalau timezone lokal
// di depan UTC (mis. WIB = UTC+7), "hari ini" versi lokal bisa jadi
// "kemarin" versi UTC tergantung jam berapa sekarang. Akibatnya invoice
// yang dibuat HARI INI (tanggal lokal) diam-diam tidak ikut ke-filter di
// rentang default laporan PPN sampai tanggal UTC-nya "menyusul" - kelihatan
// seperti PPN invoice hilang padahal cuma soal rentang tanggal default.
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function firstDayOfMonth(d = NOW) {
  return toLocalDateString(new Date(d.getFullYear(), d.getMonth(), 1));
}
const TODAY = toLocalDateString(NOW);

type Tab = "ppn" | "pph";

export function TaxReportPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ppn");

  // PPN
  const [ppnDateFrom, setPpnDateFrom] = useState(firstDayOfMonth());
  const [ppnDateTo, setPpnDateTo] = useState(TODAY);
  const [showPpnDetail, setShowPpnDetail] = useState(false);

  // PPh
  const [pphMonth, setPphMonth] = useState(NOW.getMonth() + 1);
  const [pphYear, setPphYear] = useState(NOW.getFullYear());
  const [showPphDetail, setShowPphDetail] = useState(false);

  // PDF
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadTaxReportPdf();

  // Queries
  const { data: ppn, isLoading: isLoadingPpn } = usePpnSummary(ppnDateFrom || undefined, ppnDateTo || undefined);
  const { data: pph, isLoading: isLoadingPph } = usePphSummary(pphMonth, pphYear);

  const discrepancy = ppn ? ppn.ppn_output - ppn.ppn_output_from_gl : 0;
  const isConsistent = ppn ? discrepancy === 0 : true;

  const btnTab = (tab: Tab, label: string, color: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        padding: "0.5rem 1.25rem",
        border: "none",
        borderBottom: activeTab === tab ? `3px solid ${color}` : "3px solid transparent",
        background: "none",
        color: activeTab === tab ? color : "var(--grey)",
        fontWeight: activeTab === tab ? 700 : 400,
        fontSize: "0.9rem",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  const statCard = (label: string, value: string, bg: string, color: string, sub?: string) => (
    <div style={{ background: bg, border: `1px solid ${color}33`, borderRadius: 8, padding: "1rem", textAlign: "center" }}>
      <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey)", marginBottom: "0.3rem" }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color, fontFamily: "monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "#b45309", marginTop: "0.2rem" }}>{sub}</div>}
    </div>
  );

  const efakturBox = (label: string, count: number, bg: string, color: string) => (
    <div style={{ background: bg, border: `1px solid ${color}44`, borderRadius: 8, padding: "1rem", textAlign: "center" }}>
      <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color, marginBottom: "0.3rem" }}>{label}</div>
      <div style={{ fontSize: "1.8rem", fontWeight: 800, color }}>{count}</div>
      <div style={{ fontSize: "0.72rem", color }}>{count === 1 ? "faktur" : "faktur"}</div>
    </div>
  );

  const showDetailBtn = (current: boolean, setter: (v: boolean) => void, label: string) => (
    <button
      onClick={() => setter(!current)}
      style={{ fontSize: "0.8rem", color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: "0.25rem 0" }}
    >
      {current ? "▲ Sembunyikan Detail" : `▼ ${label}`}
    </button>
  );

  return (
    <div>
      <PageHeader
        title="Laporan Pajak"
        subtitle="Ringkasan PPN (Keluaran vs Masukan + E-Faktur) dan PPh (Bukti Potong per jenis pajak)."
      />

      {/* Toolbar */}
      <div style={{ padding: "0 2rem 1.5rem" }} className="no-print">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {btnTab("ppn", "📋 PPN", "#dc2626")}
            {btnTab("pph", "📋 PPh", "#7c3aed")}
          </div>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.5rem 1rem",
              background: "var(--accent)", color: "white",
              border: "none", borderRadius: 8,
              cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
            }}
          >
            <FileDown size={15} /> Cetak PDF
          </button>
        </div>

        {activeTab === "ppn" && (
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Dari Tanggal</label>
              <input className="input" type="date" style={{ width: 160 }} value={ppnDateFrom} onChange={(e) => setPpnDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Sampai Tanggal</label>
              <input className="input" type="date" style={{ width: 160 }} value={ppnDateTo} onChange={(e) => setPpnDateTo(e.target.value)} />
            </div>
            {showDetailBtn(showPpnDetail, setShowPpnDetail, "Tampilkan Detail Invoice")}
          </div>
        )}

        {activeTab === "pph" && (
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Bulan</label>
              <select className="input" style={{ width: 150 }} value={pphMonth} onChange={(e) => setPphMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Tahun</label>
              <input className="input" type="number" style={{ width: 100 }} value={pphYear} onChange={(e) => setPphYear(Number(e.target.value))} />
            </div>
            {showDetailBtn(showPphDetail, setShowPphDetail, "Tampilkan Detail Sertifikat")}
          </div>
        )}
      </div>

      <div style={{ padding: "0 2rem 2rem" }}>

        {/* ============================================= PPN ============================================= */}
        {activeTab === "ppn" && !ppnDateFrom || !ppnDateTo ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--grey)" }}>Pilih rentang tanggal untuk melihat ringkasan PPN.</div>
        ) : activeTab === "ppn" && isLoadingPpn ? (
          <LoadingState label="Menghitung PPN..." />
        ) : activeTab === "ppn" && ppn ? (
          <div>
            {/* KPI */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
              {statCard("PPN Keluaran", formatCurrency(ppn.ppn_output), "#fee2e2", "#dc2626")}
              {statCard("PPN Masukan", formatCurrency(ppn.ppn_input), "#e0f2fe", "#0369a1")}
              {statCard(
                ppn.net_payable >= 0 ? "Kurang Bayar" : "Lebih Bayar",
                formatCurrency(Math.abs(ppn.net_payable)),
                ppn.net_payable >= 0 ? "#fef2f2" : "#f0fdf4",
                ppn.net_payable >= 0 ? "#dc2626" : "#16a34a"
              )}
              {statCard("Invoice Ber-PPN", `${ppn.invoice_count} invoice`, "#f5f5f5", "var(--grey-dark)")}
            </div>

            {/* Alert */}
            <div style={{ padding: "0.85rem 1rem", background: isConsistent ? "#f0fdf4" : "#fffbeb", border: `1px solid ${isConsistent ? "#16a34a" : "#f59e0b"}`, borderRadius: 8, marginBottom: "1rem" }}>
              <div style={{ fontWeight: 700, color: isConsistent ? "#16a34a" : "#b45309", fontSize: "0.82rem", marginBottom: "0.2rem" }}>
                {isConsistent ? "✅ KONSISTEN" : "⚠️ DISCREPANCY"} — PPN dari GL: {formatCurrency(ppn.ppn_output_from_gl)}
                {discrepancy !== 0 && (
                  <span style={{ color: discrepancy > 0 ? "#dc2626" : "#16a34a" }}>
                    {" "}({discrepancy > 0 ? "+" : ""}{formatCurrency(discrepancy)})
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>
                {discrepancy !== 0 ? "Discrepancy biasanya dari invoice lama sebelum fix tax (Agustus 2026)." : "Angka PPN dari invoice = PPN dari GL — sistem konsisten."}
              </div>
            </div>

            {/* E-Faktur Status */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
              {efakturBox("E-Faktur Terbit", ppn.efaktur_issued_count, "#e0f2fe", "#0369a1")}
              {efakturBox("Belum Terbit", ppn.efaktur_pending_count, "#fffbeb", "#b45309")}
              {efakturBox("Total Invoice", ppn.invoice_count, "#f5f5f5", "var(--grey-dark)")}
            </div>

            {/* Net Payable */}
            <div style={{ padding: "1rem 1.25rem", borderRadius: 8, marginBottom: "1rem", background: ppn.net_payable >= 0 ? "#fef2f2" : "#f0fdf4", border: `2px solid ${ppn.net_payable >= 0 ? "#dc2626" : "#16a34a"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--grey)", marginBottom: "0.2rem" }}>
                    {ppn.net_payable >= 0 ? "💸 Kurang Bayar — WAJIB DISETOR" : "💚 Lebih Bayar — BISA DIKOMPENSASI"}
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: ppn.net_payable >= 0 ? "#dc2626" : "#16a34a" }}>
                    {formatCurrency(Math.abs(ppn.net_payable))}
                  </div>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--grey)", maxWidth: 280, textAlign: "right" }}>
                  {ppn.net_payable >= 0 ? "Setor ke kas negara sebelum batas waktu SPT Masa PPN." : "Bisa dikompensasi ke masa pajak berikutnya atau diajukan restitusi."}
                </div>
              </div>
            </div>

            {/* Invoice Detail */}
            {showPpnDetail && ppn.invoice_breakdown && ppn.invoice_breakdown.length > 0 && (
              <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", marginBottom: "1rem" }}>
                <div style={{ padding: "0.85rem 1.2rem", fontWeight: 700, fontSize: "0.9rem", borderBottom: "1px solid var(--border)", background: "#f9f9f9" }}>
                  📋 Rincian Invoice Ber-PPN ({ppn.invoice_breakdown.length})
                </div>
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>No. Invoice</th>
                      <th>Tanggal</th>
                      <th>Customer</th>
                      <th style={{ textAlign: "right" }}>DPP</th>
                      <th style={{ textAlign: "right" }}>PPN</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th>No. Faktur</th>
                      <th style={{ textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ppn.invoice_breakdown.map((inv: PpnInvoiceRow, i: number) => (
                      <tr key={i}>
                        <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{inv.invoice_number}</td>
                        <td style={{ fontSize: "0.78rem" }}>{formatDate(inv.invoice_date)}</td>
                        <td style={{ fontSize: "0.78rem" }}>{inv.customer_name}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.78rem" }}>{formatCurrency(inv.subtotal)}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.78rem", color: "#dc2626", fontWeight: 600 }}>{formatCurrency(inv.tax_amount)}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.78rem" }}>{formatCurrency(inv.total_amount)}</td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.72rem", color: inv.nomor_faktur ? "#0369a1" : "var(--grey)" }}>{inv.nomor_faktur ?? "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          {inv.efaktur_status === "issued" ? (
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16a34a" }}>TERBIT</span>
                          ) : inv.efaktur_status === "draft" ? (
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#b45309" }}>DRAFT</span>
                          ) : (
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#dc2626" }}>BELUM</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {showPpnDetail && (!ppn.invoice_breakdown || ppn.invoice_breakdown.length === 0) && (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--grey)" }}>Tidak ada invoice dengan PPN pada periode ini.</div>
            )}
          </div>
        ) : null}

        {/* ============================================= PPh ============================================= */}
        {activeTab === "pph" && isLoadingPph ? (
          <LoadingState label="Menghitung PPh..." />
        ) : activeTab === "pph" && pph ? (
          <div>
            {/* KPI */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
              {statCard("Kita Potong Vendor", formatCurrency(pph.total_withheld_by_us), "#fef3c7", "#b45309", pph.unremitted_count > 0 ? `${pph.unremitted_count} belum setor` : "")}
              {statCard("Customer Potong Kita", formatCurrency(pph.total_withheld_by_customer), "#f5f3ff", "#7c3aed")}
              {statCard("Total Sertifikat", `${pph.total_certificate_count} sertifikat`, "#f5f5f5", "var(--grey-dark)")}
            </div>

            {/* Unremitted Warning */}
            {(pph.unremitted_amount ?? 0) > 0 && (
              <div style={{ padding: "0.85rem 1rem", background: "#fef2f2", border: "1px solid #dc2626", borderRadius: 8, marginBottom: "1rem" }}>
                <div style={{ fontWeight: 700, color: "#dc2626", fontSize: "0.82rem", marginBottom: "0.2rem" }}>
                  ⚠️ PPh Yang Belum Disetor: {formatCurrency(pph.unremitted_amount)}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--grey)" }}>
                  {pph.unremitted_count} sertifikat belum disetor ke kas negara. Segera proses pembayaran ke DJP.
                </div>
              </div>
            )}

            {/* Per-Jenis Pajak */}
            {pph.by_tax_type && pph.by_tax_type.length > 0 && (
              <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", marginBottom: "1rem" }}>
                <div style={{ padding: "0.85rem 1.2rem", fontWeight: 700, fontSize: "0.9rem", borderBottom: "1px solid var(--border)", background: "#f9f9f9" }}>
                  📋 Ringkasan Per Jenis Pajak ({pph.by_tax_type.length} jenis)
                </div>
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Jenis Pajak</th>
                      <th style={{ textAlign: "center" }}>Tarif</th>
                      <th style={{ textAlign: "right" }}>Kita Potong Vendor</th>
                      <th style={{ textAlign: "right" }}>Customer Potong Kita</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th style={{ textAlign: "center" }}>Sertifikat</th>
                      <th style={{ textAlign: "center" }}>Blm Setor</th>
                      <th style={{ textAlign: "right" }}>Belum Disetor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pph.by_tax_type.map((t: PphByTaxType, i: number) => (
                      <tr key={i}>
                        <td style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem" }}>{t.tax_type_code}</td>
                        <td style={{ fontSize: "0.82rem" }}>{t.tax_type_name ?? "—"}</td>
                        <td style={{ textAlign: "center", fontSize: "0.82rem" }}>{t.rate}%</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.82rem", color: "#b45309" }}>{formatCurrency(t.withheld_by_us)}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.82rem", color: "#7c3aed" }}>{formatCurrency(t.withheld_by_customer)}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 700 }}>{formatCurrency(t.withheld_by_us + t.withheld_by_customer)}</td>
                        <td style={{ textAlign: "center", fontSize: "0.82rem" }}>{t.certificate_count}</td>
                        <td style={{ textAlign: "center", fontSize: "0.82rem", color: t.unremitted_count > 0 ? "#dc2626" : "#16a34a", fontWeight: t.unremitted_count > 0 ? 700 : 400 }}>{t.unremitted_count}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.82rem", color: t.unremitted_amount > 0 ? "#dc2626" : "var(--grey)", fontWeight: t.unremitted_amount > 0 ? 700 : 400 }}>{formatCurrency(t.unremitted_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(!pph.by_tax_type || pph.by_tax_type.length === 0) && (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--grey)" }}>Belum ada pemotongan PPh pada periode ini.</div>
            )}

            {/* Certificate Detail */}
            {showPphDetail && pph.certificate_breakdown && pph.certificate_breakdown.length > 0 && (
              <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "0.85rem 1.2rem", fontWeight: 700, fontSize: "0.9rem", borderBottom: "1px solid var(--border)", background: "#f9f9f9" }}>
                  📄 Rincian Bukti Potong ({pph.certificate_breakdown.length})
                </div>
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>No. Bukti Potong</th>
                      <th>Jenis</th>
                      <th>Arah</th>
                      <th>Counterparty</th>
                      <th>NPWP</th>
                      <th style={{ textAlign: "right" }}>Gross Amount</th>
                      <th style={{ textAlign: "center" }}>Tarif</th>
                      <th style={{ textAlign: "right" }}>PPh Dipotong</th>
                      <th style={{ textAlign: "center" }}>Status Setor</th>
                      <th>Tgl Setor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pph.certificate_breakdown.map((cert: PphCertificateRow, i: number) => (
                      <tr key={i}>
                        <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{cert.certificate_number}</td>
                        <td style={{ fontSize: "0.75rem" }}><strong>{cert.tax_type_code}</strong></td>
                        <td style={{ fontSize: "0.72rem" }}>
                          <span style={{ padding: "1px 6px", borderRadius: 3, fontSize: "0.68rem", fontWeight: 700, background: cert.direction === "withheld_by_us" ? "#e0f2fe" : "#f5f3ff", color: cert.direction === "withheld_by_us" ? "#0369a1" : "#7c3aed" }}>
                            {cert.direction === "withheld_by_us" ? "Kita Potong" : "Cust Potong"}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.75rem" }}>{cert.counterparty_name}</td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "var(--grey)" }}>{cert.counterparty_npwp ?? "—"}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.75rem" }}>{formatCurrency(cert.gross_amount)}</td>
                        <td style={{ textAlign: "center", fontSize: "0.75rem" }}>{cert.rate}%</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.75rem", color: "#dc2626", fontWeight: 700 }}>{formatCurrency(cert.withheld_amount)}</td>
                        <td style={{ textAlign: "center" }}>
                          {cert.is_remitted ? (
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16a34a" }}>SDH SETOR</span>
                          ) : (
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#dc2626" }}>BLM SETOR</span>
                          )}
                        </td>
                        <td style={{ fontSize: "0.75rem", color: "var(--grey)" }}>{cert.remitted_date ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {showPphDetail && (!pph.certificate_breakdown || pph.certificate_breakdown.length === 0) && (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--grey)" }}>Tidak ada bukti potong PPh pada periode ini.</div>
            )}
          </div>
        ) : null}
      </div>

      {/* PDF Modal */}
      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Laporan Pajak"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) =>
            downloadPdfMutation.mutateAsync({
              organizationId: orgId,
              date_from: activeTab === "ppn" ? ppnDateFrom : undefined,
              date_to: activeTab === "ppn" ? ppnDateTo : undefined,
              period_month: activeTab === "pph" ? pphMonth : undefined,
              period_year: activeTab === "pph" ? pphYear : undefined,
            })
          }
        />
      )}
    </div>
  );
}
