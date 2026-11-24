import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { opportunityApi } from "./opportunityApi";
import type {
  OpportunityFormValues, OpportunityListParams,
} from "../types/opportunity";

const oppKeys = {
  all: ["opportunities"] as const,
  lists: () => [...oppKeys.all, "list"] as const,
  list: (params: OpportunityListParams) => [...oppKeys.lists(), params] as const,
  pipeline: () => [...oppKeys.all, "pipeline"] as const,
};

export function useOpportunityList(params: OpportunityListParams) {
  return useQuery({
    queryKey: oppKeys.list(params),
    queryFn: () => opportunityApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useOpportunity(id: number | undefined) {
  return useQuery({
    queryKey: [...oppKeys.all, "detail", id ?? 0] as const,
    queryFn: () => opportunityApi.show(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function usePipelineSummary() {
  return useQuery({
    queryKey: oppKeys.pipeline(),
    queryFn: () => opportunityApi.pipelineSummary().then(r => (r.data?.data?.by_stage ?? []) as PipelineStageItem[]),
    staleTime: 60_000,
  });
}

export type PipelineStageItem = {
  stage: string;
  opportunity_count: number;
  total_value: number;
  weighted_value: number;
};

export function useCreateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: OpportunityFormValues) => opportunityApi.create(values).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: oppKeys.lists() }),
  });
}

export function useLogOpportunityActivity(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { activity_type: string; subject: string; notes?: string; activity_date?: string }) =>
      opportunityApi.logActivity(id, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...oppKeys.all, "detail", id] }),
  });
}

export function useUpdateOpportunityStage(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { stage: import("../types/opportunity").OpportunityStage; lost_reason?: string; competitor_name?: string; final_amount?: number; closer_id?: number | null }) =>
      opportunityApi.updateStage(id, args.stage, args).then(response => response.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: oppKeys.all }); qc.invalidateQueries({ queryKey: ["crmReports"] }); },
  });
}
