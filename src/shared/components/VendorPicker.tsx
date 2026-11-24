import { useState, useEffect, useRef } from "react";
import { Search, X, Check } from "lucide-react";
import { vendorSearchApi } from "@shared/api/vendorApi";
import type { VendorSummary } from "@shared/types/vendor";

interface VendorPickerProps {
  label: string;
  selectedVendorId?: number;
  selectedVendorName?: string;
  onSelect: (vendor: VendorSummary) => void;
  onClear: () => void;
}

/**
 * GANTI pola lama (Vendor ID diketik manual) - sama persis pola
 * CustomerPicker.tsx untuk AR Invoice, cuma sumber datanya Vendor
 * (ProcurementInventory) bukan Customer (CRM).
 */
export function VendorPicker({ label, selectedVendorId, selectedVendorName, onSelect, onClear }: VendorPickerProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<VendorSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    vendorSearchApi.search(debouncedQuery)
      .then((res) => setResults(res.data.data))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery, isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(vendor: VendorSummary) {
    onSelect(vendor);
    setIsOpen(false);
    setQuery("");
  }

  if (selectedVendorId && selectedVendorName) {
    return (
      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">{label}</label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", border: "1px solid var(--border)", borderRadius: 8, padding: "0.55rem 0.75rem", background: "var(--accent-light)" }}>
          <Check size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: "0.85rem" }}>
            <strong>{selectedVendorName}</strong>
          </div>
          <button type="button" onClick={onClear} style={{ border: "none", background: "none", color: "var(--grey-dark)", cursor: "pointer", display: "flex", fontSize: "0.78rem", fontWeight: 600, alignItems: "center", gap: "0.25rem" }}>
            <X size={13} /> Ganti
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ marginBottom: "1rem", position: "relative" }}>
      <label className="input-label">{label}</label>
      <div style={{ position: "relative" }}>
        <Search size={15} style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "var(--grey)" }} />
        <input
          className="input"
          style={{ paddingLeft: "2rem" }}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          placeholder="Cari nama atau kode vendor..."
        />
      </div>

      {isOpen && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "0.25rem", background: "white", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 4px 16px rgba(20,22,31,0.12)", maxHeight: 240, overflowY: "auto", zIndex: 10 }}>
          {isLoading && <div style={{ padding: "0.75rem", fontSize: "0.82rem", color: "var(--grey)" }}>Mencari...</div>}
          {!isLoading && results.length === 0 && (
            <div style={{ padding: "0.75rem", fontSize: "0.82rem", color: "var(--grey)" }}>
              {query ? "Tidak ada vendor cocok." : "Belum ada vendor - ketik untuk cari, atau daftarkan dulu di Procurement."}
            </div>
          )}
          {!isLoading && results.map((vendor) => (
            <button
              key={vendor.id}
              type="button"
              onClick={() => handleSelect(vendor)}
              style={{ display: "block", width: "100%", textAlign: "left", border: "none", background: "none", padding: "0.6rem 0.75rem", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{vendor.vendor_name}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--grey)", fontFamily: "monospace" }}>{vendor.vendor_code}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
