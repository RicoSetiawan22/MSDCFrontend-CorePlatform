
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLead, useConvertLead } from "../api/useLeads";
import { useAssignQuotationCustomer } from "../api/useQuotations";
import { customerApi } from "../api/customerApi";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { CrmModalShell } from "./CreateContractFromQuotationModal";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";

export function AssignCustomerModal({
  quotationId,
  quotationNumber,
  leadId,
  onClose,
}: {
  quotationId: number;
  quotationNumber: string;
  leadId: number | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  const { data: lead, isLoading: loadingLead } = useLead(
    leadId ?? undefined
  );

  const convertMutation = useConvertLead(leadId ?? 0);
  const assignMutation = useAssignQuotationCustomer(quotationId);

  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function openCustomer(customerId: number) {
    navigate(`/crm-sales/customers?edit_customer=${customerId}&return_to=quotations`);
  }

  async function handleConvertLead() {
    if (busy) return;

    setError(null);
    setBusy(true);

    try {
      const result = (await convertMutation.mutateAsync()) as unknown as {
        data: { id: number };
      };

      const customerId = result.data.id;

      await assignMutation.mutateAsync(customerId);

      openCustomer(customerId);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateCustomer(event: FormEvent) {
    event.preventDefault();

    if (busy || !companyName.trim()) return;

    setError(null);
    setBusy(true);

    try {
      const response = await customerApi.create({
        company_name: companyName.trim(),
      });

      const customer = response.data.data;

      await assignMutation.mutateAsync(customer.id);

      openCustomer(customer.id);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <CrmModalShell
      title="Jadikan Customer Baru"
      onClose={onClose}
      maxWidth={900}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            background: "#fff",
            padding: "22px 24px",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#16213d",
              marginBottom: 12,
            }}
          >
            Informasi Customer
          </div>

          <p
            style={{
              color: "#64748b",
              fontSize: 13,
              lineHeight: 1.65,
              margin: "0 0 18px",
            }}
          >
            Quotation{" "}
            <strong style={{ fontFamily: "monospace" }}>
              {quotationNumber}
            </strong>{" "}
            belum tertaut ke Customer terdaftar.
            Setelah Customer berhasil dibuat, halaman
            Customer akan terbuka untuk melengkapi data pelanggan.
          </p>

          {leadId ? (
            loadingLead ? (
              <LoadingState />
            ) : (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 9,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    color: "#64748b",
                    marginBottom: 4,
                  }}
                >
                  Dari Lead
                </div>

                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#16213d",
                  }}
                >
                  {lead?.company_name ?? "—"}
                </div>
              </div>
            )
          ) : (
            <form
              id="crm-customer-from-quotation"
              onSubmit={handleCreateCustomer}
            >
              <InputField
                label="Nama Perusahaan *"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Contoh: PT Maju Sejahtera"
              />
            </form>
          )}

          {error && (
            <div
              className="input-error"
              role="alert"
              style={{ marginTop: 12 }}
            >
              {error}
            </div>
          )}
        </section>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={busy}
            style={{ minWidth: 96, height: 40 }}
          >
            Batal
          </Button>

          {leadId ? (
            <Button
              onClick={handleConvertLead}
              disabled={busy || loadingLead}
              style={{
                minWidth: 240,
                height: 40,
                background: "#f7ab00",
                color: "#fff",
                border: "none",
              }}
            >
              {busy
                ? "Memproses..."
                : "Convert Lead → Customer"}
            </Button>
          ) : (
            <Button
              type="submit"
              form="crm-customer-from-quotation"
              disabled={busy || !companyName.trim()}
              style={{
                minWidth: 240,
                height: 40,
                background: "#f7ab00",
                color: "#fff",
                border: "none",
              }}
            >
              {busy
                ? "Memproses..."
                : "Buat Customer → Customer"}
            </Button>
          )}
        </div>
      </div>
    </CrmModalShell>
  );
}
