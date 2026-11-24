import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useCreateContract } from "../api/useContracts";
import { useProductList } from "../api/useProducts";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { CrmModalShell } from "./CreateContractFromQuotationModal";
import { CustomerPicker, type CustomerPickerResult } from "@shared/components/CustomerPicker";
import { NumberSequenceSetupModal } from "@modules/core-platform/components/NumberSequenceSetupModal";
import { extractErrorMessage, extractNumberSequenceError, type NumberSequenceNotConfiguredError } from "@shared/types/api";

type ServiceType = "colocation" | "dedicated_server" | "cloud" | "bandwidth" | "cross_connect" | "managed_service" | "other";
interface ServiceRow {
  service_type: ServiceType; description: string; quantity: number; unit_price: number;
  /** Diisi otomatis dari Product.default_* saat Produk dipilih di bawah -
   * supaya Contract yang dibuat manual (bukan dari Quotation) TETAP
   * mewariskan kebutuhan resource DataCenterOps ke ContractService, jadi
   * Perintah Kerja tahu apa yang perlu dipasang (rack, IP, cross-connect,
   * dst) - sebelumnya kontrak manual selalu kosong di sini. */
  product_id?: number | null;
  required_rack_u?: number | null;
  rack_mode?: "unit" | "whole_rack";
  required_ip_count?: number | null;
  required_power_watt?: number | null;
  required_bandwidth_mbps?: number | null;
  requires_cross_connect?: boolean;
}
const SERVICE_TYPES: ServiceType[] = ["colocation", "dedicated_server", "cloud", "bandwidth", "cross_connect", "managed_service", "other"];

export function ContractFormModal({ onClose }: { onClose: () => void }) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerPickerResult | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [contractType, setContractType] = useState("msp");
  const [paymentTermDays, setPaymentTermDays] = useState(30);
  const [autoRenew, setAutoRenew] = useState(false);
  const [notes, setNotes] = useState("");
  const [services, setServices] = useState<ServiceRow[]>([
    { service_type: "other", description: "", quantity: 1, unit_price: 0 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [seqError, setSeqError] = useState<NumberSequenceNotConfiguredError | null>(null);
  const create = useCreateContract();
  const { data: products } = useProductList({ is_active: true });

  function buildPayload() {
    return {
      customer_id: selectedCustomer!.id,
      start_date: startDate,
      end_date: endDate,
      contract_type: contractType,
      payment_term_days: paymentTermDays,
      auto_renew: autoRenew,
      notes: notes || undefined,
      services,
    };
  }

  function handleCustomerSelect(customer: CustomerPickerResult) {
    setSelectedCustomer(customer);
  }

  function handleCustomerClear() {
    setSelectedCustomer(null);
  }

  function addService() {
    setServices(prev => [...prev, { service_type: "other", description: "", quantity: 1, unit_price: 0 }]);
  }

  function removeService(i: number) {
    setServices(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateService(i: number, field: keyof ServiceRow, value: string | number) {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  /** Pilih Produk -> tarik service_type + kebutuhan resource DataCenterOps
   * (default_rack_u dkk) dari master data Produk ke baris ini, sama pola
   * dengan alur Quotation -> SO/Contract yang sudah ada - staf tetap bisa
   * timpa manual field apa pun setelahnya kalau perlu. */
  function selectProduct(i: number, productId: string) {
    if (!productId) {
      setServices(prev => prev.map((s, idx) => idx === i ? { ...s, product_id: null } : s));
      return;
    }
    const product = (products ?? []).find(p => p.id === Number(productId));
    if (!product) return;
    setServices(prev => prev.map((s, idx) => idx !== i ? s : {
      ...s,
      product_id: product.id,
      service_type: product.service_type,
      description: s.description || product.name,
      unit_price: s.unit_price || Number(product.base_price),
      required_rack_u: product.default_rack_u,
      rack_mode: product.default_rack_mode,
      required_ip_count: product.default_ip_count,
      required_power_watt: product.default_power_watt,
      required_bandwidth_mbps: product.default_bandwidth_mbps,
      requires_cross_connect: product.default_requires_cross_connect,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedCustomer) { setError("Pilih customer terlebih dahulu."); return; }
    setError(null);
    try {
      await create.mutateAsync(buildPayload());
      onClose();
    } catch (err) {
      const seq = extractNumberSequenceError(err);
      if (seq) { setSeqError(seq); return; }
      setError(extractErrorMessage(err));
    }
  }

  const CONTRACT_TYPES = [
    { value: "msp", label: "Managed Services (MSP)" },
    { value: "dedicated", label: "Dedicated Server" },
    { value: "project", label: "Project-Based" },
    { value: "consulting", label: "Consulting" },
  ];

  return (
    <CrmModalShell title="Kontrak Baru" onClose={onClose} maxWidth={720}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/*
          Customer — lookup dari database Customer.
          Dipilih dari search picker, customer_id didapat dari hasil pilihan.
        */}
        <CustomerPicker
          label="Customer *"
          selectedCustomerId={selectedCustomer?.id}
          selectedCustomerName={selectedCustomer?.company_name}
          onSelect={handleCustomerSelect}
          onClear={handleCustomerClear}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
          <div>
            <label className="input-label">Tipe Kontrak</label>
            <select className="input" value={contractType} onChange={e => setContractType(e.target.value)}>
              {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <InputField label="Tanggal Mulai" type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)} />
            <InputField label="Tanggal Berakhir" type="date" value={endDate}
              onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
          <InputField label="Payment Term (hari)" type="number" min={0} value={paymentTermDays}
            onChange={e => setPaymentTermDays(Number(e.target.value))} />
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", alignSelf: "flex-end", marginBottom: "0.5rem", cursor: "pointer" }}>
            <input type="checkbox" checked={autoRenew} onChange={e => setAutoRenew(e.target.checked)} />
            Auto Renew
          </label>
        </div>

        {/* Services */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label className="input-label" style={{ margin: 0 }}>Layanan / Services</label>
            <button type="button" onClick={addService} className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}>
              <Plus size={13} /> Tambah Service
            </button>
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "var(--bg-subtle)" }}>
                  <th style={{ padding: "0.5rem", textAlign: "left", width: "18%" }}>Produk (opsional)</th>
                  <th style={{ padding: "0.5rem", textAlign: "left", width: "16%" }}>Tipe Layanan</th>
                  <th style={{ padding: "0.5rem", textAlign: "left", width: "26%" }}>Deskripsi</th>
                  <th style={{ padding: "0.5rem", textAlign: "right", width: "10%" }}>Qty</th>
                  <th style={{ padding: "0.5rem", textAlign: "right", width: "20%" }}>Unit Price</th>
                  <th style={{ width: "10%" }}></th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc, i) => (
                  <tr key={i}>
                    <td style={{ padding: "0.3rem 0.4rem" }}>
                      <select className="input" value={svc.product_id ?? ""}
                        onChange={e => selectProduct(i, e.target.value)}
                        title="Pilih Produk supaya kebutuhan resource DataCenterOps (rack/IP/cross-connect) otomatis terisi"
                        style={{ fontSize: "0.8rem" }}>
                        <option value="">— Tanpa produk —</option>
                        {(products ?? []).map(p => (
                          <option key={p.id} value={p.id}>{p.product_code} — {p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "0.3rem 0.4rem" }}>
                      <select className="input" value={svc.service_type}
                        onChange={e => updateService(i, "service_type", e.target.value)}
                        style={{ fontSize: "0.8rem" }}>
                        {SERVICE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "0.3rem 0.4rem" }}>
                      <input className="input" value={svc.description}
                        onChange={e => updateService(i, "description", e.target.value)}
                        placeholder="Backup 10TB/month" style={{ fontSize: "0.8rem" }} />
                    </td>
                    <td style={{ padding: "0.3rem 0.4rem" }}>
                      <input className="input" type="number" min={1} value={svc.quantity}
                        onChange={e => updateService(i, "quantity", Number(e.target.value))}
                        style={{ fontSize: "0.8rem" }} />
                    </td>
                    <td style={{ padding: "0.3rem 0.4rem" }}>
                      <input className="input" type="number" min={0} value={svc.unit_price}
                        onChange={e => updateService(i, "unit_price", Number(e.target.value))}
                        style={{ fontSize: "0.8rem", textAlign: "right" }} />
                    </td>
                    <td style={{ padding: "0.3rem", textAlign: "center" }}>
                      {services.length > 1 && (
                        <button type="button" onClick={() => removeService(i)} style={{ border: "none", background: "none", color: "var(--bad)", cursor: "pointer" }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>
            Pilih Produk kalau baris ini butuh resource Data Center (rack, IP, cross-connect) — kebutuhannya otomatis terisi dari master data Produk, muncul di Perintah Kerja DataCenterOps begitu kontrak ini diprovisioning.
          </div>
        </div>

        <div>
          <label className="input-label">Catatan</label>
          <textarea className="input" rows={2} value={notes}
            onChange={e => setNotes(e.target.value)} />
        </div>

        {error && <div className="input-error">{error}</div>}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={create.isPending} style={{ flex: 1 }}>
            {create.isPending ? "Menyimpan..." : "Buat Kontrak"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>

      {seqError && (
        <NumberSequenceSetupModal
          moduleCode={seqError.module_code}
          suggestedPrefix={seqError.suggested_prefix}
          suggestedFormat={seqError.suggested_format}
          lockModuleCode
          onClose={() => setSeqError(null)}
          onCreated={() => { setSeqError(null); create.mutateAsync(buildPayload()).then(() => onClose()).catch((err) => setError(extractErrorMessage(err))); }}
        />
      )}
    </CrmModalShell>
  );
}
