import { useState, type FormEvent } from "react";
import { ChevronDown, ChevronRight, Trash2, Plus, Pencil } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import {
  useCreateWorkflowCondition, useDeleteWorkflowCondition,
  useCreateWorkflowAction, useDeleteWorkflowAction,
  useCreateWorkflowTransition, useDeleteWorkflowTransition, useWorkflowTransitions,
  useCreateWorkflowNotification, useDeleteWorkflowNotification, useWorkflowNotifications,
  useDeleteWorkflowLevel, useUpdateWorkflowLevel,
} from "../api/useWorkflowDesign";
import { extractErrorMessage } from "@shared/types/api";
import type { LevelFormValues } from "../api/workflowDesignApi";
import type {
  WorkflowLevel, ConditionOperator, ActionTrigger, ActionType, NotificationChannel, NotificationRecipientType, ApproverType,
} from "../types/workflow";

const APPROVER_TYPE_LABELS: Record<string, string> = {
  role: "Role", user: "User Spesifik", department_head: "Kepala Departemen",
  dynamic_field: "Field Dinamis (dari payload)", scoped_role: "Role dengan Scope",
};
const OPERATORS: ConditionOperator[] = ["=", "!=", ">", ">=", "<", "<=", "in", "not_in", "contains"];
const TRIGGERS: ActionTrigger[] = ["on_enter", "on_approve", "on_reject", "on_escalate"];
const ACTION_TYPES: ActionType[] = ["notify_email", "notify_system", "webhook", "auto_approve", "auto_reject"];
const CHANNELS: NotificationChannel[] = ["email", "wa", "push", "sms"];
const RECIPIENT_TYPES: NotificationRecipientType[] = ["approver", "initiator", "role", "custom_user"];

const selectStyle: React.CSSProperties = { fontSize: "0.78rem", padding: "0.35rem 0.5rem" };
const smallInputStyle: React.CSSProperties = { fontSize: "0.78rem", padding: "0.35rem 0.5rem" };

export function WorkflowLevelCard({ level, allLevels, templateId }: {
  level: WorkflowLevel;
  allLevels: WorkflowLevel[];
  templateId: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const deleteLevelMutation = useDeleteWorkflowLevel(templateId);

  async function handleDeleteLevel() {
    if (!confirm(`Hapus level "${level.name}"? Condition, action, transition, dan notification di level ini akan ikut terhapus.`)) return;
    try { await deleteLevelMutation.mutateAsync(level.id); }
    catch (err) { alert(extractErrorMessage(err)); }
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, marginBottom: "0.75rem", overflow: "hidden" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.75rem 1rem", background: "var(--bg-subtle)", cursor: "pointer" }}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--accent)" }}>#{level.sequence}</span>
        <span style={{ fontWeight: 700 }}>{level.name}</span>
        <span style={{ fontSize: "0.78rem", color: "var(--grey)" }}>
          {APPROVER_TYPE_LABELS[level.approver_type] ?? level.approver_type}
          {level.approver_ref ? ` · ${level.approver_ref}` : ""}
        </span>
        {level.min_approval_count > 1 && <span className="badge badge-prospect" style={{ fontSize: "0.7rem" }}>min {level.min_approval_count} approver</span>}
        {level.is_final && <span className="badge badge-active" style={{ fontSize: "0.7rem" }}>Final</span>}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <button
            style={{ border: "none", background: "none", color: "var(--accent)", cursor: "pointer", padding: "2px 4px" }}
            onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); }}
            title="Edit Approval Level"
          >
            <Pencil size={14} />
          </button>
          <button
            style={{ border: "none", background: "none", color: "var(--bad)", cursor: "pointer", padding: "2px 4px" }}
            disabled={deleteLevelMutation.isPending}
            onClick={(e) => { e.stopPropagation(); handleDeleteLevel(); }}
            title="Hapus Level"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <ConditionSection level={level} templateId={templateId} />
          <ActionSection level={level} templateId={templateId} />
          <TransitionSection level={level} allLevels={allLevels} />
          <NotificationSection level={level} />
        </div>
      )}
      {isEditModalOpen && (
        <EditLevelModal level={level} templateId={templateId} onClose={() => setIsEditModalOpen(false)} />
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", color: "var(--grey-dark)", marginBottom: "0.5rem" }}>{children}</div>;
}

function ConditionSection({ level, templateId }: { level: WorkflowLevel; templateId: number }) {
  const createMutation = useCreateWorkflowCondition(templateId);
  const deleteMutation = useDeleteWorkflowCondition(templateId);
  const [field, setField] = useState("");
  const [operator, setOperator] = useState<ConditionOperator>("=");
  const [value, setValue] = useState("");
  const [group, setGroup] = useState(1);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createMutation.mutateAsync({ level_id: level.id, field, operator, value, condition_group: group });
      setField(""); setValue("");
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  return (
    <div>
      <SectionTitle>Condition (syarat level ini berlaku)</SectionTitle>
      <p style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "-0.3rem", marginBottom: "0.5rem" }}>
        Antar group = OR, dalam group yang sama = AND. Kosongkan jika level ini selalu berlaku.
      </p>
      {(level.conditions ?? []).length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.6rem" }}>
          {level.conditions!.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", background: "var(--bg-subtle)", padding: "0.35rem 0.6rem", borderRadius: 6 }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "var(--grey)" }}>grp {c.condition_group}</span>
              <span style={{ fontFamily: "monospace" }}>{c.field} {c.operator} {c.value}</span>
              <button style={{ marginLeft: "auto", border: "none", background: "none", color: "var(--bad)", cursor: "pointer" }}
                onClick={() => deleteMutation.mutate(c.id)} title="Hapus"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
        <input className="input" style={{ ...smallInputStyle, width: 130 }} placeholder="field (mis. amount)" value={field} onChange={(e) => setField(e.target.value)} required />
        <select className="input" style={selectStyle} value={operator} onChange={(e) => setOperator(e.target.value as ConditionOperator)}>
          {OPERATORS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <input className="input" style={{ ...smallInputStyle, width: 130 }} placeholder="value" value={value} onChange={(e) => setValue(e.target.value)} required />
        <input className="input" type="number" min={1} style={{ ...smallInputStyle, width: 70 }} title="Condition group" value={group} onChange={(e) => setGroup(Number(e.target.value) || 1)} />
        <button type="submit" className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.35rem 0.6rem" }} disabled={createMutation.isPending}>
          <Plus size={13} /> Tambah
        </button>
      </form>
      {error && <div className="input-error">{error}</div>}
    </div>
  );
}

function ActionSection({ level, templateId }: { level: WorkflowLevel; templateId: number }) {
  const createMutation = useCreateWorkflowAction(templateId);
  const deleteMutation = useDeleteWorkflowAction(templateId);
  const [trigger, setTrigger] = useState<ActionTrigger>("on_enter");
  const [actionType, setActionType] = useState<ActionType>("notify_email");
  const [configText, setConfigText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    let config: Record<string, unknown> | undefined;
    if (configText.trim()) {
      try { config = JSON.parse(configText); }
      catch { setError("Config harus berupa JSON valid, mis. {\"webhook_url\":\"...\"}"); return; }
    }
    try {
      await createMutation.mutateAsync({ level_id: level.id, trigger, action_type: actionType, config });
      setConfigText("");
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  return (
    <div>
      <SectionTitle>Action (efek otomatis saat trigger terjadi)</SectionTitle>
      {(level.actions ?? []).length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.6rem" }}>
          {level.actions!.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", background: "var(--bg-subtle)", padding: "0.35rem 0.6rem", borderRadius: 6 }}>
              <span className="badge badge-prospect" style={{ fontSize: "0.68rem" }}>{a.trigger}</span>
              <span style={{ fontFamily: "monospace" }}>{a.action_type}</span>
              {a.config && <span style={{ color: "var(--grey)", fontSize: "0.72rem" }}>{JSON.stringify(a.config)}</span>}
              <button style={{ marginLeft: "auto", border: "none", background: "none", color: "var(--bad)", cursor: "pointer" }}
                onClick={() => deleteMutation.mutate(a.id)} title="Hapus"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
        <select className="input" style={selectStyle} value={trigger} onChange={(e) => setTrigger(e.target.value as ActionTrigger)}>
          {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input" style={selectStyle} value={actionType} onChange={(e) => setActionType(e.target.value as ActionType)}>
          {ACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className="input" style={{ ...smallInputStyle, width: 220 }} placeholder='config JSON (opsional)' value={configText} onChange={(e) => setConfigText(e.target.value)} />
        <button type="submit" className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.35rem 0.6rem" }} disabled={createMutation.isPending}>
          <Plus size={13} /> Tambah
        </button>
      </form>
      {error && <div className="input-error">{error}</div>}
    </div>
  );
}

function TransitionSection({ level, allLevels }: { level: WorkflowLevel; allLevels: WorkflowLevel[] }) {
  const { data: transitions, isLoading } = useWorkflowTransitions(level.id);
  const createMutation = useCreateWorkflowTransition(level.id);
  const deleteMutation = useDeleteWorkflowTransition(level.id);
  const [toLevelId, setToLevelId] = useState<string>("");
  const [event, setEvent] = useState("approve");
  const [useCondition, setUseCondition] = useState(false);
  const [condField, setCondField] = useState("");
  const [condOperator, setCondOperator] = useState<ConditionOperator>("<=");
  const [condValue, setCondValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const condition = useCondition && condField
      ? [{ field: condField, operator: condOperator, value: condValue }]
      : undefined;
    try {
      await createMutation.mutateAsync({ from_level_id: level.id, to_level_id: toLevelId ? Number(toLevelId) : null, event, condition });
      setEvent("approve"); setUseCondition(false); setCondField(""); setCondValue("");
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  const otherLevels = allLevels.filter((l) => l.id !== level.id);

  return (
    <div>
      <SectionTitle>Transition (kemana alur pindah setelah event)</SectionTitle>
      <p style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "-0.3rem", marginBottom: "0.5rem" }}>
        Untuk 1 event bisa ada beberapa transition: yang PUNYA syarat dicek dulu (urutan tidak penting, hanya 1 yang cocok yang dipakai),
        transition TANPA syarat jadi fallback/default kalau tidak ada yang cocok.
      </p>
      {isLoading && <div style={{ fontSize: "0.78rem", color: "var(--grey)" }}>Memuat...</div>}
      {transitions && transitions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.6rem" }}>
          {transitions.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", background: "var(--bg-subtle)", padding: "0.35rem 0.6rem", borderRadius: 6 }}>
              <span className="badge badge-prospect" style={{ fontSize: "0.68rem" }}>{t.event}</span>
              <span>→</span>
              <span style={{ fontWeight: 600 }}>{t.to_level ? t.to_level.name : "Selesai (end)"}</span>
              {t.condition && t.condition.length > 0
                ? <span style={{ color: "var(--grey)", fontSize: "0.72rem", fontFamily: "monospace" }}>
                    jika {t.condition.map((c) => `${c.field} ${c.operator} ${c.value}`).join(" DAN ")}
                  </span>
                : <span style={{ color: "var(--grey)", fontSize: "0.72rem" }}>(default/fallback)</span>}
              <button style={{ marginLeft: "auto", border: "none", background: "none", color: "var(--bad)", cursor: "pointer" }}
                onClick={() => deleteMutation.mutate(t.id)} title="Hapus"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
          <input className="input" style={{ ...smallInputStyle, width: 140 }} placeholder="event (mis. approve)" value={event} onChange={(e) => setEvent(e.target.value)} required />
          <select className="input" style={selectStyle} value={toLevelId} onChange={(e) => setToLevelId(e.target.value)}>
            <option value="">— Selesai (end) —</option>
            {otherLevels.map((l) => <option key={l.id} value={l.id}>#{l.sequence} {l.name}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem" }}>
            <input type="checkbox" checked={useCondition} onChange={(e) => setUseCondition(e.target.checked)} />
            Pakai syarat
          </label>
        </div>
        {useCondition && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center", paddingLeft: "0.5rem", borderLeft: "2px solid var(--border)" }}>
            <input className="input" style={{ ...smallInputStyle, width: 130 }} placeholder="field (mis. discount_pct)" value={condField} onChange={(e) => setCondField(e.target.value)} />
            <select className="input" style={selectStyle} value={condOperator} onChange={(e) => setCondOperator(e.target.value as ConditionOperator)}>
              {OPERATORS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <input className="input" style={{ ...smallInputStyle, width: 100 }} placeholder="value" value={condValue} onChange={(e) => setCondValue(e.target.value)} />
          </div>
        )}
        <button type="submit" className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.35rem 0.6rem", alignSelf: "flex-start" }} disabled={createMutation.isPending}>
          <Plus size={13} /> Tambah Transition
        </button>
      </form>
      {error && <div className="input-error">{error}</div>}
    </div>
  );
}

function NotificationSection({ level }: { level: WorkflowLevel }) {
  const { data: notifications, isLoading } = useWorkflowNotifications(level.id);
  const createMutation = useCreateWorkflowNotification(level.id);
  const deleteMutation = useDeleteWorkflowNotification(level.id);
  const [trigger, setTrigger] = useState<ActionTrigger>("on_enter");
  const [channel, setChannel] = useState<NotificationChannel>("email");
  const [templateCode, setTemplateCode] = useState("");
  const [recipientType, setRecipientType] = useState<NotificationRecipientType>("approver");
  const [recipientRef, setRecipientRef] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createMutation.mutateAsync({
        level_id: level.id, trigger, channel, template_code: templateCode,
        recipient_type: recipientType, recipient_ref: recipientRef || undefined,
      });
      setTemplateCode(""); setRecipientRef("");
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  return (
    <div>
      <SectionTitle>Notification (kabari siapa saat trigger terjadi)</SectionTitle>
      {isLoading && <div style={{ fontSize: "0.78rem", color: "var(--grey)" }}>Memuat...</div>}
      {notifications && notifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.6rem" }}>
          {notifications.map((n) => (
            <div key={n.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", background: "var(--bg-subtle)", padding: "0.35rem 0.6rem", borderRadius: 6 }}>
              <span className="badge badge-prospect" style={{ fontSize: "0.68rem" }}>{n.trigger}</span>
              <span style={{ textTransform: "uppercase", fontSize: "0.72rem", fontWeight: 700, color: "var(--accent)" }}>{n.channel}</span>
              <span style={{ fontFamily: "monospace" }}>{n.template_code}</span>
              <span style={{ color: "var(--grey)", fontSize: "0.72rem" }}>→ {n.recipient_type}{n.recipient_ref ? `:${n.recipient_ref}` : ""}</span>
              {!n.is_active && <span className="badge badge-inactive" style={{ fontSize: "0.65rem" }}>Nonaktif</span>}
              <button style={{ marginLeft: "auto", border: "none", background: "none", color: "var(--bad)", cursor: "pointer" }}
                onClick={() => deleteMutation.mutate(n.id)} title="Hapus"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
        <select className="input" style={selectStyle} value={trigger} onChange={(e) => setTrigger(e.target.value as ActionTrigger)}>
          {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input" style={selectStyle} value={channel} onChange={(e) => setChannel(e.target.value as NotificationChannel)}>
          {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="input" style={{ ...smallInputStyle, width: 150 }} placeholder="template_code" value={templateCode} onChange={(e) => setTemplateCode(e.target.value)} required />
        <select className="input" style={selectStyle} value={recipientType} onChange={(e) => setRecipientType(e.target.value as NotificationRecipientType)}>
          {RECIPIENT_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {(recipientType === "role" || recipientType === "custom_user") && (
          <input className="input" style={{ ...smallInputStyle, width: 130 }} placeholder="recipient_ref" value={recipientRef} onChange={(e) => setRecipientRef(e.target.value)} />
        )}
        <button type="submit" className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.35rem 0.6rem" }} disabled={createMutation.isPending}>
          <Plus size={13} /> Tambah
        </button>
      </form>
      {error && <div className="input-error">{error}</div>}
    </div>
  );
}

const APPROVER_TYPES: ApproverType[] = ["role", "user", "department_head", "dynamic_field", "scoped_role"];

function EditLevelModal({ level, templateId, onClose }: { level: WorkflowLevel; templateId: number; onClose: () => void }) {
  const updateMutation = useUpdateWorkflowLevel(templateId);
  const [form, setForm] = useState<Partial<LevelFormValues>>({
    sequence: level.sequence,
    name: level.name,
    approver_type: level.approver_type,
    approver_ref: level.approver_ref ?? "",
    min_approval_count: level.min_approval_count,
    is_final: level.is_final,
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateMutation.mutateAsync({ id: level.id, payload: form });
      onClose();
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  return (
    <Modal title={`Edit Level #${level.sequence} - ${level.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <InputField label="Sequence *" type="number" min={1} required value={form.sequence ?? 1}
            onChange={(e) => setForm({ ...form, sequence: Number(e.target.value) })} />
          <InputField label="Nama *" required value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Manager Approval" />
        </div>
        <div>
          <label className="input-label">Approver Type *</label>
          <select className="input" value={form.approver_type} onChange={(e) => setForm({ ...form, approver_type: e.target.value as ApproverType })}>
            {APPROVER_TYPES.map((t) => <option key={t} value={t}>{APPROVER_TYPE_LABELS[t] ?? t}</option>)}
          </select>
        </div>
        <InputField label="Approver Ref" value={form.approver_ref ?? ""} onChange={(e) => setForm({ ...form, approver_ref: e.target.value })}
          placeholder="nama role / user id / nama field, sesuai approver type" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", alignItems: "end" }}>
          <InputField label="Min Approval Count" type="number" min={1} value={form.min_approval_count ?? 1}
            onChange={(e) => setForm({ ...form, min_approval_count: Number(e.target.value) })} />
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", marginBottom: "1rem" }}>
            <input type="checkbox" checked={form.is_final ?? false} onChange={(e) => setForm({ ...form, is_final: e.target.checked })} />
            Level Final
          </label>
        </div>
        {error && <div className="input-error">{error}</div>}
        <Button type="submit" disabled={updateMutation.isPending} style={{ width: "100%" }}>
          {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan Level"}
        </Button>
      </form>
    </Modal>
  );
}
