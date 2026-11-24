import { useState, type FormEvent } from "react";
import { ArrowLeft, Target, Users, CircleDollarSign, StickyNote } from "lucide-react";
import { useCreateOpportunity } from "../api/useOpportunities";
import { useCrmSalesEmployees } from "../api/useLeads";
import { Button } from "@shared/components/Button";
import { PageHeader } from "@shared/components/PageHeader";
import { InputField } from "@shared/components/InputField";
import { CustomerPicker, type CustomerPickerResult, } from "@shared/components/CustomerPicker";
import { CurrencyInput } from "@shared/components/CurrencyInput";
import { LeadPicker } from "../components/LeadPicker";
import { NumberSequenceSetupModal } from "@modules/core-platform/components/NumberSequenceSetupModal";
import { extractErrorMessage, extractNumberSequenceError, type NumberSequenceNotConfiguredError, } from "@shared/types/api";
import type { Lead } from "../types/lead";
import type { Opportunity } from "../types/opportunity";
type SourceType = "customer" | "lead";
const COLORS = {
    navy: "#16213d",
    navyDark: "#0b1c33",
    slate: "#64748b",
    slateLight: "#94a3b8",
    orange: "#f2a602",
    orangeDark: "#d99200",
    green: "#16a34a",
    red: "#dc2626",
    border: "#e5e7eb",
    page: "#f5f7fa",
    white: "#ffffff",
    soft: "#f8fafc",
};
const OPPORTUNITY_FORM_STYLES = `
/* Opportunity Baru — soft enterprise UI, matching approved MSDC CRM forms. */
.crm-opportunity-form-ui {
  --opp-ink: #102b4e;
  --opp-muted: #74869e;
  --opp-border: #e4ebf4;
  --opp-gold: #f7ab00;
  min-height: 100%;
  padding-bottom: 36px;
  color: var(--opp-ink);
  background: #f5f7fb !important;
}
.crm-opportunity-form-ui *, .crm-opportunity-form-ui *::before, .crm-opportunity-form-ui *::after { box-sizing: border-box; }
.crm-opportunity-form-ui button, .crm-opportunity-form-ui input,
.crm-opportunity-form-ui select, .crm-opportunity-form-ui textarea { font-family: inherit; }
.crm-opportunity-form-content {
  width: auto;
  max-width: 1264px;
  margin: 0 auto 32px !important;
  padding: 0 clamp(16px, 2.2vw, 32px) !important;
}
.crm-opportunity-form-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin: 5px 0 18px;
}
.crm-opportunity-form-ui .crm-opportunity-form-back {
  display: inline-flex;
  min-height: 43px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 17px;
  border: 1px solid #f2d58b;
  border-radius: 12px;
  background: linear-gradient(180deg, #fffaf0 0%, #fff2cf 100%);
  color: #916000;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(220, 157, 20, .08);
  transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
}
.crm-opportunity-form-ui .crm-opportunity-form-back:hover {
  transform: translateY(-1px);
  background: #ffebad;
  box-shadow: 0 7px 18px rgba(220, 157, 20, .14);
}
.crm-opportunity-form-back:focus-visible,
.crm-opportunity-form-ui button:focus-visible {
  outline: 3px solid rgba(240,168,0,.32);
  outline-offset: 3px;
}
.crm-opportunity-form-badge {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  padding: 0 12px;
  border: 1px solid #e1e9f2;
  border-radius: 999px;
  background: #fff;
  color: #73869f;
  font-size: 11px;
  font-weight: 750;
}
.crm-opportunity-form-intro {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 16px;
  margin: 0 0 18px;
  padding: 24px 27px;
  border: 1px solid #e1e9f3;
  border-radius: 20px;
  background: linear-gradient(105deg, #f7faff 0%, #fbfcff 66%, #fff8e6 100%);
  box-shadow: 0 8px 28px rgba(15,39,71,.045);
}
.crm-opportunity-form-intro__icon {
  display: inline-flex;
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  align-items: center;
  justify-content: center;
  border: 1px solid #f5e3ae;
  border-radius: 16px;
  background: #fff1c7;
  color: #b47b0b;
}
.crm-opportunity-form-intro__text { min-width: 0; flex: 1; }
.crm-opportunity-form-intro__title {
  margin: 0;
  color: #102b4e;
  font-size: 19px;
  font-weight: 850;
  letter-spacing: -.025em;
  line-height: 1.25;
}
.crm-opportunity-form-intro__subtitle {
  margin: 6px 0 0;
  color: #788ba2;
  font-size: 12px;
  line-height: 1.55;
}
.crm-opportunity-form-intro__tag {
  flex: 0 0 auto;
  padding: 7px 11px;
  border: 1px solid #dfe8f2;
  border-radius: 999px;
  background: #fff;
  color: #57738e;
  font-size: 10px;
  font-weight: 800;
}
.crm-opportunity-form {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 17px;
}
.crm-opportunity-form-section {
  width: 100%;
  padding: 22px 26px 25px;
  border: 1px solid #e1e9f3;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 5px 18px rgba(15,39,71,.04);
}
.crm-opportunity-form-section__title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  margin: 0 0 20px;
  padding: 0 0 17px;
  border-bottom: 1px solid #edf2f7;
  color: #102b4e;
}
.crm-opportunity-form-section__icon {
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2ebfb;
  border-radius: 13px;
  background: #eff6ff;
  color: #2563eb;
}
.crm-opportunity-form-section__heading { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 5px; }
.crm-opportunity-form-section__heading strong { color: #102b4e; font-size: 14px; font-weight: 820; }
.crm-opportunity-form-section__heading small { color: #8191a6; font-size: 11px; font-weight: 500; line-height: 1.4; }
.crm-opportunity-form-section__number {
  display: inline-flex;
  min-width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  padding: 0 7px;
  border: 1px solid #f1e0b7;
  border-radius: 10px;
  background: #fffaf0;
  color: #b47b0b;
  font-size: 11px;
  font-weight: 850;
}
.crm-opportunity-form-ui .input,
.crm-opportunity-form-ui input,
.crm-opportunity-form-ui select,
.crm-opportunity-form-ui textarea {
  border-color: #dce5ef !important;
  border-radius: 11px !important;
  color: #223b55 !important;
  font-size: 12px !important;
  transition: border-color .16s ease, box-shadow .16s ease;
}
.crm-opportunity-form-ui .input:focus,
.crm-opportunity-form-ui input:focus,
.crm-opportunity-form-ui select:focus,
.crm-opportunity-form-ui textarea:focus {
  border-color: #e4a008 !important;
  box-shadow: 0 0 0 3px rgba(240,168,0,.12) !important;
  outline: none !important;
}
.crm-opportunity-form-ui label { color: #425c79; font-size: 12px; font-weight: 720; }
.crm-opportunity-source-tabs { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 11px; margin-bottom: 16px; }
.crm-opportunity-source-tab {
  min-height: 44px;
  border: 1px solid #dbe4ee;
  border-radius: 11px;
  background: #fff;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: background .16s ease, border-color .16s ease;
}
.crm-opportunity-source-tab.is-active { border-color: #f0a800; background: #fffbeb; color: #a16207; }
.crm-opportunity-source-tab:hover { border-color: #e6ba47; }
.crm-opportunity-pic-info { margin-top: 15px; padding: 13px 16px; border: 1px solid #dbeafe; border-radius: 12px; background: #f7fbff; }
.crm-opportunity-pic-info strong { color: #102b4e; font-size: 12px; }
.crm-opportunity-pic-info p { color: #64748b; font-size: 11px; }
.crm-opportunity-form-two-col { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; }
.crm-opportunity-form-notes { width: 100%; min-height: 104px; padding: 12px 13px; border: 1px solid #dbe3ec; border-radius: 11px; background: #fff; font-size: 12px; line-height: 1.55; resize: vertical; }
.crm-opportunity-form-error { padding: 12px 15px; border: 1px solid #fecaca; border-radius: 12px; background: #fef2f2; color: #b91c1c; font-size: 12px; font-weight: 650; }
.crm-opportunity-form-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 0 4px; }
.crm-opportunity-form-actions button { min-height: 42px; border-radius: 11px; font-size: 12px; font-weight: 800; }
.crm-opportunity-form-actions button[type="submit"] { border: 1px solid #e6a000; background: #f0a800; color: #fff; box-shadow: 0 3px 8px rgba(240,168,0,.16); }
.crm-opportunity-form-actions button[type="submit"]:hover { background: #df9900; transform: translateY(-1px); }
@media (max-width: 760px) {
  .crm-opportunity-form-content { padding: 0 16px !important; }
  .crm-opportunity-form-intro { padding: 18px; }
  .crm-opportunity-form-section { padding: 18px 16px; }
  .crm-opportunity-form-two-col { grid-template-columns: 1fr; }
  .crm-opportunity-form-intro__tag { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .crm-opportunity-form-ui *, .crm-opportunity-form-ui *::before, .crm-opportunity-form-ui *::after { transition: none !important; }
}


/* Shared MSDC back navigation button: matched to Detail Produk & Jasa. */
.crm-msdc-back-button.crm-msdc-back-button {
  display: inline-flex !important;
  min-height: 43px !important;
  align-items: center !important;
  justify-content: center !important;
  align-self: flex-start !important;
  gap: 9px !important;
  padding: 0 17px !important;
  border: 1px solid #f7d27b !important;
  border-radius: 12px !important;
  background: linear-gradient(180deg, #fff9ed 0%, #fff2d2 100%) !important;
  color: #996100 !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  line-height: 1.25 !important;
  text-decoration: none !important;
  box-shadow: 0 3px 10px rgba(215, 153, 17, .07) !important;
  cursor: pointer !important;
  transition: background .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease !important;
  white-space: normal !important;
  text-align: center !important;
}
.crm-msdc-back-button.crm-msdc-back-button:hover:not(:disabled) {
  border-color: #e9b948 !important;
  background: #ffeab0 !important;
  color: #805000 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 7px 18px rgba(215, 153, 17, .14) !important;
}
.crm-msdc-back-button.crm-msdc-back-button:focus-visible {
  outline: 3px solid rgba(247, 171, 0, .3) !important;
  outline-offset: 2px !important;
}
.crm-msdc-back-button.crm-msdc-back-button svg {
  flex: 0 0 auto;
}
@media (max-width: 640px) {
  .crm-msdc-back-button.crm-msdc-back-button {
    min-height: 42px !important;
    gap: 8px !important;
    padding: 0 14px !important;
  }
}
`;

const EMPTY = {
    name: "",
    customer_id: undefined as number | undefined,
    lead_id: undefined as number | undefined,
    estimated_value: undefined as number | undefined,
    probability_pct: 10,
    expected_close_date: "",
    notes: "",
};
const customLabelStyle = {
    display: "block",
    marginBottom: "0.4rem",
    color: COLORS.navy,
    fontSize: "0.72rem",
    fontWeight: 700,
} as const;

export function OpportunityFormModal({
    onClose,
    onCreated,
    initialLead,
}: {
    onClose: () => void;
    onCreated?: (opportunity: Opportunity) => void;
    initialLead?: Lead;
}) {
    const [form, setForm] = useState(() => ({
        ...EMPTY,
        lead_id: initialLead?.id,
    }));

    const [sourceType, setSourceType] = useState<SourceType>(
        initialLead ? "lead" : "customer"
    );

    const [selectedCustomer, setSelectedCustomer] =
        useState<CustomerPickerResult | null>(null);

    const [selectedLead, setSelectedLead] =
        useState<Lead | null>(initialLead ?? null);
    const [error, setError] = useState<string | null>(null);
    const [seqError, setSeqError] = useState<NumberSequenceNotConfiguredError | null>(null);
    const create = useCreateOpportunity();
    const { data: salesEmployees } = useCrmSalesEmployees();
    function buildPayload() {
        return {
            name: form.name,
            customer_id: form.customer_id,
            lead_id: form.lead_id,
            estimated_value: form.estimated_value,
            probability_pct: form.probability_pct,
            expected_close_date: form.expected_close_date || undefined,
            notes: form.notes || undefined,
        };
    }
    function handleCustomerSelect(customer: CustomerPickerResult) {
        setSelectedCustomer(customer);
        setForm((f) => ({
            ...f,
            customer_id: customer.id,
            lead_id: undefined,
        }));
        setSelectedLead(null);
    }
    function handleCustomerClear() {
        setSelectedCustomer(null);
        setForm((f) => ({
            ...f,
            customer_id: undefined,
        }));
    }
    function handleLeadSelect(lead: Lead) {
        setSelectedLead(lead);
        setForm((f) => ({
            ...f,
            lead_id: lead.id,
            customer_id: undefined,
        }));
        setSelectedCustomer(null);
    }
    function handleLeadClear() {
        setSelectedLead(null);
        setForm((f) => ({
            ...f,
            lead_id: undefined,
        }));
    }
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) {
            setError("Nama opportunity wajib diisi.");
            return;
        }
        if (!form.customer_id && !form.lead_id) {
            setError("Pilih Customer atau Lead terlebih dahulu.");
            return;
        }
        if (form.estimated_value == null || !Number.isFinite(form.estimated_value) || form.estimated_value < 0) {
            setError("Estimasi nilai Opportunity wajib diisi dengan angka tidak negatif."); return;
        }
        setError(null);
        try {
                        const createdOpportunity = await create.mutateAsync(buildPayload());

            if (onCreated) {
                onCreated(createdOpportunity);
            } else {
                onClose();
            }
        }
        catch (err) {
            const seq = extractNumberSequenceError(err);
            if (seq) {
                setSeqError(seq);
                return;
            }
            setError(extractErrorMessage(err));
        }
    }
    return (<div className="crm-opportunity-form-ui" style={{ minHeight: "100%", background: COLORS.page }}>
        <style>{OPPORTUNITY_FORM_STYLES}</style>
        <PageHeader title="Peluang" subtitle="Pipeline penjualan dan perkiraan revenue."
        containerClassName="px-7 pt-5 pb-2"
        />
        
      <div className="crm-opportunity-form-content">
        <div className="crm-opportunity-form-navigation">
          <button type="button" className="crm-opportunity-form-back crm-msdc-back-button" onClick={onClose}>
            <ArrowLeft size={17} strokeWidth={2.25} aria-hidden="true" />
            Kembali ke daftar Peluang
          </button>
          <span className="crm-opportunity-form-badge">Form Opportunity Baru</span>
        </div>

        <header className="crm-opportunity-form-intro">
          <span className="crm-opportunity-form-intro__icon" aria-hidden="true"><Target size={25} strokeWidth={2} /></span>
          <div className="crm-opportunity-form-intro__text">
            <h2 className="crm-opportunity-form-intro__title">Opportunity Baru</h2>
            <p className="crm-opportunity-form-intro__subtitle">Lengkapi informasi peluang penjualan, calon pelanggan, serta target pendapatan.</p>
          </div>
          <span className="crm-opportunity-form-intro__tag">Data Peluang</span>
        </header>

        <form className="crm-opportunity-form" onSubmit={handleSubmit}>
        {/* INFORMASI OPPORTUNITY */}
        <div className="crm-opportunity-form-section">
          <div className="crm-opportunity-form-section__title">
            <span className="crm-opportunity-form-section__icon"><Target size={19}/></span><span className="crm-opportunity-form-section__heading"><strong>Informasi Opportunity</strong><small>Identitas peluang yang akan ditambahkan ke pipeline penjualan.</small></span><span className="crm-opportunity-form-section__number">01</span>
          </div>

          <InputField label="Nama Opportunity *" required value={form.name} onChange={(e) => setForm({
            ...form,
            name: e.target.value,
        })} placeholder="mis. Implementasi Cloud Backup untuk PT XYZ"/>
        </div>


        {/* CUSTOMER / LEAD */}
        <div className="crm-opportunity-form-section">
          <div className="crm-opportunity-form-section__title">
            <span className="crm-opportunity-form-section__icon"><Users size={19}/></span><span className="crm-opportunity-form-section__heading"><strong>Customer / Lead</strong><small>Tentukan sumber peluang dan penanggung jawab Sales.</small></span><span className="crm-opportunity-form-section__number">02</span>
          </div>

          <div className="crm-opportunity-source-tabs">
            <button type="button" className={`crm-opportunity-source-tab ${sourceType === "customer" ? "is-active" : ""}`} onClick={() => {
            setSourceType("customer");
            handleCustomerClear();
            handleLeadClear();
        }} style={{
            minHeight: 38,
            padding: "0.5rem 0.75rem",
            border: `1px solid ${sourceType === "customer"
                ? COLORS.orange
                : COLORS.border}`,
            borderRadius: 8,
            background: sourceType === "customer"
                ? "#fff8e6"
                : COLORS.white,
            color: sourceType === "customer"
                ? COLORS.orangeDark
                : COLORS.slate,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.75rem",
        }}>
              Customer
            </button>

            <button type="button" className={`crm-opportunity-source-tab ${sourceType === "lead" ? "is-active" : ""}`} onClick={() => {
            setSourceType("lead");
            handleCustomerClear();
            handleLeadClear();
        }} style={{
            minHeight: 38,
            padding: "0.5rem 0.75rem",
            border: `1px solid ${sourceType === "lead"
                ? COLORS.orange
                : COLORS.border}`,
            borderRadius: 8,
            background: sourceType === "lead"
                ? "#fff8e6"
                : COLORS.white,
            color: sourceType === "lead"
                ? COLORS.orangeDark
                : COLORS.slate,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.75rem",
        }}>
              Lead
            </button>
          </div>


          {sourceType === "customer" ? (<CustomerPicker label=" " selectedCustomerId={selectedCustomer?.id} selectedCustomerName={selectedCustomer?.company_name} onSelect={handleCustomerSelect} onClear={handleCustomerClear}/>) : (<LeadPicker label=" " selectedLeadId={selectedLead?.id} selectedLeadName={selectedLead?.company_name} onSelect={handleLeadSelect} onClear={handleLeadClear}/>)}
          <div style={{ marginTop: "0.9rem" }}>
            <label style={customLabelStyle}>PIC</label>
            <div className="crm-opportunity-pic-info" style={{ padding: "0.75rem", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.soft }}>
              <strong style={{ color: COLORS.navy, fontSize: "0.8rem" }}>
                {sourceType === "lead"
                  ? (selectedLead
                      ? (salesEmployees ?? []).find(employee => employee.employee_id === selectedLead.sales_employee_id)?.full_name
                        || (salesEmployees ?? []).find(employee => employee.user_id != null && employee.user_id === selectedLead.assigned_to)?.full_name
                        || selectedLead.pic || "Belum tersedia"
                      : "Pilih Lead dahulu")
                  : (selectedCustomer ? "Mengikuti Sales Owner Customer" : "Pilih Customer dahulu")}
              </strong>
              <p style={{ color: COLORS.slate, fontSize: 11, lineHeight: 1.5, margin: "4px 0 0" }}>
                Tidak perlu memilih Sales lagi. Backend mengambil Employee Sales dari Lead atau Customer dan mengecek status serta jabatan HR.
              </p>
            </div>
          </div>
        </div>


        {/* NILAI & TARGET */}
        <div className="crm-opportunity-form-section">
          <div className="crm-opportunity-form-section__title">
            <span className="crm-opportunity-form-section__icon" style={{ background: "#fffbeb", color: "#d97706", borderColor: "#f9e7b9" }}><CircleDollarSign size={19}/></span><span className="crm-opportunity-form-section__heading"><strong>Nilai & Target</strong><small>Estimasi nilai, probabilitas, dan tanggal penutupan peluang.</small></span><span className="crm-opportunity-form-section__number">03</span>
          </div>

          <div style={{
            marginBottom: "0.9rem",
        }}>
            <label style={customLabelStyle}>
              Estimasi Nilai (Rp)
            </label>

            <CurrencyInput value={form.estimated_value ?? 0} onChange={(v) => setForm({
            ...form,
            estimated_value: v > 0 ? v : undefined,
        })}/>
          </div>


          <div className="crm-opportunity-form-two-col">
            <div>
              <label style={customLabelStyle}>
                Probabilitas (%)
              </label>

              <input className="input" type="number" min={0} max={100} value={form.probability_pct} onChange={(e) => setForm({
            ...form,
            probability_pct: Number(e.target.value),
        })} style={{
            width: "100%",
            height: 38,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            color: COLORS.navy,
            fontSize: "0.75rem",
        }}/>
            </div>


            <InputField label="Target Close Date" type="date" value={form.expected_close_date} onChange={(e) => setForm({
            ...form,
            expected_close_date: e.target.value,
        })}/>
          </div>
        </div>


        {/* CATATAN */}
        <div className="crm-opportunity-form-section">
          <div className="crm-opportunity-form-section__title">
            <span className="crm-opportunity-form-section__icon" style={{ background: "#f5f3ff", color: "#7c3aed", borderColor: "#e9e2ff" }}><StickyNote size={19}/></span><span className="crm-opportunity-form-section__heading"><strong>Catatan</strong><small>Informasi pendukung untuk tindak lanjut tim penjualan.</small></span><span className="crm-opportunity-form-section__number">04</span>
          </div>

          <textarea className="input crm-opportunity-form-notes" rows={3} value={form.notes} onChange={(e) => setForm({
            ...form,
            notes: e.target.value,
        })} placeholder="Tambahkan catatan jika diperlukan..." style={{
            width: "100%",
            minHeight: 86,
            resize: "vertical",
            padding: "0.65rem 0.75rem",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            color: COLORS.navy,
            fontSize: "0.75rem",
            lineHeight: 1.5,
        }}/>
        </div>


        {/* ERROR */}
        {error && (<div className="crm-opportunity-form-error" style={{
                padding: "0.65rem 0.8rem",
                border: "1px solid #fecaca",
                borderRadius: 8,
                background: "#fef2f2",
                color: COLORS.red,
                fontSize: "0.72rem",
                fontWeight: 600,
            }}>
            {error}
          </div>)}


        {/* ACTIONS */}
        <div className="crm-opportunity-form-actions">
          <Button type="button" variant="secondary" onClick={onClose} style={{
            minWidth: 88,
            height: 36,
            borderRadius: 8,
            fontSize: "0.75rem",
            fontWeight: 700,
        }}>
            Batal
          </Button>

          <Button type="submit" disabled={create.isPending} style={{
            minWidth: 140,
            height: 36,
            borderRadius: 8,
            border: "none",
            background: COLORS.orange,
            color: COLORS.white,
            fontSize: "0.75rem",
            fontWeight: 700,
        }}>
            {create.isPending
            ? "Menyimpan..."
            : "Buat Opportunity"}
          </Button>
        </div>
      </form>


      {/* NUMBER SEQUENCE */}
      {seqError && (<NumberSequenceSetupModal moduleCode={seqError.module_code} suggestedPrefix={seqError.suggested_prefix} suggestedFormat={seqError.suggested_format} lockModuleCode onClose={() => setSeqError(null)} onCreated={() => {
                setSeqError(null);
                                create
                    .mutateAsync(buildPayload())
                    .then((createdOpportunity) => {
                        if (onCreated) {
                            onCreated(createdOpportunity);
                        } else {
                            onClose();
                        }
                    })
                    .catch((err) => setError(extractErrorMessage(err)));
            }}/>)}
      </div>
    </div>);
}