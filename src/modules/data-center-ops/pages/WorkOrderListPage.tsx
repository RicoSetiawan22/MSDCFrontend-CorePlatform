import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@shared/components/PageHeader";
import { useWorkOrderList } from "../api/useWorkOrders";
import {
  WorkOrderStatusBanner,
  WorkOrderKPICards,
  WorkOrderToolbar,
  WorkOrderTable,
  WorkOrderTablePagination,
  type WorkOrderKPIMetrics,
} from "../components/work-order";

/**
 * Halaman "Perintah Kerja" (Work Orders) Data Center Operations.
 * Menampilkan antrean Sales Order aktif yang membutuhkan instalasi fisik perangkat,
 * jaringan cross-connect/bandwidth, dan pengujian di data center.
 *
 * Desain diselaraskan 100% dengan dashboard MSDC (Rack, Site, Device, IPAM).
 */
export function WorkOrderListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [progressFilter, setProgressFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  // ── 1. Fetch Seluruh Antrean Work Order Aktif Sekaligus ──
  const {
    data: workOrdersPage,
    isLoading,
    dataUpdatedAt,
  } = useWorkOrderList({ per_page: 500 });

  const allOrders = useMemo(() => workOrdersPage?.data ?? [], [workOrdersPage]);

  // ── 2. Format Waktu Terakhir Diperbarui (Last Updated Timestamp) ──
  const lastUpdatedTime = useMemo(() => {
    if (!dataUpdatedAt) return undefined;
    return new Date(dataUpdatedAt)
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\./g, ":");
  }, [dataUpdatedAt]);

  // ── 3. Kalkulasi 4 Metrik KPI Utama ──
  const metrics: WorkOrderKPIMetrics = useMemo(() => {
    const totalWorkOrders = allOrders.length;
    let inProgressWorkOrders = 0;
    let unstartedWorkOrders = 0;
    let readyForTestingWorkOrders = 0;

    allOrders.forEach((so) => {
      const items = so.work_order?.items ?? [];
      const totalCount = items.length;

      if (totalCount === 0) {
        unstartedWorkOrders += 1;
        return;
      }

      const doneCount = items.filter((i) => i.is_completed).length;

      if (doneCount === 0) {
        unstartedWorkOrders += 1;
      } else {
        if (doneCount < totalCount) {
          inProgressWorkOrders += 1;
        }

        // Cek apakah semua item layanan selesai, dan sedang menunggu testing
        const serviceItems = items.filter((i) => i.item_type === "service");
        const testingItems = items.filter((i) => i.item_type === "testing");
        const serviceDone =
          serviceItems.length > 0 && serviceItems.every((i) => i.is_completed);
        const testingDone =
          testingItems.length > 0 && testingItems.every((i) => i.is_completed);

        if (serviceDone && !testingDone) {
          readyForTestingWorkOrders += 1;
        }
      }
    });

    return {
      totalWorkOrders,
      inProgressWorkOrders,
      unstartedWorkOrders,
      readyForTestingWorkOrders,
    };
  }, [allOrders]);

  // ── 4. Client-side Search, Filtering, dan Relevance Sorting ──
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const prog = progressFilter.trim().toLowerCase();
    const serv = serviceFilter.trim().toLowerCase();

    const result = allOrders.filter((so) => {
      const items = so.work_order?.items ?? [];
      const totalCount = items.length;
      const doneCount = items.filter((i) => i.is_completed).length;

      // Filter Progres
      if (prog) {
        if (prog === "unstarted") {
          if (totalCount > 0 && doneCount > 0) return false;
        } else if (prog === "in_progress") {
          if (doneCount === 0 || doneCount >= totalCount) return false;
        } else if (prog === "ready_testing") {
          const serviceItems = items.filter((i) => i.item_type === "service");
          const testingItems = items.filter((i) => i.item_type === "testing");
          const serviceDone =
            serviceItems.length > 0 && serviceItems.every((i) => i.is_completed);
          const testingDone =
            testingItems.length > 0 && testingItems.every((i) => i.is_completed);
          if (!serviceDone || testingDone) return false;
        }
      }

      // Filter Jenis Layanan
      if (serv) {
        const hasService = items.some(
          (i) => i.service_type?.toLowerCase() === serv
        );
        if (!hasService) return false;
      }

      // Filter Pencarian (No. SO, Nama Customer, No. Kontrak)
      if (q) {
        const matchSo = so.so_number?.toLowerCase().includes(q);
        const matchCustomer = so.customer?.company_name
          ?.toLowerCase()
          .includes(q);
        const contract = so.source_contract ?? so.contracts?.[0];
        const matchContract = contract?.contract_number
          ?.toLowerCase()
          .includes(q);

        if (!matchSo && !matchCustomer && !matchContract) {
          return false;
        }
      }

      return true;
    });

    // Relevansi Pencarian: Tempatkan yang diawali query di paling depan
    if (q) {
      result.sort((a, b) => {
        const aSoStarts = a.so_number?.toLowerCase().startsWith(q) ? 1 : 0;
        const bSoStarts = b.so_number?.toLowerCase().startsWith(q) ? 1 : 0;
        if (aSoStarts !== bSoStarts) return bSoStarts - aSoStarts;

        const aCustStarts = a.customer?.company_name?.toLowerCase().startsWith(q)
          ? 1
          : 0;
        const bCustStarts = b.customer?.company_name?.toLowerCase().startsWith(q)
          ? 1
          : 0;
        if (aCustStarts !== bCustStarts) return bCustStarts - aCustStarts;

        return 0;
      });
    }

    return result;
  }, [allOrders, search, progressFilter, serviceFilter]);

  // ── 5. Paginasi Hasil Filter ──
  const total = filteredOrders.length;
  const totalPages = Math.ceil(total / perPage) || 1;

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredOrders.slice(start, start + perPage);
  }, [filteredOrders, page, perPage]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Header Banner Bergaya MSDC ── */}
      <PageHeader
        title="Perintah Kerja"
        subtitle="Monitoring & penugasan checklist instalasi perangkat, jaringan, dan pengujian operasional"
        containerClassName="px-7 pt-5 pb-2"
      />

      <div className="mx-7 mt-3 flex flex-col gap-6">
        {/* ── 2. Overview Card: Status Banner & 4 KPI Cards Sesuai Desain MSDC ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          <WorkOrderStatusBanner
            isOperational={true}
            lastUpdated={lastUpdatedTime}
            inProgressCount={metrics.inProgressWorkOrders}
          />

          <WorkOrderKPICards metrics={metrics} />
        </div>

        {/* ── 3. Konten Utama: Toolbar & Tabel Work Order ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          {/* Toolbar: Search, Filters & Total Count Badge */}
          <WorkOrderToolbar
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            progressFilter={progressFilter}
            onProgressFilterChange={(val) => {
              setProgressFilter(val);
              setPage(1);
            }}
            serviceFilter={serviceFilter}
            onServiceFilterChange={(val) => {
              setServiceFilter(val);
              setPage(1);
            }}
            totalWorkOrders={total}
          />

          {/* Tabel Work Order */}
          <WorkOrderTable
            orders={paginatedOrders}
            isLoading={isLoading}
            onOpenOrder={(soId) => navigate(`/dc/work-orders/${soId}`)}
          />

          {/* Paginasi Terstandar */}
          {total > 0 && (
            <WorkOrderTablePagination
              currentPage={page}
              totalPages={totalPages}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(newPerPage) => {
                setPerPage(newPerPage);
                setPage(1);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkOrderListPage;
