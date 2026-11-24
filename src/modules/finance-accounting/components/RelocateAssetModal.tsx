import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRelocateAsset } from "../api/useFixedAssets";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { FormInput, FormTextarea } from "@shared/components/ui/FormKit";
import { extractErrorMessage } from "@shared/types/api";

interface RelocateAssetModalProps {
  assetId: number;
  currentLocation: string;
  onClose: () => void;
}

export function RelocateAssetModal({ assetId, currentLocation, onClose }: RelocateAssetModalProps) {
  const [toLocation, setToLocation] = useState("");
  const [relocationDate, setRelocationDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const relocateMutation = useRelocateAsset();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!toLocation.trim()) { setError("Lokasi baru wajib diisi."); return; }
    try {
      await relocateMutation.mutateAsync({
        id: assetId,
        toLocation,
        relocationDate: relocationDate || undefined,
        reason: reason || undefined,
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title="📦 Relokasi Aset" onClose={onClose} maxWidth={480}>
      {/* Current vs New location display */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem", background: "var(--bg-subtle)", borderRadius: 8, marginBottom: "1.25rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.7rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>Lokasi Saat Ini</div>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--grey-dark)" }}>{currentLocation}</div>
        </div>
        <ArrowRight size={18} color="var(--grey)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.7rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>Lokasi Baru</div>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent)" }}>{toLocation || "— belum ditentukan —"}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <FormInput
          label="Lokasi Baru *"
          required
          value={toLocation}
          onChange={(e) => setToLocation(e.target.value)}
          placeholder="mis. DC Surabaya - Rack B04"
          error={error && !toLocation ? "Wajib diisi" : undefined}
        />
        <FormInput
          label="Tanggal Relokasi"
          type="date"
          value={relocationDate}
          onChange={(e) => setRelocationDate(e.target.value)}
        />
        <FormTextarea
          label="Alasan / Catatan"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="mis. Upgrade kapasitas rack, pemindahan DC..."
        />

        {error && (
          <div style={{ padding: "0.7rem 0.875rem", background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: "0.82rem" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={relocateMutation.isPending} style={{ flex: 1 }}>
            {relocateMutation.isPending ? "Menyimpan..." : "📦 Pindahkan Aset"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
