import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, FileText, Pencil, Send, Calculator, CheckCircle2, Mail, Phone, Briefcase,
  Wallet, TrendingUp, TrendingDown, ClipboardCheck, AlertTriangle, ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { extractErrorMessage } from "@shared/types/api";
import { useFilePreview } from "@modules/core-platform/api/useFilePreview";
import { useEmployee } from "../api/useEmployees";
import { useCalculatePayrollDeductions, useSubmitPayrollToFinance } from "../api/usePayroll";
import { calculateMonthlyPayrollDeductions, PTKP_ANNUAL_MAP } from "../lib/indonesianTax";
import type { PayrollRecord } from "../types/payroll";

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function rupiah(v: string | number): string {
  return `Rp ${Math.round(Number(v) || 0).toLocaleString("id-ID")}`;
}

function PayrollAvatar({ photoFileId, name, size = 72 }: { photoFileId?: number | null; name: string; size?: number }) {
  const { url } = useFilePreview(photoFileId);
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: "var(--accent-light)",
        color: "var(--msdc-blue)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 700,
      }}
    >
      {initials}
    </div>
  );
}

interface Props {
  record: PayrollRecord;
  onBack: () => void;
  onViewSlip: (rec: PayrollRecord) => void;
  onEditDraft: () => void;
}

export function PayrollDetailView({ record: initialRecord, onBack, onViewSlip, onEditDraft }: Props) {
  const [record, setRecord] = useState<PayrollRecord>(initialRecord);
  useEffect(() => {
    setRecord(initialRecord);
  }, [initialRecord]);

  // Ambil data asli karyawan dari database (termasuk PTKP, NPWP, NIK, BPJS, & Tanggungan Keluarga)
  const { data: employee } = useEmployee(record.employee_id);
  const calcMutation = useCalculatePayrollDeductions();
  const submitMutation = useSubmitPayrollToFinance();

  const fullName = record.employee?.full_name ?? employee?.full_name ?? "—";

  // Hitung otomatis sesuai regulasi Pemerintah RI (PP 58/2023, PMK 168/2023, Perpres 64/2020, PP 45/2015)
  const breakdown = useMemo(() => {
    const emp = employee ?? record.employee;

    // Penghasilan sebenarnya (untuk tampilan)
    const full = calculateMonthlyPayrollDeductions(record, emp);

    // Potongan hanya dari gaji pokok: uang makan & lembur di-nol-kan
    const baseOnly = calculateMonthlyPayrollDeductions(
      { ...record, meal_allowance: "0", overtime_amount: "0" },
      emp
    );

    const baseGross = Number(full.baseSalary || 0);
    const allowanceTotal =
      Number(full.mealAllowance || 0) + Number(full.overtimeAmount || 0);
    const netAfterDeduction = baseGross - baseOnly.totalEmployeeDeduction;

    return {
      ...baseOnly,
      baseSalary: full.baseSalary,
      mealAllowance: full.mealAllowance,
      overtimeAmount: full.overtimeAmount,
      grossSalary: full.grossSalary, // dipertahankan agar enrichedCurrentRecord tidak rusak
      baseGross,                     // bruto = gaji pokok saja
      allowanceTotal,                // uang makan + lembur
      netAfterDeduction,             // gaji pokok setelah dipotong
      netTakeHomePay: netAfterDeduction + allowanceTotal,
    };
  }, [record, employee]);

  // Sinkronkan hasil perhitungan otomatis ke record ketika data detail employee selesai dimuat
  useEffect(() => {
    if (employee && record.status !== "sent_to_finance") {
      calcMutation.mutate(
        { record, employee },
        {
          onSuccess: (updated) => setRecord(updated),
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee?.id, employee?.ptkp_status, record.base_salary, record.meal_allowance, record.overtime_amount]);

  const isPostedToGl = record.status === "sent_to_finance";
  const isQueuedInFinance = !isPostedToGl && Boolean(record.submitted_to_finance);
  const submitted = isPostedToGl || isQueuedInFinance;
  const periodLabel = `${MONTH_NAMES[record.period_month - 1]} ${record.period_year}`;
  const canSubmit = !submitted && !submitMutation.isPending;

  const missingEmployeeData = useMemo(() => {
    if (!employee) return [] as string[];
    const m: string[] = [];
    if (!employee.ptkp_status && breakdown.ptkpSource === "default_tk0") m.push("Status PTKP (otomatis menggunakan default TK/0)");
    if (!employee.bpjs_kesehatan_number) m.push("No. BPJS Kesehatan");
    if (!employee.bpjs_ketenagakerjaan_number) m.push("No. BPJS Ketenagakerjaan");
    return m;
  }, [employee, breakdown.ptkpSource]);

  function handleRecalculate() {
    calcMutation.mutate(
      { record, employee: employee ?? record.employee },
      {
        onSuccess: (updated) => {
          setRecord(updated);
        },
        onError: (err) => alert("Gagal menghitung ulang: " + extractErrorMessage(err)),
      }
    );
  }

  function handleSubmit() {
    if (
      !confirm(
        `Ajukan & upload payroll ${fullName} periode ${periodLabel} (Gaji Bersih: ${rupiah(
          breakdown.netTakeHomePay
        )}) ke antrean Finance > HR Integration?\n\nCatatan: Payroll akan masuk ke menu HR Integration di Finance terlebih dahulu dan baru ter-generate ke Jurnal Umum (GL) setelah diposting oleh tim Finance.`
      )
    ) {
      return;
    }
    submitMutation.mutate(
      { record, employee: employee ?? record.employee },
      {
        onSuccess: (updated) => {
          setRecord(updated);
          alert(
            `Berhasil! Payroll ${fullName} telah masuk ke antrean Finance > HR Integration.\n\nSilakan buka modul Finance & Accounting > HR Integration untuk memvalidasi preview jurnal dan memposting ke General Ledger (GL).`
          );
        },
        onError: (err) => alert("Gagal mengajukan ke Finance: " + extractErrorMessage(err)),
      }
    );
  }

  const enrichedCurrentRecord: PayrollRecord = useMemo(
    () => ({
      ...record,
      ptkp_status: breakdown.ptkpStatus,
      ter_category: breakdown.terCategory,
      ter_rate: breakdown.terRate,
      bpjs_kesehatan_deduction: String(breakdown.bpjsKesehatanEmployee),
      bpjs_jht_deduction: String(breakdown.bpjsJhtEmployee),
      bpjs_jp_deduction: String(breakdown.bpjsJpEmployee),
      bpjs_ketenagakerjaan_deduction: String(breakdown.bpjsKetenagakerjaanEmployee),
      bpjs_deduction: String(breakdown.bpjsTotalEmployee),
      pph21_deduction: String(breakdown.pph21Monthly),
      kasbon_installment: String(breakdown.kasbonInstallment),
      total_deduction: String(breakdown.totalEmployeeDeduction),
      net_amount: String(breakdown.netTakeHomePay),
    }),
    [record, breakdown]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* ── PageHeader Banner ─────────────────────────────────────────────── */}
      <PageHeader
        title="Detail Payroll"
        subtitle={`${fullName} · ${employee?.employee_number ?? "—"}${employee?.nik ? ` · NIK: ${employee.nik}` : ""} · ${periodLabel}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${isPostedToGl
              ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
              : isQueuedInFinance
                ? "bg-blue-500/20 text-blue-200 border-blue-400/30"
                : "bg-amber-500/20 text-amber-200 border-amber-400/30"
              }`}
          >
            {isPostedToGl
              ? "Posted to Finance (GL)"
              : isQueuedInFinance
                ? "Antrean HR Integration (Finance)"
                : "Draft"}
          </span>
          <span className="text-xs px-3 py-1.5 rounded-xl bg-[#F2A602]/20 text-[#F2A602] font-semibold border border-[#F2A602]/30">
            {String(record.period_month).padStart(2, "0")}/{record.period_year}
          </span>
        </div>
      </PageHeader>

      {/* ── Info Bar: Kembali ─────────────────────────────────────────────── */}
      <div className="px-7 pt-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              onClick={onBack}
            >
              <ArrowLeft size={14} /> Kembali ke Payroll Records
            </button>
            {employee && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {employee.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-slate-400" />
                    {employee.email}
                  </span>
                )}
                {employee.phone && <span className="text-slate-300">·</span>}
                {employee.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" />
                    {employee.phone}
                  </span>
                )}
                {employee.position?.position_title && <span className="text-slate-300">·</span>}
                {employee.position?.position_title && (
                  <span className="flex items-center gap-1">
                    <Briefcase size={12} className="text-slate-400" />
                    {employee.position.position_title}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-xs text-slate-500">
            Periode: <strong className="text-slate-900">{periodLabel}</strong>
          </div>
        </div>
      </div>

      {/* ── Konten ────────────────────────────────────────────────────────── */}
      <div className="px-7 py-5 flex flex-col gap-6">
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
          {/* Banner alur */}
          <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
            <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
              <ClipboardCheck size={18} />
            </div>
            <div className="leading-relaxed">
              <strong className="text-slate-900 font-semibold">Perhitungan Otomatis Regulasi Pemerintah RI:</strong> Potongan{" "}
              <span className="font-semibold text-slate-800">BPJS Kesehatan (1%)</span>,{" "}
              <span className="font-semibold text-slate-800">BPJS Ketenagakerjaan (JHT 2% + JP 1%)</span>, dan{" "}
              <span className="font-semibold text-slate-800">PPh Pasal 21 (TER PP No. 58/2023 &amp; PMK No. 168/2023)</span>{" "}
              dihitung otomatis dari data asli karyawan di database dan langsung terpotong pada Slip Gaji serta Rekap Pajak Tahunan.
            </div>
          </div>

          {missingEmployeeData.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 flex items-start gap-3">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>
                Catatan kelengkapan administrasi karyawan: <strong>{missingEmployeeData.join(", ")}</strong>. Anda dapat memperbaruinya di menu{" "}
                <strong>Employee &gt; Detail &gt; BPJS &amp; Pajak</strong>.
              </span>
            </div>
          )}

          {/* Profile banner */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[#0A2140] to-[#1e40af]" />
            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <PayrollAvatar photoFileId={employee?.photo_file_id} name={fullName} size={72} />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{fullName}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {employee?.employee_number && (
                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                      Kode: {employee.employee_number}
                    </span>
                  )}
                  {employee?.nik && (
                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                      NIK: {employee.nik}
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${isPostedToGl
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : isQueuedInFinance
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                  >
                    {isPostedToGl
                      ? "Posted to Finance (GL)"
                      : isQueuedInFinance
                        ? "Menunggu Posting di HR Integration Finance"
                        : "Draft — Siap Diajukan"}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-[#F2A602]/10 text-amber-700 font-semibold border border-[#F2A602]/30">
                    PTKP {breakdown.ptkpStatus} (TER {breakdown.terCategory} · {breakdown.terRatePercent})
                  </span>
                  {employee?.npwp && (
                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      NPWP: {employee.npwp}
                    </span>
                  )}
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gaji Bersih (Take-Home Pay)</div>
                <div className="text-2xl font-bold tracking-tight text-emerald-600">
                  {rupiah(breakdown.netTakeHomePay)}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Otomatis terpotong Pajak &amp; BPJS ({rupiah(breakdown.totalEmployeeDeduction)})
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* A. Ringkasan */}
            <InfoCard
              icon={<Wallet size={18} />}
              iconClass="bg-[#0A2140]/10 text-[#0A2140]"
              title="Ringkasan Gaji"
              subtitle="Gaji pokok dipotong, lalu ditambah tunjangan"
            >
              <AmountRow label="Total bruto (Gaji Pokok)" value={rupiah(breakdown.baseGross)} bold />
              <AmountRow
                label="Total potongan karyawan"
                value={`– ${rupiah(breakdown.totalEmployeeDeduction)}`}
                valueClass="text-rose-600 font-semibold"
              />
              <AmountRow
                label="Gaji pokok setelah potongan"
                value={rupiah(breakdown.netAfterDeduction)}
                bold
              />
              <AmountRow
                label="Uang makan"
                value={`+ ${rupiah(breakdown.mealAllowance)}`}
                valueClass="text-emerald-600 font-semibold"
              />
              <AmountRow
                label="Uang lembur"
                value={`+ ${rupiah(breakdown.overtimeAmount)}`}
                valueClass="text-emerald-600 font-semibold"
              />
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Gaji bersih (Take-Home Pay)</span>
                <span className="text-lg font-bold font-mono text-emerald-600">
                  {rupiah(breakdown.netTakeHomePay)}
                </span>
              </div>
            </InfoCard>

            {/* B. Penghasilan */}
            <InfoCard
              icon={<TrendingUp size={18} />}
              iconClass="bg-emerald-50 text-emerald-600"
              title="Rincian Penghasilan"
              subtitle="Pemasukan yang tersimpan dari payroll"
            >
              <AmountRow label="Gaji pokok" value={rupiah(breakdown.baseSalary)} />
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Total bruto (dasar potongan)</span>
                <span className="text-sm font-bold font-mono text-[#0A2140]">{rupiah(breakdown.baseGross)}</span>
              </div>

              <div className="mt-4 mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tunjangan (tidak dipotong)
              </div>
              <AmountRow label="Uang makan" value={rupiah(breakdown.mealAllowance)} />
              <AmountRow label="Uang lembur" value={rupiah(breakdown.overtimeAmount)} />
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Total tunjangan</span>
                <span className="text-sm font-bold font-mono text-emerald-600">{rupiah(breakdown.allowanceTotal)}</span>
              </div>
            </InfoCard>

            {/* C. Potongan */}
            <InfoCard
              icon={<TrendingDown size={18} />}
              iconClass="bg-rose-50 text-rose-600"
              title="Rincian Potongan"
              subtitle="BPJS dan PPh 21 dari data karyawan (PP 58/2023 & PMK 168/2023)"
              action={
                !submitted && (
                  <button
                    type="button"
                    onClick={handleRecalculate}
                    disabled={calcMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-60"
                  >
                    <Calculator size={13} />
                    {calcMutation.isPending ? "Menyimpan..." : "Hitung ulang"}
                  </button>
                )
              }
            >
              <div className="flex flex-col gap-3.5">
                <DeductionRow
                  title="BPJS Kesehatan"
                  note={`1% × Gaji Pokok (maks Rp 12.000.000) · Uang makan & lembur tidak dipotong${employee?.bpjs_kesehatan_number ? ` · No. ${employee.bpjs_kesehatan_number}` : ""}`}
                  value={rupiah(breakdown.bpjsKesehatanEmployee)}
                />
                <DeductionRow
                  title="BPJS Ketenagakerjaan"
                  note={`JHT 2% (${rupiah(breakdown.bpjsJhtEmployee)}) + JP 1% (${rupiah(breakdown.bpjsJpEmployee)}) dari Gaji Pokok · Uang makan & lembur tidak dipotong`}
                  value={rupiah(breakdown.bpjsKetenagakerjaanEmployee)}
                />
                <DeductionRow
                  title="PPh 21"
                  note={`Tarif efektif bulanan (TER Kategori ${breakdown.terCategory} · ${breakdown.terRatePercent} × Gaji Pokok ${rupiah(breakdown.baseSalary)}) · PTKP ${breakdown.ptkpStatus} (${rupiah(PTKP_ANNUAL_MAP[breakdown.ptkpStatus])}/thn) · Uang makan & lembur tidak dipotong pajak`}
                  value={rupiah(breakdown.pph21Monthly)}
                />
                {breakdown.kasbonInstallment > 0 && (
                  <DeductionRow
                    title="Cicilan Kasbon"
                    note="Potongan angsuran pinjaman karyawan"
                    value={rupiah(breakdown.kasbonInstallment)}
                  />
                )}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Total potongan karyawan</span>
                  <span className="text-sm font-bold font-mono text-rose-600">
                    - {rupiah(breakdown.totalEmployeeDeduction)}
                  </span>
                </div>

                {/* Referensi Iuran Ditanggung Perusahaan */}
                <div className="mt-1 rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    Iuran Jaminan Sosial Ditanggung Perusahaan (Tidak Memotong Gaji):
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>BPJS Kesehatan (4%): <strong>{rupiah(breakdown.bpjsKesehatanEmployer)}</strong></span>
                    <span>JHT Perusahaan (3,7%): <strong>{rupiah(breakdown.bpjsJhtEmployer)}</strong></span>
                    <span>JP Perusahaan (2%): <strong>{rupiah(breakdown.bpjsJpEmployer)}</strong></span>
                    <span>JKK (0,24%) + JKM (0,30%): <strong>{rupiah(breakdown.bpjsJkkEmployer + breakdown.bpjsJkmEmployer)}</strong></span>
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* D. Tindakan HR */}
            <InfoCard
              icon={<Send size={18} />}
              iconClass="bg-[#F2A602]/10 text-[#F2A602]"
              title="Tindakan HR"
              subtitle="Periksa slip, ubah draft, atau ajukan ke Finance"
            >
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onViewSlip(enrichedCurrentRecord)}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                >
                  <FileText size={14} className="text-slate-500" /> Lihat Slip Gaji
                </button>
                <button
                  type="button"
                  onClick={onEditDraft}
                  disabled={submitted}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil size={14} className="text-slate-500" /> Edit Draft
                </button>
              </div>

              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className={`mt-3 w-full flex flex-col items-center gap-1 rounded-xl px-4 py-4 text-center transition-all ${canSubmit
                  ? "bg-[#f4ae3e] hover:bg-[#f7a41f] text-white shadow-sm"
                  : isQueuedInFinance
                    ? "bg-blue-50 text-blue-700 border border-blue-200 cursor-not-allowed"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed"
                  }`}
              >
                {submitted ? <CheckCircle2 size={16} /> : <Send size={16} />}
                <span className="text-sm font-semibold">
                  {submitMutation.isPending
                    ? "Mengirim ke HR Integration Finance..."
                    : isPostedToGl
                      ? `Sudah Diposting ke Jurnal Umum (GL)${record.gl_journal_number ? ` · ${record.gl_journal_number}` : ""}`
                      : isQueuedInFinance
                        ? "Sudah Masuk Antrean HR Integration (Finance)"
                        : "Ajukan ke Finance"}
                </span>
                <span
                  className={`text-xs ${canSubmit ? "text-white/90" : isQueuedInFinance ? "text-blue-600" : "text-emerald-600"
                    }`}
                >
                  {isPostedToGl
                    ? "Jurnal gaji & pajak sudah ter-generate di General Ledger Finance."
                    : isQueuedInFinance
                      ? "Buka menu Finance > HR Integration untuk memvalidasi & memposting jurnal ke GL."
                      : "Potongan sudah terisi otomatis, klik untuk meng-upload ke antrean HR Integration di Finance."}
                </span>
              </button>
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  iconClass,
  title,
  subtitle,
  action,
  children,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconClass}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function AmountRow({
  label,
  value,
  bold,
  valueClass,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span
        className={`text-sm font-mono ${valueClass ?? (bold ? "font-bold text-slate-900" : "font-semibold text-slate-800")
          }`}
      >
        {value}
      </span>
    </div>
  );
}

function DeductionRow({ title, note, value }: { title: string; note: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-400">{note}</div>
      </div>
      <div className="text-sm font-semibold font-mono text-slate-800">{value}</div>
    </div>
  );
}
