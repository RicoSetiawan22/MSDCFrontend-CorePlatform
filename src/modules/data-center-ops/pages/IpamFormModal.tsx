import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { useCreateIpSubnet } from "../api/useIpam";
import { extractErrorMessage } from "@shared/types/api";

const EMPTY = {
  cidr: "",
  ip_version: "ipv4" as "ipv4" | "ipv6",
  subnet_type: "public" as "public" | "private",
  site_id: "",
  gateway: "",
  description: "",
};

export function IpamFormModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const createSubnet = useCreateIpSubnet();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cidr.trim()) {
      setError("CIDR wajib diisi.");
      return;
    }
    setError(null);

    try {
      await createSubnet.mutateAsync({
        cidr: form.cidr.trim(),
        ip_version: form.ip_version,
        subnet_type: form.subnet_type,
        site_id: form.site_id ? Number(form.site_id) : undefined,
        gateway: form.gateway.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    }
  }

  function set(key: keyof typeof EMPTY, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isPending = createSubnet.isPending;

  return (
    <Modal
      title="Subnet Baru"
      onClose={isPending ? () => {} : onClose}
      maxWidth={560}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="input-label">CIDR *</label>
          <input
            className="input"
            placeholder="mis. 10.0.0.0/24"
            value={form.cidr}
            onChange={(e) => set("cidr", e.target.value)}
            disabled={isPending}
            style={{ width: "100%", fontFamily: "monospace" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
          <div>
            <label className="input-label">IP Version</label>
            <select
              className="input"
              value={form.ip_version}
              onChange={(e) => set("ip_version", e.target.value)}
              disabled={isPending}
              style={{ width: "100%" }}
            >
              <option value="ipv4">IPv4</option>
              <option value="ipv6">IPv6</option>
            </select>
          </div>
          <div>
            <label className="input-label">Tipe Subnet</label>
            <select
              className="input"
              value={form.subnet_type}
              onChange={(e) => set("subnet_type", e.target.value)}
              disabled={isPending}
              style={{ width: "100%" }}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
          <div>
            <label className="input-label">Site ID</label>
            <input
              className="input"
              type="number"
              placeholder="Opsional"
              value={form.site_id}
              onChange={(e) => set("site_id", e.target.value)}
              disabled={isPending}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="input-label">Gateway</label>
            <input
              className="input"
              placeholder="mis. 10.0.0.1"
              value={form.gateway}
              onChange={(e) => set("gateway", e.target.value)}
              disabled={isPending}
              style={{ width: "100%", fontFamily: "monospace" }}
            />
          </div>
        </div>

        <div>
          <label className="input-label">Deskripsi</label>
          <textarea
            className="input"
            rows={2}
            placeholder="Deskripsi subnet..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            disabled={isPending}
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>

        {error && <div className="input-error">{error}</div>}

        <div className="flex items-center gap-2.5 pt-3">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E59B00] hover:bg-[#D48F00] active:bg-[#c28100] text-white text-xs sm:text-sm font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Menyimpan Subnet...</span>
              </>
            ) : (
              <span>Simpan Subnet</span>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default IpamFormModal;
