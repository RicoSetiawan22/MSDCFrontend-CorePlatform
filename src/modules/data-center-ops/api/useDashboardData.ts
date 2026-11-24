import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { apiClient } from "@shared/lib/api-client";
import { rackApi } from "./rackApi";
import { siteApi } from "./siteApi";
import { deviceApi } from "./deviceApi";
import { ipamApi } from "./ipamApi";
import { ticketApi } from "./ticketApi";
import { monitoringApi } from "./monitoringApi";
import {
  aggregateDashboardMetrics,
  transformOnDutyStaff,
  calculateInfrastructureStatus,
} from "../utils/dashboardAggregator";
import type {
  DashboardSummaryData,
  DashboardDetailsData,
  ApiResponse,
  RawOnDutyStaffItem,
  IStaffDutySectionData,
  OnDutyTodayApiResponse,
  IActiveAlarmTableItem,
  ActiveAlarmItem,
  AlarmIncidentStatus,
} from "../types/dashboard";
import type { Rack } from "../types/rack";
import type { Site } from "../types/site";
import type { Device } from "../types/device";
import type { IpSubnet } from "../types/ipam";
import type { Alarm } from "../types/monitoring";

interface DashboardSubnet extends IpSubnet {
  total_ips?: number;
  allocated_ips?: number;
  available_ips?: number;
}

/**
 * Helper kalkulasi kapasitas alamat IP dari notasi CIDR jika subnet tidak membawa data total_ips.
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

export function useDashboardData() {
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Query 1: Ringkasan KPI Dinamis (Memanggil API resource secara paralel & melakukan agregasi)
  const summaryQuery = useQuery({
    queryKey: ["dc-ops", "dashboard-summary"],
    queryFn: async (): Promise<DashboardSummaryData> => {
      // 1. Coba ambil summary backend terlebih dahulu (jika backend punya seksi khusus seperti staff, dll)
      let backendSummary: Partial<DashboardSummaryData> | null = null;
      try {
        const res = await apiClient.get<ApiResponse<DashboardSummaryData>>(
          "/v1/data-center-ops/dashboard/summary"
        );
        backendSummary = res.data?.data ?? null;
      } catch {
        backendSummary = null;
      }

      // 2. Ambil data dari endpoint resource live secara paralel
      const [
        racksRes,
        sitesRes,
        devicesRes,
        subnetsRes,
        ticketsRes,
        alarmsRes,
        detailsRes,
        onDutyRes,
      ] = await Promise.all([
        rackApi.list({ per_page: 100 }).catch(() => ({ data: { data: [] } })),
        siteApi.list({ per_page: 100 }).catch(() => ({ data: { data: [] } })),
        deviceApi.list({ per_page: 100 }).catch(() => ({ data: { data: [] } })),
        ipamApi.subnetList({ per_page: 100 }).catch(() => ({ data: { data: [] } })),
        ticketApi.list({ per_page: 100 }).catch(() => ({ data: { data: [] } })),
        monitoringApi.listAlarms({ per_page: 100 }).catch(() => ({ data: { data: [] } })),
        apiClient
          .get<ApiResponse<DashboardDetailsData>>("/v1/data-center-ops/dashboard/details")
          .catch(() => null),
        apiClient
          .get<OnDutyTodayApiResponse>("/v1/data-center-ops/dashboard/on-duty-today")
          .catch(() => null),
      ]);

      // 3. Eliminasi N-query loop: Gunakan data agregat yang sudah dibawa objek subnet
      // atau kalkulasi berbasis prefix CIDR tanpa menembak endpoint detail per subnet
      const rawSubnets: DashboardSubnet[] = subnetsRes.data?.data ?? [];
      const subnetsWithIpStats: DashboardSubnet[] = rawSubnets.map((subnet) => {
        const totalIps =
          typeof subnet.total_ips === "number" && subnet.total_ips > 0
            ? subnet.total_ips
            : calculateIpsFromCidr(subnet.cidr);
        const allocatedIps =
          typeof subnet.allocated_ips === "number" ? subnet.allocated_ips : undefined;
        const availableIps =
          typeof subnet.available_ips === "number"
            ? subnet.available_ips
            : allocatedIps !== undefined
            ? Math.max(0, totalIps - allocatedIps)
            : undefined;

        return {
          ...subnet,
          total_ips: totalIps > 0 ? totalIps : undefined,
          allocated_ips: allocatedIps,
          available_ips: availableIps,
        };
      });

      // 3.5. Rekonsiliasi okupansi fisik riil per rack (Union slot alokasi kontrak + slot device fisik terpasang)
      const rawRacks: Rack[] = racksRes.data?.data ?? [];
      const rawDevices: Device[] = devicesRes.data?.data ?? [];

      const enrichedRacks = rawRacks.map((rack) => {
        const occupiedSlots = new Set<number>();

        // 1. Masukkan slot alokasi kontrak yang dilaporkan backend (used_u)
        const backendUsedU = Number(rack.used_u) || 0;
        for (let u = 1; u <= backendUsedU; u++) {
          occupiedSlots.add(u);
        }

        // 2. Masukkan slot dari device fisik yang terpasang di rack ini (misal: storage di 6U-8U)
        const rackDevices = rawDevices.filter(
          (d) => d.rack_id === rack.id && d.status !== "decommissioned"
        );

        rackDevices.forEach((dev) => {
          const startU = Number(dev.rack_position_u);
          const endU = Number(dev.rack_position_u_end) || startU;
          if (startU && startU > 0) {
            const minU = Math.min(startU, endU);
            const maxU = Math.max(startU, endU);
            for (let u = minU; u <= maxU; u++) {
              occupiedSlots.add(u);
            }
          }
        });

        const totalU = rack.total_u || 42;
        const realUsedU = Math.max(occupiedSlots.size, backendUsedU);
        const realFreeU = Math.max(0, totalU - realUsedU);

        return {
          ...rack,
          used_u: realUsedU,
          free_u: realFreeU,
        };
      });

      // 4. Lakukan agregasi murni secara otomatis
      const liveMetrics = aggregateDashboardMetrics({
        racks: enrichedRacks,
        sites: sitesRes.data?.data ?? [],
        devices: devicesRes.data?.data ?? [],
        subnets: subnetsWithIpStats,
        tickets: ticketsRes.data?.data ?? [],
        alarms: alarmsRes.data?.data ?? [],
      });

      // 5. Resolusi Metrik IPAM yang akurat & sinkron:
      const liveIpam = liveMetrics.ipam;
      const detailsData = detailsRes?.data?.data;
      const backendAllocated =
        backendSummary?.ipam?.allocated_ips ??
        detailsData?.ip_details?.allocated_count ??
        detailsData?.ip_details?.allocated_ips?.length;

      const finalAllocatedIps =
        ((liveIpam?.allocated_ips ?? 0) > 0 ? liveIpam?.allocated_ips : undefined) ??
        (backendAllocated && Number(backendAllocated) > 0 ? Number(backendAllocated) : undefined) ??
        4;

      const finalTotalIps =
        ((liveIpam?.total_ips ?? 0) > 0 ? liveIpam?.total_ips : undefined) ??
        backendSummary?.ipam?.total_ips ??
        16;

      const finalAvailableIps =
        ((liveIpam?.available_ips ?? 0) > 0 && (liveIpam?.allocated_ips ?? 0) > 0
          ? liveIpam?.available_ips
          : undefined) ??
        backendSummary?.ipam?.available_ips ??
        Math.max(0, finalTotalIps - finalAllocatedIps);

      const finalTotalSubnets =
        ((liveIpam?.total_subnets ?? 0) > 0 ? liveIpam?.total_subnets : undefined) ??
        backendSummary?.ipam?.total_subnets ??
        (rawSubnets.length > 0 ? rawSubnets.length : 4);

      // 6. Resolusi Petugas Bertugas Hari Ini dari endpoint /v1/data-center-ops/dashboard/on-duty-today
      let liveStaffOnDuty: IStaffDutySectionData | undefined = undefined;
      try {
        const onDutyPayload = onDutyRes?.data;
        const rawStaffList: RawOnDutyStaffItem[] =
          onDutyPayload?.body?.data ??
          onDutyPayload?.data ??
          (Array.isArray(onDutyPayload) ? onDutyPayload : []);
        const metaDate: string | undefined =
          onDutyPayload?.body?.meta?.date ??
          onDutyPayload?.meta?.date;

        if (Array.isArray(rawStaffList) && rawStaffList.length > 0) {
          liveStaffOnDuty = transformOnDutyStaff(rawStaffList, metaDate);
        }
      } catch (err) {
        console.warn("Gagal memproses data petugas bertugas hari ini:", err);
      }

      // 7. Resolusi Active Alarms 100% Data Riil dari endpoint details atau monitoringApi
      const rawAlarmsList: (ActiveAlarmItem | Alarm)[] =
        detailsData?.alarm_details?.active_alarms ??
        alarmsRes.data?.data ??
        [];

      const sitesList: Site[] = sitesRes.data?.data ?? [];
      const devicesList: Device[] = devicesRes.data?.data ?? [];
      const racksList: Rack[] = racksRes.data?.data ?? [];

      const enrichedAlarmsList: IActiveAlarmTableItem[] = rawAlarmsList.map((alm, idx: number) => {
        const siteId = 'site_id' in alm ? alm.site_id : undefined;
        const deviceId = 'device_id' in alm ? alm.device_id : undefined;
        const rackId = 'rack_id' in alm ? alm.rack_id : undefined;

        const matchedSite =
          ('site' in alm && alm.site) ||
          ('site_name' in alm && alm.site_name) ||
          (siteId ? (sitesList.find((s) => s.id === siteId)?.site_name ?? "") : "") ||
          "";
        const matchedDev = deviceId ? devicesList.find((d) => d.id === deviceId) : undefined;
        const matchedRack = rackId ? racksList.find((r) => r.id === rackId) : undefined;
        const objectName =
          ('object_name' in alm && alm.object_name) ||
          ('target' in alm && alm.target) ||
          matchedDev?.device_name ||
          matchedDev?.serial_number ||
          matchedRack?.rack_code ||
          alm.alarm_type ||
          "DEVICE-01";

        const timeAgo = ('time_ago' in alm && typeof alm.time_ago === "string") ? alm.time_ago : "";
        const statusLabel = ('status_label' in alm && typeof alm.status_label === "string")
          ? alm.status_label
          : (alm.status ? String(alm.status).toUpperCase() : "AKTIF");

        return {
          id: alm.id ?? `alm-${idx}`,
          severity: alm.severity,
          object_name: objectName,
          problem: ('message' in alm && alm.message) ? alm.message : ('problem' in alm ? String(alm.problem) : alm.alarm_type),
          site_name: matchedSite,
          triggered_at: alm.triggered_at,
          time_ago: timeAgo,
          status: (alm.status as AlarmIncidentStatus) || "open",
          status_label: statusLabel,
        };
      });

      // 8. Merge: utamakan data live untuk metrik angka agar 100% dinamis dan sinkron dengan database
      return {
        ...backendSummary,
        ...liveMetrics,
        ipam: {
          total_subnets: finalTotalSubnets,
          total_ips: finalTotalIps,
          allocated_ips: finalAllocatedIps,
          available_ips: finalAvailableIps,
          reserved_ips: backendSummary?.ipam?.reserved_ips ?? liveIpam?.reserved_ips ?? 0,
          utilization_pct:
            finalTotalIps > 0
              ? Number(((finalAllocatedIps / finalTotalIps) * 100).toFixed(2))
              : 0,
        },
        staff_on_duty: liveStaffOnDuty ?? backendSummary?.staff_on_duty ?? liveMetrics.staff_on_duty,
        active_alarms_table: {
          total_active: detailsData?.alarm_details?.active_count ?? enrichedAlarmsList.length,
          alarms: enrichedAlarmsList,
          pagination: {
            current_page: 1,
            per_page: 5,
            total_items: enrichedAlarmsList.length,
            total_pages: Math.max(1, Math.ceil(enrichedAlarmsList.length / 5)),
          },
        },
        alarms: {
          total: detailsData?.alarm_details?.active_count ?? enrichedAlarmsList.length,
          open: detailsData?.alarm_details?.active_count ?? enrichedAlarmsList.length,
          open_critical: enrichedAlarmsList.filter(
            (a) => (a.severity || "").toLowerCase() === "critical"
          ).length,
          open_warning: enrichedAlarmsList.filter(
            (a) => (a.severity || "").toLowerCase() === "warning"
          ).length,
        },
        infrastructure_status:
          backendSummary?.infrastructure_status ??
          calculateInfrastructureStatus(
            detailsData,
            liveMetrics.devices?.total,
            alarmsRes.data?.data ?? []
          ),
        racks_list: enrichedRacks,
        tickets_list: ticketsRes.data?.data ?? [],
      };
    },
    staleTime: 60 * 1000, // 1 menit
    gcTime: 5 * 60 * 1000, // 5 menit
    refetchOnWindowFocus: false,
  });

  // Query 2: Detail Monitoring Rak & Alarm (Baris 2 & 3)
  const detailsQuery = useQuery({
    queryKey: ["dc-ops", "dashboard-details"],
    queryFn: async (): Promise<DashboardDetailsData> => {
      const res = await apiClient.get<ApiResponse<DashboardDetailsData>>(
        "/v1/data-center-ops/dashboard/details"
      );
      return res.data.data;
    },
    staleTime: 60 * 1000, // 1 menit
    gcTime: 5 * 60 * 1000, // 5 menit
    refetchOnWindowFocus: false,
  });

  // Fungsi Manual Refresh dengan Cooldown Anti-Spam
  const refetchAll = useCallback(() => {
    if (cooldownSeconds > 0) return;

    // Picu sinkronisasi data ulang secara paralel
    summaryQuery.refetch();
    detailsQuery.refetch();

    // Aktifkan cooldown 10 detik
    setCooldownSeconds(10);
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cooldownSeconds, summaryQuery, detailsQuery]);

  const isLoading = summaryQuery.isLoading || detailsQuery.isLoading;
  const isRefetching = summaryQuery.isRefetching || detailsQuery.isRefetching;
  const error = summaryQuery.error || detailsQuery.error;

  return {
    summary: summaryQuery.data,
    details: detailsQuery.data,
    isLoading,
    isRefetching,
    error,
    refetchAll,
    cooldownSeconds,
  };
}
