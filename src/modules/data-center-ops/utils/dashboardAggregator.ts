import type { Rack } from "../types/rack";
import type { Site } from "../types/site";
import type { Device } from "../types/device";
import type { IpSubnet } from "../types/ipam";
import type { Ticket } from "../types/ticket";
import type { Alarm } from "../types/monitoring";
import type {
  DashboardSummaryData,
  DashboardDetailsData,
  RawOnDutyStaffItem,
  IStaffDutySectionData,
  ISiteStaffGroup,
  IInfraStatusSectionData,
} from "../types/dashboard";

export interface ExtendedSubnet extends IpSubnet {
  total_ips?: number;
  allocated_ips?: number;
  available_ips?: number;
}

export interface RawDashboardResponses {
  racks: Rack[];
  sites: Site[];
  devices: Device[];
  subnets: ExtendedSubnet[];
  tickets: Ticket[];
  alarms: Alarm[];
}

/**
 * Helper kalkulasi kapasitas alamat IP dari notasi CIDR.
 * Contoh: /24 -> 256 IP, /28 -> 16 IP, /29 -> 8 IP.
 */
function calculateIpsFromCidr(cidr?: string): number {
  if (!cidr) return 0;
  const parts = cidr.split("/");
  if (parts.length < 2) return 0;
  const prefix = parseInt(parts[1], 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return 0;
  return Math.pow(2, 32 - prefix);
}

export function aggregateDashboardMetrics(raw: RawDashboardResponses): DashboardSummaryData {
  // 1. Agregasi RACK (Kalkulasi dinamis total U, used U, free U dari database live)
  const totalRacks = raw.racks.length;
  const totalU = raw.racks.reduce((acc, r) => acc + (r.total_u || 0), 0);
  const usedU = raw.racks.reduce((acc, r) => acc + (r.used_u || 0), 0);
  const freeU = raw.racks.reduce(
    (acc, r) => acc + (r.free_u ?? Math.max(0, (r.total_u || 0) - (r.used_u || 0))),
    0
  );

  // 2. Agregasi SITE
  const totalSites = raw.sites.length;
  const activeSites = raw.sites.filter((s) => s.status === "active").length;
  const maintSites = raw.sites.filter((s) => s.status === "maintenance").length;

  // 3. Agregasi IPAM
  const totalIps = raw.subnets.reduce(
    (acc, s) => acc + (s.total_ips ?? calculateIpsFromCidr(s.cidr)),
    0
  );
  const allocatedIps = raw.subnets.reduce(
    (acc, s) => acc + (s.allocated_ips ?? 0),
    0
  );
  const availableIps = raw.subnets.reduce(
    (acc, s) =>
      acc +
      (s.available_ips ??
        Math.max(
          0,
          (s.total_ips ?? calculateIpsFromCidr(s.cidr)) -
            (s.allocated_ips ?? 0)
        )),
    0
  );

  // 4. Agregasi DEVICE
  const totalDevices = raw.devices.length;
  const activeDevices = raw.devices.filter((d) => d.status === "active").length;
  const availableDevices = raw.devices.filter(
    (d) => d.status === "spare" || d.status === "maintenance"
  ).length;

  // 5. Agregasi TICKET (Mendukung ITIL lifecycle, SLA overdue, dan timestamp penyelesaian)
  const totalTickets = raw.tickets.length;
  // Tiket yang aktif dan membutuhkan tindakan teknisi (belum resolved dan belum closed)
  const openTickets = raw.tickets.filter(
    (t) =>
      t.status === "trouble" ||
      t.status === "maintenance" ||
      t.status === "pending_customer" ||
      (!t.resolved_at && t.status !== "closed" && t.status !== "normal")
  ).length;

  // Tiket yang sudah terselesaikan (status normal atau sudah ada resolved_at, namun belum closed)
  const resolvedTickets = raw.tickets.filter(
    (t) =>
      (t.status === "normal" || (t.status as string) === "resolved" || Boolean(t.resolved_at)) &&
      t.status !== "closed"
  ).length;

  // Tiket yang sudah ditutup resmi
  const closedTickets = raw.tickets.filter((t) => t.status === "closed").length;

  // Tiket yang melanggar batas waktu respon atau resolusi SLA
  const overdueSla = raw.tickets.filter(
    (t) => Boolean(t.is_response_overdue) || Boolean(t.is_resolution_overdue)
  ).length;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const tickets7d = raw.tickets.filter(
    (t) => new Date(t.created_at) >= sevenDaysAgo
  ).length;

  // 6. Agregasi ALARM
  const totalAlarms = raw.alarms.length;
  const criticalAlarms = raw.alarms.filter((a) => a.severity === "critical").length;
  const warningAlarms = raw.alarms.filter((a) => a.severity === "warning").length;

  return {
    system_status: criticalAlarms > 0 ? "DEGRADED" : "OPERATIONAL",
    last_sync_time: new Date().toISOString(),
    sites: {
      total: totalSites,
      active: activeSites,
      maintenance: maintSites,
      decommissioned: Math.max(0, totalSites - activeSites - maintSites),
    },
    racks: {
      total: totalRacks,
      active: raw.racks.filter((r) => r.status === "active").length,
      total_u: totalU,
      used_u: usedU,
      free_u: freeU,
      utilization_pct: totalU > 0 ? Number(((usedU / totalU) * 100).toFixed(2)) : 0,
    },
    ipam: {
      total_subnets: raw.subnets.length,
      total_ips: totalIps,
      allocated_ips: allocatedIps,
      available_ips: availableIps,
      reserved_ips: 0,
      utilization_pct:
        totalIps > 0 ? Number(((allocatedIps / totalIps) * 100).toFixed(2)) : 0,
    },
    devices: {
      total: totalDevices,
      active: activeDevices,
      spare: availableDevices,
      maintenance: raw.devices.filter((d) => d.status === "maintenance").length,
    },
    tickets: {
      total: totalTickets,
      open: openTickets,
      resolved: resolvedTickets,
      closed: closedTickets,
      overdue_sla: overdueSla,
      created_7d: tickets7d,
    },
    alarms: {
      total: totalAlarms,
      open: totalAlarms,
      open_critical: criticalAlarms,
      open_warning: warningAlarms,
    },
  };
}

/**
 * Format nama staf agar rapi dan kapital di awal kata
 */
function formatStaffName(name: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => {
      if (!word) return "";
      return word
        .split(".")
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ""))
        .join(".");
    })
    .join(" ");
}

/**
 * Buat inisial avatar 1-2 huruf
 */
function getStaffInitials(name: string): string {
  if (!name) return "ST";
  const cleaned = name.replace(/[^a-zA-Z\s]/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return name.charAt(0).toUpperCase() || "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format teks shift, misal "SH2 (06:00 - 14:00)"
 */
function formatShiftTime(code?: string, start?: string, end?: string): string {
  const s = start ? start.slice(0, 5) : "";
  const e = end ? end.slice(0, 5) : "";
  const timeRange = s && e ? ` (${s} - ${e})` : "";
  return `${code || "Shift"}${timeRange}`;
}

/**
 * Transform data raw dari endpoint `/v1/data-center-ops/dashboard/on-duty-today`
 * menjadi format siap pakai `IStaffDutySectionData` terkelompokkan per site.
 */
export function transformOnDutyStaff(
  rawList: RawOnDutyStaffItem[],
  metaDate?: string
): IStaffDutySectionData {
  const d = metaDate ? new Date(metaDate) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const dutyDateFormatted = validDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const siteMap = new Map<number, ISiteStaffGroup>();

  for (const item of rawList) {
    const siteId = item.site_id ?? 0;
    const siteName = item.site_name || `Site ${siteId}`;

    if (!siteMap.has(siteId)) {
      siteMap.set(siteId, {
        site_id: siteId,
        site_name: siteName,
        total_on_duty: 0,
        staff_members: [],
      });
    }

    const group = siteMap.get(siteId)!;
    group.total_on_duty += 1;
    group.staff_members.push({
      id: item.employee_id || item.schedule_id,
      schedule_id: item.schedule_id,
      employee_id: item.employee_id,
      name: formatStaffName(item.employee_name),
      employee_number: item.employee_number,
      role: item.position_title || "Staff NOC",
      avatar_initials: getStaffInitials(item.employee_name),
      avatar_url: null,
      shift: formatShiftTime(item.shift_code, item.shift_start, item.shift_end),
      shift_code: item.shift_code,
      shift_start: item.shift_start,
      shift_end: item.shift_end,
      email: item.email,
      phone: item.phone,
      status: "on_duty",
      status_label: "BERTUGAS",
      skills: item.skills || [],
      open_tickets_count: item.open_tickets_count || 0,
    });
  }

  const sites = Array.from(siteMap.values()).sort(
    (a, b) => Number(a.site_id) - Number(b.site_id)
  );

  return {
    duty_date: metaDate || validDate.toISOString().slice(0, 10),
    duty_date_formatted: dutyDateFormatted,
    total_sites: sites.length,
    total_staff_active: rawList.length,
    sites,
  };
}

/**
 * Helper format waktu relatif dengan toleransi Time Skew (clock drift).
 * Mengatasi masalah perbedaan jam server vs jam lokal komputer pengguna.
 * Jika jam klien sedikit mendahului atau tertinggal dari server,
 * tidak akan menghasilkan nilai negatif yang membingungkan.
 */
export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return "Baru saja";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Baru saja";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Toleransi clock skew: Jika waktu server sedikit lebih baru daripada jam lokal pengguna
  // (misal hingga 5 menit / -300 detik di depan) atau selisih di bawah 60 detik, anggap "Baru saja"
  if (diffInSeconds < 60 && diffInSeconds >= -300) {
    return "Baru saja";
  }

  const absSeconds = Math.abs(diffInSeconds);
  const minutes = Math.floor(absSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) {
    return `${minutes} menit yang lalu`;
  }
  if (hours < 24) {
    return `${hours} jam yang lalu`;
  }
  if (days === 1) {
    return "Kemarin";
  }
  return `${days} hari yang lalu`;
}

/**
 * Fallback format nama site: menampilkan '—' jika kosong, null, undefined, atau '-'.
 */
export function formatSiteName(site?: string | null): string {
  if (!site || site.trim() === "" || site.trim() === "-") {
    return "—";
  }
  return site.trim();
}

/**
 * Kalkulasi status infrastruktur dinamis dari detail perangkat dan alarm:
 * - Dynamic Total Devices: penjumlahan device_count di data.device_details.by_customer + own_count
 * - Critical & Warning dihitung dari active alarms
 * - Healthy dihitung dari selisih total - (critical + warning)
 */
export function calculateInfrastructureStatus(
  details?: DashboardDetailsData | null,
  fallbackTotalDevices?: number,
  rawAlarms?: Alarm[]
): IInfraStatusSectionData {
  // 1. Dynamic Total Devices calculation:
  // Menjumlahkan properti device_count di dalam data.device_details.by_customer beserta own_count
  const customerDevices =
    details?.device_details?.by_customer?.reduce(
      (acc, c) => acc + (Number(c.device_count) || 0),
      0
    ) ?? 0;
  const ownDevices = Number(details?.device_details?.own_count) || 0;
  const calculatedTotal = customerDevices + ownDevices;

  const totalDevices =
    calculatedTotal > 0
      ? calculatedTotal
      : fallbackTotalDevices && fallbackTotalDevices > 0
      ? fallbackTotalDevices
      : 135;

  // 2. Breakdown Alarms
  const activeAlarms = details?.alarm_details?.active_alarms ?? rawAlarms ?? [];
  const criticalCount = activeAlarms.filter(
    (a) => (a.severity || "").toLowerCase() === "critical"
  ).length;
  const warningCount = activeAlarms.filter(
    (a) => (a.severity || "").toLowerCase() === "warning"
  ).length;
  const healthyCount = Math.max(0, totalDevices - (criticalCount + warningCount));

  const healthyPct =
    totalDevices > 0
      ? Number(((healthyCount / totalDevices) * 100).toFixed(1))
      : 0;
  const warningPct =
    totalDevices > 0
      ? Number(((warningCount / totalDevices) * 100).toFixed(1))
      : 0;
  const criticalPct =
    totalDevices > 0
      ? Number(((criticalCount / totalDevices) * 100).toFixed(1))
      : 0;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  return {
    last_updated: timeStr,
    total_devices: totalDevices,
    healthy: { count: healthyCount, percentage: healthyPct },
    warning: { count: warningCount, percentage: warningPct },
    critical: { count: criticalCount, percentage: criticalPct },
  };
}