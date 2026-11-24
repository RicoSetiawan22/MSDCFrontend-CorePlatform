import { useState, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Check, AlertCircle, X } from "lucide-react";

interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  description?: string;
}

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

/** Wrapper standar untuk setiap field di dalam form — beri spacing, label, hint, error. */
export function FormField({ label, error, hint, required, children }: FormFieldProps) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.4rem" }}>
        <label className="input-label" style={{ margin: 0 }}>
          {label}
          {required && <span style={{ color: "var(--bad)", marginLeft: "0.2rem" }}>*</span>}
        </label>
        {hint && (
          <span style={{ fontSize: "0.72rem", color: "var(--grey)", fontStyle: "italic" }}>
            ({hint})
          </span>
        )}
      </div>
      {children}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.35rem", color: "var(--bad)", fontSize: "0.78rem" }}>
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}

/** Input teks standar — semua styling di satu tempat, konsisten. */
export function FormInput({
  error,
  style,
  label,
  hint,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string; label?: string; hint?: string }) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      {label && (
        <label className="input-label" htmlFor={inputId} style={{ display: "block", marginBottom: "0.4rem" }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input${error ? " input--error" : ""}`}
        style={{ width: "100%", ...style }}
        {...props}
      />
      {hint && !error && <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>{hint}</div>}
      {error && <div style={{ fontSize: "0.72rem", color: "var(--bad)", marginTop: "0.3rem" }}>{error}</div>}
    </div>
  );
}

/** Textarea standar. */
export function FormTextarea({
  error,
  rows = 3,
  style,
  label,
  hint,
  id,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string; label?: string; hint?: string }) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      {label && (
        <label className="input-label" htmlFor={inputId} style={{ display: "block", marginBottom: "0.4rem" }}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`input${error ? " input--error" : ""}`}
        rows={rows}
        style={{ width: "100%", resize: "vertical", ...style }}
        {...props}
      />
      {hint && !error && <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>{hint}</div>}
      {error && <div style={{ fontSize: "0.72rem", color: "var(--bad)", marginTop: "0.3rem" }}>{error}</div>}
    </div>
  );
}

/** Select dropdown yang beautiful - cari/search, dropdown dengan sub-label, dan chevron indicator. */
interface SearchableSelectProps {
  value: string | number | "";
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  disabled?: boolean;
  emptyMessage?: string;
  /** Optional: propagate search string to parent for external API lookups (AccountPicker) */
  onSearchChange?: (search: string) => void;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  error,
  disabled,
  emptyMessage = "Tidak ada pilihan.",
  onSearchChange,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => String(o.value) === String(value));

  // Filter options by search
  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      (o.sublabel ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const inContainer = containerRef.current && containerRef.current.contains(e.target as Node);
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(e.target as Node);
      if (!inContainer && !inDropdown) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: "0.5rem",
          padding: "0.55rem 0.75rem",
          border: `1px solid ${error ? "var(--bad)" : isOpen ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 8,
          background: disabled ? "var(--bg-subtle)" : "white",
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          fontSize: "0.875rem",
          color: selected ? "var(--text)" : "var(--grey)",
          transition: "border-color 0.15s",
          boxShadow: isOpen ? "0 0 0 3px rgba(79,70,229,0.1)" : "none",
        }}
      >
        <div style={{ flex: 1, overflow: "hidden" }}>
          {selected ? (
            <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selected.label}
            </div>
          ) : (
            <span style={{ color: "var(--grey)" }}>{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={15}
          style={{
            color: "var(--grey)",
            flexShrink: 0,
            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {/* Dropdown panel — portal to body to escape overflow containers */}
      {isOpen && createPortal(
        <div
          ref={containerRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            pointerEvents: "none",
          }}
          onClick={() => { setIsOpen(false); setSearch(""); }}
        >
          <div
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(90vw, 560px)",
              background: "white",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 16px 48px rgba(20,22,31,0.22)",
              overflow: "hidden",
              pointerEvents: "all",
            }}
          >
            {/* Search input */}
            <div style={{ padding: "0.75rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Search size={15} style={{ color: "var(--grey)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                className="input"
                style={{ border: "none", padding: "0.25rem 0", fontSize: "0.875rem", flex: 1, boxShadow: "none" }}
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => { setSearch(e.target.value); onSearchChange?.(e.target.value); }}
                autoFocus
              />
              <button type="button" onClick={() => { setIsOpen(false); setSearch(""); }} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--grey)", display: "flex", padding: 2 }}>
                <X size={15} />
              </button>
            </div>
            {/* Options list */}
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "1.5rem", fontSize: "0.85rem", color: "var(--grey)", textAlign: "center" }}>
                  {emptyMessage}
                </div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(String(opt.value)); setIsOpen(false); setSearch(""); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      padding: "0.75rem 1rem",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      borderBottom: "1px solid var(--border)",
                      gap: "0.75rem",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {opt.label}
                      </div>
                      {opt.sublabel && (
                        <div style={{ fontSize: "0.75rem", color: "var(--grey)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {String(opt.value) === String(value) && (
                      <Check size={15} color="var(--accent)" style={{ flexShrink: 0 }} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Error */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.35rem", color: "var(--bad)", fontSize: "0.78rem" }}>
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}

/** Badge/chip untuk menampilkan status — warna-warni. */
interface StatusBadgeProps {
  status: string;
  label?: string;
}
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: "#d9f2e6", color: "#15803d" },
  posted: { bg: "#dbeafe", color: "#1d4ed8" },
  paid: { bg: "#d1fae5", color: "#065f46" },
  draft: { bg: "#f3f4f6", color: "#374151" },
  void: { bg: "#fee2e2", color: "#991b1b" },
  suspended: { bg: "#fef3c7", color: "#92400e" },
  terminated: { bg: "#fee2e2", color: "#991b1b" },
  cancelled: { bg: "#f3f4f6", color: "#6b7280" },
  issued: { bg: "#dbeafe", color: "#1d4ed8" },
  partially_paid: { bg: "#fef3c7", color: "#92400e" },
  overdue: { bg: "#fee2e2", color: "#dc2626" },
};
export function StatusBadge({ status, label }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status.toLowerCase()] ?? { bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{ background: colors.bg, color: colors.color, fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: 20, display: "inline-block", textTransform: "capitalize" }}>
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}

/** Clearable search input */
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
export function SearchInput({ value, onChange, placeholder = "Cari..." }: SearchInputProps) {
  return (
    <div style={{ position: "relative" }}>
      <Search size={15} style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "var(--grey)" }} />
      <input
        className="input"
        style={{ paddingLeft: "2rem", paddingRight: value ? "2rem" : "0.75rem" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", display: "flex", color: "var(--grey)" }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/** Toolbar dengan search + action buttons */
interface ToolbarProps {
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  actions?: ReactNode;
  filters?: ReactNode;
}
export function Toolbar({ search, actions, filters }: ToolbarProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
      {search && (
        <div style={{ width: 260, flexShrink: 0 }}>
          <SearchInput value={search.value} onChange={search.onChange} placeholder={search.placeholder} />
        </div>
      )}
      {filters}
      {actions && <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", alignItems: "center" }}>{actions}</div>}
    </div>
  );
}
