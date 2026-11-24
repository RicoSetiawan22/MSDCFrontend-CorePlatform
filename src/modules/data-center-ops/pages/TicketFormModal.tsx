import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { useCreateTicket } from "../api/useTickets";
import { deviceApi } from "../api/deviceApi";
import { customerApi } from "@modules/crm-sales/api/customerApi";
import { contractApi } from "@modules/crm-sales/api/contractApi";
import { extractErrorMessage } from "@shared/types/api";
import type { Customer } from "@modules/crm-sales/types/customer";
import type { TicketPriority, TicketType } from "../types/ticket";

const EMPTY = {
  customer_id: "",
  customer_label: "",
  contract_id: "",
  site_id: "",
  device_id: "",
  ticket_type: "incident",
  priority: "medium",
  subject: "",
  description: "",
};

export function TicketFormModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const create = useCreateTicket();

  const [customerSearch, setCustomerSearch] = useState("");
  const { data: customerResults } = useQuery({
    queryKey: ["ticket-customer-search", customerSearch],
    queryFn: () => customerApi.list({ search: customerSearch, per_page: 10 }).then(r => r.data.data),
    enabled: customerSearch.length >= 2,
  });

  // Kontrak AKTIF milik customer yang dipilih - baru bisa diambil setelah
  // customer_id ada, supaya user tidak perlu hafal Contract ID manual.
  const { data: activeContracts, isLoading: loadingContracts } = useQuery({
    queryKey: ["ticket-customer-active-contracts", form.customer_id],
    queryFn: () => contractApi.list({ customer_id: Number(form.customer_id), status: "active", per_page: 50 }).then(r => r.data.data),
    enabled: !!form.customer_id,
  });

  // Device yang tertaut ke contract terpilih - begitu contract dipilih,
  // Site ID & Device ID tidak perlu diketik manual lagi, tinggal pilih dari
  // device yang sudah ditautkan ke contract itu (lihat Device.contract_id).
  const { data: contractDevices, isLoading: loadingDevices } = useQuery({
    queryKey: ["ticket-contract-devices", form.contract_id],
    queryFn: () => deviceApi.list({ contract_id: Number(form.contract_id), per_page: 100 }).then(r => r.data.data),
    enabled: !!form.contract_id,
  });

  // Kalau customer cuma punya 1 contract aktif, langsung pilihkan otomatis
  // supaya user tidak perlu klik lagi - persis maksud "dipilih contract
  // otomatis" setelah customer ditemukan.
  useEffect(() => {
    if (activeContracts && activeContracts.length === 1) {
      setForm(f => (f.contract_id ? f : { ...f, contract_id: String(activeContracts[0].id) }));
    }
  }, [activeContracts]);

  function selectCustomer(customer: Customer) {
    setForm(f => ({ ...f, customer_id: String(customer.id), customer_label: `${customer.customer_code} — ${customer.company_name}`, contract_id: "", site_id: "", device_id: "" }));
    setCustomerSearch("");
  }

  function clearCustomer() {
    setForm(f => ({ ...f, customer_id: "", customer_label: "", contract_id: "", site_id: "", device_id: "" }));
  }

  function selectContract(contractId: string) {
    setForm(f => ({ ...f, contract_id: contractId, site_id: "", device_id: "" }));
  }

  function selectDevice(deviceIdStr: string) {
    const device = (contractDevices ?? []).find(d => String(d.id) === deviceIdStr);
    setForm(f => ({
      ...f,
      device_id: deviceIdStr,
      site_id: device?.site_id ? String(device.site_id) : f.site_id,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim()) { setError("Subject wajib diisi."); return; }
    if (!form.device_id && !form.description.trim()) {
      setError("Karena tiket ini tidak terhubung ke device tertentu (Lainnya), Deskripsi wajib diisi untuk menjelaskan masalahnya.");
      return;
    }
    setError(null);

    try {
      await create.mutateAsync({
        customer_id: form.customer_id ? Number(form.customer_id) : undefined,
        contract_id: form.contract_id ? Number(form.contract_id) : undefined,
        site_id: form.site_id ? Number(form.site_id) : undefined,
        device_id: form.device_id ? Number(form.device_id) : undefined,
        ticket_type: form.ticket_type as TicketType,
        priority: form.priority as TicketPriority,
        subject: form.subject.trim(),
        description: form.description || undefined,
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
    <Modal title="Tiket Baru" onClose={create.isPending ? () => {} : onClose} maxWidth={600}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="input-label">Subject *</label>
          <input className="input" placeholder="mis. Server tidak bisa diakses via SSH"
            value={form.subject} onChange={e => set("subject", e.target.value)}
            disabled={create.isPending}
            style={{ width: "100%" }} />
        </div>

        <div>
          <label className="input-label">Deskripsi</label>
          <textarea className="input" rows={3}
            placeholder="Detail masalah atau request..."
            value={form.description} onChange={e => set("description", e.target.value)}
            disabled={create.isPending}
            style={{ width: "100%", resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
          <div>
            <label className="input-label">Tipe Tiket</label>
            <select className="input" value={form.ticket_type}
              onChange={e => set("ticket_type", e.target.value)}
              disabled={create.isPending}
              style={{ width: "100%" }}>
              <option value="incident">Incident</option>
              <option value="remote_hands">Remote Hands</option>
              <option value="maintenance">Maintenance</option>
              <option value="request">Request</option>
              <option value="other">Lainnya</option>
            </select>
            <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
              Status akan otomatis: <strong>{form.ticket_type === "maintenance" ? "Maintenance" : "Trouble"}</strong>
            </div>
          </div>
          <div>
            <label className="input-label">Prioritas</label>
            <select className="input" value={form.priority}
              onChange={e => set("priority", e.target.value)}
              disabled={create.isPending}
              style={{ width: "100%" }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Customer - search by nama, bukan ID mentah */}
        <div>
          <label className="input-label">Customer</label>
          {form.customer_id ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: "#f0fdf4", borderRadius: 6, fontSize: "0.85rem" }}>
              <span style={{ flex: 1, color: "#16a34a", fontWeight: 600 }}>{form.customer_label}</span>
              <button type="button" onClick={clearCustomer} disabled={create.isPending}
                style={{ border: "none", background: "none", color: "#dc2626", cursor: create.isPending ? "not-allowed" : "pointer", fontSize: "0.78rem" }}>
                Ganti
              </button>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <input className="input" placeholder="Cari nama customer (min 2 huruf)..."
                value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                disabled={create.isPending}
                style={{ width: "100%" }} />
              {customerSearch.length >= 2 && customerResults && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "white", border: "1px solid var(--border)", borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", maxHeight: 180, overflowY: "auto" }}>
                  {customerResults.length === 0 && <div style={{ padding: "0.5rem", color: "var(--grey)", fontSize: "0.78rem" }}>Tidak ditemukan.</div>}
                  {customerResults.map(c => (
                    <button key={c.id} type="button"
                      onClick={() => selectCustomer(c)}
                      style={{ display: "block", width: "100%", padding: "0.45rem 0.7rem", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: "0.8rem" }}>
                      <span style={{ fontFamily: "monospace", color: "var(--grey)", fontSize: "0.72rem" }}>{c.customer_code}</span> — {c.company_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contract - muncul begitu customer dipilih, isinya kontrak AKTIF milik customer itu saja */}
        {form.customer_id && (
          <div>
            <label className="input-label">Contract (Aktif)</label>
            <select className="input" value={form.contract_id} disabled={loadingContracts || create.isPending}
              onChange={e => selectContract(e.target.value)} style={{ width: "100%" }}>
              <option value="">— Tanpa contract —</option>
              {(activeContracts ?? []).map(c => (
                <option key={c.id} value={c.id}>{c.contract_number}</option>
              ))}
            </select>
            {!loadingContracts && activeContracts && activeContracts.length === 0 && (
              <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
                Customer ini belum punya contract berstatus aktif.
              </div>
            )}
          </div>
        )}

        {/* Site & Device TIDAK PERNAH diketik manual (ID mentah tidak
            berarti apa-apa buat user) - cuma bisa dipilih dari device yang
            sudah ditautkan ke contract terpilih (Device.contract_id),
            site-nya otomatis ikut dari device tsb. Kalau tidak ada contract
            atau device-nya "Lainnya", ticket dicatat tanpa site/device
            spesifik (lihat peringatan Lainnya di bawah). */}
        {form.contract_id && (
          <div>
            <label className="input-label">Device (dari Contract)</label>
            <select className="input" value={form.device_id} disabled={loadingDevices || create.isPending}
              onChange={e => selectDevice(e.target.value)} style={{ width: "100%" }}>
              <option value="">Lainnya (tanpa device spesifik)</option>
              {(contractDevices ?? []).map(d => (
                <option key={d.id} value={d.id}>{d.device_code} — {d.device_name}</option>
              ))}
            </select>
            {!loadingDevices && contractDevices && contractDevices.length === 0 && (
              <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
                Contract ini belum punya device yang ditautkan.
              </div>
            )}
            {form.site_id && (
              <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
                Site ID: <strong>{form.site_id}</strong> (otomatis dari device terpilih)
              </div>
            )}
          </div>
        )}

        {!form.device_id && (
          <div style={{ fontSize: "0.72rem", color: "#b45309", background: "#fffbeb", padding: "0.5rem 0.7rem", borderRadius: 6 }}>
            Tiket ini akan dicatat sebagai <strong>Lainnya</strong> (tidak terhubung ke device tertentu) — pastikan kolom Deskripsi di atas sudah menjelaskan masalahnya.
          </div>
        )}

        {error && <div className="input-error">{error}</div>}

        <div className="flex items-center gap-2.5 pt-3">
          <button
            type="submit"
            disabled={create.isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E59B00] hover:bg-[#D48F00] active:bg-[#c28100] text-white text-xs sm:text-sm font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {create.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Membuat Tiket...</span>
              </>
            ) : (
              <span>Buat Tiket</span>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={create.isPending}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
        </div>
      </form>
    </Modal>
  );
}
