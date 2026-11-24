import { useState } from "react";
import { X } from "lucide-react";
import { useEmployeeList } from "../api/useEmployees";

export interface EmployeePickerResult {
  id: number;
  full_name: string;
}

/** Cari + pilih 1 employee aktif - dipakai buat fitur assign (Support
 * Ticket, Incident, Problem) yang assigned_to-nya ke hr_employee.id.
 * onSelect kasih balik {id, full_name} (bukan cuma id) supaya pemanggil
 * yang belum sempat refetch dari server (mis. form create) tetap bisa
 * tampilkan nama yang dipilih. */
export function EmployeePicker({ onSelect, onCancel }: { onSelect: (employee: EmployeePickerResult) => void; onCancel: () => void }) {
  const [search, setSearch] = useState("");
  const { data: results, isLoading } = useEmployeeList({ search: search || undefined, per_page: 10, employment_status: "active" });

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input className="input" autoFocus placeholder="Cari nama employee..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
        <button type="button" className="btn btn-secondary" style={{ padding: "0.4rem 0.6rem" }} onClick={onCancel}>
          <X size={14} />
        </button>
      </div>
      <div style={{ marginTop: 4, background: "var(--surface, #ffffff)", border: "1px solid var(--border, #e2e8f0)", borderRadius: 8, maxHeight: 220, overflowY: "auto", boxShadow: "0 8px 20px rgba(0,0,0,0.12)", zIndex: 50, position: "relative" }}>
        {isLoading && <div style={{ padding: "0.6rem 0.75rem", fontSize: "0.8rem", color: "var(--grey, #64748b)" }}>Memuat daftar pegawai...</div>}
        {!isLoading && (results?.data.length ?? 0) === 0 && (
          <div style={{ padding: "0.6rem 0.75rem", fontSize: "0.8rem", color: "var(--grey, #64748b)" }}>
            {search ? "Tidak ada pegawai yang cocok." : "Belum ada data pegawai aktif."}
          </div>
        )}
        {!isLoading && results?.data.map(emp => (
          <button
            key={emp.id}
            type="button"
            onClick={() => onSelect({ id: emp.id, full_name: emp.full_name })}
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              textAlign: "left",
              padding: "0.55rem 0.75rem",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom: "1px solid #f1f5f9",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{emp.full_name}</span>
            <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>
              {emp.employee_number && <span>NIK: {emp.employee_number}</span>}
              {emp.position?.position_title && <span>• {emp.position.position_title}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
