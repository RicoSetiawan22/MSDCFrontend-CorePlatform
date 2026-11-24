import { useState, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useDepartmentLookup } from "./useLookup";

interface DepartmentPickerProps {
  value: string; // "" = none
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DepartmentPicker({ value, onChange, placeholder = "Pilih Departemen...", disabled = false }: DepartmentPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useDepartmentLookup({
    q: search || undefined,
    is_active: true,
    limit: 20,
  });

  const selected = data?.data.find((d) => String(d.id) === value);

  return (
    <div style={{ position: "relative", userSelect: "none" }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { if (!disabled) { setOpen((o) => !o); setSearch(""); } }}
        disabled={disabled}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: disabled ? "var(--bg-subtle)" : "white",
          border: `1px solid ${open ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 8,
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "0.875rem",
          color: selected ? "var(--grey-dark)" : "var(--grey)",
          textAlign: "left",
          transition: "border-color 0.15s",
          gap: "0.5rem",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? (
            <span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem", color: "var(--accent)" }}>
                {selected.code}
              </span>
              <span style={{ marginLeft: "0.4rem", color: "var(--grey-dark)" }}>
                {selected.name}
              </span>
              {selected.parent_name && (
                <span style={{ marginLeft: "0.4rem", fontSize: "0.72rem", color: "var(--grey)" }}>
                  → {selected.parent_name}
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: disabled ? "var(--border)" : "var(--grey)", fontStyle: "italic" }}>
              {placeholder}
            </span>
          )}
        </span>
        <ChevronDown size={14} style={{ flexShrink: 0, color: "var(--grey)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {/* Dropdown */}
      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 200,
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {/* Search input */}
          <div style={{ padding: "0.5rem", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "white" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "6px 8px", background: "var(--bg-subtle)", borderRadius: 7 }}>
              <Search size={13} color="var(--grey)" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode atau nama..."
                autoFocus
                style={{ border: "none", background: "transparent", outline: "none", fontSize: "0.82rem", width: "100%", color: "var(--grey-dark)" }}
              />
            </div>
          </div>

          {/* Results */}
          {isLoading && (
            <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.82rem", color: "var(--grey)" }}>
              Memuat...
            </div>
          )}
          {!isLoading && data?.data.length === 0 && (
            <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.82rem", color: "var(--grey)" }}>
              {search ? `Tidak ada departemen matching "${search}"` : "Belum ada departemen."}
            </div>
          )}
          {!isLoading && data?.data.map((dept) => (
            <button
              key={dept.id}
              type="button"
              onClick={() => { onChange(String(dept.id)); setOpen(false); setSearch(""); }}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "0.6rem 0.875rem",
                border: "none",
                background: String(dept.id) === value ? "var(--accent-light)" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                borderBottom: "1px solid var(--border)",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { if (String(dept.id) !== value) (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; }}
              onMouseLeave={(e) => { if (String(dept.id) !== value) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%" }}>
                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem", color: "var(--accent)", flexShrink: 0 }}>
                  {dept.code}
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--grey-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {dept.name}
                </span>
              </div>
              {dept.parent_name && (
                <span style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.1rem", marginLeft: "0.1rem" }}>
                  Induk: {dept.parent_name}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Click-outside to close */}
      {open && (
        <div
          onClick={() => { setOpen(false); setSearch(""); }}
          style={{ position: "fixed", inset: 0, zIndex: 199 }}
        />
      )}
    </div>
  );
}
