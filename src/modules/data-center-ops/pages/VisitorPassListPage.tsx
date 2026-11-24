import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { DashboardStatusBanner } from "../components/common/DashboardStatusBanner";
import {
  VisitorPassKPICards,
  VisitorPassToolbar,
  VisitorPassTable,
  VisitorPassQRCodeModal,
  VisitorPassCheckOutModal,
  VisitorPassCancelModal,
  VisitorPassApproveModal,
} from "../components/visitor-pass";
import {
  useVisitorPassList,
  useCheckOutVisitorPass,
  useCancelVisitorPass,
  useApproveVisitorPass,
} from "../api/useVisitorPass";
import type { VisitorPass, VisitorPassStatus } from "../types/visitorPass";

export const VisitorPassListPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [qrModalPass, setQrModalPass] = useState<VisitorPass | null>(null);
  const [checkOutModalPass, setCheckOutModalPass] = useState<VisitorPass | null>(null);
  const [cancelModalPass, setCancelModalPass] = useState<VisitorPass | null>(null);
  const [approveModalPass, setApproveModalPass] = useState<VisitorPass | null>(null);

  // Toast feedback state
  const [feedbackToast, setFeedbackToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Queries
  const {
    data: paginatedData,
    isLoading,
    dataUpdatedAt,
  } = useVisitorPassList({
    page,
    per_page: perPage,
    search: search || undefined,
    status: (statusFilter || undefined) as VisitorPassStatus | undefined,
  });

  // Query seluruh data untuk KPI
  const { data: allData } = useVisitorPassList({ per_page: 200 });

  // Mutations
  const checkOutMutation = useCheckOutVisitorPass();
  const cancelMutation = useCancelVisitorPass();
  const approveMutation = useApproveVisitorPass();

  // Komputasi KPI Stats
  const stats = useMemo(() => {
    const list = allData?.data ?? [];
    const total = allData?.total ?? list.length;
    const activeInFacility = list.filter((p) => p.status === "active_in_facility").length;
    const upcoming = list.filter(
      (p) => p.status === "scheduled" || p.status === "registered" || p.status === "approved"
    ).length;
    const pendingRegistration = list.filter((p) => p.status === "pending_registration").length;
    const overstayed = list.filter(
      (p) =>
        p.status === "overstayed" ||
        (p.status === "active_in_facility" &&
          (p.planned_check_out_at || p.valid_until || p.valid_to) &&
          new Date((p.planned_check_out_at || p.valid_until || p.valid_to)!).getTime() < Date.now())
    ).length;
    const completed = list.filter((p) => p.status === "completed").length;

    return { total, activeInFacility, upcoming, pendingRegistration, overstayed, completed };
  }, [allData]);

  // Last updated string
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

  const passes = paginatedData?.data ?? [];
  const totalPages = paginatedData?.last_page ?? 1;

  // Actions
  const handleCheckOut = (pass: VisitorPass) => {
    setCheckOutModalPass(pass);
  };

  const openCancelModal = (pass: VisitorPass) => {
    setCancelModalPass(pass);
  };

  const handleApprove = (pass: VisitorPass) => {
    setApproveModalPass(pass);
  };

  const handleConfirmApprove = async (notes?: string) => {
    if (!approveModalPass) return;
    try {
      await approveMutation.mutateAsync({ id: approveModalPass.id, notes });
      setApproveModalPass(null);
      setFeedbackToast({
        message: "Izin kunjungan berhasil disetujui dan tiket QR telah dikirim ke email tamu.",
        type: "success",
      });
      setTimeout(() => setFeedbackToast(null), 5000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Gagal menyetujui izin kunjungan.";
      setFeedbackToast({
        message: msg,
        type: "error",
      });
      setTimeout(() => setFeedbackToast(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Page Header Bergaya MSDC ── */}
      <PageHeader
        title="Visitor Pass Log & Izin Akses"
        subtitle="Sistem pemantauan perizinan tamu data center, integrasi kontrak CRM & riwayat audit fisik"
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* ── Feedback Notification Toast ── */}
      {feedbackToast && (
        <div className="px-7 pt-2 pb-1">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-xs animate-in slide-in-from-top duration-200 ${
              feedbackToast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedbackToast.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
              )}
              <span>{feedbackToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackToast(null)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ── 2. Konten Utama ── */}
      <div className="flex flex-col gap-6 px-7 py-5">
        {/* Status Banner & KPI Cards */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
          <DashboardStatusBanner
            isOperational={true}
            statusTitle="GATE & ACCESS PROTOCOL ACTIVE"
            subtitle={
              <span>
                Saat ini terdapat <strong>{stats.activeInFacility} tamu aktif</strong> di dalam area data center.
              </span>
            }
            lastUpdated={lastUpdatedTime}
          />

          <VisitorPassKPICards
            stats={stats}
            isLoading={isLoading && !paginatedData}
          />
        </div>

        {/* Toolbar & Tabel Data */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
          <VisitorPassToolbar
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            totalItems={paginatedData?.total}
          />

          <VisitorPassTable
            passes={passes}
            isLoading={isLoading}
            currentPage={page}
            totalPages={totalPages}
            perPage={perPage}
            total={paginatedData?.total ?? passes.length}
            onPageChange={setPage}
            onPerPageChange={(p) => {
              setPerPage(p);
              setPage(1);
            }}
            perPageOptions={[5, 10, 20, 50]}
            onViewDetail={(pass) => navigate(`/dc/visitor-passes/${pass.id}`)}
            onViewQR={(pass) => setQrModalPass(pass)}
            onApprove={handleApprove}
            onCheckOut={handleCheckOut}
            onCancel={openCancelModal}
          />
        </div>
      </div>

      {/* Modals */}
      <VisitorPassQRCodeModal
        pass={qrModalPass}
        isOpen={!!qrModalPass}
        onClose={() => setQrModalPass(null)}
      />

      {/* Modal Persetujuan Izin Kunjungan (Approval) */}
      <VisitorPassApproveModal
        pass={approveModalPass}
        isOpen={!!approveModalPass}
        onClose={() => setApproveModalPass(null)}
        onConfirm={handleConfirmApprove}
        isLoading={approveMutation.isPending}
      />

      {/* Modal Konfirmasi Check-Out Pengunjung */}
      <VisitorPassCheckOutModal
        pass={checkOutModalPass}
        isOpen={!!checkOutModalPass}
        onClose={() => setCheckOutModalPass(null)}
        onConfirm={async (notes, exitGate) => {
          if (!checkOutModalPass) return;
          await checkOutMutation.mutateAsync({
            id: checkOutModalPass.id,
            notes: notes || (exitGate ? `Check-out dari ${exitGate}` : undefined),
          });
          setCheckOutModalPass(null);
        }}
        isLoading={checkOutMutation.isPending}
      />

      {/* Modal Konfirmasi Pembatalan Izin Kunjungan */}
      <VisitorPassCancelModal
        pass={cancelModalPass}
        isOpen={!!cancelModalPass}
        onClose={() => setCancelModalPass(null)}
        onConfirm={async (reason) => {
          if (!cancelModalPass) return;
          await cancelMutation.mutateAsync({
            id: cancelModalPass.id,
            reason,
          });
          setCancelModalPass(null);
        }}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};

