import { useState } from "react";

/** Format number as Indonesian Rupiah: 1000000 -> "1.000.000" */
export function formatRupiah(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value.replace(/\./g, "").replace(/,/g, "")) : value;
  if (isNaN(num)) return "";
  return num.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

/** Parse formatted IDR string back to number */
export function parseRupiah(value: string): number {
  return parseFloat(value.replace(/\./g, "")) || 0;
}

/** Input angka dengan pemisah ribuan otomatis (titik, format Indonesia)
 * dan prefix "Rp" - dipakai semua form yang input harga/nominal uang
 * (mis. JournalFormModal, ProductListPage) supaya tidak ada yang harus
 * hitung sendiri nolnya angka besar. */
export function CurrencyInput({
  value, onChange, placeholder = "0",
}: { value: number; onChange: (v: number) => void; placeholder?: string }) {
  const [focused, setFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(
    focused ? (value > 0 ? formatRupiah(value) : "") : value > 0 ? formatRupiah(value) : ""
  );

  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "var(--grey)", pointerEvents: "none" }}>Rp</span>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        placeholder={placeholder}
        onFocus={() => { setFocused(true); setDisplayValue(value > 0 ? formatRupiah(value) : ""); }}
        onBlur={(e) => {
          setFocused(false);
          const parsed = parseRupiah(e.target.value);
          onChange(parsed);
          setDisplayValue(parsed > 0 ? formatRupiah(parsed) : "");
        }}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, "");
          const num = parseInt(raw) || 0;
          setDisplayValue(raw ? num.toLocaleString("id-ID") : "");
          onChange(num);
        }}
        style={{
          width: "100%", padding: "0.5rem 0.5rem 0.5rem 28px",
          border: "1px solid var(--border)", borderRadius: 8,
          fontSize: "0.88rem", fontFamily: "monospace", textAlign: "right",
          outline: "none", boxSizing: "border-box",
          background: "white",
        }}
      />
    </div>
  );
}
