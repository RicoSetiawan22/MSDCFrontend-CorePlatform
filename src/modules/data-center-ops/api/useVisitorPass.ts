import { useMutation, useQuery, useQueryClient, type Query } from "@tanstack/react-query";
import { visitorPassApi } from "./visitorPassApi";
import type {
  VisitorPass,
  VisitorPassListParams,
  CreateVisitorPassPayload,
  InviteVisitorPayload,
  SelfRegisterPayload,
  ScanVerifyPayload,
  PublicVisitorPassResponse,
} from "../types/visitorPass";

export const visitorPassKeys = {
  all: ["visitorPasses"] as const,
  lists: () => [...visitorPassKeys.all, "list"] as const,
  list: (params?: VisitorPassListParams) => [...visitorPassKeys.lists(), params] as const,
  details: () => [...visitorPassKeys.all, "detail"] as const,
  detail: (id: number) => [...visitorPassKeys.details(), id] as const,
  eligibleCustomers: () => [...visitorPassKeys.all, "eligible-customers"] as const,
  activeInFacility: () => [...visitorPassKeys.all, "active-in-facility"] as const,
  publicPass: (token: string) => ["publicVisitorPass", token] as const,
  publicInvitation: (token: string) => ["publicVisitorInvitation", token] as const,
};

/**
 * Hook untuk daftar paginasi visitor pass dengan filter
 */
export function useVisitorPassList(params?: VisitorPassListParams) {
  return useQuery({
    queryKey: visitorPassKeys.list(params),
    queryFn: () => visitorPassApi.list(params).then((r) => r.data),
    placeholderData: (prev) => prev,
    staleTime: 10_000,
  });
}

/**
 * Hook untuk detail satu visitor pass beserta log auditnya
 */
export function useVisitorPass(id: number | undefined) {
  return useQuery({
    queryKey: visitorPassKeys.detail(id ?? 0),
    queryFn: () =>
      visitorPassApi.show(id!).then((r) => {
        const body = r.data as any;
        return (body?.data ?? body) as VisitorPass;
      }),
    enabled: !!id,
  });
}

/**
 * Hook untuk daftar customer yang memiliki kontrak aktif di CRM
 */
export function useEligibleCustomers() {
  return useQuery({
    queryKey: visitorPassKeys.eligibleCustomers(),
    queryFn: () => visitorPassApi.getEligibleCustomers().then((r) => r.data.data),
    staleTime: 60_000,
  });
}

/**
 * Hook untuk daftar tamu yang saat ini sedang berada di dalam gedung (Active in Facility)
 */
export function useActiveInFacility(refetchInterval: number | false = 15_000) {
  return useQuery({
    queryKey: visitorPassKeys.activeInFacility(),
    queryFn: () => visitorPassApi.getActiveInFacility().then((r) => r.data.data),
    refetchInterval,
  });
}

/**
 * Hook mutasi untuk membuat pendaftaran izin tamu baru
 */
export function useCreateVisitorPass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVisitorPassPayload) =>
      visitorPassApi.create(payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: visitorPassKeys.all });
    },
  });
}

/**
 * Hook mutasi untuk verifikasi scanner pos jaga (Check-In & Anti-Replay)
 */
export function useScanVerifyVisitorPass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ScanVerifyPayload) =>
      visitorPassApi.scanVerify(payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: visitorPassKeys.all });
    },
  });
}

/**
 * Hook mutasi untuk Check-Out tamu dari fasilitas
 */
export function useCheckOutVisitorPass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes, exitGate }: { id: number; notes?: string; exitGate?: string }) =>
      visitorPassApi.checkOut(id, notes, exitGate).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: visitorPassKeys.all });
    },
  });
}

/**
 * Hook mutasi untuk membatalkan izin kunjungan
 */
export function useCancelVisitorPass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      visitorPassApi.cancel(id, reason).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: visitorPassKeys.all });
    },
  });
}

/**
 * Hook mutasi untuk operator menyetujui izin kunjungan yang sudah diregistrasi tamu.
 * Menerima id saja, atau { id, notes } untuk menyertakan catatan persetujuan (audit trail).
 */
export function useApproveVisitorPass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (param: number | { id: number; notes?: string }) => {
      const id = typeof param === "number" ? param : param.id;
      const notes = typeof param === "number" ? undefined : param.notes;
      return visitorPassApi.approveVisitorPass(id, notes).then((r) => r.data.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: visitorPassKeys.all });
    },
  });
}

/**
 * Hook publik untuk melihat digital badge tamu tanpa login
 */
export function usePublicVisitorPass(
  publicUrlToken: string | undefined,
  options?: {
    refetchInterval?:
      | number
      | false
      | ((query: Query<PublicVisitorPassResponse["data"]>) => number | false | undefined);
  }
) {
  return useQuery({
    queryKey: visitorPassKeys.publicPass(publicUrlToken ?? ""),
    queryFn: () => visitorPassApi.getPublicPass(publicUrlToken!).then((r) => r.data.data),
    enabled: !!publicUrlToken,
    retry: 1,
    ...options,
  });
}

/**
 * Hook mutasi untuk operator mengirim undangan registrasi mandiri ke PIC/vendor
 */
export function useInviteVisitorPass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteVisitorPayload) =>
      visitorPassApi.invite(payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: visitorPassKeys.all });
    },
  });
}

/**
 * Hook publik untuk mengambil detail undangan kunjungan sebelum tamu registrasi
 */
export function useVisitorInvitation(
  invitationToken: string | undefined,
  options?: {
    refetchInterval?: number | false | ((query: any) => number | false | undefined);
  }
) {
  return useQuery({
    queryKey: visitorPassKeys.publicInvitation(invitationToken ?? ""),
    queryFn: () => visitorPassApi.getInvitation(invitationToken!).then((r) => r.data.data),
    enabled: !!invitationToken,
    retry: 1,
    ...options,
  });
}

/**
 * Hook publik untuk submit registrasi mandiri tamu
 */
export function useSubmitVisitorRegistration(invitationToken: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SelfRegisterPayload) =>
      visitorPassApi.submitRegistration(invitationToken, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: visitorPassKeys.all });
      qc.invalidateQueries({ queryKey: visitorPassKeys.publicInvitation(invitationToken) });
    },
  });
}
