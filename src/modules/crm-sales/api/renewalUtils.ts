import type { Contract, ContractStatus } from "../types/contract";
import type { RenewalData, RenewalRow, RenewalUrgency } from "../types/renewal";

/** Batas hari per tingkat urgensi (sisa hari <= batas). Ubah di sini kalau
 * kebijakan berubah. */
export const URGENCY_LIMIT = { darurat: 7, peringatan: 30, persiapan: 90 } as const;

/** Status kontrak perpanjangan yang dianggap "sedang diproses". */
export const IN_PROGRESS_STATUSES: ContractStatus[] = [
  "draft",
  "pending_finance_approval",
  "pending_legal_approval",
  "sent_to_client",
];

export const URGENCY_LABEL: Record<RenewalUrgency, string> = {
  darurat: "Darurat",
  peringatan: "Peringatan",
  persiapan: "Persiapan",
};

export function getUrgency(daysLeft: number): RenewalUrgency {
  if (daysLeft <= URGENCY_LIMIT.darurat) return "darurat";
  if (daysLeft <= URGENCY_LIMIT.peringatan) return "peringatan";
  return "persiapan";
}

/** Susun data halaman Perpanjangan dari SEMUA contract (tanpa filter status). */
export function buildRenewalData(all: Contract[]): RenewalData {
  // Kontrak perpanjangan terbaru per parent (hanya yang diproses / sudah aktif).
  const childByParent = new Map<number, Contract>();
  for (const c of all) {
    if (!c.parent_contract_id) continue;
    const relevant = c.status === "active" || c.status === "expiring_soon" || IN_PROGRESS_STATUSES.includes(c.status);
    if (!relevant) continue;
    const prev = childByParent.get(c.parent_contract_id);
    if (!prev || c.id > prev.id) childByParent.set(c.parent_contract_id, c);
  }

  let inProgress = 0;
  let renewed = 0;
  childByParent.forEach((child) => {
    if (IN_PROGRESS_STATUSES.includes(child.status)) inProgress += 1;
    else renewed += 1;
  });

  const rows: RenewalRow[] = all
    .filter((c) => c.status === "active" && c.days_until_expiry !== null && c.days_until_expiry <= URGENCY_LIMIT.persiapan)
    .map((c) => {
      const child = childByParent.get(c.id) ?? null;
      return {
        contract: c,
        daysLeft: c.days_until_expiry as number,
        urgency: getUrgency(c.days_until_expiry as number),
        renewal: child && IN_PROGRESS_STATUSES.includes(child.status) ? child : null,
      };
    })
    // Yang sudah punya perpanjangan AKTIF dianggap beres -> keluar dari daftar.
    .filter((r) => {
      const child = childByParent.get(r.contract.id);
      return !child || IN_PROGRESS_STATUSES.includes(child.status);
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    rows,
    childByParent,
    kpis: {
      within90: rows.length,
      within60: rows.filter((r) => r.daysLeft <= 60).length,
      within30: rows.filter((r) => r.daysLeft <= 30).length,
      emergency: rows.filter((r) => r.urgency === "darurat").length,
      inProgress,
      renewed,
    },
  };
}

/** Nama penjual - backend belum punya field baku, jadi coba beberapa key. */
export function readSalesName(contract: Contract): string {
  const row = contract as unknown as Record<string, unknown>;
  for (const key of ["sales_name", "salesperson", "sales_person", "created_by_name", "creator", "created_by_user"]) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) return v;
    if (v && typeof v === "object") {
      const name = (v as Record<string, unknown>).name;
      if (typeof name === "string" && name.trim()) return name;
    }
  }
  return "—";
}

/* ───────── Helper tanggal (UTC, format YYYY-MM-DD) ───────── */

function parseISO(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
export function todayISO(): string {
  return toISO(new Date());
}
export function addDays(s: string, n: number): string {
  const d = parseISO(s);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}
export function addMonths(s: string, n: number): string {
  const d = parseISO(s);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return toISO(d);
}
/** Tanggal berakhir untuk periode yang mulai di `start` selama `months` bulan. */
export function periodEnd(start: string, months: number): string {
  return addDays(addMonths(start, months), -1);
}
