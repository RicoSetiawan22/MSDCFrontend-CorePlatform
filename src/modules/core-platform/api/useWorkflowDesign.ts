import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  workflowDesignApi,
  type ActionFormValues,
  type ConditionFormValues,
  type LevelFormValues,
  type NotificationFormValues,
  type TemplateFormValues,
  type TransitionFormValues,
  type VersionFormValues,
} from "./workflowDesignApi";

const wfKeys = {
  all: ["workflowDesign"] as const,
  templates: (params: { module_code?: string; page?: number }) => [...wfKeys.all, "templates", params] as const,
  template: (id: number) => [...wfKeys.all, "template", id] as const,
  transitions: (fromLevelId: number) => [...wfKeys.all, "transitions", fromLevelId] as const,
  notifications: (levelId: number) => [...wfKeys.all, "notifications", levelId] as const,
};

export function useWorkflowTemplates(params: { module_code?: string; page?: number }) {
  return useQuery({
    queryKey: wfKeys.templates(params),
    queryFn: () => workflowDesignApi.templates(params).then((r) => r.data.data),
    placeholderData: (p) => p,
  });
}

export function useWorkflowTemplate(id: number | undefined) {
  return useQuery({
    queryKey: wfKeys.template(id ?? 0),
    queryFn: () => workflowDesignApi.templateShow(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useWorkflowTransitions(fromLevelId: number | undefined) {
  return useQuery({
    queryKey: wfKeys.transitions(fromLevelId ?? 0),
    queryFn: () => workflowDesignApi.transitions({ from_level_id: fromLevelId }).then((r) => r.data.data),
    enabled: !!fromLevelId,
  });
}

export function useWorkflowNotifications(levelId: number | undefined) {
  return useQuery({
    queryKey: wfKeys.notifications(levelId ?? 0),
    queryFn: () => workflowDesignApi.notifications({ level_id: levelId }).then((r) => r.data.data),
    enabled: !!levelId,
  });
}

export function useCreateWorkflowTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TemplateFormValues) => workflowDesignApi.templateStore(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: wfKeys.all }),
  });
}

export function useUpdateWorkflowTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<TemplateFormValues> & { is_active?: boolean } }) =>
      workflowDesignApi.templateUpdate(id, payload).then((r) => r.data.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: wfKeys.all });
      qc.invalidateQueries({ queryKey: wfKeys.template(variables.id) });
    },
  });
}

export function useCreateWorkflowVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VersionFormValues) => workflowDesignApi.versionStore(payload).then((r) => r.data.data),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: wfKeys.template(variables.template_id) }),
  });
}

export function usePublishWorkflowVersion(templateId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (versionId: number) => workflowDesignApi.versionPublish(versionId).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: wfKeys.template(templateId) }),
  });
}

export function useCreateWorkflowLevel(templateId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LevelFormValues) => workflowDesignApi.levelStore(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: wfKeys.template(templateId) }),
  });
}

export function useUpdateWorkflowLevel(templateId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LevelFormValues> }) =>
      workflowDesignApi.levelUpdate(id, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: wfKeys.template(templateId) }),
  });
}

export function useDeleteWorkflowLevel(templateId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => workflowDesignApi.levelDestroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: wfKeys.template(templateId) }),
  });
}

export function useCreateWorkflowCondition(templateId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConditionFormValues) => workflowDesignApi.conditionStore(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: wfKeys.template(templateId) }),
  });
}

export function useDeleteWorkflowCondition(templateId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => workflowDesignApi.conditionDestroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: wfKeys.template(templateId) }),
  });
}

export function useCreateWorkflowAction(templateId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ActionFormValues) => workflowDesignApi.actionStore(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: wfKeys.template(templateId) }),
  });
}

export function useDeleteWorkflowAction(templateId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => workflowDesignApi.actionDestroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: wfKeys.template(templateId) }),
  });
}

export function useCreateWorkflowTransition(fromLevelId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransitionFormValues) => workflowDesignApi.transitionStore(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: wfKeys.transitions(fromLevelId) }),
  });
}

export function useDeleteWorkflowTransition(fromLevelId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => workflowDesignApi.transitionDestroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: wfKeys.transitions(fromLevelId) }),
  });
}

export function useCreateWorkflowNotification(levelId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotificationFormValues) => workflowDesignApi.notificationStore(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: wfKeys.notifications(levelId) }),
  });
}

export function useDeleteWorkflowNotification(levelId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => workflowDesignApi.notificationDestroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: wfKeys.notifications(levelId) }),
  });
}
