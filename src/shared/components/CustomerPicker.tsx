import { useState, useEffect, useRef } from "react";
import { Search, X, Check, User } from "lucide-react";
import { apiClient } from "@shared/lib/api-client";
import type { CustomerSummary } from "@shared/types/customer";
import type { Lead } from "@modules/crm-sales/types/lead";

interface CustomerPickerProps {
  label: string;
  selectedCustomerId?: number;
  selectedCustomerName?: string;
  onSelect: (customer: CustomerPickerResult) => void;
  onClear: () => void;
}

export interface CustomerPickerResult {
  id: number;
  company_name: string;
  customer_code?: string;
  isLead: boolean;
}

export function CustomerPicker({ label, selectedCustomerId, selectedCustomerName, onSelect, onClear }: CustomerPickerProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleSelect(customer: CustomerPickerResult) {
    onSelect(customer);
    setIsOpen(false);
    setQuery("");
  }

  // Mode: customer selected
  if (selectedCustomerId && selectedCustomerName) {
    return (
      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">{label}</label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", border: "1px solid var(--border)", borderRadius: 8, padding: "0.55rem 0.75rem", background: "var(--accent-light)" }}>
          <Check size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: "0.85rem" }}>
            <strong>{selectedCustomerName}</strong>
          </div>
          <button type="button" onClick={onClear} style={{ border: "none", background: "none", color: "var(--grey-dark)", cursor: "pointer", display: "flex", fontSize: "0.78rem", fontWeight: 600, alignItems: "center", gap: "0.25rem" }}>
            <X size={13} /> Ganti
          </button>
        </div>
      </div>
    );
  }

  // Mode: search
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
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          placeholder="Cari nama atau kode customer / lead..."
        />
      </div>

      {isOpen && (
        <DropdownContent
          query={debouncedQuery}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}

// ── Dropdown content (fresh fetch on every open) ───────────────────────────
function DropdownContent({ query, onSelect }: { query: string; onSelect: (c: CustomerPickerResult) => void }) {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.allSettled([
      apiClient.get("/v1/crm-sales/customers", {
        params: { search: query || undefined, per_page: 20 },
      }),
      apiClient.get("/v1/crm-sales/leads", {
        params: {
          search: query || undefined,
          per_page: 20,
          status: "new,contacted,qualified,proposal_sent,negotiation",
        },
      }),
    ]).then(([custResult, leadResult]) => {
      if (cancelled) return;
      // CustomerController returns plain paginator { current_page, data: [...] }
      // LeadController returns { success, data: { data: [...] } }
      const custData = custResult.status === "fulfilled"
        ? (custResult.value.data as { data?: unknown[] })?.data ?? []
        : [];
      const leadData = leadResult.status === "fulfilled"
        ? (leadResult.value.data as { data?: { data?: unknown[] } })?.data?.data ?? []
        : [];
      setCustomers(custData as CustomerSummary[]);
      setLeads(leadData as Lead[]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [query]);

  if (loading) {
    return (
      <div style={{
        position: "absolute", top: "100%", left: 0, right: 0, marginTop: "0.25rem",
        background: "white", border: "1px solid var(--border)", borderRadius: 8,
        boxShadow: "0 4px 16px rgba(20,22,31,0.12)", padding: "0.75rem",
        fontSize: "0.82rem", color: "var(--grey)", zIndex: 10,
      }}>
        Mencari...
      </div>
    );
  }

  const hasCustomers = customers.length > 0;
  const hasLeads = leads.length > 0;

  if (!hasCustomers && !hasLeads) {
    return (
      <div style={{
        position: "absolute", top: "100%", left: 0, right: 0, marginTop: "0.25rem",
        background: "white", border: "1px solid var(--border)", borderRadius: 8,
        boxShadow: "0 4px 16px rgba(20,22,31,0.12)", padding: "0.75rem",
        fontSize: "0.82rem", color: "var(--grey)", zIndex: 10,
      }}>
        {query ? "Tidak ada customer atau lead cocok." : "Ketik untuk mencari customer atau lead."}
      </div>
    );
  }

  return (
    <div style={{
      position: "absolute", top: "100%", left: 0, right: 0, marginTop: "0.25rem",
      background: "white", border: "1px solid var(--border)", borderRadius: 8,
      boxShadow: "0 4px 16px rgba(20,22,31,0.12)", maxHeight: 320, overflowY: "auto", zIndex: 10,
    }}>
      {hasCustomers && (
        <>
          <div style={{ padding: "0.4rem 0.75rem", fontSize: "0.65rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.06em", background: "#f0fdf4", borderBottom: "1px solid #dcfce7" }}>
            Customer
          </div>
          {customers.map(c => (
            <button
              key={`cust-${c.id}`}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => onSelect({ id: c.id, company_name: c.company_name, customer_code: c.customer_code, isLead: false })}
              style={{ display: "flex", width: "100%", textAlign: "left", border: "none", background: "none", padding: "0.6rem 0.75rem", cursor: "pointer", borderBottom: "1px solid var(--border)", gap: "0.5rem", alignItems: "center" }}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, flexShrink: 0 }}>
                C
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.company_name}
                </div>
                {c.customer_code && (
                  <div style={{ fontSize: "0.68rem", color: "var(--grey)", fontFamily: "monospace" }}>
                    {c.customer_code}
                  </div>
                )}
              </div>
            </button>
          ))}
        </>
      )}

      {hasLeads && (
        <>
          <div style={{ padding: "0.4rem 0.75rem", fontSize: "0.65rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.06em", background: "#fef3c7", borderBottom: "1px solid #fef3c7" }}>
            Lead (Bakal Customer)
          </div>
          {leads.map(l => (
            <button
              key={`lead-${l.id}`}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => onSelect({ id: l.id, company_name: l.company_name, customer_code: l.lead_number, isLead: true })}
              style={{ display: "flex", width: "100%", textAlign: "left", border: "none", background: "none", padding: "0.6rem 0.75rem", cursor: "pointer", borderBottom: "1px solid var(--border)", gap: "0.5rem", alignItems: "center" }}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#fef3c7", color: "#b45309", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {l.company_name}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--grey)", fontFamily: "monospace" }}>
                  {l.lead_number} · {l.status}
                </div>
              </div>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
