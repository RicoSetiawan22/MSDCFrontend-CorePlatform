import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { useWorkOrder, useToggleWorkOrderItem, useRefetchWorkOrder } from "../api/useWorkOrders";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import { extractErrorMessage } from "@shared/types/api";
import {
  WorkOrderDetailBreadcrumb,
  WorkOrderDetailHero,
  WorkOrderInfoCard,
  WorkOrderItemRow,
  WorkOrderTestingCard,
} from "../components/work-order";
import { WorkOrderDeviceModal } from "./WorkOrderDeviceModal";
import { WorkOrderCrossConnectModal } from "./WorkOrderCrossConnectModal";
import { WorkOrderIpAllocateModal } from "./WorkOrderIpAllocateModal";
import type { WorkOrderItem } from "../types/workOrder";
import type { Device } from "../types/device";

/**
 * Detail 1 Perintah Kerja (Work Order) Data Center Operations.
 * Menampilkan checklist item per layanan kontrak dan 1 pengujian akhir (testing).
 *
 * Menghubungkan secara langsung posisi slot rack + Device Inventori,
 * Cross-Connect, dan alokasi IPAM ke baris layanan kontrak yang bersangkutan.
 */
export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const salesOrderId = Number(id);
  const navigate = useNavigate();

  const { data: wo, isLoading, isError, error: queryError, refetch } = useWorkOrder(salesOrderId);
  const toggle = useToggleWorkOrderItem(salesOrderId);
  const refetchWorkOrder = useRefetchWorkOrder(salesOrderId);

  const [error, setError] = useState<string | null>(null);
  const [togglingItemId, setTogglingItemId] = useState<number | null>(null);

  const [deviceModal, setDeviceModal] = useState<{
    item: WorkOrderItem;
    editingDevice?: Device | null;
  } | null>(null);
  const [crossConnectModal, setCrossConnectModal] = useState<WorkOrderItem | null>(null);
  const [ipModal, setIpModal] = useState<WorkOrderItem | null>(null);

  function handleToggle(item: WorkOrderItem) {
    setError(null);
    setTogglingItemId(item.id);

    toggle.mutate(
      { itemId: item.id, values: { is_completed: !item.is_completed } },
      {
        onSettled: () => {
          setTogglingItemId(null);
        },
        onError: (err) => {
          setError(extractErrorMessage(err));
        },
      }
    );
  }

  // ── State Error Saat Gagal Fetch Data ──
  if (isError) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16">
        <PageHeader
          title="Perintah Kerja"
          subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
          containerClassName="px-7 pt-5 pb-2"
        />
        <div className="px-7 py-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
            <AlertCircle size={28} />
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h3 className="text-base font-bold text-slate-800">
              Gagal Memuat Detail Perintah Kerja
            </h3>
            <p className="text-xs text-slate-500">
              {(queryError as Error)?.message ||
                "Terjadi kesalahan saat mengambil rincian data perintah kerja."}
            </p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={() => navigate("/dc/work-orders")}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              ← Kembali ke Daftar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── State Loading Skeleton ──
  if (isLoading && !wo) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16">
        <PageHeader
          title="Perintah Kerja"
          subtitle="Memuat rincian perintah kerja dan checklist instalasi..."
          containerClassName="px-7 pt-5 pb-2"
        />
        <div className="px-7 py-20 flex items-center justify-center">
          <LoadingState />
        </div>
      </div>
    );
  }

  // ── State Data Kosong / Tidak Ditemukan ──
  if (!wo) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16">
        <PageHeader
          title="Perintah Kerja"
          subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
          containerClassName="px-7 pt-5 pb-2"
        />
        <div className="px-7 py-16 flex flex-col items-center gap-4">
          <EmptyState
            title="Perintah Kerja Tidak Ditemukan"
            subtitle="Data perintah kerja atau Sales Order dengan ID ini mungkin sudah selesai atau tidak terdaftar."
          />
          <button
            type="button"
            onClick={() => navigate("/dc/work-orders")}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            ← Kembali ke Perintah Kerja
          </button>
        </div>
      </div>
    );
  }

  const serviceItems = wo.items.filter((i) => i.item_type === "service");
  const testingItem = wo.items.find((i) => i.item_type === "testing");
  const customerId = wo.sales_order?.customer?.id;

  // Syarat pengujian: seluruh layanan fisik harus selesai terlebih dahulu
  const allServicesDone =
    serviceItems.length > 0 && serviceItems.every((i) => i.is_completed);

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Breadcrumb Rute Navigasi ── */}
      <WorkOrderDetailBreadcrumb soNumber={wo.sales_order?.so_number} />

      {/* ── 2. Header Banner Bergaya MSDC ── */}
      <PageHeader
        title="Perintah Kerja"
        subtitle="Pemantauan infrastruktur fisik & operasional 24×7"
        containerClassName="px-7 pt-2 pb-2"
      />

      {/* ── 3. Konten Utama Mengalir (Single Scrollable Flow) ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* Hero Card Header (Gambar 1) */}
        <WorkOrderDetailHero
          workOrder={wo}
          onBack={() => navigate("/dc/work-orders")}
        />

        {/* Informasi Perintah Kerja (Bergaya Device Inventory - Gambar 2) */}
        <WorkOrderInfoCard workOrder={wo} />

        {/* Banner Pesan Error Mutasi jika Ada */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Card Checklist Layanan: Item Dipesan (dari Kontrak) (Gambar 1) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Item Dipesan (dari Kontrak)
            </h2>
            <span className="text-xs text-slate-500 font-semibold">
              {serviceItems.filter((i) => i.is_completed).length} dari {serviceItems.length} layanan selesai
            </span>
          </div>

          <div className="flex flex-col gap-3.5">
            {serviceItems.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-6 text-center">
                Kontrak ini tidak memiliki baris layanan fisik.
              </div>
            ) : (
              serviceItems.map((item) => (
                <WorkOrderItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => handleToggle(item)}
                  disabled={toggle.isPending}
                  isToggling={togglingItemId === item.id}
                  onAddDevice={(editingDevice) => setDeviceModal({ item, editingDevice })}
                  onAddCrossConnect={() => setCrossConnectModal(item)}
                  onAllocateIp={() => setIpModal(item)}
                />
              ))
            )}
          </div>
        </div>

        {/* Card Checklist Testing & Commissioning (Gambar 1) */}
        {testingItem && (
          <WorkOrderTestingCard
            testingItem={testingItem}
            onToggle={() => handleToggle(testingItem)}
            disabled={toggle.isPending}
            isToggling={togglingItemId === testingItem.id}
            canExecuteTesting={allServicesDone}
          />
        )}
      </div>

      {/* ── 4. Modals Alokasi Resource Teknis (Device, Cross-Connect, IPAM) ── */}
      {deviceModal && (
        <WorkOrderDeviceModal
          contractId={wo.contract_id}
          customerId={customerId}
          contractServiceId={deviceModal.item.contract_service_id!}
          editingDevice={deviceModal.editingDevice}
          onClose={() => setDeviceModal(null)}
          onSaved={refetchWorkOrder}
        />
      )}

      {crossConnectModal && (
        <WorkOrderCrossConnectModal
          contractId={wo.contract_id}
          customerId={customerId}
          contractServiceId={crossConnectModal.contract_service_id!}
          onClose={() => setCrossConnectModal(null)}
          onSaved={refetchWorkOrder}
        />
      )}

      {ipModal && (
        <WorkOrderIpAllocateModal
          customerId={customerId}
          contractServiceId={ipModal.contract_service_id!}
          requiredCount={ipModal.contract_service?.required_ip_count ?? null}
          currentCount={ipModal.contract_service?.ip_addresses?.length ?? 0}
          onClose={() => setIpModal(null)}
          onSaved={refetchWorkOrder}
        />
      )}
    </div>
  );
}

export default WorkOrderDetailPage;
