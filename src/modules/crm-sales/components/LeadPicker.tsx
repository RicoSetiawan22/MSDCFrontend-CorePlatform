import { useState, useEffect, useRef } from "react";
import { Search, X, Check } from "lucide-react";
import { leadApi } from "@modules/crm-sales/api/leadApi";
import type { Lead } from "@modules/crm-sales/types/lead";

interface LeadPickerProps {
  label: string;
  selectedLeadId?: number;
  selectedLeadName?: string;
  onSelect: (lead: Lead) => void;
  onClear: () => void;
}

/**
 * Search Lead dari database CRM.
 * User ketik nama perusahaan → dropdown menampilkan hasil pencarian.
 * Dipilih → lead_id + company_name otomatis terisi.
 */
export function LeadPicker({ label, selectedLeadId, selectedLeadName, onSelect, onClear }: LeadPickerProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce 350ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    // open_only=true - kecualikan lead yang sudah 'converted' (sudah jadi
    // Customer beneran, lihat Lead.converted_customer_id) atau
    // 'unqualified' - keduanya tidak relevan dipilih sebagai sumber
    // Opportunity baru di jalur "Lead (Bakal Customer)".
    leadApi.list({ search: debouncedQuery || undefined, per_page: 25, open_only: true })
      .then((res) => setResults(res.data.data ?? []))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery, isOpen]);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(lead: Lead) {
    onSelect(lead);
    setIsOpen(false);
    setQuery("");
  }

  // ---- Mode: SUDAH ada lead terpilih ----
  if (selectedLeadId && selectedLeadName) {
    return (
      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">{label}</label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", border: "1px solid var(--border)", borderRadius: 8, padding: "0.55rem 0.75rem", background: "#ede9fe" }}>
          <Check size={16} color="#7c3aed" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: "0.85rem" }}>
            <strong>{selectedLeadName}</strong>
          </div>
          <button type="button" onClick={onClear} style={{ border: "none", background: "none", color: "var(--grey-dark)", cursor: "pointer", display: "flex", fontSize: "0.78rem", fontWeight: 600, alignItems: "center", gap: "0.25rem" }}>
            <X size={13} /> Ganti
          </button>
        </div>
      </div>
    );
  }

  // ---- Mode: CARI lead ----
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
          placeholder="Cari nama perusahaan lead..."
        />
      </div>

      {isOpen && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "0.25rem", background: "white", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 4px 16px rgba(20,22,31,0.12)", maxHeight: 240, overflowY: "auto", zIndex: 10 }}>
          {isLoading && <div style={{ padding: "0.75rem", fontSize: "0.82rem", color: "var(--grey)" }}>Mencari...</div>}
          {!isLoading && results.length === 0 && (
            <div style={{ padding: "0.75rem", fontSize: "0.82rem", color: "var(--grey)" }}>
              {query ? "Tidak ada lead cocok." : "Ketik nama perusahaan untuk mencari lead."}
            </div>
          )}
          {!isLoading && results.map((lead) => (
            <button
              key={lead.id}
              type="button"
              onClick={() => handleSelect(lead)}
              style={{ display: "block", width: "100%", textAlign: "left", border: "none", background: "none", padding: "0.6rem 0.75rem", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{lead.company_name}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--grey)", fontFamily: "monospace" }}>{lead.lead_number}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
