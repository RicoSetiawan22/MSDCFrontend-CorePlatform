
import { useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, AlertTriangle, Lock, Trash2, ArrowLeft } from "lucide-react";
import { useContract } from "../api/useContracts";
import {
  useContractSlas,
  useCreateSla,
  useReportSlaBreach,
  useUpdateSlaBreachStatus,
  useSlaTemplates,
  useCreateSlaTemplate,
  useDeleteSlaTemplate,
} from "../api/useSla";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type {
  Sla,
  SlaBreachStatus,
  SlaBreachType,
  SlaCompensationType,
} from "../types/sla";
import type { ContractStatus } from "../types/contract";

const CONTRACT_SLA_STYLES = `
.crm-contract-sla-page,.crm-contract-sla-create-page { min-height:100%; background:#f5f7fa !important; color:#16213d; }
.crm-contract-sla-page .content-card,.crm-contract-sla-create-page form,.crm-contract-sla-create-page .crm-sla-create-panel { border:1px solid #e2e8f0 !important; border-radius:16px !important; background:#fff !important; box-shadow:0 4px 18px rgba(15,23,42,.045); }
.crm-contract-sla-page .toolbar { display:flex; align-items:center; gap:12px; padding:16px 20px !important; border-bottom:1px solid #edf1f5; }
.crm-contract-sla-page .crm-contract-sla-card { padding:17px 18px !important; border:1px solid #e2e8f0 !important; border-radius:14px !important; background:linear-gradient(180deg,#fff 0%,#fcfdff 100%); box-shadow:0 2px 8px rgba(15,23,42,.04); transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease; }
.crm-contract-sla-page .crm-contract-sla-card:hover { transform:translateY(-2px); border-color:#cbd5e1 !important; box-shadow:0 9px 20px rgba(15,23,42,.07); }
.crm-contract-sla-page table { width:100%; border-collapse:separate !important; border-spacing:0; }
.crm-contract-sla-page thead th { padding:12px !important; background:#f8fafc !important; border-bottom:1px solid #e2e8f0 !important; color:#64748b !important; font-size:10px !important; font-weight:800 !important; }
.crm-contract-sla-page tbody td { padding:11px 12px !important; border-bottom:1px solid #edf1f5 !important; font-size:12px !important; }
.crm-contract-sla-page tbody tr:hover td { background:#f8fafc; }
.crm-contract-sla-page input,.crm-contract-sla-page select,.crm-contract-sla-page textarea,.crm-contract-sla-create-page input,.crm-contract-sla-create-page select,.crm-contract-sla-create-page textarea { border-color:#dbe3ec !important; border-radius:10px !important; }
.crm-contract-sla-page input:focus,.crm-contract-sla-page select:focus,.crm-contract-sla-page textarea:focus,.crm-contract-sla-create-page input:focus,.crm-contract-sla-create-page select:focus,.crm-contract-sla-create-page textarea:focus { border-color:#e4a008 !important; box-shadow:0 0 0 3px rgba(240,168,0,.12) !important; outline:none !important; }
.crm-contract-sla-page button,.crm-contract-sla-create-page button { border-radius:10px !important; transition:transform .16s ease,box-shadow .16s ease; }
.crm-contract-sla-page button:hover:not(:disabled),.crm-contract-sla-create-page button:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 12px rgba(15,39,71,.09); }
.crm-contract-sla-page button:focus-visible,.crm-contract-sla-create-page button:focus-visible,.crm-contract-sla-page a:focus-visible { outline:3px solid rgba(247,171,0,.35); outline-offset:2px; }
@media (max-width:760px) { .crm-contract-sla-page > div[style*='padding: 0 2rem'],.crm-contract-sla-create-page > div[style*='padding: 0 2rem'] { padding-left:16px !important; padding-right:16px !important; } .crm-contract-sla-page .crm-contract-sla-card { padding:14px !important; } }
@media (prefers-reduced-motion:reduce) { .crm-contract-sla-page .crm-contract-sla-card,.crm-contract-sla-page button,.crm-contract-sla-create-page button { transition:none !important; } .crm-contract-sla-page .crm-contract-sla-card:hover { transform:none; } }


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
.crm-contract-sla-create-page .crm-msdc-back-button {
  margin-bottom: 18px !important;
}
@media (max-width: 640px) {
  .crm-msdc-back-button.crm-msdc-back-button {
    min-height: 42px !important;
    gap: 8px !important;
    padding: 0 14px !important;
  }
}
`;

function isContractLocked(status: ContractStatus): boolean {
  return status !== "draft";
}

const COMPENSATION_LABELS: Record<SlaCompensationType, string> = {
  credit_pct: "Kredit % dari nilai bulanan",
  fixed_amount: "Nominal tetap",
  none: "Tanpa kompensasi",
};

const BREACH_STATUS_LABELS: Record<SlaBreachStatus, string> = {
  reported: "Dilaporkan",
  acknowledged: "Diakui",
  compensated: "Sudah Dikompensasi",
};

export function ContractSlaPage() {
  const params = useParams<{ id: string }>();
  const contractId = params.id ? Number(params.id) : undefined;
  const { data: contract } = useContract(contractId);
  const { data: slas, isLoading } = useContractSlas(contractId);
  const [showCreateSla, setShowCreateSla] = useState(false);
  const isLocked = !!contract && isContractLocked(contract.status);

  if (showCreateSla && contractId && !isLocked) {
    return (
      <CreateSlaPage
        contractId={contractId}
        contractNumber={contract?.contract_number ?? ""}
        onClose={() => setShowCreateSla(false)}
      />
    );
  }

  return (
    <div className="crm-contract-sla-page">
      <style>{CONTRACT_SLA_STYLES}</style>
      <PageHeader
        title="Kelola SLA"
        subtitle={contract ? contract.contract_number : "Memuat..."}
      />

      <div style={{ padding: "0 2rem 1rem" }}>
        <Link
          to={
            contractId
              ? `/crm-sales/contracts/${contractId}`
              : "/crm-sales/contracts"
          }
          className="crm-msdc-back-button"
        >
          <ArrowLeft size={17} aria-hidden="true" /> Kembali ke Contract
        </Link>
      </div>

      <div style={{ padding: "0 2rem 2rem" }}>
        {isLocked && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 8,
              padding: "0.6rem 0.8rem",
              fontSize: "0.85rem",
              color: "#92400e",
              marginBottom: "1rem",
            }}
          >
            <Lock size={15} />
            SLA sudah dikunci sejak Contract diajukan approval - tidak
            bisa ditambah/diubah lagi
            {(
              contract?.status === "pending_finance_approval" ||
              contract?.status === "pending_legal_approval" ||
              contract?.status === "sent_to_client"
            )
              ? " sampai disetujui/ditolak."
              : "."}
          </div>
        )}

        <div className="content-card" style={{ margin: 0 }}>
          <div className="toolbar">
            <div />
            <Button
              style={{ marginLeft: "auto" }}
              onClick={() => setShowCreateSla(true)}
              disabled={isLocked}
              title={
                isLocked
                  ? "Terkunci selama proses approval"
                  : undefined
              }
            >
              <Plus size={15} /> SLA Baru
            </Button>
          </div>

          {isLoading && <LoadingState />}

          {slas && slas.length === 0 && (
            <EmptyState
              title="Belum Ada SLA"
              subtitle="Definisikan SLA untuk kontrak ini — target uptime, response time, dan kompensasi."
            />
          )}

          {slas && slas.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                padding: "0 1.5rem 1.5rem",
              }}
            >
              {slas.map((sla) => (
                <SlaCard
                  key={sla.id}
                  sla={sla}
                  contractId={contractId!}
                  isLocked={isLocked}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SlaCard({
  sla,
  contractId,
  isLocked,
}: {
  sla: Sla;
  contractId: number;
  isLocked: boolean;
}) {
  const [showReportBreach, setShowReportBreach] = useState(false);
  const updateStatusMutation = useUpdateSlaBreachStatus(contractId);

  async function handleAdvanceStatus(
    breachId: number,
    current: SlaBreachStatus
  ) {
    const next: SlaBreachStatus =
      current === "reported" ? "acknowledged" : "compensated";

    try {
      await updateStatusMutation.mutateAsync({
        breachId,
        status: next,
      });
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  return (
    <div className="crm-contract-sla-card"
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "0.75rem",
        }}
      >
        <div>
          <div style={{ fontWeight: 700 }}>{sla.sla_name}</div>

          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--grey)",
            }}
          >
            Uptime {sla.uptime_target_pct}%
            {sla.response_time_minutes &&
              ` · Response ${sla.response_time_minutes} menit`}
            {sla.resolution_time_hours &&
              ` · Resolution ${sla.resolution_time_hours} jam`}
          </div>

          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--grey)",
              marginTop: "0.15rem",
            }}
          >
            Kompensasi: {COMPENSATION_LABELS[sla.compensation_type]}
            {sla.compensation_type !== "none" &&
              sla.compensation_value &&
              ` (${sla.compensation_type === "credit_pct"
                ? `${sla.compensation_value}%`
                : formatCurrency(sla.compensation_value)})`}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowReportBreach(true)}
          disabled={isLocked}
          title={
            isLocked
              ? "Terkunci selama proses approval"
              : undefined
          }
          style={{
            fontSize: "0.72rem",
            padding: "0.3rem 0.6rem",
            background: isLocked ? "#f3f4f6" : "#fff7ed",
            color: isLocked ? "#9ca3af" : "#c2410c",
            border: `1.5px solid ${
              isLocked ? "#e5e7eb" : "#fb923c"
            }`,
            borderRadius: 6,
            cursor: isLocked ? "not-allowed" : "pointer",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={13} />
          Laporkan Pelanggaran
        </button>
      </div>

      {(sla.breaches ?? []).length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.78rem",
            marginTop: "0.5rem",
          }}
        >
          <thead>
            <tr
              style={{
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {["Tanggal", "Tipe", "Deskripsi", "Kompensasi", "Status", ""].map(
                (heading, index) => (
                  <th
                    key={index}
                    style={{
                      textAlign: index === 3 ? "right" : "left",
                      padding: "0.3rem 0.4rem",
                      color: "var(--grey)",
                    }}
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {sla.breaches!.map((b) => (
              <tr key={b.id}>
                <td style={{ padding: "0.3rem 0.4rem" }}>
                  {formatDate(b.breach_date)}
                </td>
                <td
                  style={{
                    padding: "0.3rem 0.4rem",
                    textTransform: "capitalize",
                  }}
                >
                  {b.breach_type.replace(/_/g, " ")}
                </td>
                <td style={{ padding: "0.3rem 0.4rem" }}>
                  {b.description ?? "—"}
                </td>
                <td
                  style={{
                    padding: "0.3rem 0.4rem",
                    textAlign: "right",
                    fontFamily: "monospace",
                  }}
                >
                  {formatCurrency(b.compensation_amount)}
                </td>
                <td style={{ padding: "0.3rem 0.4rem" }}>
                  <span
                    className={`badge badge-${
                      b.status === "compensated" ? "active" : "inactive"
                    }`}
                    style={{ fontSize: "0.68rem" }}
                  >
                    {BREACH_STATUS_LABELS[b.status]}
                  </span>

                  {b.credit_invoice_id && (
                    <div style={{ marginTop: "0.2rem" }}>
                      <Link
                        to="/finance/ar-invoices"
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--accent)",
                        }}
                      >
                        Lihat credit note →
                      </Link>
                    </div>
                  )}
                </td>
                <td style={{ padding: "0.3rem 0.4rem" }}>
                  {b.status !== "compensated" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleAdvanceStatus(b.id, b.status)
                      }
                      disabled={
                        updateStatusMutation.isPending || isLocked
                      }
                      title={
                        isLocked
                          ? "Terkunci selama proses approval"
                          : undefined
                      }
                      style={{
                        fontSize: "0.7rem",
                        border: "none",
                        background: "none",
                        color: isLocked
                          ? "#9ca3af"
                          : "var(--accent)",
                        cursor: isLocked
                          ? "not-allowed"
                          : "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Tandai{" "}
                      {b.status === "reported"
                        ? "Diakui"
                        : "Dikompensasi"}{" "}
                      →
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showReportBreach && (
        <ReportBreachModal
          sla={sla}
          contractId={contractId}
          onClose={() => setShowReportBreach(false)}
        />
      )}
    </div>
  );
}

function CreateSlaPage({
  contractId,
  contractNumber,
  onClose,
}: {
  contractId: number;
  contractNumber: string;
  onClose: () => void;
}) {
  const createMutation = useCreateSla(contractId);
  const { data: templates } = useSlaTemplates();
  const createTemplateMutation = useCreateSlaTemplate();
  const deleteTemplateMutation = useDeleteSlaTemplate();

  const [source, setSource] = useState<"blank" | "template">("blank");
  const [templateId, setTemplateId] = useState<number | "">("");
  const [slaName, setSlaName] = useState("");
  const [uptimeTarget, setUptimeTarget] = useState(99.9);
  const [responseMinutes, setResponseMinutes] = useState<number | "">("");
  const [resolutionHours, setResolutionHours] = useState<number | "">("");
  const [compensationType, setCompensationType] =
    useState<SlaCompensationType>("none");
  const [compensationValue, setCompensationValue] =
    useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function applyTemplate(id: number | "") {
    setTemplateId(id);
    const tpl = (templates ?? []).find((t) => t.id === id);
    if (!tpl) return;

    setSlaName(tpl.template_name);
    setUptimeTarget(Number(tpl.uptime_target_pct));
    setResponseMinutes(tpl.response_time_minutes ?? "");
    setResolutionHours(tpl.resolution_time_hours ?? "");
    setCompensationType(tpl.compensation_type);
    setCompensationValue(
      tpl.compensation_value
        ? Number(tpl.compensation_value)
        : ""
    );
    setNotes(tpl.notes ?? "");
  }

  async function handleDeleteTemplate() {
    if (templateId === "") return;
    const tpl = (templates ?? []).find((t) => t.id === templateId);
    if (!tpl) return;

    if (
      !confirm(
        `Hapus template "${tpl.template_name}"? Tindakan ini tidak bisa dibatalkan.`
      )
    ) {
      return;
    }

    try {
      await deleteTemplateMutation.mutateAsync(tpl.id);
      setTemplateId("");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await createMutation.mutateAsync({
        sla_name: slaName,
        uptime_target_pct: uptimeTarget,
        response_time_minutes:
          responseMinutes === "" ? undefined : responseMinutes,
        resolution_time_hours:
          resolutionHours === "" ? undefined : resolutionHours,
        compensation_type: compensationType,
        compensation_value:
          compensationValue === "" ? undefined : compensationValue,
        notes: notes || undefined,
      });

      if (saveAsTemplate && newTemplateName.trim()) {
        try {
          await createTemplateMutation.mutateAsync({
            template_name: newTemplateName.trim(),
            uptime_target_pct: uptimeTarget,
            response_time_minutes:
              responseMinutes === "" ? undefined : responseMinutes,
            resolution_time_hours:
              resolutionHours === "" ? undefined : resolutionHours,
            compensation_type: compensationType,
            compensation_value:
              compensationValue === ""
                ? undefined
                : compensationValue,
            notes: notes || undefined,
          });
        } catch {
          // SLA tetap berhasil meskipun penyimpanan template gagal.
        }
      }

      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="crm-contract-sla-create-page" style={{ minHeight: "100%", background: "#f5f7fa" }}>
      <style>{CONTRACT_SLA_STYLES}</style>
      <PageHeader
        title="SLA Baru"
        subtitle={
          contractNumber
            ? `Pengaturan SLA untuk ${contractNumber}`
            : "Buat SLA untuk kontrak"
        }
        containerClassName="px-7 pt-5 pb-2"
      />

      <div style={{ padding: "0 2rem 3rem" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <button
            type="button"
            onClick={onClose}
            className="crm-msdc-back-button"
          >
            <ArrowLeft size={17} aria-hidden="true" /> Kembali ke Kelola SLA
          </button>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >

            <div style={{ padding: "24px 28px" }}>
              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSource("blank")}
                    style={{
                      flex: 1,
                      padding: "0.7rem",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 700,
                      border: `1.5px solid ${
                        source === "blank"
                          ? "#092747"
                          : "var(--border)"
                      }`,
                      background:
                        source === "blank"
                          ? "#092747"
                          : "transparent",
                      color:
                        source === "blank"
                          ? "#fff"
                          : "var(--text)",
                    }}
                  >
                    Buat Baru
                  </button>

                  <button
                    type="button"
                    onClick={() => setSource("template")}
                    style={{
                      flex: 1,
                      padding: "0.7rem",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 700,
                      border: `1.5px solid ${
                        source === "template"
                          ? "#092747"
                          : "var(--border)"
                      }`,
                      background:
                        source === "template"
                          ? "#092747"
                          : "transparent",
                      color:
                        source === "template"
                          ? "#fff"
                          : "var(--text)",
                    }}
                  >
                    Dari Template
                  </button>
                </div>

                {source === "template" && (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "flex-end",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label className="input-label">
                        Pilih Template
                      </label>
                      <select
                        className="input"
                        value={templateId}
                        onChange={(e) =>
                          applyTemplate(
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value)
                          )
                        }
                      >
                        <option value="">— Pilih template —</option>
                        {(templates ?? []).map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.template_name} (Uptime{" "}
                            {t.uptime_target_pct}%)
                          </option>
                        ))}
                      </select>
                    </div>

                    {templateId !== "" && (
                      <button
                        type="button"
                        title="Hapus template ini"
                        onClick={handleDeleteTemplate}
                        disabled={deleteTemplateMutation.isPending}
                        style={{
                          border: "1px solid var(--border)",
                          background: "#fff",
                          borderRadius: 8,
                          padding: "0.65rem",
                          cursor: "pointer",
                          color: "#dc2626",
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                )}

                <InputField
                  label="Nama SLA *"
                  required
                  value={slaName}
                  onChange={(e) => setSlaName(e.target.value)}
                  placeholder="mis. SLA Colocation Standard"
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3, minmax(0, 1fr))",
                    gap: "0.75rem",
                  }}
                >
                  <InputField
                    label="Target Uptime (%)"
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={uptimeTarget}
                    onChange={(e) =>
                      setUptimeTarget(Number(e.target.value))
                    }
                  />
                  <InputField
                    label="Response (menit)"
                    type="number"
                    min={1}
                    value={responseMinutes}
                    onChange={(e) =>
                      setResponseMinutes(
                        e.target.value === ""
                          ? ""
                          : Number(e.target.value)
                      )
                    }
                  />
                  <InputField
                    label="Resolution (jam)"
                    type="number"
                    min={1}
                    value={resolutionHours}
                    onChange={(e) =>
                      setResolutionHours(
                        e.target.value === ""
                          ? ""
                          : Number(e.target.value)
                      )
                    }
                  />
                </div>

                <div>
                  <label className="input-label">
                    Tipe Kompensasi
                  </label>
                  <select
                    className="input"
                    value={compensationType}
                    onChange={(e) =>
                      setCompensationType(
                        e.target.value as SlaCompensationType
                      )
                    }
                  >
                    {Object.entries(COMPENSATION_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {compensationType !== "none" && (
                  <InputField
                    label={
                      compensationType === "credit_pct"
                        ? "Nilai Kompensasi (%)"
                        : "Nilai Kompensasi (Rp)"
                    }
                    type="number"
                    min={0}
                    value={compensationValue}
                    onChange={(e) =>
                      setCompensationValue(
                        e.target.value === ""
                          ? ""
                          : Number(e.target.value)
                      )
                    }
                  />
                )}

                <div>
                  <label className="input-label">Catatan</label>
                  <textarea
                    className="input"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Masukkan catatan SLA..."
                  />
                </div>

                <div
                  style={{
                    border: "1px dashed var(--border)",
                    borderRadius: 8,
                    padding: "1rem",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={saveAsTemplate}
                      onChange={(e) =>
                        setSaveAsTemplate(e.target.checked)
                      }
                    />
                    Simpan pengaturan ini sebagai Template baru
                  </label>

                  {saveAsTemplate && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <InputField
                        label="Nama Template *"
                        required
                        value={newTemplateName}
                        onChange={(e) =>
                          setNewTemplateName(e.target.value)
                        }
                        placeholder="mis. SLA Colocation Standard"
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <div className="input-error">{error}</div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                    paddingTop: 12,
                  }}
                >
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={createMutation.isPending}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    style={{
                      background: "#f7ab00",
                      color: "#fff",
                    }}
                  >
                    {createMutation.isPending
                      ? "Menyimpan..."
                      : "Simpan SLA"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportBreachModal({
  sla,
  contractId,
  onClose,
}: {
  sla: Sla;
  contractId: number;
  onClose: () => void;
}) {
  const reportMutation = useReportSlaBreach(contractId);
  const [breachDate, setBreachDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [breachType, setBreachType] =
    useState<SlaBreachType>("uptime");
  const [description, setDescription] = useState("");
  const [compensationAmount, setCompensationAmount] =
    useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await reportMutation.mutateAsync({
        slaId: sla.id,
        values: {
          breach_date: breachDate,
          breach_type: breachType,
          description: description || undefined,
          compensation_amount:
            compensationAmount === ""
              ? undefined
              : compensationAmount,
        },
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      title={`⚠️ Laporkan Pelanggaran — ${sla.sla_name}`}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <InputField
            label="Tanggal *"
            type="date"
            required
            value={breachDate}
            onChange={(e) => setBreachDate(e.target.value)}
          />
          <div>
            <label className="input-label">
              Tipe Pelanggaran
            </label>
            <select
              className="input"
              value={breachType}
              onChange={(e) =>
                setBreachType(e.target.value as SlaBreachType)
              }
            >
              <option value="uptime">Uptime</option>
              <option value="response_time">Response Time</option>
              <option value="resolution_time">Resolution Time</option>
            </select>
          </div>
        </div>

        <div>
          <label className="input-label">Deskripsi</label>
          <textarea
            className="input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Apa yang terjadi..."
          />
        </div>

        <InputField
          label="Nominal Kompensasi (Rp)"
          type="number"
          min={0}
          value={compensationAmount}
          onChange={(e) =>
            setCompensationAmount(
              e.target.value === ""
                ? ""
                : Number(e.target.value)
            )
          }
          hint="Kosongkan untuk dihitung otomatis dari pengaturan kompensasi SLA ini."
        />

        {error && (
          <div className="input-error">{error}</div>
        )}

        <Button
          type="submit"
          disabled={reportMutation.isPending}
          style={{ width: "100%", marginTop: "0.5rem" }}
        >
          {reportMutation.isPending
            ? "Menyimpan..."
            : "💾 Catat Pelanggaran"}
        </Button>
      </form>
    </Modal>
  );
}
