import { useState } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { useCreateRack } from "../api/useRacks";
import { useSiteList } from "../api/useSites";
import { extractErrorMessage } from "@shared/types/api";
import { LoadingState } from "@shared/components/LoadingState";
import type { SiteRoom } from "../types/site";

const EMPTY = {
  site_room_id: "",
  rack_name: "",
  total_u: "42",
  power_capacity_watt: "",
  status: "active",
  notes: "",
};

export function RackFormModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const create = useCreateRack();
  const { data: sitesData, isLoading: sitesLoading } = useSiteList({ per_page: 100 });

  // Group rooms by site for better UX
  const roomsBySite: Array<{
    siteId: number; siteName: string;
    rooms: Array<{ value: string; label: string; floor?: string; zone?: string; }>;
  }> = (sitesData?.data ?? []).map(site => ({
    siteId: site.id,
    siteName: site.site_name,
    rooms: (site.rooms ?? []).map((room: SiteRoom) => ({
      value: String(room.id),
      label: `${room.room_code} — ${room.room_name}`,
      floor: room.floor ?? undefined,
      zone: room.zone ?? undefined,
    })),
  })).filter(s => s.rooms.length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.site_room_id) { setError("Room wajib dipilih."); return; }
    setError(null);

    try {
      await create.mutateAsync({
        site_room_id: Number(form.site_room_id),
        rack_name: form.rack_name || undefined,
        total_u: form.total_u ? Number(form.total_u) : 42,
        power_capacity_watt: form.power_capacity_watt ? Number(form.power_capacity_watt) : undefined,
        status: form.status as "active" | "reserved" | "maintenance" | "decommissioned",
        notes: form.notes || undefined,
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  function set(key: keyof typeof EMPTY, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  return (
    <Modal title="Rack Baru" onClose={onClose} maxWidth={560}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {sitesLoading ? (
          <LoadingState />
        ) : roomsBySite.length === 0 ? (
          <div style={{ padding: "1rem", background: "#fff7ed", borderRadius: 8, fontSize: "0.875rem", color: "#92400e" }}>
            ⚠️ Belum ada room. Tambahkan room di halaman <strong>Site</strong> terlebih dahulu.
          </div>
        ) : (
          <>
            {/* Room picker — grouped by site */}
            <div>
              <label className="input-label">Room *</label>
              <select
                className="input"
                value={form.site_room_id}
                onChange={e => set("site_room_id", e.target.value)}
                style={{ width: "100%" }}>
                <option value="">— Pilih Room —</option>
                {roomsBySite.map(group => (
                  <optgroup key={group.siteId} label={group.siteName}>
                    {group.rooms.map(room => (
                      <option key={room.value} value={room.value}>
                        {room.label} {room.floor || room.zone ? `(${([room.floor, room.zone].filter(Boolean).join(" "))}` : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div style={{ fontSize: "0.72rem", color: "var(--grey)" }}>
              Kode rack akan dibuat otomatis (Master Data &gt; Number Sequence).
            </div>
            <div>
              <label className="input-label">Nama Rack</label>
              <input className="input" placeholder="mis. Rack Server A"
                value={form.rack_name} onChange={e => set("rack_name", e.target.value)}
                style={{ width: "100%" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
              <div>
                <label className="input-label">Total U</label>
                <input className="input" type="number" min="1" placeholder="42"
                  value={form.total_u} onChange={e => set("total_u", e.target.value)}
                  style={{ width: "100%" }} />
              </div>
              <div>
                <label className="input-label">Kapasitas Daya (Watt)</label>
                <input className="input" type="number" min="0" placeholder="5000"
                  value={form.power_capacity_watt} onChange={e => set("power_capacity_watt", e.target.value)}
                  style={{ width: "100%" }} />
              </div>
            </div>

            <div>
              <label className="input-label">Status</label>
              <select className="input" value={form.status}
                onChange={e => set("status", e.target.value)} style={{ width: "100%" }}>
                <option value="active">Active</option>
                <option value="reserved">Reserved</option>
                <option value="maintenance">Maintenance</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </div>

            <div>
              <label className="input-label">Catatan</label>
              <textarea className="input" rows={2} placeholder="Catatan..."
                value={form.notes} onChange={e => set("notes", e.target.value)}
                style={{ width: "100%", resize: "vertical" }} />
            </div>
          </>
        )}

        {error && <div className="input-error">{error}</div>}

        <div style={{ display: "flex", gap: "0.6rem", paddingTop: "0.5rem" }}>
          <Button className="bg-primary-gold" type="submit" disabled={create.isPending || roomsBySite.length === 0} style={{ flex: 1 }}>
            {create.isPending ? "Menyimpan..." : "Simpan Rack"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
