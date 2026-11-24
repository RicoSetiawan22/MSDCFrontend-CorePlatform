import { useQuery } from "@tanstack/react-query";
import { workflowApi } from "./workflowApi";

export function useMyApprovals(params: { status?: string }) {
  return useQuery({
    queryKey: ["workflowApprovals", params] as const,
    queryFn: async () => {
      try {
        const res = await workflowApi.myApprovals(params);
        return res.data.data;
      } catch (err: unknown) {
        if (params.status === "all") {
          const [pendingRes, approvedRes, rejectedRes] = await Promise.allSettled([
            workflowApi.myApprovals({ status: "pending" }),
            workflowApi.myApprovals({ status: "approved" }),
            workflowApi.myApprovals({ status: "rejected" }),
          ]);
          const p = pendingRes.status === "fulfilled" ? pendingRes.value.data.data : [];
          const a = approvedRes.status === "fulfilled" ? approvedRes.value.data.data : [];
          const r = rejectedRes.status === "fulfilled" ? rejectedRes.value.data.data : [];
          return [...p, ...a, ...r];
        }
        throw err;
      }
    },
    placeholderData: (p) => p,
  });
}

export function useWorkflowInstance(id: number | undefined) {
  return useQuery({
    queryKey: ["workflowInstance", id ?? 0] as const,
    queryFn: () => workflowApi.instanceShow(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useWorkflowInstances(params?: {
  module_code?: string;
  document_type?: string;
  status?: string;
  page?: number;
  per_page?: number;
}) {
  return useQuery({
    queryKey: ["workflowInstances", params] as const,
    queryFn: () => workflowApi.instances(params || {}).then((r) => r.data),
  });
}
