import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import { useAuth } from "@shared/lib/auth-context";
import { useRack, useDeleteRack, useRackList, useRequestReleaseAllocation, useRequestMoveAllocation } from "../api/useRacks";
import type { RackDependentAllocation } from "../types/rack";

const DEVICE_TYPE_LABEL: Record<string, string> = {
  server: "Server", switch: "Switch", router: "Router", firewall: "Firewall",
  ups: "UPS", pdu: "PDU", storage: "Storage", other: "Lainnya",
};

export function RackDetailModal({ rackId, onClose }: { rackId: number; onClose: () => void }) {
  const navigate = useNavigate();
  const { data: rack, isLoading } = useRack(rackId);
  const deleteRack = useDeleteRack();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("rack.manage");
  const [releaseTarget, setReleaseTarget] = useState<RackDependentAllocation | null>(null);
  const [moveTarget, setMoveTarget] = useState<RackDependentAllocation | null>(null);

  function handleDelete() {
    if (!rack) return;
    if (!confirm(`Hapus rack "${rack.rack_code}"? Aksi ini tidak bisa dibatalkan.`)) return;
    deleteRack.mutate(rack.id, {
      onSuccess: onClose,
      onError: (e) => alert("Gagal: " + extractErrorMessage(e)),
    });
  }

  const dep = rack?.dependents;

  // Hitung utilisasi fisik riil (Union alokasi kontrak + device terpasang)
  const realOccupiedSlots = useMemo(() => {
    const slots = new Set<number>();
    dep?.allocations?.forEach((a) => {
      for (let u = a.start_u; u <= a.end_u; u++) {
        slots.add(u);
      }
    });
    dep?.devices?.forEach((d) => {
      const startU = Number(d.rack_position_u);
      const endU = Number(d.rack_position_u_end) || startU;
      if (startU > 0) {
        for (let u = Math.min(startU, endU); u <= Math.max(startU, endU); u++) {
          slots.add(u);
        }
      }
    });
    return slots;
  }, [dep]);

  const totalU = rack?.total_u || 42;
  const realUsedU = realOccupiedSlots.size > 0 ? realOccupiedSlots.size : (rack?.utilization?.used_u ?? 0);
  const realFreeU = Math.max(0, totalU - realUsedU);
  const realPct = totalU > 0 ? Number(((realUsedU / totalU) * 100).toFixed(1)) : 0;

  return (
    <Modal title={rack ? `Detail Rack — ${rack.rack_code}` : "Detail Rack"} onClose={onClose} maxWidth={560}>
      {isLoading || !rack ? <LoadingState /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem" }}>{rack.rack_name ?? rack.rack_code}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--grey)" }}>
                {rack.site_room?.site?.site_name ?? "—"} · {rack.site_room?.room_name ?? "—"}
                {" · "}{rack.total_u} U
                {rack.power_capacity_watt ? ` · ${rack.power_capacity_watt} W` : ""}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                fontSize: "0.75rem",
                padding: "0.3rem 0.6rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                whiteSpace: "nowrap",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onClick={() => navigate(`/dc/racks/${rackId}`)}
              title="Buka Halaman Lengkap"
            >
              <ExternalLink size={13} />
              Buka Halaman Lengkap
            </button>
          </div>

          {rack.utilization && (
            <div style={{ background: "var(--bg-subtle)", borderRadius: 8, padding: "0.6rem 0.75rem", display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
              <span>Terpakai: <strong>{realUsedU} U</strong></span>
              <span>Sisa: <strong>{realFreeU} U</strong></span>
              <span>Utilisasi: <strong>{realPct}%</strong></span>
            </div>
          )}

          {/* Daya dihitung dari total Watt device fisik terpasang - beda basis
              dari utilisasi U di atas (yang dari alokasi reservasi customer),
              karena tidak ada konsep "reservasi Watt" di data model. */}
          {rack.utilization && rack.utilization.power_capacity_watt && (
            <div style={{ background: "var(--bg-subtle)", borderRadius: 8, padding: "0.6rem 0.75rem", display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
              <span>Daya Terpakai: <strong>{rack.utilization.used_watt} W</strong></span>
              <span>Sisa Daya: <strong>{rack.utilization.free_watt ?? "—"} W</strong></span>
              <span>Utilisasi Daya: <strong>{rack.utilization.power_utilization_pct ?? "—"}%</strong></span>
            </div>
          )}

          {/* Device terpasang */}
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--grey)", textTransform: "uppercase", marginBottom: 6 }}>
              Device Terpasang ({dep?.devices.length ?? 0})
            </div>
            {!dep || dep.devices.length === 0 ? (
              <div style={{ fontSize: "0.8rem", color: "var(--grey)" }}>Belum ada device di rack ini.</div>
            ) : (
              <table className="table" style={{ fontSize: "0.8rem" }}>
                <thead><tr><th>Kode</th><th>Nama</th><th>Tipe</th><th>Posisi U</th></tr></thead>
                <tbody>
                  {dep.devices.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontFamily: "monospace" }}>{d.device_code}</td>
                      <td>{d.device_name}</td>
                      <td>{DEVICE_TYPE_LABEL[d.device_type] ?? d.device_type}</td>
                      <td style={{ fontFamily: "monospace" }}>
                        {d.rack_position_u
                          ? (d.rack_position_u_end && d.rack_position_u_end !== d.rack_position_u
                              ? `U${d.rack_position_u}-U${d.rack_position_u_end}`
                              : `U${d.rack_position_u}`)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Alokasi customer/kontrak */}
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--grey)", textTransform: "uppercase", marginBottom: 6 }}>
              Alokasi Customer / Kontrak ({dep?.allocations.length ?? 0})
            </div>
            {!dep || dep.allocations.length === 0 ? (
              <div style={{ fontSize: "0.8rem", color: "var(--grey)" }}>Belum ada alokasi customer di rack ini.</div>
            ) : (
              <table className="table" style={{ fontSize: "0.8rem" }}>
                <thead><tr><th>U-Range</th><th>Customer</th><th>Kontrak</th><th>Status</th>{canManage && <th>Aksi</th>}</tr></thead>
                <tbody>
                  {dep.allocations.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontFamily: "monospace" }}>{a.start_u}–{a.end_u}</td>
                      <td>{a.customer?.company_name ?? "—"}</td>
                      <td style={{ fontFamily: "monospace" }}>{a.contract?.contract_number ?? "—"}</td>
                      <td><span className="badge badge-active">{a.status === "active" ? "Aktif" : "Reserved"}</span></td>
                      {canManage && (
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button type="button" className="btn btn-secondary" style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem" }}
                              onClick={() => setReleaseTarget(a)}>
                              Ajukan Release
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem" }}
                              onClick={() => setMoveTarget(a)}>
                              Ajukan Pindah
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Hapus */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.85rem" }}>
            {dep?.can_delete ? (
              <div style={{ fontSize: "0.78rem", color: "var(--grey)", marginBottom: 8 }}>
                Rack ini belum punya device atau alokasi customer — aman untuk dihapus.
              </div>
            ) : (
              <div style={{ fontSize: "0.78rem", color: "#dc2626", marginBottom: 8 }}>
                Rack ini masih punya device dan/atau alokasi customer aktif (lihat daftar di atas) — bereskan dulu sebelum bisa dihapus.
              </div>
            )}
            <Button type="button" variant="danger" disabled={!dep?.can_delete || deleteRack.isPending}
              onClick={handleDelete} style={{ width: "100%" }}>
              {deleteRack.isPending ? "Menghapus..." : "Hapus Rack"}
            </Button>
          </div>
        </div>
      )}

      {releaseTarget && <RequestReleaseModal allocation={releaseTarget} onClose={() => setReleaseTarget(null)} />}
      {moveTarget && <RequestMoveModal allocation={moveTarget} currentRackId={rackId} onClose={() => setMoveTarget(null)} />}
    </Modal>
  );
}

// ─── Ajukan Release ──────────────────────────────────────────────────────────────
// Approval Manager lewat Workflow Engine - allocation TIDAK langsung dilepas
// di sini, cuma diajukan (lihat RackController::requestRelease()). Efeknya
// baru diterapkan begitu Manager approve di "My Approvals".
function RequestReleaseModal({ allocation, onClose }: { allocation: RackDependentAllocation; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const requestRelease = useRequestReleaseAllocation();

  function handleSubmit() {
    requestRelease.mutate({ allocationId: allocation.id, reason: reason.trim() || undefined }, {
      onSuccess: (res) => { alert(res.message); onClose(); },
      onError: (e) => alert("Gagal: " + extractErrorMessage(e)),
    });
  }

  return (
    <Modal title="Ajukan Release Alokasi" onClose={onClose} maxWidth={420}>
      <p style={{ fontSize: "0.85rem", color: "var(--grey)", marginBottom: "0.75rem" }}>
        {allocation.start_u}–{allocation.end_u}U — {allocation.customer?.company_name ?? "—"} ({allocation.contract?.contract_number ?? "tanpa kontrak"})
      </p>
      <div style={{ fontSize: "0.75rem", color: "var(--grey)", background: "var(--bg-subtle)", borderRadius: 8, padding: "0.6rem 0.75rem", marginBottom: "1rem" }}>
        Pengajuan ini akan dikirim ke Manager untuk approval lewat My Approvals - alokasi baru benar-benar dilepas setelah disetujui.
      </div>
      <label className="input-label">Alasan (opsional)</label>
      <textarea className="input" style={{ width: "100%", minHeight: 70 }} value={reason} onChange={e => setReason(e.target.value)}
        placeholder="mis. customer over-provisioned, downsize kapasitas..." />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "1rem" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
        <button type="button" className="btn btn-primary" disabled={requestRelease.isPending} onClick={handleSubmit}>
          {requestRelease.isPending ? "Mengajukan..." : "Ajukan Release"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Ajukan Pindah ───────────────────────────────────────────────────────────────
function RequestMoveModal({ allocation, currentRackId, onClose }: { allocation: RackDependentAllocation; currentRackId: number; onClose: () => void }) {
  const [targetRackId, setTargetRackId] = useState("");
  const [targetStartU, setTargetStartU] = useState("");
  const [reason, setReason] = useState("");
  const { data: racksPage, isLoading: racksLoading } = useRackList({ status: "active", per_page: 100 });
  const requestMove = useRequestMoveAllocation();

  const otherRacks = (racksPage?.data ?? []).filter(r => r.id !== currentRackId);

  function handleSubmit() {
    if (!targetRackId || !targetStartU) { alert("Pilih rack tujuan dan posisi U mulai."); return; }
    requestMove.mutate({
      allocationId: allocation.id, targetRackId: parseInt(targetRackId), targetStartU: parseInt(targetStartU),
      reason: reason.trim() || undefined,
    }, {
      onSuccess: (res) => { alert(res.message); onClose(); },
      onError: (e) => alert("Gagal: " + extractErrorMessage(e)),
    });
  }

  return (
    <Modal title="Ajukan Pindah Alokasi" onClose={onClose} maxWidth={420}>
      <p style={{ fontSize: "0.85rem", color: "var(--grey)", marginBottom: "0.75rem" }}>
        {allocation.start_u}–{allocation.end_u}U ({allocation.end_u - allocation.start_u + 1}U) — {allocation.customer?.company_name ?? "—"}
      </p>
      <div style={{ fontSize: "0.75rem", color: "var(--grey)", background: "var(--bg-subtle)", borderRadius: 8, padding: "0.6rem 0.75rem", marginBottom: "1rem" }}>
        Panjang alokasi ({allocation.end_u - allocation.start_u + 1}U) dipertahankan - cuma posisinya yang pindah. Perlu approval Manager sebelum benar-benar diterapkan.
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Rack Tujuan</label>
        <select className="input" style={{ width: "100%" }} value={targetRackId} onChange={e => setTargetRackId(e.target.value)} disabled={racksLoading}>
          <option value="">— Pilih rack —</option>
          {otherRacks.map(r => (
            <option key={r.id} value={r.id}>{r.rack_code} — {r.site_room?.site?.site_name ?? "—"} / {r.site_room?.room_name ?? "—"} ({r.total_u}U)</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Posisi U Mulai</label>
        <input className="input" type="number" min={1} style={{ width: "100%" }} value={targetStartU} onChange={e => setTargetStartU(e.target.value)} placeholder="mis. 5" />
      </div>
      <label className="input-label">Alasan (opsional)</label>
      <textarea className="input" style={{ width: "100%", minHeight: 60 }} value={reason} onChange={e => setReason(e.target.value)}
        placeholder="mis. konsolidasi rack, maintenance rack lama..." />

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "1rem" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
        <button type="button" className="btn btn-primary" disabled={requestMove.isPending} onClick={handleSubmit}>
          {requestMove.isPending ? "Mengajukan..." : "Ajukan Pindah"}
        </button>
      </div>
    </Modal>
  );
}
