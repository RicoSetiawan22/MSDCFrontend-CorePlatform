import { useQuery } from "@tanstack/react-query";
import { workflowApi } from "@modules/core-platform/api/workflowApi";

/**
 * Breakdown status approval PER LANGKAH (mis. Kepala Posisi: Disetujui,
 * EPM1: Pending, EPM2: Pending) - BUKAN cuma 1 status tunggal per dokumen
 * (draft/submitted/approved) yang sebelumnya dipakai di mana-mana.
 * Dipakai di History PO (PR/PO/FPP/RFQ picking, semua punya
 * workflow_instance_id sendiri) - render null diam-diam kalau dokumen ini
 * belum pernah di-submit approval (workflowInstanceId null).
 */
export function ApprovalStepsList({ workflowInstanceId }: { workflowInstanceId: number | null | undefined }) {
  const { data, isLoading } = useQuery({
    queryKey: ["workflow-instance-detail", workflowInstanceId],
    queryFn: () => workflowApi.instanceDetail(workflowInstanceId!).then((r) => r.data.data),
    enabled: !!workflowInstanceId,
  });

  if (!workflowInstanceId) return null;
  if (isLoading) {
    return <div style={{ fontSize: "0.72rem", color: "var(--grey)", margin: "0.4rem 0" }}>Memuat status approval...</div>;
  }
  if (!data || data.instance_levels.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", margin: "0.5rem 0" }}>
      {data.instance_levels.map((il) => {
        const levelName = il.level?.name ?? "—";
        const minCount = il.level?.min_approval_count ?? 1;
        const isQuorum = minCount > 1;
        const approvedVoteCount = il.votes.filter((v) => v.decision === "approved").length;

        let label: string;
        let color: string;
        let bg: string;
        if (il.status === "approved") {
          label = isQuorum ? `Disetujui (${approvedVoteCount}/${minCount})` : `Disetujui${il.approver ? ` — ${il.approver.name}` : ""}`;
          color = "#15803d"; bg = "#d9f2e6";
        } else if (il.status === "rejected") {
          label = "Ditolak"; color = "#991b1b"; bg = "#fee2e2";
        } else if (il.status === "skipped") {
          label = "Dilewati"; color = "#64748b"; bg = "#f1f5f9";
        } else {
          label = isQuorum ? `Menunggu (${approvedVoteCount}/${minCount})` : "Menunggu";
          color = "#92400e"; bg = "#fef3c7";
        }

        return (
          <div key={il.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.76rem", padding: "0.3rem 0.6rem", background: "#fafafa", border: "1px solid var(--border)", borderRadius: 6 }}>
            <span style={{ fontWeight: 600 }}>{levelName}</span>
            <span style={{ fontWeight: 700, padding: "0.1rem 0.55rem", borderRadius: 99, fontSize: "0.68rem", color, background: bg, whiteSpace: "nowrap" }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
