/**
 * Aturan tunggal kapan QR Code akses visitor pass BOLEH ditampilkan (ISO 27001 - Physical Access Control).
 *
 * QR hanya dirender bila tiket berstatus 'scheduled', belum dipindai (single-use), belum lewat
 * valid_until, DAN payload berupa token QR resmi dari backend ('VPQR_...'). TIDAK ADA fallback ke
 * public_url_token / token URL / pass_number: tiket hangus (completed/expired/cancelled/denied)
 * memang dikirim backend dengan qr_payload = null dan harus tampil tanpa QR.
 */

export type VisitorQrInactiveReason =
  | "pending_registration"
  | "registered"
  | "checked_in"
  | "completed"
  | "expired"
  | "cancelled"
  | "denied"
  | "unavailable";

export type VisitorQrState =
  | { kind: "active"; payload: string }
  | { kind: "inactive"; reason: VisitorQrInactiveReason };

/** Field yang dibaca dari VisitorPass (operator) maupun respons E-Badge publik. */
export interface VisitorQrSource {
  status?: string | null;
  valid_until?: string | null;
  valid_to?: string | null;
  qr_payload?: string | null;
  raw_qr_token?: string | null;
  is_consumed?: boolean | null;
  is_expired?: boolean | null;
}

const QR_TOKEN_PATTERN = /^VPQR_[A-Za-z0-9]+$/;

export function isVisitorQrToken(value: unknown): value is string {
  return typeof value === "string" && QR_TOKEN_PATTERN.test(value);
}

/**
 * Alasan QR tidak aktif berdasarkan status & masa berlaku saja (tanpa melihat payload),
 * atau null bila tiket boleh menampilkan QR.
 */
export function getVisitorQrInactiveReason(
  pass: VisitorQrSource | null | undefined,
  now: number = Date.now(),
): VisitorQrInactiveReason | null {
  if (!pass) return "unavailable";

  switch (pass.status) {
    case "pending_registration":
      return "pending_registration";
    case "registered":
      return "registered";
    case "active_in_facility":
    case "overstayed":
      return "checked_in";
    case "completed":
      return "completed";
    case "expired":
      return "expired";
    case "cancelled":
      return "cancelled";
    case "denied":
      return "denied";
    case "scheduled":
      break;
    default:
      return "unavailable";
  }

  if (pass.is_consumed) return "checked_in";

  const validUntil = pass.valid_until || pass.valid_to;
  const validUntilMs = validUntil ? new Date(validUntil).getTime() : NaN;
  if (pass.is_expired || (!isNaN(validUntilMs) && validUntilMs <= now)) return "expired";

  return null;
}

/** Tentukan payload QR yang boleh dirender, atau alasan QR tidak aktif. */
export function resolveVisitorQrState(
  pass: VisitorQrSource | null | undefined,
  now: number = Date.now(),
): VisitorQrState {
  const reason = getVisitorQrInactiveReason(pass, now);
  if (reason) return { kind: "inactive", reason };

  const payload = [pass?.qr_payload, pass?.raw_qr_token].find(isVisitorQrToken);
  return payload ? { kind: "active", payload } : { kind: "inactive", reason: "unavailable" };
}

export const VISITOR_QR_INACTIVE_COPY: Record<
  Exclude<VisitorQrInactiveReason, "pending_registration" | "registered">,
  { title: string; description: string; buttonLabel: string }
> = {
  checked_in: {
    title: "Sudah Check-In",
    description:
      "QR Code telah dipindai di pos jaga dan tidak dapat digunakan ulang (single-use). Lakukan check-out di pos jaga saat meninggalkan fasilitas.",
    buttonLabel: "QR Sudah Dipakai",
  },
  completed: {
    title: "Kunjungan Selesai",
    description: "Tiket telah hangus setelah check-out. QR Code tidak berlaku lagi untuk akses fasilitas.",
    buttonLabel: "Tiket Hangus",
  },
  expired: {
    title: "Tiket Kedaluwarsa",
    description:
      "Masa berlaku QR Code telah berakhir. Hubungi operator data center untuk menerbitkan undangan kunjungan baru.",
    buttonLabel: "Tiket Kedaluwarsa",
  },
  cancelled: {
    title: "Tiket Dibatalkan",
    description: "Izin kunjungan ini telah dibatalkan oleh operator data center. QR Code tidak berlaku.",
    buttonLabel: "Tiket Dibatalkan",
  },
  denied: {
    title: "Akses Ditolak",
    description: "Izin kunjungan ini ditolak oleh operator data center. QR Code tidak berlaku.",
    buttonLabel: "Akses Ditolak",
  },
  unavailable: {
    title: "QR Code Tidak Tersedia",
    description:
      "QR Code akses belum dapat ditampilkan. Muat ulang halaman, atau hubungi operator data center bila masalah berlanjut.",
    buttonLabel: "QR Tidak Tersedia",
  },
};
