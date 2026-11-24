import { useState } from "react";
import { CheckCircle2, Server, AlertTriangle } from "lucide-react";
import { useSiteList } from "@modules/data-center-ops/api/useSites";
import { useUpdateResourceRequirements, useCheckResourceAvailability, useReserveResources } from "../api/useSalesOrders";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";
import type { ResourceCheckResult, ResourceRequirementInput, SalesOrderDetail, SalesOrderLine } from "../types/salesOrder";

const RESOURCE_LABELS: Record<string, string> = {
  rack: "Rack (U)",
  ip: "IP Address",
  power: "Listrik (Watt)",
  bandwidth: "Bandwidth (Mbps)",
  cross_connect: "Cross-Connect",
};

/**
 * Gerbang ketersediaan resource FISIK (rack/IP/listrik/bandwidth/
 * cross-connect) sebelum Sales Order boleh dikonfirmasi - lihat
 * SalesOrderResourceService di backend. Alur: pilih site -> isi
 * kebutuhan per baris -> cek ketersediaan (opsional, preview) ->
 * reservasi (WAJIB, mengunci kebutuhan & membuka card Approval Client).
 */
export function ResourceAvailabilityCard({ so }: { so: SalesOrderDetail }) {
  const { data: sites } = useSiteList({ per_page: 100, status: "active" });
  const updateReqMutation = useUpdateResourceRequirements(so.id);
  const checkMutation = useCheckResourceAvailability(so.id);
  const reserveMutation = useReserveResources(so.id);

  const [siteId, setSiteId] = useState<number | "">(so.site_id ?? "");
  const [lines, setLines] = useState<Record<number, ResourceRequirementInput>>(() =>
    Object.fromEntries((so.lines ?? []).map((l) => [l.id, lineToInput(l)])));
  const [checkResults, setCheckResults] = useState<ResourceCheckResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isReserved = !!so.resources_reserved_at;

  function updateLine(lineId: number, patch: Partial<ResourceRequirementInput>) {
    setLines((prev) => ({ ...prev, [lineId]: { ...prev[lineId], ...patch } }));
  }

  async function handleSaveRequirements() {
    setError(null);
    setCheckResults(null);
    if (!siteId) { setError("Pilih site dulu."); return; }
    try {
      await updateReqMutation.mutateAsync({ siteId: Number(siteId), lines: Object.values(lines) });
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  async function handleCheck() {
    setError(null);
    try {
      const result = await checkMutation.mutateAsync();
      setCheckResults(result);
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  async function handleReserve() {
    setError(null);
    if (!confirm("Reservasi semua resource yang dibutuhkan SO ini? Setelah berhasil, kebutuhan resource tidak bisa diubah lagi.")) return;
    try {
      await reserveMutation.mutateAsync();
      setCheckResults(null);
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  if (isReserved) {
    return (
      <div className="card" style={{ padding: "1.5rem" }}>
        <h3 style={{ margin: "0 0 0.75rem" }}>🏗️ Ketersediaan Resource</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "0.6rem 0.8rem", fontSize: "0.85rem", color: "#15803d" }}>
          <CheckCircle2 size={16} />
          Semua resource sudah direservasi di site <strong>{so.site?.site_name ?? "—"}</strong> ({formatDateTime(so.resources_reserved_at)}).
        </div>
      </div>
    );
  }

  const anyRequirement = Object.values(lines).some((l) =>
    (l.required_rack_u ?? 0) > 0 || l.rack_mode === "whole_rack" || (l.required_ip_count ?? 0) > 0 || (l.required_power_watt ?? 0) > 0 ||
    (l.required_bandwidth_mbps ?? 0) > 0 || l.requires_cross_connect);

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h3 style={{ margin: "0 0 0.4rem" }}>🏗️ Ketersediaan Resource</h3>
      <p style={{ fontSize: "0.82rem", color: "var(--grey)", marginTop: 0, marginBottom: "1rem" }}>
        SO ini WAJIB direservasi dulu (rack, IP, listrik, bandwidth, cross-connect sesuai kebutuhan) sebelum bisa dikonfirmasi ke client -
        mencegah menjual kapasitas yang sebenarnya tidak tersedia.
      </p>

      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Site Tujuan *</label>
        <select className="input" value={siteId} onChange={(e) => setSiteId(e.target.value ? Number(e.target.value) : "")} style={{ maxWidth: 320 }}>
          <option value="">— Pilih Site —</option>
          {(sites?.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.site_code} — {s.site_name}</option>)}
        </select>
      </div>

      <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "0.4rem" }}>Baris</th>
              <th style={{ textAlign: "right", padding: "0.4rem" }}>Rack (U)</th>
              <th style={{ textAlign: "right", padding: "0.4rem" }}>IP</th>
              <th style={{ textAlign: "right", padding: "0.4rem" }}>Listrik (W)</th>
              <th style={{ textAlign: "right", padding: "0.4rem" }}>Bandwidth (Mbps)</th>
              <th style={{ textAlign: "center", padding: "0.4rem" }}>Cross-Connect</th>
            </tr>
          </thead>
          <tbody>
            {(so.lines ?? []).map((line) => {
              const val = lines[line.id] ?? lineToInput(line);
              return (
                <tr key={line.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.4rem" }}>
                    <div style={{ fontWeight: 600 }}>{line.description}</div>
                    <div style={{ color: "var(--grey)", textTransform: "capitalize" }}>{line.service_type.replace(/_/g, " ")}</div>
                  </td>
                  <td style={{ padding: "0.4rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-end" }}>
                      <input className="input" type="number" min={0} style={{ width: 80, fontSize: "0.8rem", textAlign: "right" }}
                        disabled={val.rack_mode === "whole_rack"}
                        value={val.required_rack_u ?? ""} onChange={(e) => updateLine(line.id, { required_rack_u: e.target.value ? Number(e.target.value) : null })} />
                      <select className="input" style={{ width: 80, fontSize: "0.7rem", padding: "0.15rem 0.3rem" }}
                        value={val.rack_mode ?? "unit"} onChange={(e) => updateLine(line.id, { rack_mode: e.target.value as "unit" | "whole_rack" })}>
                        <option value="unit">Ecer</option>
                        <option value="whole_rack">1 Rack</option>
                      </select>
                    </div>
                  </td>
                  <td style={{ padding: "0.4rem" }}>
                    <input className="input" type="number" min={0} style={{ width: 70, fontSize: "0.8rem", textAlign: "right" }}
                      value={val.required_ip_count ?? ""} onChange={(e) => updateLine(line.id, { required_ip_count: e.target.value ? Number(e.target.value) : null })} />
                  </td>
                  <td style={{ padding: "0.4rem" }}>
                    <input className="input" type="number" min={0} style={{ width: 90, fontSize: "0.8rem", textAlign: "right" }}
                      value={val.required_power_watt ?? ""} onChange={(e) => updateLine(line.id, { required_power_watt: e.target.value ? Number(e.target.value) : null })} />
                  </td>
                  <td style={{ padding: "0.4rem" }}>
                    <input className="input" type="number" min={0} style={{ width: 90, fontSize: "0.8rem", textAlign: "right" }}
                      value={val.required_bandwidth_mbps ?? ""} onChange={(e) => updateLine(line.id, { required_bandwidth_mbps: e.target.value ? Number(e.target.value) : null })} />
                  </td>
                  <td style={{ padding: "0.4rem", textAlign: "center" }}>
                    <input type="checkbox" checked={val.requires_cross_connect ?? false}
                      onChange={(e) => updateLine(line.id, { requires_cross_connect: e.target.checked })} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Button variant="secondary" onClick={handleSaveRequirements} disabled={updateReqMutation.isPending}>
          {updateReqMutation.isPending ? "Menyimpan..." : "💾 Simpan Kebutuhan"}
        </Button>
        <Button variant="secondary" onClick={handleCheck} disabled={checkMutation.isPending || !anyRequirement}>
          {checkMutation.isPending ? "Mengecek..." : "🔍 Cek Ketersediaan"}
        </Button>
        <Button onClick={handleReserve} disabled={reserveMutation.isPending || !anyRequirement}>
          <Server size={15} /> {reserveMutation.isPending ? "Mereservasi..." : "Reservasi Resource"}
        </Button>
      </div>

      {error && <div className="input-error" style={{ marginTop: "0.75rem" }}>{error}</div>}

      {checkResults && checkResults.length > 0 && (
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {checkResults.map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem",
              padding: "0.5rem 0.7rem", borderRadius: 6,
              background: r.ok ? "#f0fdf4" : "#fef2f2", color: r.ok ? "#15803d" : "#dc2626",
            }}>
              {r.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              <strong>{RESOURCE_LABELS[r.resource] ?? r.resource}</strong> — {r.detail}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function lineToInput(line: SalesOrderLine): ResourceRequirementInput {
  return {
    id: line.id,
    required_rack_u: line.required_rack_u,
    rack_mode: line.rack_mode ?? "unit",
    required_ip_count: line.required_ip_count,
    required_power_watt: line.required_power_watt ? Number(line.required_power_watt) : null,
    required_bandwidth_mbps: line.required_bandwidth_mbps,
    requires_cross_connect: line.requires_cross_connect,
  };
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}
