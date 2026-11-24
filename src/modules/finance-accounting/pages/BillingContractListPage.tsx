import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, PlayCircle, FileText, Repeat, Receipt, Landmark, Wallet, BookOpen, ChevronRight, Edit2, TrendingUp, CalendarDays, ExternalLink, LinkIcon, Lock } from "lucide-react";
import { useBillingContractList, useCreateBillingContract, useUpdateBillingContract } from "../api/useBillingContracts";
import { useContractList } from "@modules/crm-sales/api/useContracts";
import { RunBillingModal } from "../components/RunBillingModal";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { FormInput, FormTextarea } from "@shared/components/ui/FormKit";
import { SearchableSelect } from "@shared/components/ui/FormKit";
import { AccountPicker } from "@shared/components/ui/AccountPicker";
import { useProfitCenterLookup } from "@shared/components/ui/useLookup";
import { formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { BiBillingContract, BiBillingContractFormValues, BillingContractStatus } from "../types/billingContract";

const STATUS_LABEL: Record<BillingContractStatus, string> = {
  active: "Aktif",
  suspended: "Ditangguhkan",
  terminated: "Dihentikan",
};

/** Field operasional saja - contract_number/customer_id/customer_name TIDAK
 * ADA lagi di sini, selalu diturunkan backend dari crm_contract_id yang
 * dipilih lewat picker (lihat BiBillingContractController::store()). */
type OperationalForm = Omit<BiBillingContractFormValues, "crm_contract_id">;

const EMPTY_FORM: OperationalForm = {
  service_description: "",
  revenue_account_id: 0,
  monthly_amount: 0,
  start_date: "",
};

const PIPELINE_STEPS = [
  { icon: FileText, label: "Contract" },
  { icon: Repeat, label: "Monthly Billing" },
  { icon: Receipt, label: "Invoice" },
  { icon: Landmark, label: "Finance" },
  { icon: Wallet, label: "Customer Bayar" },
  { icon: BookOpen, label: "Journal Otomatis" },
];

interface ContractFormModalProps {
  contract?: BiBillingContract | null;
  /** crm_contract_id yang SUDAH punya kontrak billing - dikeluarkan dari
   * picker supaya tidak bisa didaftarkan dobel (backend juga menolak,
   * ini cuma mencegah error di awal). */
  linkedCrmContractIds: number[];
  onClose: () => void;
}

function ContractFormModal({ contract, linkedCrmContractIds, onClose }: ContractFormModalProps) {
  const isEdit = !!contract;
  const createMutation = useCreateBillingContract();
  const updateMutation = useUpdateBillingContract();
  const profitCenters = useProfitCenterLookup({ is_active: true, limit: 20 });
  const { data: crmContracts, isLoading: crmLoading } = useContractList({ status: "active", per_page: 100 });
  const [error, setError] = useState<string | null>(null);
  const [crmContractId, setCrmContractId] = useState<number | "">("");

  const availableCrmContracts = (crmContracts?.data ?? []).filter((c) => !linkedCrmContractIds.includes(c.id));
  const selectedCrmContract = availableCrmContracts.find((c) => c.id === crmContractId);

  const initForm = (): OperationalForm => contract
    ? {
        service_description: contract.service_description,
        profit_center_id: contract.profit_center?.id,
        revenue_account_id: contract.revenue_account.id,
        monthly_amount: contract.monthly_amount,
        tax_rate: contract.tax_rate ?? undefined,
        billing_day: contract.billing_day ?? undefined,
        // API balas ISO datetime penuh ("...T00:00:00.000000Z") - <input
        // type="date"> cuma menerima "YYYY-MM-DD" (bug lama, baru ketauan
        // sekarang - dulu field ini selalu kosong pas edit).
        start_date: contract.start_date.slice(0, 10),
        end_date: contract.end_date ? contract.end_date.slice(0, 10) : undefined,
        payment_term_days: contract.payment_term_days ?? undefined,
        notes: contract.notes ?? undefined,
      }
    : { ...EMPTY_FORM };

  const [form, setForm] = useState<OperationalForm>(initForm);

  function setField<K extends keyof OperationalForm>(key: K, value: OperationalForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSelectCrmContract(value: string) {
    const id = value ? Number(value) : "";
    setCrmContractId(id);
    const picked = availableCrmContracts.find((c) => c.id === id);
    if (picked) {
      // start_date/end_date dari API berbentuk ISO datetime penuh
      // ("2026-08-07T00:00:00.000000Z") - <input type="date"> cuma
      // menerima "YYYY-MM-DD", potong 10 karakter pertama (pola yang
      // sama dipakai ActivateContractModal.tsx dkk).
      setForm((prev) => ({
        ...prev,
        monthly_amount: Number(picked.monthly_value),
        start_date: picked.start_date.slice(0, 10),
        end_date: picked.end_date ? picked.end_date.slice(0, 10) : undefined,
        payment_term_days: picked.payment_term_days ?? prev.payment_term_days,
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit && contract) {
        await updateMutation.mutateAsync({ id: contract.id, values: form });
      } else {
        if (!crmContractId) { setError("Pilih Contract CRM dulu — kontrak billing selalu ditautkan ke Contract yang sudah ada."); return; }
        await createMutation.mutateAsync({ ...form, crm_contract_id: crmContractId });
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const profitCenterOptions = (profitCenters.data?.data ?? []).map((p) => ({
    value: String(p.id),
    label: p.name,
    sublabel: p.code,
  }));

  const subtotal = form.monthly_amount ?? 0;
  const taxRate = form.tax_rate ?? 0;
  const taxAmount = subtotal * (taxRate / 100);

  const DATE_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
    value: String(i + 1),
    label: `Tanggal ${i + 1}`,
    sublabel: "setiap bulan",
  }));

  return (
    <Modal
      title={isEdit ? `✏️ Edit Kontrak — ${contract!.contract_number}` : "📄 Kontrak Billing Baru"}
      onClose={onClose}
      maxWidth={640}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

        {!isEdit && (
          <div style={{ background: "#dbeafe", color: "#1d4ed8", padding: "0.75rem 0.875rem", borderRadius: 8, fontSize: "0.8rem" }}>
            Kontrak billing otomatis menagih customer di periode yang ditentukan — invoice AR dibuat oleh scheduler tanpa input manual.
          </div>
        )}

        {/* Kontrak CRM */}
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <LinkIcon size={13} /> Contract CRM
          </div>
          {isEdit ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-subtle)", borderRadius: 8, padding: "0.6rem 0.8rem" }}>
              <div>
                <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem" }}>{contract!.contract_number}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--grey)" }}>{contract!.customer_name}</div>
              </div>
              {contract!.crm_contract_id ? (
                <Link to={`/crm-sales/contracts/${contract!.crm_contract_id}`} target="_blank" style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                  Lihat di CRM <ExternalLink size={12} />
                </Link>
              ) : (
                <span style={{ fontSize: "0.72rem", color: "var(--grey)" }}>Tidak terhubung ke CRM</span>
              )}
            </div>
          ) : (
            <>
              <SearchableSelect
                value={crmContractId ? String(crmContractId) : ""}
                onChange={handleSelectCrmContract}
                options={availableCrmContracts.map((c) => ({
                  value: String(c.id),
                  label: c.contract_number,
                  sublabel: c.customer?.company_name ?? "—",
                }))}
                placeholder={crmLoading ? "Memuat contract..." : "Pilih Contract CRM..."}
              />
              {!crmLoading && availableCrmContracts.length === 0 && (
                <div style={{ fontSize: "0.75rem", color: "var(--grey)", marginTop: "0.4rem" }}>
                  Tidak ada Contract CRM aktif yang belum punya kontrak billing.{" "}
                  <Link to="/crm-sales/contracts" target="_blank" style={{ color: "var(--accent)" }}>Buka Contract Management →</Link>
                </div>
              )}
              {selectedCrmContract && (
                <div style={{ fontSize: "0.78rem", color: "var(--grey-dark)", marginTop: "0.4rem" }}>
                  Customer: <strong>{selectedCrmContract.customer?.company_name ?? "—"}</strong> — nomor kontrak, customer, tagihan awal & periode diambil otomatis dari CRM.
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
          <FormInput
            label="Deskripsi Layanan *"
            required
            value={form.service_description}
            onChange={(e) => setField("service_description", e.target.value)}
            placeholder="mis. Sewa Rack Colocation 10U - DC Surabaya"
          />
          <div>
            <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Tanggal Tagih per Bulan</label></div>
            <SearchableSelect
              value={form.billing_day ? String(form.billing_day) : ""}
              onChange={(v) => setField("billing_day", Number(v))}
              options={DATE_OPTIONS}
              placeholder="Pilih tanggal..."
            />
          </div>
        </div>

        {/* Billing */}
        <div style={{ paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <CalendarDays size={13} /> Detail Tagihan
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <FormInput
              label="Tagihan per Periode (Rp) *"
              type="number" required min={0.01} step="any"
              value={form.monthly_amount || ""}
              onChange={(e) => setField("monthly_amount", Number(e.target.value))}
              placeholder="0"
            />
            <FormInput
              label="Tarif Pajak (%)"
              type="number" min={0} max={100}
              value={form.tax_rate ?? ""}
              onChange={(e) => setField("tax_rate", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="11 (kosongkan = tanpa pajak)"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginTop: "0.875rem" }}>
            <FormInput
              label="Tanggal Mulai *"
              type="date"
              required
              value={form.start_date}
              onChange={(e) => setField("start_date", e.target.value)}
            />
            <FormInput
              label="Tanggal Berakhir"
              type="date"
              value={form.end_date ?? ""}
              onChange={(e) => setField("end_date", e.target.value || undefined)}
              placeholder="Kosongkan = tidak terbatas"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginTop: "0.875rem" }}>
            <FormInput
              label="Payment Term (hari)"
              type="number" min={0}
              value={form.payment_term_days ?? ""}
              onChange={(e) => setField("payment_term_days", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="30"
            />
            <div>
              <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Profit Center</label></div>
              <SearchableSelect
                value={form.profit_center_id ? String(form.profit_center_id) : ""}
                onChange={(v) => setField("profit_center_id", Number(v))}
                options={profitCenterOptions}
                placeholder="Pilih profit center..."
              />
            </div>
          </div>
        </div>

        {/* Akun Pendapatan */}
        <div style={{ paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <TrendingUp size={13} /> Akun Pendapatan
          </div>
          <div>
            <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Akun Pendapatan *</label></div>
            <AccountPicker
              value={form.revenue_account_id ? String(form.revenue_account_id) : ""}
              onChange={(v) => setField("revenue_account_id", Number(v))}
              accountType="revenue"
              placeholder="Cari akun pendapatan..."
            />
            <div style={{ fontSize: "0.7rem", color: "var(--grey)", marginTop: "0.3rem" }}>
              Akun di mana pendapatan kontrak ini akan di-posting (mis. 411001 Pendapatan Colocation).
            </div>
          </div>
        </div>

        {/* Summary preview */}
        {form.monthly_amount > 0 && (
          <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.875rem 1rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey-dark)", marginBottom: "0.6rem" }}>Preview Tagihan Bulanan</div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0", fontSize: "0.82rem" }}>
              <span>Subtotal</span><span style={{ fontFamily: "monospace", fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0", fontSize: "0.82rem" }}>
              <span>{form.tax_rate ? `PPN (${form.tax_rate}%)` : "Pajak"}</span>
              <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{formatCurrency(taxAmount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0 0.1rem", borderTop: "1px solid var(--border)", marginTop: "0.4rem", fontWeight: 700, fontSize: "0.9rem" }}>
              <span>Total/Bulan</span>
              <span style={{ fontFamily: "monospace", color: "#b45309" }}>{formatCurrency(subtotal + taxAmount)}</span>
            </div>
          </div>
        )}

        <FormTextarea
          value={form.notes ?? ""}
          onChange={(e) => setField("notes", e.target.value || undefined)}
          rows={2}
          label="Catatan"
          placeholder="Catatan internal kontrak (opsional)"
        />

        {error && (
          <div style={{ padding: "0.7rem 0.875rem", background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: "0.82rem" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} style={{ flex: 1 }}>
            {(createMutation.isPending || updateMutation.isPending) ? "Menyimpan..." : isEdit ? "💾 Simpan Perubahan" : "💾 Simpan Kontrak"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}

export function BillingContractListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<BillingContractStatus | "">("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [editContract, setEditContract] = useState<BiBillingContract | null>(null);

  const { data, isLoading } = useBillingContractList({ page, per_page: 25, status: status || undefined });

  const totalMonthly = (data?.data ?? []).reduce((sum, c) => sum + Number(c.monthly_amount ?? 0), 0);
  const activeCount = (data?.data ?? []).filter((c) => c.status === "active").length;
  // Dipakai picker "Kontrak Baru" - hanya menutupi 1 halaman yang sedang
  // dimuat, cukup untuk skala data saat ini (backend tetap jadi penjaga
  // utama lewat validasi crm_contract_id unik di store()).
  const linkedCrmContractIds = (data?.data ?? []).map((c) => c.crm_contract_id).filter((id): id is number => id !== null);

  return (
    <div>
      <PageHeader title="Billing Integration" subtitle="Jembatan Contract (CRM) → Invoice AR — tagihan berulang berjalan otomatis tiap bulan." />

      <div style={{ padding: "0 2rem" }}>
        {/* Pipeline strip */}
        <div className="card" style={{ padding: "1rem 1.5rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", overflowX: "auto" }}>
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.label} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", minWidth: 88 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent-light)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <step.icon size={16} />
                </div>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--grey-dark)", textAlign: "center" }}>{step.label}</span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && <ChevronRight size={16} color="var(--border)" style={{ flexShrink: 0, margin: "0 0.25rem 1.1rem" }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="content-card">
        {/* Toolbar */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.4rem", flex: 1, flexWrap: "wrap" }}>
            {(["", "active", "suspended", "terminated"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStatus(s); setPage(1); }}
                style={{
                  padding: "0.3rem 0.875rem", borderRadius: 20, cursor: "pointer",
                  border: `1px solid ${status === s ? "var(--accent)" : "var(--border)"}`,
                  background: status === s ? "var(--accent-light)" : "white",
                  color: status === s ? "var(--accent)" : "var(--grey)",
                  fontSize: "0.78rem", fontWeight: status === s ? 700 : 400,
                }}
              >
                {s === "" ? "Semua" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
            <Button variant="secondary" onClick={() => setIsRunModalOpen(true)}>
              <PlayCircle size={15} /> Billing
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={15} /> Kontrak Baru
            </Button>
          </div>
        </div>

        {/* Summary strip */}
        {data && data.data.length > 0 && (
          <div style={{ display: "flex", gap: "1.5rem", padding: "0.75rem 1.25rem", background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: "0.68rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Kontrak</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>{data.total} kontrak</div>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "1.5rem" }}>
              <div style={{ fontSize: "0.68rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Kontrak Aktif</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--good)" }}>{activeCount} kontrak</div>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "1.5rem" }}>
              <div style={{ fontSize: "0.68rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Tagihan/Bulan</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "monospace" }}>{formatCurrency(totalMonthly)}</div>
            </div>
          </div>
        )}

        {isLoading && <LoadingState />}
        {data && data.data.length === 0 && (
          <EmptyState title="Belum Ada Kontrak Billing" subtitle="Daftarkan kontrak berulang dari customer untuk mulai menagih otomatis tiap bulan." />
        )}

        {data && data.data.length > 0 && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>No. Kontrak</th>
                  <th>Customer</th>
                  <th>Layanan</th>
                  <th style={{ textAlign: "right" }}>Tagihan/Bulan</th>
                  <th>Periode</th>
                  <th>Terakhir Ditagih</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/finance/billing/contracts/${c.id}`} style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none", fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {c.contract_number}
                      </Link>
                      {c.crm_contract_id ? (
                        <Link to={`/crm-sales/contracts/${c.crm_contract_id}`} target="_blank" title="Lihat Contract di CRM"
                          style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.68rem", color: "var(--grey)", textDecoration: "none", marginTop: "0.15rem" }}>
                          <LinkIcon size={10} /> CRM
                        </Link>
                      ) : (
                        <div style={{ fontSize: "0.68rem", color: "var(--warn-text, #b45309)", marginTop: "0.15rem" }}>Tidak terhubung CRM</div>
                      )}
                    </td>
                    <td style={{ fontSize: "0.85rem", fontWeight: 600 }}>{c.customer_name}</td>
                    <td style={{ fontSize: "0.82rem", color: "var(--grey-dark)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.service_description}</td>
                    <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>{formatCurrency(c.monthly_amount)}</td>
                    <td style={{ fontSize: "0.78rem", color: "var(--grey)" }}>
                      {c.start_date ? new Date(c.start_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--grey)" }}>{c.last_billed_period ? c.last_billed_period.slice(0, 10) : "Belum pernah"}</td>
                    <td>
                      <span className={`badge badge-${c.status === "active" ? "active" : c.status === "terminated" ? "churned" : "inactive"}`}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td>
                      {/* Kontrak yang sudah tertaut Contract CRM (praktis SEMUA
                          kontrak baru - store() sekarang wajibkan crm_contract_id)
                          term-nya sudah final dari approval Finance & Legal di
                          CRM - tidak boleh diedit diam-diam di sini lagi.
                          Cuma kontrak LEGACY (belum tertaut CRM) yang masih bisa
                          diedit langsung dari halaman ini. */}
                      {c.crm_contract_id ? (
                        <span title="Term kontrak sudah final dari Contract CRM - edit lewat addendum di CRM"
                          style={{ display: "flex", padding: "0.25rem", color: "var(--grey)", opacity: 0.5 }}>
                          <Lock size={13} />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditContract(c)}
                          style={{ border: "none", background: "none", cursor: "pointer", color: "var(--grey)", display: "flex", padding: "0.25rem" }}
                          title="Edit kontrak"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "0 1.5rem" }}>
              <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {isCreateModalOpen && <ContractFormModal linkedCrmContractIds={linkedCrmContractIds} onClose={() => setIsCreateModalOpen(false)} />}
      {editContract && <ContractFormModal contract={editContract} linkedCrmContractIds={linkedCrmContractIds} onClose={() => setEditContract(null)} />}
      {isRunModalOpen && <RunBillingModal onClose={() => setIsRunModalOpen(false)} />}
    </div>
  );
}
