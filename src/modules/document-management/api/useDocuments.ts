import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentApi } from "./documentApi";
import { templateApi } from "./templateApi";
import { documentTypeAdminApi } from "./documentTypeAdminApi";
import type { DocumentListParams, DocumentCreatePayload, DocumentUpdatePayload } from "../types/document";
import type { DocTemplateFormValues } from "./templateApi";

const documentKeys = {
  all: ["documents"] as const,
  list: (params: DocumentListParams) => [...documentKeys.all, "list", params] as const,
  detail: (id: number) => [...documentKeys.all, "detail", id] as const,
  revisions: (id: number) => [...documentKeys.all, "revisions", id] as const,
};

export function useDocumentList(params: DocumentListParams) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => documentApi.list(params).then(r => r.data),
    placeholderData: prev => prev,
  });
}

export function useDocument(id: number | undefined) {
  return useQuery({
    queryKey: documentKeys.detail(id ?? 0),
    queryFn: () => documentApi.show(id!).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useDocumentRevisions(id: number | undefined) {
  return useQuery({
    queryKey: documentKeys.revisions(id ?? 0),
    queryFn: () => documentApi.revisions(id!).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: ["documentTypes"],
    queryFn: () => documentApi.documentTypes().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: DocumentCreatePayload) => documentApi.create(values).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: DocumentUpdatePayload }) => documentApi.update(id, values).then(r => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: documentKeys.all });
      qc.invalidateQueries({ queryKey: documentKeys.revisions(id) });
    },
  });
}

export function useSubmitDocumentForApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => documentApi.submitForApproval(id).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useArchiveDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => documentApi.archive(id).then(r => r.data.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: documentKeys.all });
      qc.invalidateQueries({ queryKey: documentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: documentKeys.revisions(id) });
    },
  });
}

export function useAttachDocumentFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => documentApi.attachFile(id, file).then(r => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: documentKeys.all });
      qc.invalidateQueries({ queryKey: documentKeys.revisions(id) });
    },
  });
}

export function useSignDocumentFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: number) => documentApi.signFile(fileId).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

/** Tanda tangani surat (bukan file generik) - regenerate PDF-nya dengan
 * stempel QR verifikasi, lihat documentApi.sign(). */
export function useSignDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => documentApi.sign(id).then(r => r.data.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: documentKeys.all });
      qc.invalidateQueries({ queryKey: documentKeys.revisions(id) });
    },
  });
}

export function useDocumentTemplates(module?: string) {
  return useQuery({
    queryKey: ["docTemplates", module ?? "all"],
    queryFn: () => templateApi.list(module ? { module } : undefined).then(r => r.data.data),
  });
}

export function useSaveDocumentTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: DocTemplateFormValues) => templateApi.save(values).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["docTemplates"] }),
  });
}

/** "Kelola Jenis Surat" (admin) - BEDA dari useDocumentTypes() di atas
 * (yang cuma tipe aktif, dipakai dropdown form) - ini termasuk yang
 * nonaktif, dipakai halaman pengelolaan. */
export function useDocumentTypeAdminList() {
  return useQuery({
    queryKey: ["documentTypesAdmin"],
    queryFn: () => documentTypeAdminApi.list().then(r => r.data.data),
  });
}

export function useSaveDocumentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      code: string; label: string; sort_order?: number; is_active?: boolean;
      meta: { direction: string; prefix: string; module: string; workflow_template_code?: string; default_template_id?: number; requires_approval?: boolean };
    }) => {
      const lookupTypeId = await documentTypeAdminApi.findDocumentTypeLookupTypeId();
      return documentTypeAdminApi.save(lookupTypeId, values).then(r => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentTypesAdmin"] });
      qc.invalidateQueries({ queryKey: ["documentTypes"] });
    },
  });
}
