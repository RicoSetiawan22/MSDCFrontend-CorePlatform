import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Search, RefreshCw, AlertTriangle, FileText, Printer, ChevronRight } from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { extractErrorMessage } from "@shared/types/api";
import { formatDate } from "@shared/lib/format";
import { useEmployeeList, useEmployee } from "../api/useEmployees";
import {
  usePayrollList, useCreatePayroll, useUpdatePayroll, useDeletePayroll,
  useGeneratePayroll, useSalaryList, useEmployeeSalary, useSetEmployeeSalary,
} from "../api/usePayroll";
import { calculateMonthlyPayrollDeductions } from "../lib/indonesianTax";
import type { PayrollRecord, PayrollStatus, EmployeeSalary } from "../types/payroll";
import { PayrollDetailView } from "./PayrollDetailView";
import { TaxRecapTab, TaxRecapDetailView, TaxKpiCards, type TaxStatusFilter } from "./TaxRecapTab";

function rupiah(v: string | number): string {
  return `Rp ${Math.round(Number(v) || 0).toLocaleString("id-ID")}`;
}

type Tab = "records" | "salaries" | "slips" | "taxes";

export function PayrollListPage() {
  const [tab, setTab] = useState<Tab>("records");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | "">("");
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [showCreate, setShowCreate] = useState(false);
  const [editRecord, setEditRecord] = useState<PayrollRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<PayrollRecord | null>(null);
  const [previewSlipRecord, setPreviewSlipRecord] = useState<PayrollRecord | null>(null);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [taxStatus, setTaxStatus] = useState<TaxStatusFilter>("");
  const [taxDetail, setTaxDetail] = useState<number | null>(null);

  const { data, isLoading } = usePayrollList({
    status: statusFilter || undefined,
    period_month: monthFilter,
    period_year: yearFilter,
    page,
    per_page: 20,
  });

  const deleteRecord = useDeletePayroll();
  const generatePayroll = useGeneratePayroll();

  function handleDelete(r: PayrollRecord) {
    if (!confirm(`Hapus payroll record ${r.employee?.full_name ?? ""} periode ${r.period_month}/${r.period_year}?`)) return;
    deleteRecord.mutate(r.id, { onError: (e) => alert("Gagal: " + extractErrorMessage(e)) });
  }

  function handleGenerate() {
    generatePayroll.mutate(
      { month: monthFilter, year: yearFilter },
      {
        onSuccess: (res) => alert(res.message),
        onError: (e) => alert("Gagal: " + extractErrorMessage(e)),
      }
    );
  }

  const records = data?.data ?? [];
  const totalGross = records.reduce((sum, r) => sum + (Number(r.base_salary) || 0), 0);
  const totalNet = records.reduce((sum, r) => sum + takeHomePay(r), 0);
  const totalEmployees = records.length;
  const draftCount = records.filter(r => r.status === "draft" && !r.submitted_to_finance).length;
  const queuedFinanceCount = records.filter(r => r.status === "draft" && Boolean(r.submitted_to_finance)).length;
  const postedCount = records.filter(r => r.status === "sent_to_finance").length;

  if (taxDetail !== null) {
    return <TaxRecapDetailView employeeId={taxDetail} year={taxYear} onBack={() => setTaxDetail(null)} />;
  }

  if (detailRecord) {
    return (
      <>
        <PayrollDetailView
          record={detailRecord}
          onBack={() => setDetailRecord(null)}
          onViewSlip={(rec) => setPreviewSlipRecord(rec)}
          onEditDraft={() => setEditRecord(detailRecord)}
        />
        {editRecord && <MealNotesEditModal record={editRecord} onClose={() => setEditRecord(null)} />}
        {previewSlipRecord && <SlipGajiModal record={previewSlipRecord} onClose={() => setPreviewSlipRecord(null)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Payroll & Penggajian"
        subtitle="Perhitungan otomatis gaji bulanan, uang makan, lembur, BPJS, dan PPh Pasal 21 (PP 58/2023 & PMK 168/2023) — terintegrasi dengan modul Finance."
      />

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Workflow Info Banner */}
        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
            <RefreshCw size={18} />
          </div>
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Alur Bisnis Payroll &amp; Pajak:</strong> 1. Atur nominal dasar di tab{" "}
            <span className="font-semibold text-slate-800">Master Gaji Pokok</span>. ➔ 2. Klik{" "}
            <span className="font-semibold text-slate-800">Generate Payroll</span> untuk mengkalkulasi gaji, lembur, serta potongan otomatis{" "}
            <span className="font-semibold text-slate-800">BPJS Kesehatan (1%), BPJS TK (JHT 2% + JP 1%), dan PPh 21 (TER PP 58/2023)</span>. ➔ 3. Periksa{" "}
            <span className="font-semibold text-slate-800">Slip Gaji</span> &amp;{" "}
            <span className="font-semibold text-slate-800">Rekap Pajak Tahunan (Pasal 17 UU HPP)</span>, lalu ajukan ke Finance.
          </div>
        </div>

        {/* KPI Stat Cards */}
        {tab === "taxes" ? (
          <TaxKpiCards year={taxYear} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Net Payroll</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                  <span className="font-bold text-sm">Rp</span>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{rupiah(totalNet)}</span>
                <p className="text-xs text-slate-500 mt-1">
                  Bruto: {rupiah(totalGross)} · Periode {String(monthFilter).padStart(2, "0")}/{yearFilter}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Employee Terhitung</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700">
                  <Search size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalEmployees}</span>
                <p className="text-xs text-slate-500 mt-1">Karyawan masuk perhitungan</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status Draft HR</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                  <AlertTriangle size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{draftCount}</span>
                <p className="text-xs text-amber-600 font-medium mt-1">
                  Belum diajukan · {queuedFinanceCount} di antrean HR Integration
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Finance &amp; GL</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                  <RefreshCw size={16} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{postedCount + queuedFinanceCount}</span>
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  {queuedFinanceCount} di HR Integration · {postedCount} Posted GL
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Card with Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-2.5 bg-slate-50/70 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto">
            {(
              [
                { key: "records" as Tab, label: "Payroll Records", count: totalEmployees },
                { key: "salaries" as Tab, label: "Master Gaji Pokok" },
                { key: "slips" as Tab, label: "Slip Gaji" },
                { key: "taxes" as Tab, label: "Rekap Pajak Tahunan" },
              ]
            ).map(t => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${active
                    ? "bg-white text-[#0A2140] shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }`}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? "bg-slate-100 text-[#0A2140]" : "bg-slate-200/60 text-slate-500"
                        }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {tab === "salaries" && <MasterSalaryTab />}
            {tab === "slips" && <SlipGajiTab defaultMonth={monthFilter} defaultYear={yearFilter} />}
            {tab === "taxes" && (
              <TaxRecapTab
                year={taxYear}
                onYearChange={setTaxYear}
                status={taxStatus}
                onStatusChange={setTaxStatus}
                onOpen={setTaxDetail}
              />
            )}

            {tab === "records" && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Periode:</span>
                    <select
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A2140]"
                      value={monthFilter}
                      onChange={e => {
                        setMonthFilter(parseInt(e.target.value));
                        setPage(1);
                      }}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Bulan {String(i + 1).padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                    <select
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A2140]"
                      value={yearFilter}
                      onChange={e => {
                        setYearFilter(parseInt(e.target.value));
                        setPage(1);
                      }}
                    >
                      {[2024, 2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    <select
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A2140]"
                      value={statusFilter}
                      onChange={e => {
                        setStatusFilter(e.target.value as PayrollStatus | "");
                        setPage(1);
                      }}
                    >
                      <option value="">Semua Status</option>
                      <option value="draft">Draft</option>
                      <option value="sent_to_finance">Sent to Finance</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                      disabled={generatePayroll.isPending}
                      onClick={handleGenerate}
                    >
                      <RefreshCw size={13} className={generatePayroll.isPending ? "animate-spin text-slate-400" : "text-slate-500"} />
                      {generatePayroll.isPending ? "Menghitung..." : "Generate Payroll"}
                    </button>
                    <button
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#f4ae3e] hover:bg-[#f7a41f] rounded-xl transition-all shadow-sm"
                      onClick={() => setShowCreate(true)}
                    >
                      <Plus size={14} /> Payroll Baru
                    </button>
                  </div>
                </div>

                {isLoading && <LoadingState />}
                {data && data.data.length === 0 && (
                  <div className="p-8">
                    <EmptyState
                      title="Belum Ada Data Payroll"
                      subtitle={`Klik "Generate Payroll" untuk membuat payroll semua employee periode ${String(monthFilter).padStart(2, "0")}/${yearFilter} dari Master Gaji Pokok + lembur yang disetujui.`}
                    />
                  </div>
                )}
                {data && data.data.length > 0 && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200/80">
                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Employee</th>
                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Periode</th>
                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Gaji Pokok</th>
                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Tunjangan</th>
                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total Bruto</th>
                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Potongan</th>
                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Gaji Bersih</th>
                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                            <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.data.map(rec => {
                            const deductionAmt = totalDeductions(rec);
                            const netAmt = takeHomePay(rec);
                            return (
                              <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                                <td className="px-4 py-3.5">
                                  <div className="text-sm font-semibold text-slate-900">{rec.employee?.full_name ?? "—"}</div>
                                  <div className="text-[11px] text-slate-400">
                                    PTKP {rec.ptkp_status || "TK/0"} · TER {rec.ter_category || "A"}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                                  {String(rec.period_month).padStart(2, "0")}/{rec.period_year}
                                </td>
                                <td className="px-4 py-3.5 font-mono text-xs text-slate-700 whitespace-nowrap">{rupiah(rec.base_salary)}</td>
                                <td className="px-4 py-3.5 font-mono text-xs text-emerald-600 font-semibold whitespace-nowrap">
                                  {rupiah(Number(rec.meal_allowance || 0) + Number(rec.overtime_amount || 0))}
                                </td>
                                <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-800 whitespace-nowrap">{rupiah(rec.base_salary)}</td>
                                <td className="px-4 py-3.5 font-mono text-xs text-rose-600 font-semibold whitespace-nowrap">
                                  - {rupiah(deductionAmt)}
                                </td>
                                <td className="px-4 py-3.5 font-mono text-sm font-bold text-emerald-700 whitespace-nowrap">
                                  {rupiah(netAmt)}
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${rec.status === "sent_to_finance"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                      : rec.submitted_to_finance
                                        ? "bg-blue-50 text-blue-700 border-blue-200/60"
                                        : "bg-amber-50 text-amber-700 border-amber-200/60"
                                      }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${rec.status === "sent_to_finance"
                                        ? "bg-emerald-500"
                                        : rec.submitted_to_finance
                                          ? "bg-blue-500"
                                          : "bg-amber-500"
                                        }`}
                                    />
                                    {rec.status === "sent_to_finance"
                                      ? "Posted to Finance"
                                      : rec.submitted_to_finance
                                        ? "HR Integration Finance"
                                        : "Draft"}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      onClick={() => setDetailRecord(rec)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
                                    >
                                      Rincian <ChevronRight size={13} className="text-slate-400" />
                                    </button>
                                    {rec.status !== "sent_to_finance" && (
                                      <button
                                        onClick={() => handleDelete(rec)}
                                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Hapus payroll"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
                      <span className="text-xs text-slate-500">
                        Menampilkan halaman <strong className="text-slate-700">{data.current_page}</strong> dari{" "}
                        <strong className="text-slate-700">{data.last_page}</strong> (total {data.total} record)
                      </span>
                      <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreate && <PayrollFormModal defaultMonth={monthFilter} defaultYear={yearFilter} onClose={() => setShowCreate(false)} />}
      {editRecord && <MealNotesEditModal record={editRecord} onClose={() => setEditRecord(null)} />}
      {previewSlipRecord && <SlipGajiModal record={previewSlipRecord} onClose={() => setPreviewSlipRecord(null)} />}
    </div>
  );
}

// ─── Modal shell ─────────────────────────────────────────────────────────────
function ModalShell({
  title,
  onClose,
  maxWidth = 560,
  children,
}: {
  title: string;
  onClose: () => void;
  maxWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15,23,42,0.60)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          width: "100%",
          maxWidth,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 1.5rem 1rem" }}>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a" }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "1.2rem",
              padding: "0.25rem 0.5rem",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        <div className="modal-scroll-hidden" style={{ padding: "0 1.5rem 1.5rem", flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: 4, color: "#475569" }}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Employee Picker (search + select) ──────────────────────────────────────
function EmployeePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [empSearch, setEmpSearch] = useState("");
  const { data: employeesPage, isLoading } = useEmployeeList({ per_page: 50, search: empSearch || undefined });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <input
        className="input"
        placeholder="Cari nama employee..."
        value={empSearch}
        onChange={e => setEmpSearch(e.target.value)}
        style={{ width: "100%" }}
      />
      <select className="input" value={value} onChange={e => onChange(e.target.value)} disabled={isLoading} style={{ width: "100%" }}>
        <option value="">— Pilih Employee —</option>
        {(employeesPage?.data ?? []).map(e => (
          <option key={e.id} value={e.id}>
            {e.full_name} ({e.employee_number})
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Master Gaji Pokok ──────────────────────────────────────────────────────
function MasterSalaryTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSalaryList({ search: search || undefined, page, per_page: 20 });

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar__search">
          <Search size={16} />
          <input
            className="input"
            placeholder="Cari employee..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading && <LoadingState />}
      {data && data.data.length === 0 && (
        <EmptyState title="Employee Tidak Ditemukan" subtitle="Coba kata kunci pencarian lain." />
      )}
      {data && data.data.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Kode Employee</th>
                <th>Nama</th>
                <th>Gaji Pokok</th>
                <th style={{ width: 140 }}></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map(emp => (
                <SalaryRow key={emp.id} employee={emp} />
              ))}
            </tbody>
          </table>
          <div style={{ padding: "0 1.5rem" }}>
            <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}

function SalaryRow({ employee }: { employee: EmployeeSalary }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(employee.base_salary ?? "");
  const [error, setError] = useState<string | null>(null);
  const setSalary = useSetEmployeeSalary();

  function handleSave() {
    if (!value || parseFloat(value) < 0) {
      setError("Isi nominal gaji pokok yang valid.");
      return;
    }
    setError(null);
    setSalary.mutate(
      { employeeId: employee.id, baseSalary: parseFloat(value) },
      {
        onSuccess: () => setEditing(false),
        onError: e => setError(extractErrorMessage(e)),
      }
    );
  }

  return (
    <tr>
      <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#64748b" }}>{employee.employee_number}</td>
      <td style={{ fontWeight: 600 }}>{employee.full_name}</td>
      <td>
        {editing ? (
          <input
            className="input"
            type="number"
            min={0}
            step={1000}
            value={value}
            onChange={e => setValue(e.target.value)}
            style={{ width: 160 }}
            autoFocus
          />
        ) : employee.base_salary ? (
          rupiah(employee.base_salary)
        ) : (
          <span style={{ color: "#64748b" }}>Belum diset</span>
        )}
        {error && <div style={{ color: "#ef4444", fontSize: "0.7rem" }}>{error}</div>}
      </td>
      <td>
        {editing ? (
          <div style={{ display: "flex", gap: 4 }}>
            <button
              className="btn"
              style={{
                fontSize: "0.75rem",
                padding: "0.3rem 0.6rem",
                background: "#F2A602",
                border: "none",
                color: "#fff",
                fontWeight: 700,
                borderRadius: 8,
              }}
              disabled={setSalary.isPending}
              onClick={handleSave}
            >
              Simpan
            </button>
            <button
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
              onClick={() => {
                setEditing(false);
                setValue(employee.base_salary ?? "");
                setError(null);
              }}
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Payroll Baru ─────────────────────────────────────────────────────────────
function PayrollFormModal({
  defaultMonth,
  defaultYear,
  onClose,
}: {
  defaultMonth?: number;
  defaultYear?: number;
  onClose: () => void;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState(defaultMonth ?? new Date().getMonth() + 1);
  const [year, setYear] = useState(defaultYear ?? new Date().getFullYear());
  const [baseSalary, setBaseSalary] = useState("");
  const [mealAllowance, setMealAllowance] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [salaryTouched, setSalaryTouched] = useState(false);

  const createPayroll = useCreatePayroll();

  const { data: masterSalary } = useEmployeeSalary(employeeId ? parseInt(employeeId) : undefined);
  if (masterSalary?.base_salary && !salaryTouched && baseSalary !== masterSalary.base_salary) {
    setBaseSalary(masterSalary.base_salary);
  }

  const total = (parseFloat(baseSalary) || 0) + (parseFloat(mealAllowance) || 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId) {
      setError("Pilih employee dulu.");
      return;
    }
    setError(null);

    createPayroll.mutate(
      {
        employeeId: parseInt(employeeId),
        values: {
          period_month: month,
          period_year: year,
          base_salary: baseSalary ? parseFloat(baseSalary) : undefined,
          meal_allowance: mealAllowance ? parseFloat(mealAllowance) : undefined,
          notes: notes.trim() || undefined,
        },
      },
      { onSuccess: onClose, onError: e => setError(extractErrorMessage(e)) }
    );
  }

  return (
    <ModalShell title="Payroll Baru" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        <F label="Employee" required>
          <EmployeePicker value={employeeId} onChange={setEmployeeId} />
        </F>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <F label="Bulan" required>
            <select className="input" value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ width: "100%" }}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {String(i + 1).padStart(2, "0")}
                </option>
              ))}
            </select>
          </F>
          <F label="Tahun" required>
            <select className="input" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: "100%" }}>
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </F>
        </div>

        <F label="Gaji Pokok">
          <input
            className="input"
            type="number"
            min={0}
            step={1000}
            value={baseSalary}
            onChange={e => {
              setBaseSalary(e.target.value);
              setSalaryTouched(true);
            }}
            placeholder="0"
            style={{ width: "100%" }}
          />
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 4 }}>
            {masterSalary?.base_salary
              ? "Terisi otomatis dari Master Gaji Pokok - bisa ditimpa manual kalau ada penyesuaian."
              : 'Employee ini belum punya Master Gaji Pokok - isi manual, atau atur dulu di tab "Master Gaji Pokok".'}
          </div>
        </F>
        <F label="Uang Makan">
          <input
            className="input"
            type="number"
            min={0}
            step={1000}
            value={mealAllowance}
            onChange={e => setMealAllowance(e.target.value)}
            placeholder="0"
            style={{ width: "100%" }}
          />
        </F>

        <div
          style={{
            fontSize: "0.75rem",
            color: "#475569",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "0.6rem 0.75rem",
          }}
        >
          Lembur otomatis dihitung dari Overtime yang sudah di-approve Manager x tarif Master Data. Potongan BPJS &amp; PPh 21 (TER PP 58/2023) akan langsung dihitung otomatis saat disimpan.
        </div>

        <F label="Catatan">
          <textarea
            className="input"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Catatan tambahan..."
            style={{ width: "100%", minHeight: 50, resize: "vertical" }}
          />
        </F>

        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "0.6rem 0.75rem",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Total Penghasilan (belum termasuk lembur)</span>
          <span style={{ fontWeight: 700, color: "#0f172a" }}>{rupiah(total)}</span>
        </div>

        {error && <div style={{ color: "#ef4444", fontSize: "0.8rem" }}>{error}</div>}

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 8,
            paddingTop: 12,
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            className="btn"
            style={{
              background: "#F2A602",
              border: "none",
              color: "#ffffff",
              fontWeight: 700,
              borderRadius: 8,
              padding: "0.55rem 1.1rem",
            }}
            disabled={createPayroll.isPending}
          >
            {createPayroll.isPending ? "Menyimpan..." : "Simpan Payroll"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Edit Uang Makan & Catatan ───────────────────────────────────────────────
function MealNotesEditModal({ record, onClose }: { record: PayrollRecord; onClose: () => void }) {
  const [mealAllowance, setMealAllowance] = useState(record.meal_allowance ?? "");
  const [notes, setNotes] = useState(record.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const updatePayroll = useUpdatePayroll();

  const total =
    (parseFloat(record.base_salary) || 0) +
    (parseFloat(mealAllowance) || 0) +
    (parseFloat(record.overtime_amount) || 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    updatePayroll.mutate(
      {
        id: record.id,
        values: {
          meal_allowance: mealAllowance ? parseFloat(mealAllowance) : 0,
          notes: notes.trim() || undefined,
        },
      },
      { onSuccess: onClose, onError: e => setError(extractErrorMessage(e)) }
    );
  }

  return (
    <ModalShell title="Edit Uang Makan & Catatan" onClose={onClose} maxWidth={420}>
      <div style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "1rem" }}>
        {record.employee?.full_name} — {String(record.period_month).padStart(2, "0")}/{record.period_year}
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.8rem" }}>
          <div>
            <div style={{ color: "#64748b" }}>Gaji Pokok</div>
            <div style={{ color: "#0f172a", fontWeight: 600 }}>{rupiah(record.base_salary)}</div>
          </div>
          <div>
            <div style={{ color: "#64748b" }}>Lembur (auto)</div>
            <div style={{ color: "#0f172a", fontWeight: 600 }}>{rupiah(record.overtime_amount)}</div>
          </div>
        </div>

        <F label="Uang Makan">
          <input
            className="input"
            type="number"
            min={0}
            step={1000}
            value={mealAllowance}
            onChange={e => setMealAllowance(e.target.value)}
            placeholder="0"
            style={{ width: "100%" }}
            autoFocus
          />
        </F>
        <F label="Catatan">
          <textarea
            className="input"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Catatan tambahan..."
            style={{ width: "100%", minHeight: 60, resize: "vertical" }}
          />
        </F>

        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "0.6rem 0.75rem",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Total Penerimaan Sebelum Potongan</span>
          <span style={{ fontWeight: 700, color: "#0f172a" }}>{rupiah(total)}</span>
        </div>

        {error && <div style={{ color: "#ef4444", fontSize: "0.8rem" }}>{error}</div>}

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 8,
            paddingTop: 12,
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            className="btn"
            style={{
              background: "#F2A602",
              border: "none",
              color: "#ffffff",
              fontWeight: 700,
              borderRadius: 8,
              padding: "0.55rem 1.1rem",
            }}
            disabled={updatePayroll.isPending}
          >
            {updatePayroll.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Slip Gaji ───────────────────────────────────────────────────────────────
const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function overtimeHint(r: PayrollRecord): string | undefined {
  const s = r.overtime_record?.status;
  if (s === "rejected") return "Lembur ditolak, tidak dihitung";
  if (s === "draft" || s === "pending_approval") return "Lembur menunggu approval, belum dihitung";
  return undefined;
}

type SlipState = "draft" | "processing" | "posted";

function slipState(r: PayrollRecord): SlipState {
  if (r.status === "sent_to_finance") return "posted";
  if (r.submitted_to_finance) return "processing";
  return "draft";
}

const SLIP_STATE_META: Record<SlipState, { label: string; badge: string }> = {
  draft: { label: "Draft (Terhitung)", badge: "status-badge status-badge--warning" },
  processing: { label: "Antrean HR Integration Finance", badge: "status-badge status-badge--info" },
  posted: { label: "Terposting ke GL", badge: "status-badge status-badge--success" },
};

function deductionsFromBase(r: PayrollRecord): number {
  // Potongan hanya dari gaji pokok
  return calculateMonthlyPayrollDeductions(
    { ...r, meal_allowance: "0", overtime_amount: "0" },
    r.employee
  ).totalEmployeeDeduction;
}

function totalDeductions(r: PayrollRecord): number {
  return deductionsFromBase(r);
}

function takeHomePay(r: PayrollRecord): number {
  return (
    Number(r.base_salary || 0) -
    deductionsFromBase(r) +
    Number(r.meal_allowance || 0) +
    Number(r.overtime_amount || 0)
  );
}

function SlipGajiTab({ defaultMonth, defaultYear }: { defaultMonth?: number; defaultYear?: number }) {
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState(defaultMonth ?? new Date().getMonth() + 1);
  const [year, setYear] = useState(defaultYear ?? new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | "">("");
  const [selected, setSelected] = useState<PayrollRecord | null>(null);

  const { data, isLoading } = usePayrollList({
    status: statusFilter || undefined,
    period_month: month,
    period_year: year,
    page,
    per_page: 20,
  });

  const selectClass =
    "px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A2140]";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-500">Periode:</span>
        <select
          className={selectClass}
          value={month}
          onChange={e => {
            setMonth(parseInt(e.target.value));
            setPage(1);
          }}
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={year}
          onChange={e => {
            setYear(parseInt(e.target.value));
            setPage(1);
          }}
        >
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value as PayrollStatus | "");
            setPage(1);
          }}
        >
          <option value="">Semua Status</option>
          <option value="sent_to_finance">Dikirim Ke Finance</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {isLoading && <LoadingState />}
      {data && data.data.length === 0 && (
        <EmptyState
          title="Belum Ada Slip Gaji"
          subtitle={`Belum ada payroll periode ${MONTH_NAMES[month - 1]} ${year}. Buat dulu lewat tab Payroll Records.`}
        />
      )}
      {data && data.data.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Periode</th>
                <th>Bruto (Gaji Pokok)</th>
                <th>Total Potongan (BPJS &amp; PPh 21)</th>
                <th>Take-home Pay (Gaji Bersih)</th>
                <th>Status Slip</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map(rec => {
                const calc = calculateMonthlyPayrollDeductions(
                  { ...rec, meal_allowance: "0", overtime_amount: "0" },
                  rec.employee
                );
                const takeHome = takeHomePay(rec);
                return (
                  <tr key={rec.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{rec.employee?.full_name ?? "—"}</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                        PTKP {calc.ptkpStatus} · TER {calc.terCategory} ({calc.terRatePercent})
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {String(rec.period_month).padStart(2, "0")}/{rec.period_year}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 600 }}>
                      {rupiah(rec.base_salary)}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#e11d48", fontWeight: 600 }}>
                      - {rupiah(calc.totalEmployeeDeduction)}
                    </td>
                    <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#059669" }}>
                      {rupiah(takeHome)}
                    </td>
                    <td>
                      <span className={SLIP_STATE_META[slipState(rec)].badge}>{SLIP_STATE_META[slipState(rec)].label}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                        onClick={() => setSelected(rec)}
                      >
                        <FileText size={13} /> Lihat Slip
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            <span className="text-xs text-slate-500">
              Menampilkan halaman <strong className="text-slate-700">{data.current_page}</strong> dari{" "}
              <strong className="text-slate-700">{data.last_page}</strong> (total {data.total} slip)
            </span>
            <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
          </div>
        </>
      )}

      {selected && <SlipGajiModal record={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function SlipGajiModal({ record, onClose }: { record: PayrollRecord; onClose: () => void }) {
  const { data: employee } = useEmployee(record.employee_id);
  const state = slipState(record);
  const periodLabel = `${MONTH_NAMES[record.period_month - 1]} ${record.period_year}`;

  function handlePrint() {
    document.body.classList.add("print-slip");
    window.addEventListener("afterprint", () => document.body.classList.remove("print-slip"), { once: true });
    window.print();
  }

  return (
    <>
      <div
        className="modal-overlay"
        onClick={e => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="form-modal" style={{ maxWidth: 760, borderRadius: 20 }}>
          <div className="form-modal__header">
            <div className="form-modal__title-row">
              <h2 className="form-modal__title">Slip Gaji Karyawan</h2>
              <span className={SLIP_STATE_META[state].badge}>{SLIP_STATE_META[state].label}</span>
              <button type="button" className="form-modal__close" onClick={onClose} style={{ marginLeft: "auto" }}>
                ✕
              </button>
            </div>
            <p className="form-modal__subtitle">
              {record.employee?.full_name ?? employee?.full_name} — {periodLabel} · Rincian otomatis terpotong BPJS &amp; PPh 21 (PP 58/2023)
            </p>
          </div>

          <div className="form-modal__scroll modal-scroll-hidden">
            <div className="form-section" style={{ background: "var(--bg-subtle)" }}>
              <SlipSheet record={record} employee={employee} />
            </div>
          </div>

          <div className="form-modal__footer" style={{ justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Tutup
            </button>
            <button
              type="button"
              className="btn btn-accent"
              onClick={handlePrint}
              title="Cetak atau simpan sebagai PDF"
            >
              <Printer size={15} /> Cetak / Simpan PDF
            </button>
          </div>
        </div>
      </div>

      {/* Salinan khusus cetak */}
      {createPortal(
        <div className="slip-print-portal">
          <SlipSheet record={record} employee={employee} />
        </div>,
        document.body
      )}
    </>
  );
}

function SlipSheet({
  record,
  employee,
}: {
  record: PayrollRecord;
  employee?: ReturnType<typeof useEmployee>["data"];
}) {
  const posted = slipState(record) === "posted";
  const periodLabel = `${MONTH_NAMES[record.period_month - 1]} ${record.period_year}`;
  const empData = employee ?? record.employee;

  // Hitung rincian lengkap potongan BPJS & PPh 21 sesuai regulasi Pemerintah RI
  const calc = useMemo(() => {
    const base = calculateMonthlyPayrollDeductions(
      { ...record, meal_allowance: "0", overtime_amount: "0" },
      empData
    );
    const baseGross = Number(record.base_salary || 0);
    const mealAllowance = Number(record.meal_allowance || 0);
    const overtimeAmount = Number(record.overtime_amount || 0);
    const allowanceTotal = mealAllowance + overtimeAmount;
    const netAfterDeduction = baseGross - base.totalEmployeeDeduction;
    return {
      ...base,
      baseGross,
      mealAllowance,
      overtimeAmount,
      allowanceTotal,
      netAfterDeduction,
      netTakeHomePay: netAfterDeduction + allowanceTotal,
    };
  }, [record, empData]);

  const allowances = [
    { label: "Uang Makan & Tunjangan Kehadiran", value: calc.mealAllowance, note: undefined as string | undefined },
    { label: "Upah Lembur", value: calc.overtimeAmount, note: overtimeHint(record) },
  ];

  const deductionItems = [
    {
      label: "BPJS Kesehatan (1% Porsi Karyawan)",
      value: calc.bpjsKesehatanEmployee,
    },
    {
      label: "BPJS Ketenagakerjaan — JHT (2% Porsi Karyawan)",
      value: calc.bpjsJhtEmployee,
    },
    {
      label: "BPJS Ketenagakerjaan — JP (1% Porsi Karyawan)",
      value: calc.bpjsJpEmployee,
    },
    {
      label: `PPh Pasal 21 (TER Kategori ${calc.terCategory} · Tarif ${calc.terRatePercent})`,
      value: calc.pph21Monthly,
    },
  ];

  if (calc.kasbonInstallment > 0) {
    deductionItems.push({
      label: "Cicilan Kasbon Karyawan",
      value: calc.kasbonInstallment,
    });
  }

  return (
    <div className={`slip-sheet${posted ? "" : " slip-sheet--draft"}`}>
      <div className="slip-sheet__head">
        <div>
          <div className="slip-sheet__brand">MSDC Surabaya</div>
          <div className="slip-sheet__brand-sub">Global Operations</div>
        </div>
        <div className="slip-sheet__title">
          Slip Gaji
          <span>{periodLabel}</span>
        </div>
      </div>

      <div className="slip-sheet__meta" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        <div>
          <span>Nama Karyawan</span>
          <strong>{record.employee?.full_name ?? empData?.full_name ?? "—"}</strong>
        </div>
        <div>
          <span>Kode Employee</span>
          <strong>{empData?.employee_number ?? "—"}</strong>
        </div>
        <div>
          <span>NIK (16 Digit)</span>
          <strong>{empData?.nik ?? "—"}</strong>
        </div>
        <div>
          <span>Periode Gaji</span>
          <strong>{periodLabel}</strong>
        </div>
        <div>
          <span>Status PTKP / Kategori TER</span>
          <strong>
            {calc.ptkpStatus} / TER {calc.terCategory} ({calc.terRatePercent})
          </strong>
        </div>
        <div>
          <span>Status Pengajuan Finance</span>
          <strong>{record.sent_at ? `Terkirim (${formatDate(record.sent_at)})` : "Draft Terhitung"}</strong>
        </div>
      </div>

      <table className="slip-sheet__table">
        <thead>
          <tr>
            <th>Komponen</th>
            <th style={{ textAlign: "right" }}>Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {/* A. Perincian Gaji */}
          <tr className="slip-sheet__subhead">
            <td>A. Perincian Gaji</td>
            <td style={{ textAlign: "right" }}>Jumlah</td>
          </tr>
          <tr>
            <td>Gaji Pokok</td>
            <td style={{ textAlign: "right", fontFamily: "monospace" }}>{rupiah(calc.baseGross)}</td>
          </tr>
          <tr className="slip-sheet__subtotal">
            <td>Gaji Bruto</td>
            <td style={{ textAlign: "right", fontFamily: "monospace" }}>{rupiah(calc.baseGross)}</td>
          </tr>

          {/* B. Potongan */}
          <tr className="slip-sheet__subhead">
            <td>B. Potongan (BPJS &amp; PPh Pasal 21)</td>
            <td style={{ textAlign: "right" }}>Jumlah</td>
          </tr>
          {deductionItems.map(d => (
            <tr key={d.label}>
              <td><div style={{ fontWeight: 600 }}>{d.label}</div></td>
              <td style={{ textAlign: "right", fontFamily: "monospace", color: "#dc2626", fontWeight: 600 }}>
                - {rupiah(d.value)}
              </td>
            </tr>
          ))}
          <tr className="slip-sheet__subtotal">
            <td>Total Potongan</td>
            <td style={{ textAlign: "right", fontFamily: "monospace", color: "#dc2626" }}>
              - {rupiah(calc.totalEmployeeDeduction)}
            </td>
          </tr>
          <tr className="slip-sheet__subtotal">
            <td>Gaji Netto (Gaji Pokok setelah potongan)</td>
            <td style={{ textAlign: "right", fontFamily: "monospace" }}>{rupiah(calc.netAfterDeduction)}</td>
          </tr>

          {/* C. Tunjangan (tidak dipotong) */}
          <tr className="slip-sheet__subhead">
            <td>C. Tunjangan &amp; Pendapatan Lain (tidak dipotong)</td>
            <td style={{ textAlign: "right" }}>Jumlah</td>
          </tr>
          {allowances.map(a => (
            <tr key={a.label}>
              <td>
                {a.label}
                {a.note && <div className="slip-sheet__note">{a.note}</div>}
              </td>
              <td style={{ textAlign: "right", fontFamily: "monospace", color: "#059669", fontWeight: 600 }}>
                + {rupiah(a.value)}
              </td>
            </tr>
          ))}
          <tr className="slip-sheet__subtotal">
            <td>Total Tunjangan</td>
            <td style={{ textAlign: "right", fontFamily: "monospace", color: "#059669" }}>
              + {rupiah(calc.allowanceTotal)}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>Total Penerimaan (Take-Home Pay)</td>
            <td style={{ textAlign: "right", fontFamily: "monospace", color: "#059669" }}>
              {rupiah(calc.netTakeHomePay)}
            </td>
          </tr>
        </tfoot>
      </table>

      {record.notes && (
        <div className="slip-sheet__notes">
          <span>Catatan</span>
          {record.notes}
        </div>
      )}

      <div className="slip-sheet__sign">
        <div>
          <span>Diterima oleh</span>
          <div className="slip-sheet__sign-line">{record.employee?.full_name ?? empData?.full_name ?? "—"}</div>
        </div>
        <div>
          <span>HR &amp; Payroll Department</span>
          <div className="slip-sheet__sign-line">MSDC Surabaya</div>
        </div>
      </div>

      <div className="slip-sheet__footer">
        Dihitung otomatis berdasarkan PP No. 58 Tahun 2023 &amp; PMK No. 168 Tahun 2023 oleh sistem MSDC ERP.
      </div>
    </div>
  );
}
