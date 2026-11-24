import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceLogApi } from "./serviceLogApi";
import type {
  ServiceLogLine,
  ServiceLogListParams,
  ServiceLogSummary,
  InternalServiceLogInput,
  ServiceAssetInfo,
} from "../types/serviceLog";
import type { PaginatedResponse } from "@shared/types/api";

const STORAGE_KEY_INTERNAL_LOGS = "msdc_internal_service_logs_v1";
const STORAGE_KEY_LINKED_ASSETS = "msdc_service_linked_assets_v1";

// ── LocalStorage Helpers ──
export function getStoredInternalServiceLogs(): ServiceLogLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INTERNAL_LOGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Gagal membaca internal service logs:", err);
    return [];
  }
}

export function saveStoredInternalServiceLog(
  input: InternalServiceLogInput,
  assetInfo?: ServiceAssetInfo | null
): ServiceLogLine {
  const current = getStoredInternalServiceLogs();
  const id = Date.now();
  const serviceNumber = `SRV-INT-${new Date().getFullYear()}.${String(
    current.length + 1
  ).padStart(3, "0")}`;

  const newLog: ServiceLogLine = {
    id,
    source_type: "internal",
    service_number: serviceNumber,
    description: input.description,
    quantity: input.quantity,
    uom: input.uom,
    unit_price: input.unit_price,
    amount: input.amount,
    service_date: input.service_date,
    provider_type: input.provider_type,
    technician_name: input.technician_name,
    vendor_name: input.vendor_name || (input.provider_type === "internal" ? "Tim Maintenance Internal" : undefined),
    asset_id: input.asset_id,
    asset: assetInfo || null,
    service_result: input.service_result,
    service_notes: input.service_notes,
    ba_number: input.ba_number || `BA-SRV/${new Date().getFullYear()}/${String(current.length + 1).padStart(3, "0")}`,
    ba_file_name: input.ba_file_name,
    sla_target: input.sla_target || "≤ 24 Jam",
    sla_status: input.sla_status,
    created_at: new Date().toISOString(),
    purchase_order_id: null,
    purchase_order: null,
    goods_receipt_lines: [],
  };

  const updated = [newLog, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_INTERNAL_LOGS, JSON.stringify(updated));
  } catch (err) {
    console.error("Gagal menyimpan internal service log:", err);
  }
  return newLog;
}

export function getStoredLinkedAssets(): Record<number, ServiceAssetInfo> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LINKED_ASSETS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error("Gagal membaca linked assets:", err);
    return {};
  }
}

export function linkAssetToServiceLine(
  lineId: number,
  assetInfo: ServiceAssetInfo
): void {
  const current = getStoredLinkedAssets();
  current[lineId] = assetInfo;
  try {
    localStorage.setItem(STORAGE_KEY_LINKED_ASSETS, JSON.stringify(current));
  } catch (err) {
    console.error("Gagal menghubungkan aset:", err);
  }
}

// ── Query Hooks ──
export function useServiceLogList(params: ServiceLogListParams) {
  return useQuery({
    queryKey: ["serviceLog", "list", params] as const,
    queryFn: async (): Promise<PaginatedResponse<ServiceLogLine>> => {
      let apiData: PaginatedResponse<ServiceLogLine> = {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: params.per_page || 20,
        total: 0,
        from: null,
        to: null,
      };

      try {
        const res = await serviceLogApi.list({
          search: params.search,
          po_status: params.po_status,
          date_from: params.date_from,
          date_to: params.date_to,
        });
        if (res.data) {
          apiData = res.data;
        }
      } catch (err) {
        console.warn("Backend service log API tidak merespon, menggunakan data lokal:", err);
      }

      const linkedAssets = getStoredLinkedAssets();
      const internalLogs = getStoredInternalServiceLogs();

      // Enrich API PO Lines
      const enrichedApiLines: ServiceLogLine[] = (apiData.data || []).map((line) => {
        const grLine = line.goods_receipt_lines?.[0];
        const grn = grLine?.goods_receipt;
        const po = line.purchase_order;

        // Cek apakah baris ini sudah dihubungkan ke aset oleh user
        const linkedAsset = linkedAssets[line.id] || null;

        // Tanggal pelaksanaan: ambil dari receipt_date GRN atau tanggal order PO
        const serviceDate = grn?.receipt_date || po?.order_date || "";

        // Status hasil servis berdasarkan GRN / status PO
        const serviceResult =
          grn?.status === "posted"
            ? "completed"
            : po?.status === "cancelled"
            ? "cancelled"
            : "in_progress";

        // Status SLA: jika sudah diposting GRN-nya -> on_time / within_sla
        const slaStatus =
          grn?.status === "posted"
            ? "on_time"
            : po?.status === "cancelled"
            ? "in_progress"
            : "in_progress";

        return {
          ...line,
          source_type: "po" as const,
          service_number: po?.po_number || `PO-SRV-${line.id}`,
          service_date: serviceDate,
          provider_type: "vendor" as const,
          vendor_name: po?.vendor?.vendor_name || "Vendor Rekanan",
          technician_name: po?.vendor?.vendor_name ? `Teknisi ${po.vendor.vendor_name}` : "Teknisi Vendor Rekanan",
          asset_id: linkedAsset?.id || null,
          asset: linkedAsset,
          service_result: serviceResult,
          ba_number: grn?.grn_number ? `BAST-${grn.grn_number}` : undefined,
          sla_target: "≤ 3 Hari Kerja",
          sla_status: slaStatus,
        };
      });

      // Gabungkan data PO + Servis Internal
      let combined = [...internalLogs, ...enrichedApiLines];

      // Filter: Search
      if (params.search) {
        const q = params.search.toLowerCase().trim();
        combined = combined.filter((item) => {
          const desc = item.description?.toLowerCase() || "";
          const poNum = item.purchase_order?.po_number?.toLowerCase() || "";
          const srvNum = item.service_number?.toLowerCase() || "";
          const vName = item.vendor_name?.toLowerCase() || "";
          const techName = item.technician_name?.toLowerCase() || "";
          const assetName = item.asset?.asset_name?.toLowerCase() || "";
          const assetNum = item.asset?.asset_number?.toLowerCase() || "";
          const baNum = item.ba_number?.toLowerCase() || "";
          return (
            desc.includes(q) ||
            poNum.includes(q) ||
            srvNum.includes(q) ||
            vName.includes(q) ||
            techName.includes(q) ||
            assetName.includes(q) ||
            assetNum.includes(q) ||
            baNum.includes(q)
          );
        });
      }

      // Filter: Sumber Servis (PO vs Internal)
      if (params.source_type && params.source_type !== "all") {
        combined = combined.filter((item) => item.source_type === params.source_type);
      }

      // Filter: Status PO (khusus item sumber PO)
      if (params.po_status) {
        combined = combined.filter((item) => item.purchase_order?.status === params.po_status);
      }

      // Filter: Status SLA
      if (params.sla_status) {
        combined = combined.filter((item) => item.sla_status === params.sla_status);
      }

      // Filter: Status Hasil Servis
      if (params.service_result) {
        combined = combined.filter((item) => item.service_result === params.service_result);
      }

      // Filter: Rentang Tanggal
      if (params.date_from) {
        const fromDate = params.date_from;
        combined = combined.filter((item) => (item.service_date || "") >= fromDate);
      }
      if (params.date_to) {
        const toDate = params.date_to;
        combined = combined.filter((item) => (item.service_date || "") <= toDate);
      }

      const total = combined.length;
      const perPage = params.per_page || 20;
      const currentPage = params.page || 1;
      const lastPage = Math.max(1, Math.ceil(total / perPage));
      const startIndex = (currentPage - 1) * perPage;
      const paginatedData = combined.slice(startIndex, startIndex + perPage);

      return {
        data: paginatedData,
        current_page: currentPage,
        last_page: lastPage,
        per_page: perPage,
        total,
        from: total > 0 ? startIndex + 1 : null,
        to: total > 0 ? Math.min(total, startIndex + perPage) : null,
      };
    },
    placeholderData: (prev) => prev,
  });
}

export function useServiceLogSummary(params: Pick<ServiceLogListParams, "date_from" | "date_to">) {
  return useQuery({
    queryKey: ["serviceLog", "summary", params] as const,
    queryFn: async (): Promise<ServiceLogSummary> => {
      let apiSummary: ServiceLogSummary = {
        total_lines: 0,
        total_amount: 0,
        received_count: 0,
      };

      try {
        const res = await serviceLogApi.summary(params);
        if (res.data?.data) {
          apiSummary = res.data.data;
        }
      } catch (err) {
        console.warn("Backend service log summary tidak merespon, menggunakan kalkulasi lokal:", err);
      }

      // Tambahkan data servis internal
      const internalLogs = getStoredInternalServiceLogs();
      let filteredInternal = internalLogs;
      if (params.date_from) {
        filteredInternal = filteredInternal.filter(
          (i) => (i.service_date || "") >= params.date_from!
        );
      }
      if (params.date_to) {
        filteredInternal = filteredInternal.filter(
          (i) => (i.service_date || "") <= params.date_to!
        );
      }

      const internalTotalAmount = filteredInternal.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0
      );
      const internalReceivedCount = filteredInternal.filter(
        (i) => i.service_result === "completed"
      ).length;
      const internalOnTimeCount = filteredInternal.filter(
        (i) => i.sla_status === "on_time"
      ).length;

      return {
        total_lines: apiSummary.total_lines + filteredInternal.length,
        total_amount: apiSummary.total_amount + internalTotalAmount,
        received_count: apiSummary.received_count + internalReceivedCount,
        internal_count: filteredInternal.length,
        on_time_sla_count: internalOnTimeCount,
      };
    },
  });
}

export function useCreateInternalServiceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      assetInfo,
    }: {
      input: InternalServiceLogInput;
      assetInfo?: ServiceAssetInfo | null;
    }) => {
      return saveStoredInternalServiceLog(input, assetInfo);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["serviceLog"] });
    },
  });
}

export function useLinkAssetToServiceLineMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lineId,
      assetInfo,
    }: {
      lineId: number;
      assetInfo: ServiceAssetInfo;
    }) => {
      linkAssetToServiceLine(lineId, assetInfo);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["serviceLog"] });
    },
  });
}
