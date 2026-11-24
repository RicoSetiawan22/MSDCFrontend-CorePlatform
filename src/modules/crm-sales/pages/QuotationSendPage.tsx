import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Bell, CheckCircle2, FileCheck2, Info, Mail, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { ErrorState } from "@shared/components/ErrorState";
import { apiClient } from "@shared/lib/api-client";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { extractErrorMessage } from "@shared/types/api";
import { quotationApi } from "../api/quotationApi";
import { useQuotation, useUpdateQuotationStatus } from "../api/useQuotations";

type Channel = "email" | "whatsapp" | "in_app";

const CHANNELS = [
  { key: "email", label: "Email", icon: Mail, color: "#1d4ed8", bg: "#eff6ff", hint: "Kirim quotation sebagai lampiran PDF ke email customer.", placeholder: "customer@perusahaan.co.id" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "#16a34a", bg: "#f0fdf4", hint: "Kirim notifikasi melalui WhatsApp ke nomor customer.", placeholder: "08xxxxxxxxxx" },
  { key: "in_app", label: "In-App", icon: Bell, color: "#7c3aed", bg: "#f5f3ff", hint: "Kirim notifikasi in-app ke user terkait.", placeholder: "Diisi otomatis oleh sistem" },
] as const;

const QUOTATION_SEND_STYLES = `
.crm-quotation-send {
  min-height:100%; padding-bottom:38px;
  background:#f5f7fb; color:#102b4b;
}
.crm-quotation-send * { box-sizing:border-box; }
.crm-quotation-send .quotation-send-content {
  width:100%; padding:12px clamp(16px,2.2vw,32px) 40px;
}
.crm-quotation-send .quotation-send-inner {
  width:100%; max-width:1600px; margin:0 auto;
  display:flex; flex-direction:column; gap:18px;
}
.crm-quotation-send button { font:inherit; }
.crm-quotation-send button:focus-visible,
.crm-quotation-send input:focus-visible,
.crm-quotation-send textarea:focus-visible {
  outline:3px solid rgba(247,171,0,.34);
  outline-offset:3px;
}
.crm-quotation-send .quotation-send-nav {
  display:flex; align-items:center; justify-content:space-between;
  flex-wrap:wrap; gap:12px;
}
.crm-quotation-send .quotation-send-back {
  min-height:46px; display:inline-flex; align-items:center; justify-content:center;
  gap:11px; padding:0 19px;
  border:1px solid #f7d17b; border-radius:14px;
  background:linear-gradient(180deg,#fff9e9 0%,#fff2d4 100%);
  color:#9a6200; font-size:13px; font-weight:800; cursor:pointer;
  box-shadow:0 4px 11px rgba(180,117,0,.045);
  transition:background .18s ease,border-color .18s ease,transform .18s ease,box-shadow .18s ease;
}
.crm-quotation-send .quotation-send-back:hover {
  transform:translateY(-1px); border-color:#ecbd50;
  background:#fff0c4; box-shadow:0 7px 16px rgba(180,117,0,.11);
}
.crm-quotation-send .quotation-send-eyebrow {
  display:inline-flex; align-items:center; gap:7px;
  padding:9px 13px; border:1px solid #e2e9f2;
  border-radius:999px; background:#fff;
  color:#7890aa; font-size:11px; font-weight:750;
}
.crm-quotation-send .quotation-send-hero {
  display:flex; align-items:center; justify-content:space-between; gap:20px;
  padding:23px 26px; border:1px solid #e4ebf5; border-radius:20px;
  background:linear-gradient(105deg,#f6faff 0%,#fff 63%,#fff8e9 100%);
  box-shadow:0 7px 23px rgba(9,39,71,.045);
}
.crm-quotation-send .quotation-send-hero__main { display:flex; align-items:center; gap:17px; min-width:0; }
.crm-quotation-send .quotation-send-iconbox {
  display:inline-flex; flex:0 0 58px; width:58px; height:58px;
  align-items:center; justify-content:center;
  border:1px solid #f7dda3; border-radius:17px;
  background:#fff0c6; color:#b97800;
}
.crm-quotation-send .quotation-send-hero h1 {
  margin:0 0 7px; color:#0a2849; font-size:clamp(18px,1.6vw,23px);
  font-weight:850; letter-spacing:-.025em;
}
.crm-quotation-send .quotation-send-hero p {
  margin:0; color:#788da8; font-size:13px; line-height:1.55;
}
.crm-quotation-send .quotation-send-hero__meta {
  flex:0 0 auto; display:flex; flex-direction:column; align-items:flex-end; gap:7px;
  max-width:100%; padding:13px 16px;
  border:1px solid #ebeff5; border-radius:12px; background:rgba(255,255,255,.8);
}
.crm-quotation-send .quotation-send-hero__meta span {
  color:#91a2b5; font-size:10px; font-weight:800; letter-spacing:.055em; text-transform:uppercase;
}
.crm-quotation-send .quotation-send-hero__meta strong {
  color:#0a2849; font-size:13px; overflow-wrap:anywhere;
}
.crm-quotation-send .quotation-send-panel {
  overflow:hidden; border:1px solid #e2eaf3; border-radius:19px;
  background:#fff; box-shadow:0 5px 18px rgba(15,39,71,.04);
}
.crm-quotation-send .quotation-send-panel__head {
  display:flex; align-items:center; gap:13px;
  padding:19px 23px; border-bottom:1px solid #edf1f7;
  background:linear-gradient(110deg,#f8fbff 0%,#fff 67%,#fffbf3 100%);
}
.crm-quotation-send .quotation-send-panel__icon {
  flex:0 0 43px; display:flex; align-items:center; justify-content:center;
  width:43px; height:43px; border-radius:13px;
  border:1px solid #dbe9fa; background:#ecf4ff; color:#3268a4;
}
.crm-quotation-send .quotation-send-panel__icon--gold {
  background:#fff6df; border-color:#fbe3a8; color:#c58200;
}
.crm-quotation-send .quotation-send-panel__text { flex:1; min-width:0; }
.crm-quotation-send .quotation-send-panel__text h2 { margin:0; font-size:15px; font-weight:850; color:#0b2b4c; }
.crm-quotation-send .quotation-send-panel__text p { margin:5px 0 0; font-size:12px; color:#8195af; line-height:1.5; }
.crm-quotation-send .quotation-send-step {
  padding:6px 10px; border:1px solid #f9dba0; background:#fff8e8;
  border-radius:11px; color:#ae7200; font-size:12px; font-weight:850;
}
.crm-quotation-send .quotation-send-panel__body { padding:22px 23px 24px; }
.crm-quotation-send .quotation-channel-grid {
  display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px;
}
.crm-quotation-send .quotation-channel-button {
  position:relative; display:flex; align-items:center; gap:12px;
  min-height:76px; padding:15px 16px;
  border:1px solid #e1e8f1; border-radius:15px;
  color:#576f8b; background:#fff; font-size:13px; font-weight:800;
  text-align:left; cursor:pointer; transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background .18s ease;
}
.crm-quotation-send .quotation-channel-button:hover {
  transform:translateY(-1px); border-color:#f1c96a; background:#fffdf8;
  box-shadow:0 6px 17px rgba(15,39,71,.055);
}
.crm-quotation-send .quotation-channel-button.is-active {
  border:1.5px solid #f0b83d;
  color:#0e2d4f;
  background:linear-gradient(135deg,#fffdf7,#fff7df);
  box-shadow:0 0 0 3px rgba(247,171,0,.08);
}
.crm-quotation-send .quotation-channel-button__icon {
  display:flex; align-items:center; justify-content:center;
  flex:0 0 42px; width:42px; height:42px; border-radius:12px;
  background:#f5f8fc; color:#64748b;
}
.crm-quotation-send .quotation-channel-button__selection {
  margin-left:auto; color:#d59b19;
}
.crm-quotation-send .quotation-send-hint {
  display:flex; align-items:flex-start; gap:10px;
  padding:13px 15px; margin-top:16px; border:1px solid #e3ebf4;
  border-radius:12px; background:#f8fbff; color:#59728c;
  font-size:12px; line-height:1.6;
}
.crm-quotation-send .quotation-send-hint svg { flex:0 0 auto; margin-top:1px; color:#7091b4; }
.crm-quotation-send .quotation-send-pdf-note {
  display:flex; align-items:flex-start; gap:10px;
  padding:12px 15px; margin-top:10px;
  border:1px solid #dcefe6; border-radius:12px;
  background:#f2fbf6; color:#2f7656; font-size:12px; line-height:1.65;
}
.crm-quotation-send .quotation-send-pdf-note svg { flex:0 0 auto; margin-top:2px; }
.crm-quotation-send .quotation-send-label {
  display:block; margin-bottom:8px; color:#485f79; font-size:12px; font-weight:750;
}
.crm-quotation-send .quotation-send-input {
  display:block; width:100%; min-height:48px;
  padding:12px 14px; background:#fff; border:1px solid #dae4ef;
  border-radius:11px; color:#152c47; font:inherit; font-size:13px;
  transition:border-color .18s ease,box-shadow .18s ease;
}
.crm-quotation-send .quotation-send-input::placeholder { color:#97a8bc; }
.crm-quotation-send .quotation-send-input:focus {
  border-color:#efb43b; outline:none; box-shadow:0 0 0 4px rgba(247,171,0,.12);
}
.crm-quotation-send textarea.quotation-send-input {
  min-height:180px; resize:vertical; line-height:1.7;
}
.crm-quotation-send .quotation-send-field + .quotation-send-field { margin-top:22px; }
.crm-quotation-send .quotation-send-inapp {
  margin:0; padding:14px 16px; border-radius:12px;
  background:#f8fafc; border:1px solid #edf2f7; color:#617992;
  font-size:12px; line-height:1.7;
}
.crm-quotation-send .quotation-send-error {
  padding:13px 16px; border:1px solid #fecaca;
  border-radius:12px; background:#fef2f2; color:#b91c1c; font-size:13px;
}
.crm-quotation-send .quotation-send-actions {
  display:flex; align-items:center; justify-content:flex-end; gap:11px;
  padding-top:2px;
}
.crm-quotation-send .quotation-send-action {
  display:inline-flex; min-height:46px; align-items:center; justify-content:center;
  gap:9px; padding:0 20px; border-radius:12px; font-size:13px;
  font-weight:800; cursor:pointer;
  transition:transform .18s ease,box-shadow .18s ease,background .18s ease;
}
.crm-quotation-send .quotation-send-action:hover:not(:disabled) {
  transform:translateY(-1px);
}
.crm-quotation-send .quotation-send-action:disabled { opacity:.55; cursor:not-allowed; }
.crm-quotation-send .quotation-send-action--secondary {
  border:1px solid #dbe4ee; background:#fff; color:#556b84;
}
.crm-quotation-send .quotation-send-action--secondary:hover:not(:disabled) {
  background:#f8fafc; box-shadow:0 4px 12px rgba(15,39,71,.07);
}
.crm-quotation-send .quotation-send-action--primary {
  border:1px solid #eba400; background:#f7ab00; color:#092747;
  box-shadow:0 5px 13px rgba(247,171,0,.16);
}
.crm-quotation-send .quotation-send-action--primary:hover:not(:disabled) {
  background:#efaa08; box-shadow:0 7px 18px rgba(247,171,0,.24);
}
.crm-quotation-send .quotation-send-success {
  display:flex; flex-direction:column; align-items:center; text-align:center;
  gap:11px; padding:36px 24px;
}
.crm-quotation-send .quotation-send-success__icon {
  display:flex; align-items:center; justify-content:center;
  width:62px; height:62px; border-radius:18px;
  background:#eafbf1; border:1px solid #c3efd7; color:#119452;
}
.crm-quotation-send .quotation-send-success h2 { margin:0; color:#0b2b4c; font-size:18px; }
.crm-quotation-send .quotation-send-success p { margin:0 0 9px; font-size:13px; color:#6d849e; }
@media (max-width:800px) {
  .crm-quotation-send .quotation-send-hero { align-items:flex-start; flex-wrap:wrap; }
  .crm-quotation-send .quotation-send-hero__meta { align-items:flex-start; }
}
@media (max-width:670px) {
  .crm-quotation-send .quotation-send-content { padding:10px 16px 30px; }
  .crm-quotation-send .quotation-send-panel__body { padding:17px; }
  .crm-quotation-send .quotation-send-panel__head { padding:16px; }
  .crm-quotation-send .quotation-send-hero { padding:18px; }
  .crm-quotation-send .quotation-channel-grid { grid-template-columns:1fr; }
  .crm-quotation-send .quotation-channel-button { min-height:66px; }
  .crm-quotation-send .quotation-send-actions { flex-direction:column-reverse; }
  .crm-quotation-send .quotation-send-action { width:100%; }
  .crm-quotation-send .quotation-send-eyebrow { display:none; }
}
@media (prefers-reduced-motion:reduce) {
  .crm-quotation-send button { transition:none !important; }
  .crm-quotation-send button:hover { transform:none !important; }
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

export function QuotationSendPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const quotationId = Number(id);
  const validId = Number.isInteger(quotationId) && quotationId > 0;
  const { data: quotation, isLoading, isError, error: loadError } = useQuotation(validId ? quotationId : 0);
  const statusMutation = useUpdateQuotationStatus(validId ? quotationId : 0);
  const activeOrgId = useActiveOrgId();

  const [channel, setChannel] = useState<Channel>("email");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [statusWarning, setStatusWarning] = useState("");

  const back = () => navigate("/crm-sales/quotations");
  const selectedChannel = CHANNELS.find(item => item.key === channel)!;
  const quotationNumber = quotation?.quotation_number ?? "";
  const messageText = message ?? `Yth. Bapak/Ibu\n\nTerlampir quotation ${quotationNumber} untuk review dan persetujuan.\n\nMohon dapat diproses lebih lanjut.\n\n\nHormat kami`;

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!quotation || !validId) throw new Error("Quotation tidak ditemukan.");
      if (channel === "email") {
        await quotationApi.sendEmail(quotationId, activeOrgId, recipient.trim(), `Penawaran ${quotationNumber}`, messageText);
        return;
      }
      await apiClient.post("/v1/core-platform/notifications/send", {
        channel,
        recipient_type: channel === "whatsapp" ? "phone" : "in_app",
        recipient_ref: channel === "whatsapp" ? recipient.trim() : "",
        template_code: `quotation.${channel}`,
        module_code: "crm-sales",
        event_code: "quotation.sent",
        title: `Quotation ${quotationNumber}`,
        body: messageText,
        data: { quotation_id: quotationId, quotation_number: quotationNumber, customer_name: undefined },
      });
    },
    onSuccess: async () => {
      setSent(true);
      if (quotation?.status === "draft" || quotation?.status === "approved") {
        try {
          await statusMutation.mutateAsync("sent");
        } catch (err) {
          setStatusWarning(`Notifikasi terkirim, tetapi status quotation gagal diperbarui: ${extractErrorMessage(err)}`);
        }
      }
    },
    onError: (err: unknown) => setSendError(extractErrorMessage(err)),
  });

  if (!validId) return <ErrorState message="ID quotation tidak valid." />;
  if (isLoading) return <LoadingState label="Memuat quotation..." />;
  if (isError) return <ErrorState message={extractErrorMessage(loadError)} />;
  if (!quotation) return <ErrorState message="Quotation tidak ditemukan." />;

  return (
    <div className="crm-quotation-send">
      <style>{QUOTATION_SEND_STYLES}</style>
      <PageHeader
        title="Quotation"
        subtitle="Pipeline penjualan dan penawaran harga ke customer."
        containerClassName="px-7 pt-5 pb-2"
      />
      <main className="quotation-send-content">
        <div className="quotation-send-inner">
          <div className="quotation-send-nav">
            <button type="button" onClick={back} className="quotation-send-back crm-msdc-back-button">
              <ArrowLeft size={17} strokeWidth={2.1} />
              Kembali ke daftar Quotation
            </button>
            <span className="quotation-send-eyebrow"><FileCheck2 size={14} /> Form Pengiriman Quotation</span>
          </div>

          <section className="quotation-send-hero" aria-labelledby="quotation-send-title">
            <div className="quotation-send-hero__main">
              <span className="quotation-send-iconbox"><Send size={26} strokeWidth={1.9} /></span>
              <div>
                <h1 id="quotation-send-title">{sent ? "Quotation Berhasil Dikirim" : "Kirim Quotation"}</h1>
                <p>{sent ? "Informasi pengiriman berhasil diproses." : "Tentukan metode pengiriman dan lengkapi pesan untuk pelanggan."}</p>
              </div>
            </div>
            <div className="quotation-send-hero__meta">
              <span>Nomor Quotation</span>
              <strong>{quotationNumber}</strong>
            </div>
          </section>

          {sent ? (
            <section className="quotation-send-panel" aria-live="polite">
              <div className="quotation-send-success">
                <span className="quotation-send-success__icon"><CheckCircle2 size={31} /></span>
                <h2>Berhasil dikirim via {selectedChannel.label}</h2>
                <p>Quotation {quotationNumber} telah diproses melalui kanal yang dipilih.</p>
                {statusWarning && <div className="quotation-send-error" role="alert">{statusWarning}</div>}
                <button type="button" onClick={back} className="quotation-send-action quotation-send-action--primary crm-msdc-back-button">
                  <ArrowLeft size={16} /> Kembali ke Quotation
                </button>
              </div>
            </section>
          ) : (
            <>
              <section className="quotation-send-panel" aria-labelledby="quotation-send-method-title">
                <div className="quotation-send-panel__head">
                  <span className="quotation-send-panel__icon quotation-send-panel__icon--gold"><Send size={20} /></span>
                  <div className="quotation-send-panel__text">
                    <h2 id="quotation-send-method-title">Pilih Metode Pengiriman</h2>
                    <p>Pilih satu kanal untuk mengirim penawaran kepada pelanggan.</p>
                  </div>
                  <span className="quotation-send-step">01</span>
                </div>
                <div className="quotation-send-panel__body">
                  <div className="quotation-channel-grid" role="group" aria-label="Metode pengiriman">
                    {CHANNELS.map(item => (
                      <button
                        key={item.key}
                        type="button"
                        aria-pressed={channel === item.key}
                        className={`quotation-channel-button${channel === item.key ? " is-active" : ""}`}
                        onClick={() => { setChannel(item.key); setRecipient(""); setSendError(null); }}
                      >
                        <span className="quotation-channel-button__icon" style={{ color: item.color, background: item.bg }}>
                          <item.icon size={21} />
                        </span>
                        <span>{item.label}</span>
                        {channel === item.key && <CheckCircle2 className="quotation-channel-button__selection" size={19} />}
                      </button>
                    ))}
                  </div>
                  <div className="quotation-send-hint"><Info size={17} /><span>{selectedChannel.hint}</span></div>
                  {channel === "email" && (
                    <div className="quotation-send-pdf-note">
                      <ShieldCheck size={18} />
                      <span>Lampiran email menggunakan PDF resmi backend dengan TTD dan QR sesuai status persetujuan.</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="quotation-send-panel" aria-labelledby="quotation-send-info-title">
                <div className="quotation-send-panel__head">
                  <span className="quotation-send-panel__icon"><Mail size={20} /></span>
                  <div className="quotation-send-panel__text">
                    <h2 id="quotation-send-info-title">Informasi Pengiriman</h2>
                    <p>Periksa penerima dan isi pesan sebelum mengirim quotation.</p>
                  </div>
                  <span className="quotation-send-step">02</span>
                </div>
                <div className="quotation-send-panel__body">
                  {channel !== "in_app" ? (
                    <div className="quotation-send-field">
                      <label className="quotation-send-label" htmlFor="quotation-send-recipient">
                        {channel === "email" ? "Alamat Email" : "Nomor WhatsApp"} <span aria-hidden="true">*</span>
                      </label>
                      <input
                        id="quotation-send-recipient"
                        className="quotation-send-input"
                        type={channel === "email" ? "email" : "tel"}
                        value={recipient}
                        onChange={event => setRecipient(event.target.value)}
                        placeholder={selectedChannel.placeholder}
                      />
                    </div>
                  ) : (
                    <div className="quotation-send-field quotation-send-inapp">
                      Penerima In-App akan ditentukan oleh sistem sesuai konfigurasi yang sudah ada.
                    </div>
                  )}
                  <div className="quotation-send-field">
                    <label className="quotation-send-label" htmlFor="quotation-send-message">Pesan</label>
                    <textarea
                      id="quotation-send-message"
                      className="quotation-send-input"
                      rows={8}
                      value={messageText}
                      onChange={event => setMessage(event.target.value)}
                    />
                  </div>
                </div>
              </section>

              {sendError && <div className="quotation-send-error" role="alert">{sendError}</div>}
              <div className="quotation-send-actions">
                <button
                  type="button"
                  onClick={back}
                  disabled={sendMutation.isPending}
                  className="quotation-send-action quotation-send-action--secondary"
                >Batal</button>
                <button
                  type="button"
                  onClick={() => { setSendError(null); sendMutation.mutate(); }}
                  disabled={sendMutation.isPending || (channel !== "in_app" && !recipient.trim())}
                  className="quotation-send-action quotation-send-action--primary"
                >
                  <Send size={17} />
                  {sendMutation.isPending ? "Mengirim..." : `Kirim via ${selectedChannel.label}`}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
