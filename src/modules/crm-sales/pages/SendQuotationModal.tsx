import { useState } from "react";
import { Mail, MessageCircle, Bell, Send } from "lucide-react";
import { apiClient } from "@shared/lib/api-client";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { quotationApi } from "../api/quotationApi";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@shared/components/Button";
import { CrmModalShell } from "./CreateContractFromQuotationModal";

type Channel = "email" | "whatsapp" | "in_app";

const CHANNELS: { key: Channel; label: string; icon: typeof Mail; color: string; bg: string; placeholder: string; hint: string }[] = [
  {
    key: "email",
    label: "Email",
    icon: Mail,
    color: "#1d4ed8",
    bg: "#eff6ff",
    placeholder: "customer@perusahaan.co.id",
    hint: "Kirim quotation sebagai lampiran PDF ke email customer.",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    color: "#16a34a",
    bg: "#f0fdf4",
    placeholder: "08xxxxxxxxxx",
    hint: "Kirim notification via WhatsApp ke nomor customer.",
  },
  {
    key: "in_app",
    label: "In-App",
    icon: Bell,
    color: "#7c3aed",
    bg: "#f5f3ff",
    placeholder: "diisi otomatis dari customer",
    hint: "Kirim notifikasi in-app ke user terkait.",
  },
];

interface Props {
  quotationId: number;
  quotationNumber: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  onClose: () => void;
  onSent: () => void;
}

export function SendQuotationModal({ quotationId, quotationNumber, customerEmail, customerPhone, customerName, onClose, onSent }: Props) {
  const activeOrgId = useActiveOrgId();
  const [channel, setChannel] = useState<Channel>("email");
  const [recipient, setRecipient] = useState(
    channel === "email" ? (customerEmail ?? "") :
    channel === "whatsapp" ? (customerPhone ?? "") : ""
  );
  const [message, setMessage] = useState(
    `Yth. ${customerName ?? "Bapak/Ibu"}\n\nTerlampir quotation ${quotationNumber} untuk review dan persetujuan.\n\nMohon dapat diproses lebih lanjut.\n\n\nHormat kami`
  );
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const ch = channel;

      // Email SENGAJA lewat endpoint khusus Quotation (bukan notifications/send
      // generik) - itu yang benar-benar generate PDF Penawaran di server lalu
      // lampirkan ke email (lihat QuotationController::sendEmail()). Endpoint
      // generik cuma kirim teks polos, tidak pernah bisa lampirkan file.
      if (ch === "email") {
        const email = recipient || customerEmail || "";
        await quotationApi.sendEmail(quotationId, activeOrgId, email, `Penawaran ${quotationNumber}`, message);
        return;
      }

      let recipientType: string;
      let recipientRef: string;

      if (ch === "whatsapp") {
        recipientType = "phone";
        recipientRef = recipient || customerPhone || "";
      } else {
        recipientType = "in_app";
        recipientRef = "";
      }

      await apiClient.post("/v1/core-platform/notifications/send", {
        channel: ch,
        recipient_type: recipientType,
        recipient_ref: recipientRef,
        template_code: `quotation.${ch}`,
        module_code: "crm-sales",
        event_code: "quotation.sent",
        title: `Quotation ${quotationNumber}`,
        body: message,
        data: {
          quotation_id: quotationId,
          quotation_number: quotationNumber,
          customer_name: customerName,
        },
      });
    },
    onSuccess: () => {
      setSent(true);
      onSent();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Gagal mengirim. Coba lagi.");
    },
  });

  const activeChannel = CHANNELS.find(c => c.key === channel)!;

  if (sent) {
    return (
      <CrmModalShell title="Terkirim" onClose={onClose} maxWidth={400}>
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Send size={28} color="#16a34a" />
          </div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.4rem" }}>Quotation {quotationNumber}</div>
          <div style={{ fontSize: "0.875rem", color: "var(--grey)", marginBottom: "1.5rem" }}>
            Berhasil dikirim via <strong>{activeChannel.label}</strong>
          </div>
          <Button variant="secondary" onClick={onClose}>Tutup</Button>
        </div>
      </CrmModalShell>
    );
  }

  return (
    <CrmModalShell title={`Kirim Quotation ${quotationNumber}`} onClose={onClose} maxWidth={520}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Channel selector */}
        <div>
          <label className="input-label" style={{ marginBottom: "0.5rem", display: "block" }}>Pilih Channel</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
            {CHANNELS.map((ch) => (
              <button
                key={ch.key}
                type="button"
                onClick={() => {
                  setChannel(ch.key);
                  setRecipient(ch.key === "email" ? (customerEmail ?? "") : ch.key === "whatsapp" ? (customerPhone ?? "") : "");
                }}
                style={{
                  padding: "0.75rem",
                  border: `2px solid ${channel === ch.key ? ch.color : "var(--border)"}`,
                  borderRadius: 10,
                  background: channel === ch.key ? ch.bg : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <ch.icon size={20} color={channel === ch.key ? ch.color : "var(--grey)"} />
                <span style={{ fontSize: "0.82rem", fontWeight: channel === ch.key ? 700 : 400, color: channel === ch.key ? ch.color : "var(--grey)" }}>
                  {ch.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Channel info */}
        <div style={{ background: activeChannel.bg, borderRadius: 8, padding: "0.75rem", fontSize: "0.82rem", color: activeChannel.color }}>
          💡 {activeChannel.hint}
        </div>

        {/* Keterangan lampiran email sementara */}
        {channel === "email" && (
          <div style={{ background: "#fffbeb", borderRadius: 8, padding: "0.75rem", fontSize: "0.78rem", color: "#92400e" }}>
            ℹ️ Lampiran email saat ini dibuat otomatis oleh backend, sehingga desainnya mungkin berbeda dari pratinjau PDF Quotation. Penyamaan desain dan integrasi QR approval masih dalam proses.
          </div>
        )}

        {/* Recipient */}
        <div>
          <label className="input-label" style={{ marginBottom: "0.4rem", display: "block" }}>
            {channel === "email" ? "Alamat Email" : channel === "whatsapp" ? "Nomor WhatsApp" : "Penerima In-App"}
          </label>
          <input
            className="input"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            placeholder={activeChannel.placeholder}
            style={{ width: "100%" }}
          />
        </div>

        {/* Message */}
        <div>
          <label className="input-label" style={{ marginBottom: "0.4rem", display: "block" }}>Pesan</label>
          <textarea
            className="input"
            rows={6}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Tulis pesan..."
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>

        {error && <div className="input-error">{error}</div>}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || !recipient}
            style={{ flex: 1, background: activeChannel.color, borderColor: activeChannel.color }}
          >
            {sendMutation.isPending ? "Mengirim..." : `Kirim via ${activeChannel.label}`}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
        </div>
      </div>
    </CrmModalShell>
  );
}
