import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Receipt, ShieldAlert, Building, Calculator, ClipboardCheck } from "lucide-react";
import { useCreateApBill } from "../api/useApBills";
import { useTaxTypeList } from "../api/useTax";
import { Button } from "@shared/components/Button";
import { VendorPicker } from "@shared/components/VendorPicker";
import { FormInput, FormTextarea, SearchableSelect } from "@shared/components/ui/FormKit";
import { useCostCenterLookup, useProfitCenterLookup } from "@shared/components/ui/useLookup";
import { AccountPicker } from "@shared/components/ui/AccountPicker";
import { formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { ApBillLineInput } from "../types/apBill";

const EMPTY_LINE: ApBillLineInput = { description: "", quantity: 1, unit_price: 0, expense_account_code: "" };

export function ApBillFormPage() {
  const navigate = useNavigate();
  const createMutation = useCreateApBill();

  const [vendorId, setVendorId] = useState<number | undefined>(undefined);
  const [vendorName, setVendorName] = useState("");
  const [billDate, setBillDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxTypeId, setTaxTypeId] = useState("");
  const [includeTax, setIncludeTax] = useState(false);
  const [taxAmount, setTaxAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [profitCenterId, setProfitCenterId] = useState("");
  const [lines, setLines] = useState<ApBillLineInput[]>([{ ...EMPTY_LINE }]);
  const [error, setError] = useState<string | null>(null);
  const [showHoldOverride, setShowHoldOverride] = useState(false);
  const [overrideHold, setOverrideHold] = useState(false);

  const { data: taxTypes } = useTaxTypeList({ category: "ppn_input", is_active: true });
  const costCenters = useCostCenterLookup({ is_active: true, limit: 20 });
  const profitCenters = useProfitCenterLookup({ is_active: true, limit: 20 });

  const lineItemsTotal = lines.reduce((sum, line) => sum + (line.quantity ?? 1) * (line.unit_price ?? 0), 0);
  const taxAmountNumber = Number(taxAmount || 0);
  const previewSubtotal = includeTax ? lineItemsTotal - taxAmountNumber : lineItemsTotal;
  const previewTotal = includeTax ? lineItemsTotal : lineItemsTotal + taxAmountNumber;
  const selectedTax = taxTypes?.find((t) => String(t.id) === String(taxTypeId));

  function recalcTax(newTaxTypeId: string, newIncludeTax: boolean) {
    const rate = taxTypes?.find((t) => String(t.id) === newTaxTypeId)?.rate ?? 0;
    if (!newTaxTypeId) { setTaxAmount("0"); return; }
    if (newIncludeTax) {
      const subtotalExcl = lineItemsTotal / (1 + rate / 100);
      setTaxAmount(String(Math.round(lineItemsTotal - subtotalExcl)));
    } else {
      setTaxAmount(String(Math.round(lineItemsTotal * (rate / 100))));
    }
  }

  function updateLine(index: number, patch: Partial<ApBillLineInput>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!vendorId) { setError("Pilih vendor dulu sebelum menyimpan bill."); return; }
    const lineWithoutAccount = lines.findIndex((l) => !l.expense_account_code);
    if (lineWithoutAccount !== -1) {
      setError(`Baris ${lineWithoutAccount + 1} belum pilih Akun Beban.`); return;
    }
    const scaleFactor = includeTax && lineItemsTotal > 0 ? previewSubtotal / lineItemsTotal : 1;
    const linesToSubmit = includeTax
      ? lines.map((l) => ({ ...l, unit_price: Math.round(l.unit_price * scaleFactor * 100) / 100 }))
      : lines;
    try {
      await createMutation.mutateAsync({
        vendor_id: vendorId,
        vendor_name: vendorName,
        bill_date: billDate || undefined,
        due_date: dueDate || undefined,
        tax_amount: taxAmountNumber,
        notes: notes || undefined,
        override_hold: overrideHold || undefined,
        cost_center_id: costCenterId ? Number(costCenterId) : undefined,
        profit_center_id: profitCenterId ? Number(profitCenterId) : undefined,
        lines: linesToSubmit,
      });
      navigate("/finance/ap-bills");
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      if (message.toLowerCase().includes("hold")) setShowHoldOverride(true);
    }
  }

  const costCenterOptions = (costCenters.data?.data ?? []).map((c) => ({ value: String(c.id), label: c.name, sublabel: c.code }));
  const profitCenterOptions = (profitCenters.data?.data ?? []).map((p) => ({ value: String(p.id), label: p.name, sublabel: p.code }));
  const taxOptions = (taxTypes ?? []).map((t) => ({ value: String(t.id), label: `${t.name} (${t.rate}%)`, sublabel: `Rate ${t.rate}%` }));

  return (
    <form onSubmit={handleSubmit} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Sticky Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 2rem", borderBottom: "1px solid var(--border)", background: "white", flexShrink: 0, boxShadow: "0 1px 4px rgba(20,22,31,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button type="button" onClick={() => navigate("/finance/ap-bills")} className="btn btn-secondary" style={{ width: 36, height: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Bill Baru</div>
            <div style={{ fontSize: "0.72rem", color: "var(--grey)" }}>Accounts Payable — Team 4 Finance</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="button" variant="secondary" onClick={() => navigate("/finance/ap-bills")}>Batal</Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Menyimpan..." : "💾 Simpan Bill"}
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 2rem", background: "#fee2e2", color: "#991b1b", fontSize: "0.85rem", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldAlert size={15} /> {error}
          </div>
          {showHoldOverride && (
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.6rem", cursor: "pointer" }}>
              <input type="checkbox" checked={overrideHold} onChange={(e) => setOverrideHold(e.target.checked)} />
              <span style={{ fontWeight: 600 }}>Saya sadar vendor ini di-hold, tetap lanjutkan (override hold)</span>
            </label>
          )}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT */}
        <div style={{ flex: "2 1 0", overflowY: "auto", padding: "2rem 2.5rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>

          {/* Vendor */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Building size={16} color="#7c3aed" />
              </div>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)" }}>Informasi Vendor</span>
            </div>
            <VendorPicker
              label="Vendor *"
              selectedVendorId={vendorId}
              selectedVendorName={vendorName || undefined}
              onSelect={(v) => { setVendorId(v.id); setVendorName(v.vendor_name); }}
              onClear={() => { setVendorId(undefined); setVendorName(""); }}
            />
          </section>

          {/* Metadata */}
          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <ClipboardCheck size={13} color="var(--grey)" />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)" }}>Tanggal</span>
              </div>
              <FormInput type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)" }}>Jatuh Tempo</span>
              </div>
              <FormInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="Kosongkan = dari payment term vendor" />
            </div>
          </section>

          {/* Cost & Profit Center */}
          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)" }}>Cost Center</span>
              </div>
              <SearchableSelect
                value={costCenterId}
                onChange={setCostCenterId}
                options={costCenterOptions}
                placeholder="Pilih cost center..."
                searchPlaceholder="Cari cost center..."
                emptyMessage="Tidak ada cost center."
              />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)" }}>Profit Center</span>
              </div>
              <SearchableSelect
                value={profitCenterId}
                onChange={setProfitCenterId}
                options={profitCenterOptions}
                placeholder="Pilih profit center..."
                searchPlaceholder="Cari profit center..."
                emptyMessage="Tidak ada profit center."
              />
            </div>
            <div style={{ gridColumn: "1 / -1", fontSize: "0.7rem", color: "var(--grey)" }}>
              Tanpa keduanya, bill tidak muncul di Cost Center Report / Profit Center Report.
            </div>
          </section>

          {/* Invoice Lines */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Receipt size={16} color="#b45309" />
              </div>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)" }}>Baris Item</span>
              <span style={{ fontSize: "0.72rem", color: "var(--grey)", marginLeft: "auto" }}>{lines.length} item{lines.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 70px 130px 120px 40px", gap: "0.5rem", padding: "0 0.5rem", marginBottom: "0.35rem" }}>
              {["Deskripsi", "Akun Beban", "Qty", "Harga Satuan", "Jumlah", ""].map((h) => (
                <div key={h} style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{h}</div>
              ))}
            </div>

            {lines.map((line, index) => {
              const total = (line.quantity ?? 1) * (line.unit_price ?? 0);
              return (
                <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 180px 70px 130px 120px 40px", gap: "0.5rem", alignItems: "center", padding: "0.5rem", borderRadius: 8, background: index % 2 === 0 ? "transparent" : "var(--bg-subtle)", marginBottom: "0.35rem" }}>
                  <FormInput value={line.description ?? ""} onChange={(e) => updateLine(index, { description: e.target.value })} placeholder="mis. Lisensi Firewall Tahunan" style={{ fontSize: "0.85rem" }} />
                  <AccountPicker
                    value={line.expense_account_code ?? ""}
                    onChange={(v) => {
                      const acc = costCenters.data?.data?.find((a) => String(a.id) === v);
                      updateLine(index, { expense_account_code: acc ? String(acc.id) : v });
                    }}
                    accountType="expense"
                    placeholder="Pilih akun..."
                  />
                  <FormInput type="number" min={0.01} step={0.01} value={line.quantity ?? 1} onFocus={(e) => e.target.select()} onChange={(e) => updateLine(index, { quantity: Number(e.target.value) || 1 })} style={{ fontSize: "0.85rem", textAlign: "center" }} />
                  <FormInput type="number" min={0} value={line.unit_price} onFocus={(e) => e.target.select()} onChange={(e) => updateLine(index, { unit_price: Number(e.target.value) })} placeholder="0" style={{ fontSize: "0.85rem", textAlign: "right" }} />
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#b45309", textAlign: "right", fontFamily: "monospace" }}>{formatCurrency(total)}</div>
                  <button type="button" onClick={() => setLines((p) => p.length > 1 ? p.filter((_, i) => i !== index) : p)} disabled={lines.length === 1} style={{ border: "none", background: "none", cursor: lines.length === 1 ? "not-allowed" : "pointer", color: lines.length === 1 ? "var(--border)" : "var(--bad)", display: "flex", justifyContent: "center" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}

            <button type="button" onClick={() => setLines((p) => [...p, { ...EMPTY_LINE }])} className="btn btn-secondary" style={{ marginTop: "0.5rem", fontSize: "0.78rem", padding: "0.4rem 0.875rem" }}>
              <Plus size={13} /> Tambah Baris
            </button>
          </section>

          <FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Catatan tambahan untuk bill ini (opsional)" />
        </div>

        {/* RIGHT — Summary */}
        <div style={{ width: 340, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "#fafbfd", overflowY: "auto", padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Calculator size={14} color="var(--grey)" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)" }}>Pajak</span>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", marginBottom: "0.75rem", cursor: "pointer" }}>
              <input type="checkbox" checked={includeTax} onChange={(e) => { setIncludeTax(e.target.checked); recalcTax(taxTypeId, e.target.checked); }} />
              <span>Harga sudah termasuk pajak</span>
            </label>
            <SearchableSelect
              value={taxTypeId}
              onChange={(v) => { setTaxTypeId(v); recalcTax(v, includeTax); }}
              options={taxOptions}
              placeholder="Pilih jenis pajak..."
              searchPlaceholder="Cari pajak..."
              emptyMessage="Tidak ada pajak."
            />
            <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--grey)" }}>PPN</span>
              <FormInput type="number" min={0} value={taxAmount} onFocus={(e) => e.target.select()} onChange={(e) => setTaxAmount(e.target.value)} style={{ fontSize: "0.85rem", textAlign: "right" }} />
            </div>
          </section>

          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "1.1rem", marginTop: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", fontSize: "0.85rem", color: "var(--grey)" }}>
              <span>Subtotal</span><span style={{ fontWeight: 600 }}>{formatCurrency(previewSubtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", fontSize: "0.85rem", color: "var(--grey)" }}>
              <span>{selectedTax ? `${selectedTax.name} (${selectedTax.rate}%)` : "Pajak"}</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(taxAmountNumber)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.7rem 0 0.1rem", marginTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#b45309" }}>{formatCurrency(previewTotal)}</span>
            </div>
          </div>

          <div style={{ fontSize: "0.72rem", color: "var(--grey)", lineHeight: 1.5 }}>
            Jatuh tempo kosong = otomatis dari payment term default vendor. Total dihitung ulang oleh backend.
          </div>
        </div>
      </div>
    </form>
  );
}
