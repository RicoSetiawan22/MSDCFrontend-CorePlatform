import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Plus, Trash2, Receipt, Check, Calculator, Building2, CalendarDays } from "lucide-react";
import { useCreateArInvoice, useDownloadArInvoicePdf } from "../api/useArInvoices";
import { useTaxTypeList } from "../api/useTax";
import { Button } from "@shared/components/Button";
import { CustomerPicker } from "@shared/components/CustomerPicker";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { FormInput, FormTextarea, SearchableSelect } from "@shared/components/ui/FormKit";
import { useProfitCenterLookup } from "@shared/components/ui/useLookup";
import { formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { ArInvoiceLine } from "../types/arInvoice";

const EMPTY_LINE: ArInvoiceLine = { description: "", quantity: 1, unit_price: 0 };

export function ArInvoiceFormPage() {
  const navigate = useNavigate();
  const createMutation = useCreateArInvoice();
  const downloadPdfMutation = useDownloadArInvoicePdf();

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxAmount, setTaxAmount] = useState("0");
  const [taxTypeId, setTaxTypeId] = useState("");
  const [notes, setNotes] = useState("");
  const [profitCenterId, setProfitCenterId] = useState<string>("");
  const [lines, setLines] = useState<ArInvoiceLine[]>([{ ...EMPTY_LINE }]);
  const [error, setError] = useState<string | null>(null);
  const [savedInvoice, setSavedInvoice] = useState<{ id: number; number: string } | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const { data: taxTypes } = useTaxTypeList({ category: "ppn_output", is_active: true });
  const profitCenters = useProfitCenterLookup({ q: "", is_active: true, limit: 20 });

  const previewSubtotal = lines.reduce((sum, line) => sum + (line.quantity ?? 1) * (line.unit_price ?? 0), 0);
  const previewTotal = previewSubtotal + Number(taxAmount || 0);
  const selectedTax = taxTypes?.find((t) => String(t.id) === String(taxTypeId));

  function updateLine(index: number, patch: Partial<ArInvoiceLine>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customerId) { setError("Pilih customer dulu sebelum menyimpan invoice."); return; }
    try {
      const created = await createMutation.mutateAsync({
        customer_id: Number(customerId),
        customer_name: customerName,
        customer_code: customerCode || undefined,
        due_date: dueDate,
        tax_amount: Number(taxAmount || 0),
        notes: notes || undefined,
        profit_center_id: profitCenterId ? Number(profitCenterId) : undefined,
        lines,
      });
      setSavedInvoice({ id: created.id, number: created.invoice_number });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  if (savedInvoice) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", padding: "2rem", background: "var(--bg-subtle)" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#d9f2e6", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(21,128,61,0.15)" }}>
          <Check size={36} color="#15803d" />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.4rem" }}>
            Invoice <span style={{ fontFamily: "monospace", color: "var(--accent)" }}>{savedInvoice.number}</span> berhasil disimpan
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--grey)" }}>
            E-Faktur akan otomatis dibuat draft setelah invoice diposting.
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button variant="secondary" onClick={() => navigate("/finance/ar-invoices")}>Kembali ke Daftar</Button>
          <Button onClick={() => setIsPrintModalOpen(true)}><FileText size={15} /> Cetak Invoice</Button>
        </div>
        {isPrintModalOpen && (
          <LetterheadPdfModal
            title={`Cetak Invoice ${savedInvoice.number}`}
            onClose={() => navigate("/finance/ar-invoices")}
            onDownload={(organizationId) => downloadPdfMutation.mutateAsync({ invoiceId: savedInvoice.id, organizationId })}
          />
        )}
      </div>
    );
  }

  const profitOptions = (profitCenters.data?.data ?? []).map((pc) => ({
    value: String(pc.id),
    label: pc.name,
    sublabel: pc.code,
  }));

  const taxOptions = (taxTypes ?? []).map((t) => ({
    value: String(t.id),
    label: `${t.name} (${t.rate}%)`,
    sublabel: `Rate ${t.rate}%`,
  }));

  return (
    <form onSubmit={handleSubmit} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Sticky header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 2rem", borderBottom: "1px solid var(--border)", background: "white", flexShrink: 0, boxShadow: "0 1px 4px rgba(20,22,31,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button type="button" onClick={() => navigate("/finance/ar-invoices")} className="btn btn-secondary" style={{ width: 36, height: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Invoice Baru</div>
            <div style={{ fontSize: "0.72rem", color: "var(--grey)" }}>Accounts Receivable — Team 4 Finance</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="button" variant="secondary" onClick={() => navigate("/finance/ar-invoices")}>Batal</Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Menyimpan..." : "💾 Simpan Invoice"}
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 2rem", background: "#fee2e2", color: "#991b1b", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT */}
        <div style={{ flex: "2 1 0", overflowY: "auto", padding: "2rem 2.5rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Building2 size={16} color="#7c3aed" />
              </div>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)" }}>Informasi Customer</span>
            </div>
            <CustomerPicker
              label="Customer *"
              selectedCustomerId={customerId ? Number(customerId) : undefined}
              selectedCustomerName={customerName || undefined}
              onSelect={(c) => { setCustomerId(String(c.id)); setCustomerName(c.company_name); setCustomerCode(c.customer_code || ""); }}
              onClear={() => { setCustomerId(""); setCustomerName(""); setCustomerCode(""); }}
            />
          </section>

          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Receipt size={16} color="#1d4ed8" />
              </div>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)" }}>Baris Item</span>
              <span style={{ fontSize: "0.72rem", color: "var(--grey)", marginLeft: "auto" }}>{lines.length} item{lines.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 140px 130px 40px", gap: "0.5rem", padding: "0 0.5rem", marginBottom: "0.35rem" }}>
              {["Deskripsi", "Qty", "Harga Satuan", "Jumlah", ""].map((h) => (
                <div key={h} style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{h}</div>
              ))}
            </div>

            {lines.map((line, index) => {
              const total = (line.quantity ?? 1) * (line.unit_price ?? 0);
              return (
                <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 80px 140px 130px 40px", gap: "0.5rem", alignItems: "center", padding: "0.5rem", borderRadius: 8, background: index % 2 === 0 ? "transparent" : "var(--bg-subtle)", marginBottom: "0.35rem" }}>
                  <FormInput value={line.description ?? ""} onChange={(e) => updateLine(index, { description: e.target.value })} placeholder="mis. Sewa Rack Colocation - Agustus 2026" style={{ fontSize: "0.85rem" }} />
                  <FormInput type="number" min={0.01} step={0.01} value={line.quantity} onFocus={(e) => e.target.select()} onChange={(e) => updateLine(index, { quantity: Number(e.target.value) || 1 })} style={{ fontSize: "0.85rem", textAlign: "center" }} />
                  <FormInput type="number" min={0} value={line.unit_price} onFocus={(e) => e.target.select()} onChange={(e) => updateLine(index, { unit_price: Number(e.target.value) })} placeholder="0" style={{ fontSize: "0.85rem", textAlign: "right" }} />
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)", textAlign: "right", fontFamily: "monospace" }}>{formatCurrency(total)}</div>
                  <button type="button" onClick={() => setLines((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev)} disabled={lines.length === 1} style={{ border: "none", background: "none", cursor: lines.length === 1 ? "not-allowed" : "pointer", color: lines.length === 1 ? "var(--border)" : "var(--bad)", display: "flex", justifyContent: "center" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}

            <button type="button" onClick={() => setLines((p) => [...p, { ...EMPTY_LINE }])} className="btn btn-secondary" style={{ marginTop: "0.5rem", fontSize: "0.78rem", padding: "0.4rem 0.875rem" }}>
              <Plus size={13} /> Tambah Baris
            </button>
          </section>

          <FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Catatan tambahan untuk invoice ini (opsional)" />
        </div>

        {/* RIGHT — summary */}
        <div style={{ width: 340, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "#fafbfd", overflowY: "auto", padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <CalendarDays size={14} color="var(--grey)" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)" }}>Jatuh Tempo</span>
            </div>
            <FormInput type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </section>

          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--grey)" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)" }}>Profit Center</span>
            </div>
            <SearchableSelect
              value={profitCenterId}
              onChange={setProfitCenterId}
              options={profitOptions}
              placeholder="Pilih profit center..."
              searchPlaceholder="Cari profit center..."
              emptyMessage="Tidak ada profit center."
            />
            <div style={{ fontSize: "0.7rem", color: "var(--grey)", marginTop: "0.3rem", lineHeight: 1.4 }}>
              Tanpa ini, invoice tidak muncul di laporan laba per layanan.
            </div>
          </section>

          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Calculator size={14} color="var(--grey)" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)" }}>Pajak</span>
            </div>
            <SearchableSelect
              value={taxTypeId}
              onChange={(v) => {
                setTaxTypeId(v);
                const picked = taxTypes?.find((t) => String(t.id) === v);
                if (picked) setTaxAmount(String(Math.round(previewSubtotal * (picked.rate / 100))));
              }}
              options={taxOptions}
              placeholder="Pilih jenis pajak..."
              searchPlaceholder="Cari pajak..."
            />
            <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--grey)" }}>PPN</span>
              <FormInput type="number" min={0} value={taxAmount} onFocus={(e) => e.target.select()} onChange={(e) => setTaxAmount(e.target.value)} style={{ fontSize: "0.85rem", textAlign: "right" }} />
            </div>
          </section>

          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "1.1rem", marginTop: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", fontSize: "0.85rem", color: "var(--grey)" }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(previewSubtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", fontSize: "0.85rem", color: "var(--grey)" }}>
              <span>{selectedTax ? `${selectedTax.name} (${selectedTax.rate}%)` : "Pajak"}</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(Number(taxAmount || 0))}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.7rem 0 0.1rem", marginTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--accent)" }}>{formatCurrency(previewTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
