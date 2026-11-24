import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus,
  CreditCard,
  Calendar,
  Truck,
  RefreshCw,
  PackageCheck,
  Wrench,
  AlertCircle,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  PackageX,
  ExternalLink,
} from "lucide-react";
import { apiClient } from "@shared/lib/api-client";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { extractErrorMessage } from "@shared/types/api";

import type { DashboardSummary, ActivityItem } from "../types/dashboard";
import type { PrFormValues, PrLineForm } from "../types/pr";
import { useCreatePr } from "../api/usePr";
import { PrFormModal } from "../components/pr/PrFormModal";
import { ProcurementKpiCards } from "../components/dashboard/ProcurementKpiCards";
import { StatusBreakdownPanel } from "../components/dashboard/StatusBreakdownPanel";
import { RecentActivityPanel } from "../components/dashboard/RecentActivityPanel";

const EMPTY_LINE = (): PrLineForm => ({
  item_id: null,
  item_name: "",
  line_type: "goods",
  description: "",
  quantity: 1,
  uom: "pcs",
  estimated_unit_price: 0,
  channel: "offline",
});

const EMPTY_FORM: PrFormValues = {
  purpose: "",
  department_id: "",
  cost_center_id: "",
  notes: "",
  employee_id: "",
  employee_name: "",
  lines: [],
};

type PeriodOption = "this_month" | "this_quarter" | "this_year" | "all";

const PERIOD_LABELS: Record<PeriodOption, string> = {
  this_month: "Bulan Ini",
  this_quarter: "Kuartal Ini (Q)",
  this_year: "Tahun Ini",
  all: "Semua Periode",
};

export function ProcurementDashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodOption>("this_month");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const orgId = useActiveOrgId();
  const createPrMutation = useCreatePr();

  const [showPrModal, setShowPrModal] = useState(false);
  const [prForm, setPrForm] = useState<PrFormValues>(EMPTY_FORM);
  const [prLines, setPrLines] = useState<PrLineForm[]>([EMPTY_LINE()]);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [prError, setPrError] = useState<string | null>(null);

  const fetchDashboardData = useCallback((selectedPeriod: PeriodOption = period) => {
    setIsRefreshing(true);
    Promise.all([
      apiClient
        .get<{
          data: DashboardSummary;
        }>("/v1/procurement-inventory/dashboard/summary", {
          params: selectedPeriod !== "all" ? { period: selectedPeriod } : undefined,
        })
        .then((r) => r.data.data),
      apiClient
        .get<{
          data: ActivityItem[];
        }>("/v1/procurement-inventory/dashboard/recent-activity", {
          params: selectedPeriod !== "all" ? { period: selectedPeriod } : undefined,
        })
        .then((r) => r.data.data),
    ])
      .then(([s, a]) => {
        setSummary(s);
        setActivity(a);
      })
      .catch(() => {
        /* silent catch */
      })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  }, [period]);

  useEffect(() => {
    fetchDashboardData(period);
  }, [fetchDashboardData, period]);

  function handleOpenCreatePr() {
    setPrForm(EMPTY_FORM);
    setPrLines([EMPTY_LINE()]);
    setPrError(null);
    setStagedFiles([]);
    setShowPrModal(true);
  }

  async function handleSubmitPr(e: FormEvent) {
    e.preventDefault();
    setPrError(null);

    if (!prForm.purpose?.trim()) {
      setPrError("Tujuan/keperluan wajib diisi.");
      return;
    }

    const validLines = prLines.filter(
      (l) => l.description.trim() && l.quantity > 0
    );

    if (validLines.length === 0) {
      setPrError("Minimal 1 baris barang/jasa wajib diisi.");
      return;
    }

    try {
      const created = await createPrMutation.mutateAsync({
        purpose: prForm.purpose.trim(),
        employee_id: prForm.employee_id ? Number(prForm.employee_id) : undefined,
        department_id: prForm.department_id ? Number(prForm.department_id) : undefined,
        cost_center_id: prForm.cost_center_id ? Number(prForm.cost_center_id) : undefined,
        notes: prForm.notes ?? undefined,
        lines: validLines.map((l) => ({
          item_id: l.line_type === "service" ? undefined : (l.item_id ?? undefined),
          line_type: l.line_type,
          description: l.description.trim(),
          quantity: l.quantity,
          uom: l.uom,
          estimated_unit_price: l.estimated_unit_price,
          channel: l.channel,
        })),
      });

      const newPrId = (created as { id?: number })?.id;
      if (newPrId && stagedFiles.length > 0) {
        for (const file of stagedFiles) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("category", "supporting");
          try {
            await apiClient.post(
              `/v1/procurement-inventory/purchase-requests/${newPrId}/attachments`,
              fd,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
          } catch {
            // Silence failure
          }
        }
      }

      setShowPrModal(false);
      fetchDashboardData();
    } catch (err) {
      setPrError(extractErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <PageHeader
          title="Dashboard Procurement & Inventory"
          subtitle="Ringkasan seluruh transaksi — Purchase Request, RFQ, PO, Goods Receipt, dan Inventory."
          containerClassName="px-7 pt-6 pb-2"
        />
        <div className="px-7 py-12">
          <LoadingState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <PageHeader
        title="Dashboard Procurement & Inventory"
        subtitle="Ringkasan seluruh transaksi — Purchase Request, RFQ, PO, Goods Receipt, dan Inventory."
        containerClassName="px-7 pt-6 pb-2"
      >
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <button
            type="button"
            onClick={handleOpenCreatePr}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-900 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer border border-white/40"
          >
            <Plus size={15} className="text-amber-500" />
            <span>Buat PR (FPR)</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/procurement-inventory/payment-requests?action=create")}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 hover:bg-slate-900 active:scale-95 text-white border border-white/20 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <CreditCard size={15} className="text-amber-400" />
            <span>Buat FPP (Payment)</span>
          </button>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-6 px-7 py-5">
        
        {/* Toolbar: Period Filter & Quick Module Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mr-1">
              <Calendar size={14} className="text-amber-500" /> Periode:
            </span>
            {(["this_month", "this_quarter", "this_year", "all"] as PeriodOption[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setPeriod(opt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  period === opt
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {PERIOD_LABELS[opt]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => fetchDashboardData(period)}
              disabled={isRefreshing}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            </button>
            <Link
              to="/procurement-inventory/goods-receipts"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-amber-600 transition-all"
            >
              <Truck size={13} />
              <span>Penerimaan GRN</span>
            </Link>
            <Link
              to="/procurement-inventory/goods-handovers"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-amber-600 transition-all"
            >
              <PackageCheck size={13} />
              <span>Serah Terima FSTB</span>
            </Link>
            <Link
              to="/procurement-inventory/maintenance"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-amber-600 transition-all"
            >
              <Wrench size={13} />
              <span>Asset Maintenance</span>
            </Link>
          </div>
        </div>

        {/* Banner Peringatan Stok & Pengadaan Kritis */}
        <div className="bg-gradient-to-r from-rose-50 via-amber-50/30 to-white border border-rose-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl mt-0.5 shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">Peringatan Stok & Pengadaan Kritis</h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-rose-600 text-white rounded-full tracking-wider">
                  Kritis
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Terdapat <strong className="text-rose-600">3 item</strong> dengan status stok kosong. Segera ajukan Purchase Request untuk menjaga ketersediaan stok.
              </p>
              
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-rose-200 text-rose-700 text-xs font-medium rounded-lg shadow-2xs">
                  <PackageX className="w-3.5 h-3.5 text-rose-500" />
                  Kabel UTP Cat6 <span className="text-slate-400">(0)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-rose-200 text-rose-700 text-xs font-medium rounded-lg shadow-2xs">
                  <PackageX className="w-3.5 h-3.5 text-rose-500" />
                  SFP Transceiver 10G <span className="text-slate-400">(0)</span>
                </span>
                <button 
                  onClick={() => navigate("/procurement-inventory/items")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 ml-1 cursor-pointer"
                >
                  +1 item lainnya <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenCreatePr}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 shrink-0 w-full md:w-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat PR Baru</span>
          </button>
        </div>

        {/* Panel KPI Cards */}
        <ProcurementKpiCards summary={summary} />

        {/* Panel Antrean Tindakan Segera (Action Required) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Antrean Tindakan Segera (Action Required)</h3>
                <p className="text-xs text-slate-500">Dokumen dan transaksi yang memerlukan persetujuan atau tindak lanjut Anda</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
              4 Item Pending
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between gap-3 hover:border-indigo-200 transition">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Purchase Request</span>
                  <h4 className="text-xs font-semibold text-slate-800 mt-1.5">PR-2026-089 (Perangkat Jaringan)</h4>
                </div>
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                <span className="text-slate-500">Menunggu Approval EPM</span>
                <button 
                  onClick={() => navigate("/procurement-inventory/purchase-requests")}
                  className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Tinjau <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between gap-3 hover:border-amber-200 transition">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Purchase Order</span>
                  <h4 className="text-xs font-semibold text-slate-800 mt-1.5">PO-2026-042 (Kabel UTP & Switch)</h4>
                </div>
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                <span className="text-slate-500">Konfirmasi Vendor</span>
                <button 
                  onClick={() => navigate("/procurement-inventory/po-history")}
                  className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Tinjau <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between gap-3 hover:border-blue-200 transition">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Payment Request</span>
                  <h4 className="text-xs font-semibold text-slate-800 mt-1.5">FPP-2026-015 (Pelunasan Vendor)</h4>
                </div>
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                <span className="text-slate-500">Validasi Finansial</span>
                <button 
                  onClick={() => navigate("/procurement-inventory/payment-requests")}
                  className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Tinjau <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between gap-3 hover:border-purple-200 transition">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Asset Maintenance</span>
                  <h4 className="text-xs font-semibold text-slate-800 mt-1.5">MAINT-008 (Servis Rutin AC)</h4>
                </div>
                <Clock className="w-4 h-4 text-rose-500 shrink-0" />
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                <span className="text-rose-600 font-medium">Jatuh Tempo Hari Ini</span>
                <button 
                  onClick={() => navigate("/procurement-inventory/maintenance")}
                  className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Tinjau <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown & Recent Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <StatusBreakdownPanel
            prData={summary?.purchase_requests.by_status ?? {}}
            poData={summary?.purchase_orders.by_status ?? {}}
          />
          <RecentActivityPanel activity={activity} />
        </div>
      </div>

      {showPrModal && (
        <PrFormModal
          form={prForm}
          setForm={setPrForm}
          lines={prLines}
          setLines={setPrLines}
          stagedFiles={stagedFiles}
          setStagedFiles={setStagedFiles}
          error={prError}
          isSaving={createPrMutation.isPending}
          onSubmit={handleSubmitPr}
          onClose={() => setShowPrModal(false)}
          orgId={orgId}
        />
      )}
    </div>
  );
}

export default ProcurementDashboardPage;