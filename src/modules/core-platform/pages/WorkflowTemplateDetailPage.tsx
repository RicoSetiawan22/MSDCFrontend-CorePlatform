import { useState, useEffect, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Rocket, Pencil } from "lucide-react";
import {
  useWorkflowTemplate, useCreateWorkflowVersion, usePublishWorkflowVersion, useCreateWorkflowLevel, useUpdateWorkflowTemplate,
} from "../api/useWorkflowDesign";
import { WorkflowLevelCard } from "./WorkflowLevelCard";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { ErrorState } from "@shared/components/ErrorState";
import { EmptyState } from "@shared/components/EmptyState";
import { extractErrorMessage } from "@shared/types/api";
import { formatDate } from "@shared/lib/format";
import type { ApproverType, WorkflowVersion } from "../types/workflow";
import type { VersionFormValues, LevelFormValues } from "../api/workflowDesignApi";

const APPROVER_TYPES: ApproverType[] = ["role", "user", "department_head", "dynamic_field", "scoped_role"];
const VERSION_STATUS_LABELS: Record<string, string> = { draft: "Draft", published: "Published", archived: "Archived" };

export function WorkflowTemplateDetailPage() {
  const params = useParams<{ templateId: string }>();
  const templateId = params.templateId ? Number(params.templateId) : undefined;

  const { data: template, isLoading, isError, error } = useWorkflowTemplate(templateId);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false);

  const versions = template?.versions ?? [];
  const selectedVersion: WorkflowVersion | undefined = versions.find((v) => v.id === selectedVersionId) ?? versions[0];

  useEffect(() => {
    if (!selectedVersionId && versions.length > 0) setSelectedVersionId(versions[0].id);
  }, [versions, selectedVersionId]);

  return (
    <div>
      <PageHeader title={template ? template.name : "Detail Workflow Template"} subtitle={template ? template.code : "Memuat..."} />

      <div style={{ padding: "0 2rem 1rem" }}>
        <Link to="/core-platform/workflow-templates" style={{ fontSize: "0.85rem", color: "var(--accent)", textDecoration: "none" }}>← Kembali ke Workflow Design</Link>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={extractErrorMessage(error)} />}

      {template && (
        <div style={{ padding: "0 2rem 2rem" }}>
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <span className={`badge badge-${template.is_active ? "active" : "inactive"}`}>{template.is_active ? "Aktif" : "Nonaktif"}</span>
                <span style={{ textTransform: "capitalize", fontSize: "0.85rem", color: "var(--grey-dark)", fontWeight: 600 }}>{template.module_code}</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button variant="secondary" onClick={() => setIsEditTemplateModalOpen(true)}>
                  <Pencil size={15} /> Edit Template
                </Button>
                <Button variant="secondary" onClick={() => setIsVersionModalOpen(true)}>
                  <Plus size={15} /> Versi Baru
                </Button>
              </div>
            </div>
            {template.description && <p style={{ fontSize: "0.85rem", color: "var(--grey)", marginTop: "0.75rem" }}>{template.description}</p>}
          </div>

          {versions.length === 0 ? (
            <EmptyState title="Belum Ada Version" subtitle="Buat version pertama untuk mulai menambahkan approval level." />
          ) : (
            <>
              <div className="content-card" style={{ margin: 0, marginBottom: "1.25rem" }}>
                <div className="tabs">
                  {versions.map((v) => (
                    <button key={v.id} className={`tab${selectedVersion?.id === v.id ? " is-active" : ""}`} onClick={() => setSelectedVersionId(v.id)}>
                      v{v.version_number} <span className="tab__count">{VERSION_STATUS_LABELS[v.status] ?? v.status}</span>
                    </button>
                  ))}
                </div>

                {selectedVersion && (
                  <div style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <div>
                        <span className={`badge badge-${selectedVersion.status === "published" ? "active" : selectedVersion.status === "archived" ? "inactive" : "prospect"}`}>
                          {VERSION_STATUS_LABELS[selectedVersion.status] ?? selectedVersion.status}
                        </span>
                        {selectedVersion.published_at && (
                          <span style={{ marginLeft: "0.6rem", fontSize: "0.78rem", color: "var(--grey)" }}>Dipublish {formatDate(selectedVersion.published_at)}</span>
                        )}
                        {selectedVersion.notes && <div style={{ fontSize: "0.8rem", color: "var(--grey)", marginTop: "0.3rem" }}>{selectedVersion.notes}</div>}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button variant="secondary" onClick={() => setIsLevelModalOpen(true)}><Plus size={15} /> Level</Button>
                        {selectedVersion.status === "draft" && (
                          <PublishButton templateId={template.id} versionId={selectedVersion.id} />
                        )}
                      </div>
                    </div>

                    {(selectedVersion.levels ?? []).length === 0 ? (
                      <EmptyState title="Belum Ada Approval Level" subtitle="Tambahkan level approval untuk merancang alur workflow ini." />
                    ) : (
                      (selectedVersion.levels ?? [])
                        .slice()
                        .sort((a, b) => a.sequence - b.sequence)
                        .map((level) => (
                          <WorkflowLevelCard key={level.id} level={level} allLevels={selectedVersion.levels ?? []} templateId={template.id} />
                        ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {isVersionModalOpen && template && (
        <VersionFormModal templateId={template.id} nextVersionNumber={Math.max(0, ...versions.map((v) => v.version_number)) + 1} onClose={() => setIsVersionModalOpen(false)} />
      )}
      {isLevelModalOpen && selectedVersion && (
        <LevelFormModal versionId={selectedVersion.id} templateId={template!.id} nextSequence={(selectedVersion.levels?.length ?? 0) + 1} onClose={() => setIsLevelModalOpen(false)} />
      )}
      {isEditTemplateModalOpen && template && (
        <EditTemplateModal template={template} onClose={() => setIsEditTemplateModalOpen(false)} />
      )}
    </div>
  );
}

function PublishButton({ templateId, versionId }: { templateId: number; versionId: number }) {
  const publishMutation = usePublishWorkflowVersion(templateId);

  async function handlePublish() {
    if (!confirm("Publish version ini? Version published lama (jika ada) otomatis di-archive.")) return;
    try { await publishMutation.mutateAsync(versionId); }
    catch (err) { alert(extractErrorMessage(err)); }
  }

  return (
    <Button onClick={handlePublish} disabled={publishMutation.isPending}>
      <Rocket size={15} /> {publishMutation.isPending ? "Publishing..." : "Publish"}
    </Button>
  );
}

function VersionFormModal({ templateId, nextVersionNumber, onClose }: { templateId: number; nextVersionNumber: number; onClose: () => void }) {
  const createMutation = useCreateWorkflowVersion();
  const [form, setForm] = useState<VersionFormValues>({ template_id: templateId, version_number: nextVersionNumber, notes: "" });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createMutation.mutateAsync(form);
      onClose();
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  return (
    <Modal title="🆕 Version Baru" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <InputField label="Version Number *" type="number" min={1} required value={form.version_number}
          onChange={(e) => setForm({ ...form, version_number: Number(e.target.value) })} />
        <InputField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opsional" />
        {error && <div className="input-error">{error}</div>}
        <Button type="submit" disabled={createMutation.isPending} style={{ width: "100%", marginTop: "0.5rem" }}>
          {createMutation.isPending ? "Menyimpan..." : "💾 Buat Version (Draft)"}
        </Button>
      </form>
    </Modal>
  );
}

function LevelFormModal({ versionId, templateId, nextSequence, onClose }: { versionId: number; templateId: number; nextSequence: number; onClose: () => void }) {
  const createMutation = useCreateWorkflowLevel(templateId);
  const [form, setForm] = useState<LevelFormValues>({
    version_id: versionId, sequence: nextSequence, name: "", approver_type: "role", approver_ref: "", min_approval_count: 1, is_final: false,
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createMutation.mutateAsync(form);
      onClose();
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  return (
    <Modal title="🪜 Approval Level Baru" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <InputField label="Sequence *" type="number" min={1} required value={form.sequence}
            onChange={(e) => setForm({ ...form, sequence: Number(e.target.value) })} />
          <InputField label="Nama *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Manager Approval" />
        </div>
        <div>
          <label className="input-label">Approver Type *</label>
          <select className="input" value={form.approver_type} onChange={(e) => setForm({ ...form, approver_type: e.target.value as ApproverType })}>
            {APPROVER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <InputField label="Approver Ref" value={form.approver_ref} onChange={(e) => setForm({ ...form, approver_ref: e.target.value })}
          placeholder="nama role / user id / nama field, sesuai approver type" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", alignItems: "end" }}>
          <InputField label="Min Approval Count" type="number" min={1} value={form.min_approval_count}
            onChange={(e) => setForm({ ...form, min_approval_count: Number(e.target.value) })} />
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", marginBottom: "1rem" }}>
            <input type="checkbox" checked={form.is_final} onChange={(e) => setForm({ ...form, is_final: e.target.checked })} />
            Level Final
          </label>
        </div>
        {error && <div className="input-error">{error}</div>}
        <Button type="submit" disabled={createMutation.isPending} style={{ width: "100%" }}>
          {createMutation.isPending ? "Menyimpan..." : "💾 Simpan Level"}
        </Button>
      </form>
    </Modal>
  );
}

const WORKFLOW_MODULE_OPTIONS = [
  { value: "crm-sales", label: "CRM & Sales (Quotation, Kontrak, Promo)" },
  { value: "hr-service-support", label: "HR & General Affairs (Izin, Lembur, Fasilitas)" },
  { value: "procurement-inventory", label: "Procurement & Inventory (PO, PR, RFQ)" },
  { value: "finance-accounting", label: "Finance & Accounting (Jurnal, Invoice, Kas)" },
  { value: "data-center-ops", label: "Data Center Operations (Rack, DC Facility)" },
  { value: "core-platform", label: "Core Platform (Persuratan, Organisasi, Sistem)" },
  { value: "integration-analytics", label: "Integration & Analytics" },
];

function EditTemplateModal({ template, onClose }: { template: { id: number; code: string; name: string; module_code: string; description?: string | null; is_active: boolean }; onClose: () => void }) {
  const updateMutation = useUpdateWorkflowTemplate();
  const [name, setName] = useState(template.name);
  const [moduleCode, setModuleCode] = useState(template.module_code);
  const [description, setDescription] = useState(template.description ?? "");
  const [isActive, setIsActive] = useState(template.is_active);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateMutation.mutateAsync({
        id: template.id,
        payload: { name, module_code: moduleCode, description, is_active: isActive },
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title={`Edit Template: ${template.code}`} onClose={onClose} maxWidth={520}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <label className="input-label">Kode Template (Permanen)</label>
          <input className="input" disabled value={template.code} style={{ background: "var(--bg-subtle)", color: "var(--grey)" }} />
        </div>
        <InputField label="Nama Alur Persetujuan *" required value={name} onChange={(e) => setName(e.target.value)} />
        <div>
          <label className="input-label">Modul Bisnis *</label>
          <select className="input" value={moduleCode} onChange={(e) => setModuleCode(e.target.value)}>
            {WORKFLOW_MODULE_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
            <option value="other">Modul Lainnya</option>
          </select>
        </div>
        <InputField label="Deskripsi / Catatan" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opsional" />
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer", marginTop: "0.25rem" }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span>Template Aktif</span>
        </label>
        {error && <div className="input-error">{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
