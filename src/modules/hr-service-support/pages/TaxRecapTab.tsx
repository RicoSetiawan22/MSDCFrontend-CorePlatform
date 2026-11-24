import { useMemo, useRef, useState } from "react";
import {
  Search, ChevronRight, Download, ArrowLeft, Wallet, Calculator,
  FileText, AlertTriangle, TrendingUp, Printer, CheckCircle2,
  Upload, Eye, Trash2, Loader2,
} from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { fileApi } from "@shared/api/fileApi";
import { downloadBlobAsFile } from "@shared/lib/downloadFile";
import { extractErrorMessage } from "@shared/types/api";
import { useEmployeeList } from "../api/useEmployees";
import { usePayrollList, useUploadTaxCertificate, useRemoveTaxCertificate } from "../api/usePayroll";
import { readAnnualTaxCertificateMeta } from "../api/payrollApi";
import {
  BIAYA_JABATAN_MAX_PER_MONTH,
  BIAYA_JABATAN_RATE,
  PTKP_ANNUAL_MAP,
  PTKP_TER_CATEGORY_MAP,
  calculateMonthlyPayrollDeductions,
  calculatePasal17AnnualTax,
  resolveEmployeePtkp,
  type Pasal17Slice,
  type PtkpCode,
  type TerCategory,
} from "../lib/indonesianTax";
import type { Employee } from "../types/employee";
import type { PayrollRecord } from "../types/payroll";

function rupiah(v: string | number): string {
  return `Rp ${Math.round(Number(v) || 0).toLocaleString("id-ID")}`;
}

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const YEARS = [2024, 2025, 2026, 2027];

export type TaxStatusFilter = "" | "final" | "belum_final";

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join("") || "?";
}

// ─── Model rekap ─────────────────────────────────────────────────────────────
interface MonthRow {
  month: number;
  baseSalary: number;
  mealAllowance: number;
  overtimeAmount: number;
  gross: number;
  bpjsKesehatan: number;
  bpjsJhtJp: number; // JHT 2% + JP 1% (pengurang penghasilan bruto pajak)
  bpjsTotal: number;
  terRatePercent: string;
  pph21: number;
  netTakeHome: number;
  sent: boolean;
}

interface YearEndCalc {
  gross: number;
  biayaJabatan: number;
  bpjsDeductible: number; // Akumulasi JHT 2% + JP 1% porsi karyawan
  bpjsKesehatanInfo: number; // Akumulasi BPJS Kesehatan 1% (bukan pengurang pajak)
  netto: number;
  ptkpValue: number;
  pkp: number;
  taxDue: number;
  slices: Pasal17Slice[];
}

export interface TaxRecap {
  employeeId: number;
  employeeNumber: string;
  nik: string | null;
  npwp: string | null;
  name: string;
  positionTitle: string | null;
  ptkp: PtkpCode;
  ptkpSource: "employee_profile" | "family_dependents" | "default_tk0";
  terCategory: TerCategory;
  months: MonthRow[];
  records: PayrollRecord[];
  gross: number;
  bpjsDeductibleTotal: number;
  pph21Paid: number;
  netTotal: number;
  hasPph21Data: boolean;
  calc: YearEndCalc;
  diff: number; // >0 kurang potong, <0 lebih potong, 0 sesuai
  isFinal: boolean;
  taxCertificateFileId: number | null;
  taxCertificateFileName: string | null;
  taxCertificateUploadedAt: string | null;
}

function calcYearEnd(
  gross: number,
  bpjsDeductible: number,
  bpjsKesehatanInfo: number,
  monthsCount: number,
  ptkp: PtkpCode
): YearEndCalc {
  const ptkpValue = PTKP_ANNUAL_MAP[ptkp] ?? PTKP_ANNUAL_MAP["TK/0"];
  const biayaJabatan = Math.round(
    Math.min(gross * BIAYA_JABATAN_RATE, BIAYA_JABATAN_MAX_PER_MONTH * Math.max(1, monthsCount))
  );
  const netto = Math.max(0, Math.round(gross - biayaJabatan - bpjsDeductible));
  const pkp = Math.max(0, Math.floor((netto - ptkpValue) / 1000) * 1000);
  const { totalTax: taxDue, slices } = calculatePasal17AnnualTax(pkp);

  return {
    gross,
    biayaJabatan,
    bpjsDeductible,
    bpjsKesehatanInfo,
    netto,
    ptkpValue,
    pkp,
    taxDue,
    slices,
  };
}

function buildRecaps(records: PayrollRecord[], employees: Employee[]): TaxRecap[] {
  const empById = new Map<number, Employee>();
  employees.forEach(e => empById.set(e.id, e));

  const grouped = new Map<number, PayrollRecord[]>();
  records.forEach(r => {
    const list = grouped.get(r.employee_id) ?? [];
    list.push(r);
    grouped.set(r.employee_id, list);
  });

  return [...grouped.entries()]
    .map(([employeeId, list]) => {
      const sorted = [...list].sort((a, b) => a.period_month - b.period_month);
      const emp = empById.get(employeeId) ?? sorted[0]?.employee;
      const { ptkp, source: ptkpSource } = resolveEmployeePtkp(emp, sorted[0]?.ptkp_status);
      const terCategory = PTKP_TER_CATEGORY_MAP[ptkp] ?? "A";

      const months: MonthRow[] = sorted.map(r => {
        const mCalc = calculateMonthlyPayrollDeductions(r, emp);
        return {
          month: r.period_month,
          baseSalary: mCalc.baseSalary,
          mealAllowance: mCalc.mealAllowance,
          overtimeAmount: mCalc.overtimeAmount,
          gross: mCalc.grossSalary,
          bpjsKesehatan: mCalc.bpjsKesehatanEmployee,
          bpjsJhtJp: mCalc.bpjsKetenagakerjaanEmployee,
          bpjsTotal: mCalc.bpjsTotalEmployee,
          terRatePercent: mCalc.terRatePercent,
          pph21: mCalc.pph21Monthly,
          netTakeHome: mCalc.netTakeHomePay,
          sent: r.status === "sent_to_finance",
        };
      });

      const gross = months.reduce((s, m) => s + m.gross, 0);
      // Dasar pengenaan pajak tahunan murni dari Gaji Pokok (uang makan & lembur tidak dipotong pajak)
      const taxableGross = months.reduce((s, m) => s + m.baseSalary, 0);
      const bpjsDeductibleTotal = months.reduce((s, m) => s + m.bpjsJhtJp, 0);
      const bpjsKesTotal = months.reduce((s, m) => s + m.bpjsKesehatan, 0);
      const pph21Paid = months.reduce((s, m) => s + m.pph21, 0);
      const netTotal = months.reduce((s, m) => s + m.netTakeHome, 0);
      const calc = calcYearEnd(taxableGross, bpjsDeductibleTotal, bpjsKesTotal, months.length, ptkp);

      const recordWithCert = [...sorted]
        .reverse()
        .find(r => r.tax_certificate_file_id && r.tax_certificate_file_name);
      const storedAnnualCert = readAnnualTaxCertificateMeta(employeeId, sorted[0]?.period_year ?? new Date().getFullYear());

      const taxCertificateFileId =
        recordWithCert?.tax_certificate_file_id ?? storedAnnualCert?.file_id ?? null;
      const taxCertificateFileName =
        recordWithCert?.tax_certificate_file_name ?? storedAnnualCert?.file_name ?? null;
      const taxCertificateUploadedAt =
        recordWithCert?.tax_certificate_uploaded_at ?? storedAnnualCert?.uploaded_at ?? null;

      return {
        employeeId,
        employeeNumber: emp?.employee_number ?? "—",
        nik: emp?.nik ?? null,
        npwp: emp?.npwp ?? null,
        name: sorted[0].employee?.full_name ?? emp?.full_name ?? "—",
        positionTitle: emp?.position?.position_title ?? null,
        ptkp,
        ptkpSource,
        terCategory,
        months,
        records: sorted,
        gross,
        bpjsDeductibleTotal,
        pph21Paid,
        netTotal,
        hasPph21Data: true,
        calc,
        diff: calc.taxDue - pph21Paid,
        isFinal: months.length > 0 && months.every(m => m.sent),
        taxCertificateFileId,
        taxCertificateFileName,
        taxCertificateUploadedAt,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function useTaxRecaps(year: number) {
  const payroll = usePayrollList({ period_year: year, page: 1, per_page: 1000 });
  const employees = useEmployeeList({ per_page: 500 });

  const recaps = useMemo(
    () => buildRecaps(payroll.data?.data ?? [], employees.data?.data ?? []),
    [payroll.data, employees.data]
  );
  const truncated = !!payroll.data && payroll.data.total > payroll.data.data.length;

  return { recaps, isLoading: payroll.isLoading || employees.isLoading, truncated };
}

function exportCsv(recaps: TaxRecap[], year: number) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const header = [
    "Kode Employee",
    "NIK",
    "NPWP",
    "Nama Karyawan",
    "PTKP",
    "Kategori TER",
    "Bulan Terhitung",
    "Penghasilan Bruto Setahun",
    "Biaya Jabatan",
    "Pengurang JHT+JP Karyawan",
    "Penghasilan Neto",
    "PKP",
    "PPh 21 Dipotong (TER Bulanan)",
    "PPh 21 Terutang Setahun (Pasal 17)",
    "Selisih Akhir Tahun",
    "Status",
  ];
  const rows = recaps.map(r => [
    r.employeeNumber,
    r.nik ?? "",
    r.npwp ?? "",
    r.name,
    r.ptkp,
    `TER ${r.terCategory}`,
    r.months.length,
    r.gross,
    r.calc.biayaJabatan,
    r.calc.bpjsDeductible,
    r.calc.netto,
    r.calc.pkp,
    r.pph21Paid,
    r.calc.taxDue,
    r.diff,
    r.isFinal ? "Final" : "Belum final",
  ]);
  const csv = [header, ...rows].map(row => row.map(esc).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rekap-pajak-pph21-tahunan-${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── UI kecil ────────────────────────────────────────────────────────────────
const selectClass =
  "px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A2140]";
const thClass = "px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider";

function FinalBadge({ final }: { final: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
        final
          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
          : "bg-amber-50 text-amber-700 border-amber-200/60"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${final ? "bg-emerald-500" : "bg-amber-500"}`} />
      {final ? "Final (Posted)" : "Draft Berjalan"}
    </span>
  );
}

function DiffCell({ diff }: { diff: number | null }) {
  if (diff === null) return <span className="text-slate-400">—</span>;
  if (diff === 0) return <span className="text-emerald-700 font-semibold">Nihil / Sesuai (Rp 0)</span>;
  const under = diff > 0;
  return (
    <div>
      <div className={`font-semibold ${under ? "text-rose-600" : "text-emerald-600"}`}>{rupiah(Math.abs(diff))}</div>
      <div className="text-[10px] text-slate-500 font-sans">{under ? "Kurang potong" : "Lebih potong"}</div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon,
  tone,
  hintClass = "text-slate-500",
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ReactNode;
  tone: string;
  hintClass?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tone}`}>{icon}</div>
      </div>
      <div className="mt-3">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        <p className={`text-xs mt-1 ${hintClass}`}>{hint}</p>
      </div>
    </div>
  );
}

export function TaxKpiCards({ year }: { year: number }) {
  const { recaps } = useTaxRecaps(year);

  const totalGross = recaps.reduce((s, r) => s + r.gross, 0);
  const totalPphPaid = recaps.reduce((s, r) => s + r.pph21Paid, 0);
  const totalPphAnnual = recaps.reduce((s, r) => s + r.calc.taxDue, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Kpi
        label="Wajib Pajak Karyawan"
        value={recaps.length}
        hint={`Tahun pajak ${year}`}
        icon={<Search size={16} />}
        tone="bg-slate-100 text-slate-700"
      />
      <Kpi
        label="Penghasilan Bruto Tahunan"
        value={rupiah(totalGross)}
        hint="Akumulasi payroll tahun berjalan"
        icon={<span className="font-bold text-sm">Rp</span>}
        tone="bg-blue-50 text-blue-600"
      />
      <Kpi
        label="PPh 21 Dipotong (TER)"
        value={rupiah(totalPphPaid)}
        hint="Akumulasi potongan TER PP 58/2023"
        icon={<Calculator size={16} />}
        tone="bg-emerald-50 text-emerald-600"
      />
      <Kpi
        label="PPh 21 Setahun (Pasal 17)"
        value={rupiah(totalPphAnnual)}
        hint="Perhitungan Tarif Pasal 17 UU HPP"
        icon={<TrendingUp size={16} />}
        tone="bg-amber-50 text-amber-600"
        hintClass="text-amber-700 font-medium"
      />
    </div>
  );
}

// ─── Tab: Rekap Pajak Tahunan ────────────────────────────────────────────────
export function TaxRecapTab({
  year,
  onYearChange,
  status,
  onStatusChange,
  onOpen,
}: {
  year: number;
  onYearChange: (y: number) => void;
  status: TaxStatusFilter;
  onStatusChange: (s: TaxStatusFilter) => void;
  onOpen: (employeeId: number) => void;
}) {
  const [search, setSearch] = useState("");
  const { recaps, isLoading, truncated } = useTaxRecaps(year);

  const rows = recaps.filter(r => {
    if (status === "final" && !r.isFinal) return false;
    if (status === "belum_final" && r.isFinal) return false;
    if (
      search &&
      !r.name.toLowerCase().includes(search.toLowerCase()) &&
      !r.employeeNumber.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Tahun Pajak:</span>
          <select className={selectClass} value={year} onChange={e => onYearChange(parseInt(e.target.value))}>
            {YEARS.map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={status}
            onChange={e => onStatusChange(e.target.value as TaxStatusFilter)}
          >
            <option value="">Semua Status</option>
            <option value="final">Final (Posted)</option>
            <option value="belum_final">Draft Berjalan</option>
          </select>
          <input
            className={`${selectClass} w-56`}
            placeholder="Cari nama atau kode karyawan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          disabled={rows.length === 0}
          onClick={() => exportCsv(rows, year)}
        >
          <Download size={13} className="text-slate-500" /> Ekspor CSV (1721-A1)
        </button>
      </div>

      {truncated && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          Data payroll tahun ini melebihi batas yang dimuat, sebagian record belum ikut dihitung.
        </div>
      )}

      {isLoading && <LoadingState />}
      {!isLoading && rows.length === 0 && (
        <div className="p-8">
          <EmptyState
            title="Belum Ada Rekap Pajak"
            subtitle={`Tidak ada data payroll untuk tahun pajak ${year} dengan filter ini. Buat payroll lewat tab Payroll Records.`}
          />
        </div>
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80">
                <th className={thClass}>Karyawan</th>
                <th className={thClass}>PTKP / TER</th>
                <th className={thClass}>Masa Kerja</th>
                <th className={thClass}>Penghasilan Bruto</th>
                <th className={thClass}>PKP Setahun</th>
                <th className={thClass}>PPh 21 Dipotong (TER)</th>
                <th className={thClass}>PPh 21 Setahun (Pasal 17)</th>
                <th className={thClass}>Selisih Akhir Tahun</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-right`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.employeeId} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                  <td className="px-4 py-3.5 text-sm">
                    <button
                      onClick={() => onOpen(r.employeeId)}
                      className="font-semibold text-slate-900 hover:text-[#0A2140] hover:underline text-left block"
                    >
                      {r.name}
                    </button>
                    <div className="text-[11px] font-mono text-slate-400">
                      {r.employeeNumber}
                      {r.nik ? ` · NIK: ${r.nik}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/70 font-semibold">
                      {r.ptkp} · TER {r.terCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{r.months.length}/12 bln</td>
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-800">{rupiah(r.gross)}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-700">{rupiah(r.calc.pkp)}</td>
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-emerald-700">{rupiah(r.pph21Paid)}</td>
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-[#0A2140]">{rupiah(r.calc.taxDue)}</td>
                  <td className="px-4 py-3.5 font-mono text-xs">
                    <DiffCell diff={r.diff} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col items-start gap-1">
                      <FinalBadge final={r.isFinal} />
                      {r.taxCertificateFileId && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
                          <CheckCircle2 size={10} /> 1721-A1 Diupload
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => onOpen(r.employeeId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#0A2140] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      Rincian <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > 0 && (
        <p className="text-xs text-slate-500">
          Perhitungan otomatis menggunakan <strong>Tarif Efektif Bulanan (TER) PP No. 58 Tahun 2023 &amp; PMK No. 168 Tahun 2023</strong> untuk masa bulanan serta{" "}
          <strong>Tarif Progresif Pasal 17 ayat (1) huruf a UU HPP No. 7 Tahun 2021</strong> untuk rekonsiliasi tahunan (Formulir 1721-A1).
        </p>
      )}
    </div>
  );
}

// ─── Detail Rekap Pajak ──────────────────────────────────────────────────────
function SectionCard({
  icon,
  iconTone,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  iconTone: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex items-center gap-3 pb-4 mb-3 border-b border-slate-100">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconTone}`}>{icon}</div>
        <div>
          <div className="text-sm font-bold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500">{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Line({
  label,
  value,
  strong,
  muted,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  muted?: boolean;
  valueClass?: string;
}) {
  return (
    <div className={`flex items-center justify-between py-2.5 text-sm ${strong ? "border-t border-slate-100 mt-1 pt-3.5" : ""}`}>
      <span className={strong ? "font-bold text-slate-900" : muted ? "text-slate-400" : "text-slate-600"}>{label}</span>
      <span className={`font-mono ${strong ? "font-bold" : "font-semibold"} ${valueClass}`}>{value}</span>
    </div>
  );
}

export function TaxRecapDetailView({
  employeeId,
  year,
  onBack,
}: {
  employeeId: number;
  year: number;
  onBack: () => void;
}) {
  const { recaps, isLoading } = useTaxRecaps(year);
  const recap = recaps.find(r => r.employeeId === employeeId);
  const [show1721Modal, setShow1721Modal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadTaxCertificate();
  const removeMutation = useRemoveTaxCertificate();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDownloadingCert, setIsDownloadingCert] = useState(false);
  const [localCertOverride, setLocalCertOverride] = useState<{
    fileId: number | null;
    fileName: string | null;
    uploadedAt: string | null;
  } | null>(null);

  const backBar = (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <ArrowLeft size={13} /> Kembali ke Rekap Pajak Tahunan
      </button>
      <span className="text-xs text-slate-500">
        Tahun Pajak: <strong className="text-slate-900">{year}</strong>
      </span>
    </div>
  );

  if (isLoading || !recap) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-16">
        <PageHeader title="Detail Rekap Pajak" subtitle={`Tahun Pajak ${year}`} />
        <div className="px-7 py-5 flex flex-col gap-6">
          {backBar}
          {isLoading ? (
            <LoadingState />
          ) : (
            <EmptyState title="Rekap Tidak Ditemukan" subtitle="Data payroll karyawan ini tidak ada pada tahun pajak yang dipilih." />
          )}
        </div>
      </div>
    );
  }

  const { calc, diff } = recap;
  const monthMap = new Map(recap.months.map(m => [m.month, m]));
  const diffTone = diff > 0 ? "text-rose-600" : diff < 0 ? "text-emerald-600" : "text-emerald-700";
  const diffLabel =
    diff > 0
      ? "Kurang potong (dipotong pada masa pajak terakhir)"
      : diff < 0
        ? "Lebih potong (dikembalikan kepada pegawai)"
        : "Sesuai / Nihil";

  const activeCertFileId =
    localCertOverride !== null ? localCertOverride.fileId : recap.taxCertificateFileId;
  const activeCertFileName =
    localCertOverride !== null ? localCertOverride.fileName : recap.taxCertificateFileName;
  const activeCertUploadedAt =
    localCertOverride !== null ? localCertOverride.uploadedAt : recap.taxCertificateUploadedAt;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !recap) return;
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const meta = await uploadMutation.mutateAsync({
        employeeId: recap.employeeId,
        year,
        file,
        records: recap.records,
      });
      setLocalCertOverride({
        fileId: meta.file_id,
        fileName: meta.file_name,
        uploadedAt: meta.uploaded_at,
      });
      setUploadSuccess(`Dokumen "${meta.file_name}" berhasil diupload dan disimpan.`);
    } catch (err) {
      setUploadError(extractErrorMessage(err));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleViewOrDownloadCert(mode: "preview" | "download") {
    if (!activeCertFileId) return;
    setIsDownloadingCert(true);
    setUploadError(null);
    try {
      const blobRes = await fileApi.previewBlob(activeCertFileId);
      if (mode === "preview") {
        const objUrl = window.URL.createObjectURL(blobRes.data);
        window.open(objUrl, "_blank", "noopener,noreferrer");
        setTimeout(() => window.URL.revokeObjectURL(objUrl), 60000);
      } else {
        downloadBlobAsFile(blobRes.data, activeCertFileName || `Formulir-1721-A1-${year}-${recap?.employeeNumber}.pdf`);
      }
    } catch (err) {
      setUploadError(extractErrorMessage(err));
    } finally {
      setIsDownloadingCert(false);
    }
  }

  async function handleRemoveCert() {
    if (!recap || !activeCertFileId) return;
    if (!window.confirm(`Hapus dokumen Bukti Potong 1721-A1 (${activeCertFileName}) yang telah diupload?`)) {
      return;
    }
    setUploadError(null);
    setUploadSuccess(null);
    try {
      await removeMutation.mutateAsync({
        employeeId: recap.employeeId,
        year,
        records: recap.records,
      });
      setLocalCertOverride({
        fileId: null,
        fileName: null,
        uploadedAt: null,
      });
      setUploadSuccess("Dokumen Bukti Potong 1721-A1 berhasil dihapus.");
    } catch (err) {
      setUploadError(extractErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Detail Rekap Pajak Tahunan (PPh Pasal 21)"
        subtitle={`${recap.name} · ${recap.employeeNumber} · Tahun Pajak ${year}`}
      />

      <div className="px-7 py-5 flex flex-col gap-6">
        {backBar}

        {/* Header karyawan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-[#0A2140]" />
          <div className="p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-700 font-bold text-lg flex items-center justify-center">
                {initials(recap.name)}
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{recap.name}</div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                    Kode: {recap.employeeNumber}
                  </span>
                  {recap.nik && (
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                      NIK: {recap.nik}
                    </span>
                  )}
                  {recap.npwp && (
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      NPWP: {recap.npwp}
                    </span>
                  )}
                  <FinalBadge final={recap.isFinal} />
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200/60">
                    PTKP {recap.ptkp} · Kategori TER {recap.terCategory}
                  </span>
                  <span className="text-xs text-slate-500">{recap.months.length} dari 12 bulan terhitung</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Selisih Perhitungan Tahunan</div>
              <div className={`text-2xl font-bold mt-1 ${diffTone}`}>{rupiah(Math.abs(diff))}</div>
              <div className="text-xs text-slate-500 mt-0.5">{diffLabel}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Kolom kiri */}
          <div className="flex flex-col gap-6">
            <SectionCard
              icon={<Wallet size={18} />}
              iconTone="bg-slate-100 text-slate-700"
              title="A. Ringkasan Penghasilan & Potongan Tahunan"
              subtitle="Akumulasi payroll bulanan tahun pajak ini"
            >
              <Line label="Total penghasilan bruto (termasuk uang makan & lembur)" value={rupiah(recap.gross)} />
              <Line label="Total gaji pokok kena pajak (tanpa uang makan & lembur)" value={rupiah(calc.gross)} />
              <Line label="Total iuran JHT (2%) + JP (1%) karyawan" value={rupiah(recap.bpjsDeductibleTotal)} />
              <Line label="Total BPJS Kesehatan (1%) karyawan" value={rupiah(calc.bpjsKesehatanInfo)} />
              <Line
                label="Total PPh 21 dipotong bulanan (TER PP 58/2023)"
                value={rupiah(recap.pph21Paid)}
                valueClass="text-emerald-700"
              />
              <Line
                label="Total Gaji Bersih diterima (Take-Home Pay)"
                value={rupiah(recap.netTotal)}
                strong
                valueClass="text-[#0A2140]"
              />
            </SectionCard>

            <SectionCard
              icon={<Calculator size={18} />}
              iconTone="bg-blue-50 text-blue-600"
              title="B. Perhitungan Pajak Tahunan (Pasal 17 UU HPP)"
              subtitle="Rekonsiliasi PPh Pasal 21 Setahun sesuai PMK No. 168 Tahun 2023"
            >
              <Line label="1. Gaji Pokok Kena Pajak Setahun (Tanpa Uang Makan & Lembur)" value={rupiah(calc.gross)} />
              <Line
                label={`2. Pengurang: Biaya Jabatan (5%, maks Rp 500rb × ${recap.months.length} bln)`}
                value={`− ${rupiah(calc.biayaJabatan)}`}
                valueClass="text-rose-600"
              />
              <Line
                label="3. Pengurang: Iuran Pensiun / JHT (2%) + JP (1%) Karyawan"
                value={`− ${rupiah(calc.bpjsDeductible)}`}
                valueClass="text-rose-600"
              />
              <Line label="4. Penghasilan Neto Setahun (1 − 2 − 3)" value={rupiah(calc.netto)} strong />
              <Line
                label={`5. Penghasilan Tidak Kena Pajak / PTKP (${recap.ptkp})`}
                value={`− ${rupiah(calc.ptkpValue)}`}
              />
              <Line
                label="6. Penghasilan Kena Pajak / PKP Setahun (dibulatkan ribuan)"
                value={rupiah(calc.pkp)}
                strong
              />

              {/* Rincian Lapisan Tarif Pasal 17 UU HPP */}
              <div className="my-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-xs font-bold text-slate-700 mb-2">
                  Rincian Lapisan Tarif Progresif Pasal 17 ayat (1) huruf a UU HPP:
                </div>
                {calc.slices.length === 0 ? (
                  <div className="text-xs text-slate-500">
                    PKP = Rp 0 (Penghasilan Neto di bawah batas PTKP {recap.ptkp}, sehingga PPh 21 Setahun = Rp 0 / Nihil).
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {calc.slices.map(s => (
                      <div key={s.label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">
                          {s.label} × <span className="font-mono">{rupiah(s.taxableAmount)}</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-800">{rupiah(s.taxAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Line label="7. PPh Pasal 21 Terutang Setahun (Pasal 17)" value={rupiah(calc.taxDue)} strong />
              <Line label="8. PPh Pasal 21 yang Telah Dipotong (TER Bulanan)" value={`− ${rupiah(recap.pph21Paid)}`} />
              <Line
                label={`9. Selisih Akhir Tahun · ${diffLabel}`}
                value={rupiah(Math.abs(diff))}
                strong
                valueClass={diffTone}
              />

              <p className="text-[11px] text-slate-500 leading-relaxed mt-3 pt-3 border-t border-slate-100">
                Catatan Regulasi DJP: Iuran BPJS Kesehatan (1%) porsi karyawan sebesar{" "}
                <strong>{rupiah(calc.bpjsKesehatanInfo)}</strong> memotong Take-Home Pay tetapi bukan pengurang penghasilan bruto PPh 21; hanya Biaya Jabatan (5%) dan Iuran JHT (2%) + JP (1%) porsi karyawan yang menjadi pengurang penghasilan bruto.
              </p>
            </SectionCard>
          </div>

          {/* Kolom kanan */}
          <div className="flex flex-col gap-6">
            <SectionCard
              icon={<TrendingUp size={18} />}
              iconTone="bg-emerald-50 text-emerald-600"
              title="C. Rincian Pemotongan Bulanan (Januari – Desember)"
              subtitle="Penghasilan Bruto, BPJS, Tarif TER, dan PPh 21 per masa pajak"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80">
                      <th className="py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bulan</th>
                      <th className="py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Bruto</th>
                      <th className="py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">BPJS (4%)</th>
                      <th className="py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">TER</th>
                      <th className="py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">PPh 21</th>
                      <th className="py-2 pl-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTH_NAMES.map((name, i) => {
                      const m = monthMap.get(i + 1);
                      return (
                        <tr key={name} className="border-b border-slate-100">
                          <td className={`py-2.5 text-xs ${m ? "text-slate-800 font-semibold" : "text-slate-400"}`}>{name}</td>
                          <td className="py-2.5 text-right font-mono text-xs text-slate-700">{m ? rupiah(m.gross) : "—"}</td>
                          <td className="py-2.5 text-right font-mono text-xs text-slate-600">{m ? rupiah(m.bpjsTotal) : "—"}</td>
                          <td className="py-2.5 text-right font-mono text-xs text-slate-500">{m ? m.terRatePercent : "—"}</td>
                          <td className="py-2.5 text-right font-mono text-xs font-semibold text-rose-600">
                            {m ? rupiah(m.pph21) : "—"}
                          </td>
                          <td className="py-2.5 pl-3 text-xs">
                            {m ? (
                              <span className={m.sent ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                                {m.sent ? "Terkirim" : "Draft"}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200">
                      <td className="pt-3 text-xs font-bold text-slate-900">Total Setahun</td>
                      <td className="pt-3 text-right font-mono text-xs font-bold text-[#0A2140]">{rupiah(recap.gross)}</td>
                      <td className="pt-3 text-right font-mono text-xs font-bold text-slate-700">
                        {rupiah(recap.bpjsDeductibleTotal + calc.bpjsKesehatanInfo)}
                      </td>
                      <td className="pt-3 text-right font-mono text-xs text-slate-400">—</td>
                      <td className="pt-3 text-right font-mono text-xs font-bold text-rose-600">{rupiah(recap.pph21Paid)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </SectionCard>

            <SectionCard
              icon={<FileText size={18} />}
              iconTone="bg-amber-50 text-amber-600"
              title="D. Dokumen Bukti Potong Tahunan (Formulir 1721-A1)"
              subtitle="Bukti pemotongan PPh Pasal 21 bagi Pegawai Tetap"
            >
              <div className="flex items-start justify-between gap-3 py-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Formulir 1721-A1 — Tahun Pajak {year}</div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Bukti potong tahunan pegawai tetap sesuai PER-16/PJ/2016, PP No. 58/2023 &amp; PMK No. 168/2023.
                  </div>
                </div>
                {activeCertFileId ? (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                    <CheckCircle2 size={12} /> Dokumen Diupload
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <CheckCircle2 size={12} /> Siap Dicetak
                  </span>
                )}
              </div>

              {/* Box Upload Dokumen Bukti Potong Tahunan (1721-A1) */}
              <div className="mt-3 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Upload File Bukti Potong 1721-A1 Resmi (PDF / Gambar)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Unggah dokumen Formulir 1721-A1 yang telah ditandatangani atau diterbitkan DJP (PDF, JPG, PNG maks. 50MB).
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0A2140] bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-200 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Mengupload...
                      </>
                    ) : (
                      <>
                        <Upload size={13} /> {activeCertFileId ? "Ganti File" : "Upload Bukti Potong"}
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {activeCertFileId && (
                  <div className="mt-3 p-3 rounded-xl bg-white border border-blue-200/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {activeCertFileName || `Formulir-1721-A1-${year}.pdf`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          File ID #{activeCertFileId}
                          {activeCertUploadedAt
                            ? ` · Diupload ${new Date(activeCertUploadedAt).toLocaleString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleViewOrDownloadCert("preview")}
                        disabled={isDownloadingCert}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Lihat dokumen di tab baru"
                      >
                        <Eye size={13} /> Lihat
                      </button>
                      <button
                        type="button"
                        onClick={() => handleViewOrDownloadCert("download")}
                        disabled={isDownloadingCert}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Unduh file bukti potong"
                      >
                        <Download size={13} /> Unduh
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCert}
                        disabled={removeMutation.isPending}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Hapus file bukti potong"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="mt-2.5 text-xs text-rose-600 font-medium bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                    {uploadError}
                  </div>
                )}
                {uploadSuccess && (
                  <div className="mt-2.5 text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    {uploadSuccess}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShow1721Modal(true)}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0A2140] hover:bg-[#143566] rounded-xl shadow-sm transition-colors"
              >
                <FileText size={14} /> Lihat &amp; Cetak Bukti Potong 1721-A1
              </button>
            </SectionCard>
          </div>
        </div>
      </div>

      {show1721Modal && <Form1721A1Modal recap={recap} year={year} onClose={() => setShow1721Modal(false)} />}
    </div>
  );
}

function Form1721A1Modal({ recap, year, onClose }: { recap: TaxRecap; year: number; onClose: () => void }) {
  const { calc } = recap;
  const docNumber = `1.1-12.${String(year).slice(-2)}-${String(recap.employeeId).padStart(7, "0")}`;

  return (
    <div
      className="modal-overlay"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="form-modal" style={{ maxWidth: 780, borderRadius: 20 }}>
        <div className="form-modal__header">
          <div className="form-modal__title-row">
            <h2 className="form-modal__title">Bukti Pemotongan Pajak Penghasilan Pasal 21 (Formulir 1721-A1)</h2>
            <button type="button" className="form-modal__close" onClick={onClose} style={{ marginLeft: "auto" }}>
              ✕
            </button>
          </div>
          <p className="form-modal__subtitle">
            Nomor Bukti Potong: <strong>{docNumber}</strong> · Masa Perolehan Penghasilan: 01/{year} s.d. 12/{year}
          </p>
        </div>

        <div className="form-modal__scroll modal-scroll-hidden">
          <div className="form-section" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #0A2140", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Kementerian Keuangan RI — Direktorat Jenderal Pajak
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  BUKTI PEMOTONGAN PAJAK PENGHASILAN PASAL 21 BAGI PEGAWAI TETAP
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0A2140" }}>FORMULIR 1721 - A1</div>
                <div style={{ fontSize: "0.72rem", color: "#475569", fontFamily: "monospace" }}>No: {docNumber}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.78rem", marginBottom: "1rem", background: "#f8fafc", padding: "0.85rem", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div>
                <div style={{ color: "#64748b", fontSize: "0.7rem" }}>Nama Lengkap Penerima Penghasilan</div>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>{recap.name}</div>
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: "0.7rem" }}>Kode Employee / Jabatan</div>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>{recap.employeeNumber} {recap.positionTitle ? `— ${recap.positionTitle}` : ""}</div>
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: "0.7rem" }}>NIK (Nomor Induk Kepegawaian / KTP 16 Digit)</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>{recap.nik ?? "—"}</div>
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: "0.7rem" }}>NPWP / Status PTKP</div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>{recap.npwp ?? "NIK Terintegrasi"} · PTKP {recap.ptkp} (TER {recap.terCategory})</div>
              </div>
            </div>

            <table className="slip-sheet__table" style={{ fontSize: "0.8rem" }}>
              <thead>
                <tr>
                  <th>Rincian Penghitungan PPh Pasal 21 (Setahun)</th>
                  <th style={{ textAlign: "right" }}>Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1. Jumlah Penghasilan Bruto Setahun ({recap.months.length} Masa Pajak)</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{rupiah(calc.gross)}</td>
                </tr>
                <tr>
                  <td>2. Pengurangan: Biaya Jabatan (5% Bruto, maks Rp 500.000/bulan)</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", color: "#dc2626" }}>- {rupiah(calc.biayaJabatan)}</td>
                </tr>
                <tr>
                  <td>3. Pengurangan: Iuran Pensiun / JHT (2%) &amp; JP (1%) yang Dibayar Karyawan</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", color: "#dc2626" }}>- {rupiah(calc.bpjsDeductible)}</td>
                </tr>
                <tr className="slip-sheet__subtotal">
                  <td>4. Jumlah Penghasilan Neto Setahun (1 − 2 − 3)</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace" }}>{rupiah(calc.netto)}</td>
                </tr>
                <tr>
                  <td>5. Penghasilan Tidak Kena Pajak / PTKP ({recap.ptkp})</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace" }}>- {rupiah(calc.ptkpValue)}</td>
                </tr>
                <tr className="slip-sheet__subtotal">
                  <td>6. Penghasilan Kena Pajak / PKP Setahun (4 − 5)</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace" }}>{rupiah(calc.pkp)}</td>
                </tr>
                <tr>
                  <td>7. PPh Pasal 21 Terutang Setahun (Tarif Pasal 17 ayat (1) huruf a UU HPP)</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{rupiah(calc.taxDue)}</td>
                </tr>
                <tr>
                  <td>8. PPh Pasal 21 yang Telah Dipotong Masa Bulanan (TER PP 58/2023)</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", color: "#059669", fontWeight: 600 }}>{rupiah(recap.pph21Paid)}</td>
                </tr>
                <tr className="slip-sheet__subtotal">
                  <td>9. Selisih PPh Pasal 21 Akhir Tahun (7 − 8)</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace" }}>{rupiah(recap.diff)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="form-modal__footer" style={{ justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
          <button type="button" className="btn btn-accent" onClick={() => window.print()}>
            <Printer size={15} /> Cetak Bukti Potong 1721-A1
          </button>
        </div>
      </div>
    </div>
  );
}
