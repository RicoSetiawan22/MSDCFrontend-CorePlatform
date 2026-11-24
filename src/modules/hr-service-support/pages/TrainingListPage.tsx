import { useState } from "react";
import { Search, Plus, Award, BookOpen, AlertTriangle, Trash2, Wallet, Coins, Building2 } from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { useEmployeeList } from "../api/useEmployees";
import { useCostCenterList } from "@modules/finance-accounting/api/useCostCenters";
import type { CostCenter } from "@modules/finance-accounting/types/costCenter";
import {
  useTrainings, useTraining, useCreateTraining, useUpdateTraining, useDeleteTraining,
  useEnrollTraining, useCompleteTraining,
  useCertifications, useCertification, useCreateCertification, useUpdateCertification, useDeleteCertification,
  useIssueCertification, useRevokeCertification, useExpiringSoonCertifications,
  useSubmitCertificationToFinance, usePostCertificationToFinance,
} from "../api/useTraining";
import type {
  Training, Certification, EnrollmentStatus,
  FundingSource, ReimbursementStatus,
} from "../types/training";
import {
  ENROLLMENT_LABELS, CERT_STATUS_LABELS,
  FUNDING_SOURCE_LABELS, REIMBURSEMENT_STATUS_LABELS,
} from "../types/training";

type Tab = "trainings" | "certifications" | "expiring";

function formatCost(val?: string | number | null, curr: string = "IDR"): string {
  if (val === undefined || val === null || val === "" || isNaN(Number(val))) return "—";
  const num = Number(val);
  if (curr === "USD") return `$ ${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  if (curr === "SGD") return `S$ ${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  return `Rp ${num.toLocaleString("id-ID")}`;
}

export function TrainingListPage() {
  const [tab, setTab] = useState<Tab>("trainings");
  const [search, setSearch] = useState("");

  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [editTraining, setEditTraining] = useState<Training | null>(null);
  const [detailTrainingId, setDetailTrainingId] = useState<number | null>(null);

  const [showCertForm, setShowCertForm] = useState(false);
  const [editCert, setEditCert] = useState<Certification | null>(null);
  const [detailCertId, setDetailCertId] = useState<number | null>(null);

  const { data: trainings, isLoading: trLoading } = useTrainings();
  const { data: certifications, isLoading: certLoading } = useCertifications();
  const { data: expiringSoon } = useExpiringSoonCertifications();
  const { data: costCenters } = useCostCenterList({ per_page: 200 });

  const deleteTraining = useDeleteTraining();
  const deleteCert = useDeleteCertification();

  const filteredTrainings = (trainings ?? []).filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.training_code.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCerts = (certifications ?? []).filter(c =>
    !search || c.cert_name.toLowerCase().includes(search.toLowerCase()) || c.cert_code.toLowerCase().includes(search.toLowerCase())
  );

  function getCostCenterLabel(ccId?: number | null, embeddedCc?: { code?: string; name?: string; cost_center_code?: string; cost_center_name?: string } | null): string {
    if (embeddedCc?.cost_center_code || embeddedCc?.cost_center_name) {
      return `${embeddedCc.cost_center_code ?? ""} - ${embeddedCc.cost_center_name ?? ""}`.trim().replace(/^- /, "");
    }
    if (embeddedCc?.code || embeddedCc?.name) {
      return `${embeddedCc.code ?? ""} - ${embeddedCc.name ?? ""}`.trim().replace(/^- /, "");
    }
    if (!ccId) return "—";
    const found = (costCenters ?? []).find((c: CostCenter) => c.id === ccId);
    return found ? `${found.code} - ${found.name}` : `CC #${ccId}`;
  }

  function handleDeleteTraining(t: Training) {
    if (!confirm(`Hapus training "${t.title}"?`)) return;
    deleteTraining.mutate(t.id, { onError: (e) => alert("Gagal: " + extractErrorMessage(e)) });
  }
  function handleDeleteCert(c: Certification) {
    if (!confirm(`Hapus sertifikasi "${c.cert_name}"?`)) return;
    deleteCert.mutate(c.id, { onError: (e) => alert("Gagal: " + extractErrorMessage(e)) });
  }

  // Summary Metrics
  const totalEnrollments = (trainings ?? []).reduce((acc, t) => acc + (t.participants_count ?? 0), 0);
  const activeCerts = (certifications ?? []).length;
  const totalCertifiedEmployees = (certifications ?? []).reduce((acc, c) => acc + (c.employee_certifications_count ?? 0), 0);
  const totalTrainingBudget = (trainings ?? []).reduce((acc, t) => acc + (Number(t.total_cost || t.budget_amount) || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Training & Certification"
        subtitle="Manajemen program pelatihan pegawai, alokasi anggaran, sertifikasi keahlian, dan masa berlaku."
      />

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Banner Informasi & Alur Kerja */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0A2140] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
              <BookOpen size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0A2140]">Pengembangan Kompetensi & Sertifikasi SDM</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Kelola katalog pelatihan teknis data center, alokasi anggaran & cost center pemikul beban, hingga pencatatan sertifikasi profesional dengan monitoring masa kadaluarsa (H-30 alert).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              onClick={() => setShowTrainingForm(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0A2140] text-white hover:bg-[#07162c] shadow-sm transition-all"
            >
              <Plus size={14} />
              Training Baru
            </button>
            <button
              onClick={() => setShowCertForm(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F2A602] text-white hover:bg-[#d99502] shadow-sm transition-all"
            >
              <Award size={14} />
              Sertifikasi Baru
            </button>
          </div>
        </div>

        {/* 4 KPI Metric Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Program Pelatihan</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <BookOpen size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{trainings?.length ?? 0}</span>
              <p className="text-xs text-slate-500 mt-1">
                {totalTrainingBudget > 0 ? `Total Anggaran: ${formatCost(totalTrainingBudget)}` : "Program pelatihan aktif"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Peserta</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <Wallet size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalEnrollments}</span>
              <p className="text-xs text-slate-500 mt-1">Peserta terdaftar di semua batch</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Master Sertifikasi</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
                <Award size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{activeCerts}</span>
              <p className="text-xs text-slate-500 mt-1">Katalog standar sertifikasi</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sertifikat Dipegang</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <Coins size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalCertifiedEmployees}</span>
              <p className="text-xs text-slate-500 mt-1">
                {(expiringSoon?.length ?? 0) > 0 ? (
                  <span className="text-amber-600 font-semibold">{expiringSoon?.length} segera habis masa berlaku</span>
                ) : (
                  "Semua masa berlaku sertifikat aman"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Main Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="p-2.5 bg-slate-50/70 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto">
            {[
              { key: "trainings" as Tab, label: "Katalog Program Training", icon: <BookOpen size={14} />, count: trainings?.length },
              { key: "certifications" as Tab, label: "Master Sertifikasi", icon: <Award size={14} />, count: certifications?.length },
              {
                key: "expiring" as Tab,
                label: "Akan Kadaluarsa",
                icon: <AlertTriangle size={14} className={(expiringSoon?.length ?? 0) > 0 ? "text-amber-500" : ""} />,
                count: expiringSoon?.length,
              },
            ].map(t => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? "bg-white text-[#0A2140] shadow-sm border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  {t.icon}
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      t.key === "expiring"
                        ? "bg-amber-100 text-amber-700"
                        : active ? "bg-slate-100 text-[#0A2140]" : "bg-slate-200/60 text-slate-500"
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0A2140] transition-colors"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tab === "trainings" ? "Cari judul training atau kode..." : "Cari nama sertifikasi atau kode..."}
              />
            </div>
            <span className="text-xs text-slate-500">
              {tab === "trainings" && `Menampilkan ${filteredTrainings.length} dari ${trainings?.length ?? 0} training`}
              {tab === "certifications" && `Menampilkan ${filteredCerts.length} dari ${certifications?.length ?? 0} sertifikasi`}
              {tab === "expiring" && `${expiringSoon?.length ?? 0} sertifikasi mendekati masa habis (H-30)`}
            </span>
          </div>

          {/* Tab: Program Training */}
          {tab === "trainings" && trLoading && <LoadingState />}
          {tab === "trainings" && trainings && filteredTrainings.length === 0 && (
            <div className="py-8">
              <EmptyState title="Belum Ada Program Training" subtitle="Daftarkan pelatihan pegawai baru dengan tombol di atas." />
            </div>
          )}
          {tab === "trainings" && filteredTrainings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80">
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kode</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Judul Training</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Provider</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal & Durasi</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Anggaran & Biaya</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cost Center</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Peserta</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrainings.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-600">{t.training_code}</td>
                      <td className="px-5 py-3.5 font-semibold text-sm text-slate-900">{t.title}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{t.provider ?? "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        <div className="font-mono text-xs font-medium text-slate-800">
                          {t.training_date ? formatDate(t.training_date) : "—"}
                        </div>
                        {t.duration_hours ? (
                          <div className="text-[11px] text-slate-500 mt-0.5">{Number(t.duration_hours)} jam pelatihan</div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-xs font-bold text-slate-800">
                          {formatCost(t.total_cost ?? t.budget_amount, t.currency || "IDR")}
                        </div>
                        {t.cost_per_participant ? (
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {formatCost(t.cost_per_participant, t.currency || "IDR")} /pax
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5">
                        {t.cost_center_id || t.cost_center ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {getCostCenterLabel(t.cost_center_id, t.cost_center)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
                          {t.participants_count ?? 0} peserta
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setDetailTrainingId(t.id)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Detail
                          </button>
                          <button
                            onClick={() => setEditTraining(t)}
                            className="px-2.5 py-1 text-xs font-medium text-[#0A2140] hover:text-[#07162c] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTraining(t)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus training"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab: Master Sertifikasi */}
          {tab === "certifications" && certLoading && <LoadingState />}
          {tab === "certifications" && certifications && filteredCerts.length === 0 && (
            <div className="py-8">
              <EmptyState title="Belum Ada Sertifikasi" subtitle="Daftarkan master sertifikasi kepegawaian." />
            </div>
          )}
          {tab === "certifications" && filteredCerts.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80">
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kode</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Sertifikasi</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lembaga Penerbit</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Masa Berlaku</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estimasi Biaya</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Penerima</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCerts.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-600">{c.cert_code}</td>
                      <td className="px-5 py-3.5 font-semibold text-sm text-slate-900">{c.cert_name}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{c.issuing_body ?? "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{c.validity_months ? `${c.validity_months} bulan` : "Seumur hidup"}</td>
                      <td className="px-5 py-3.5">
                        <div className="text-xs">
                          <span className="text-slate-400 font-medium">Ujian: </span>
                          <span className="font-mono font-semibold text-slate-800">{formatCost(c.exam_fee, c.currency || "IDR")}</span>
                        </div>
                        {c.renewal_fee ? (
                          <div className="text-[11px] mt-0.5">
                            <span className="text-slate-400 font-medium">Renewal: </span>
                            <span className="font-mono text-slate-600">{formatCost(c.renewal_fee, c.currency || "IDR")}</span>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200/60">
                          {c.employee_certifications_count ?? 0} orang
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setDetailCertId(c.id)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Detail
                          </button>
                          <button
                            onClick={() => setEditCert(c)}
                            className="px-2.5 py-1 text-xs font-medium text-[#0A2140] hover:text-[#07162c] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCert(c)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus sertifikasi"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab: Akan Kadaluarsa */}
          {tab === "expiring" && expiringSoon === undefined && <LoadingState />}
          {tab === "expiring" && expiringSoon && expiringSoon.length === 0 && (
            <div className="py-8">
              <EmptyState
                title="Tidak Ada Sertifikasi yang Akan Kadaluarsa"
                subtitle="Semua sertifikasi pegawai masih dalam masa berlaku aktif."
              />
            </div>
          )}
          {tab === "expiring" && expiringSoon && expiringSoon.length > 0 && (
            <div>
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 text-xs font-semibold">
                <AlertTriangle size={14} className="text-amber-600" />
                <span>{expiringSoon.length} sertifikasi pegawai akan kadaluarsa dalam 30 hari ke depan</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80">
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sertifikasi</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">No. Sertifikat</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expired</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pembiayaan</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringSoon.map(ec => (
                      <tr key={ec.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                        <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{ec.employee?.full_name ?? "—"}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-700">{ec.certification?.cert_name ?? "—"}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{ec.certificate_number ?? "—"}</td>
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-amber-600">
                          {ec.expiry_date ? formatDate(ec.expiry_date) : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            ec.funding_source === "employee" ? "bg-purple-50 text-purple-700" :
                            ec.funding_source === "shared" ? "bg-amber-50 text-amber-700" :
                            "bg-blue-50 text-blue-700"
                          }`}>
                            {ec.funding_source ? FUNDING_SOURCE_LABELS[ec.funding_source] : "Company"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Akan Expired
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showTrainingForm && <TrainingFormModal costCenters={costCenters ?? []} onClose={() => setShowTrainingForm(false)} />}
      {editTraining && <TrainingFormModal training={editTraining} costCenters={costCenters ?? []} onClose={() => setEditTraining(null)} />}
      {detailTrainingId && <TrainingDetailModal trainingId={detailTrainingId} onClose={() => setDetailTrainingId(null)} />}

      {showCertForm && <CertificationFormModal onClose={() => setShowCertForm(false)} />}
      {editCert && <CertificationFormModal certification={editCert} onClose={() => setEditCert(null)} />}
      {detailCertId && <CertificationDetailModal certificationId={detailCertId} onClose={() => setDetailCertId(null)} />}
    </div>
  );
}

// ─── Modal shell ─────────────────────────────────────────────────────────────
function ModalShell({ title, onClose, maxWidth = 540, children }: { title: string; onClose: () => void; maxWidth?: number; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10, 33, 64, 0.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem",
    }}>
      <div style={{
        background: "#ffffff", borderRadius: 16, width: "100%", maxWidth,
        boxShadow: "0 20px 40px -10px rgba(10, 33, 64, 0.25)", overflow: "hidden",
        border: "1px solid rgba(226, 232, 240, 0.8)",
      }}>
        <div style={{
          padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#f8fafc",
        }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0A2140" }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", cursor: "pointer",
            fontSize: "1.1rem", color: "#64748b", lineHeight: 1, padding: "0.2rem",
          }}>×</button>
        </div>
        <div style={{ padding: "1.25rem", maxHeight: "80vh", overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Training Form Modal (create/edit) ──────────────────────────────────────
function TrainingFormModal({
  training, costCenters, onClose,
}: {
  training?: Training; costCenters: CostCenter[]; onClose: () => void;
}) {
  const isEdit = !!training;
  const [title, setTitle] = useState(training?.title ?? "");
  const [provider, setProvider] = useState(training?.provider ?? "");
  const [date, setDate] = useState(training?.training_date ?? "");
  const [hours, setHours] = useState(training?.duration_hours ? String(training.duration_hours) : "");
  const [currency, setCurrency] = useState(training?.currency ?? "IDR");
  const [totalCost, setTotalCost] = useState(training?.total_cost ?? training?.budget_amount ? String(training?.total_cost ?? training?.budget_amount) : "");
  const [costPerPax, setCostPerPax] = useState(training?.cost_per_participant ? String(training.cost_per_participant) : "");
  const [costCenterId, setCostCenterId] = useState(training?.cost_center_id ? String(training.cost_center_id) : "");
  const [error, setError] = useState<string | null>(null);

  const createTraining = useCreateTraining();
  const updateTraining = useUpdateTraining(training?.id ?? 0);
  const pending = createTraining.isPending || updateTraining.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Judul training wajib diisi."); return; }
    setError(null);

    const values = {
      title: title.trim(),
      provider: provider.trim() || undefined,
      training_date: date || undefined,
      duration_hours: hours ? parseFloat(String(hours)) : undefined,
      currency: currency || "IDR",
      total_cost: totalCost ? parseFloat(totalCost) : undefined,
      budget_amount: totalCost ? parseFloat(totalCost) : undefined,
      cost_per_participant: costPerPax ? parseFloat(costPerPax) : undefined,
      cost_center_id: costCenterId ? parseInt(costCenterId, 10) : undefined,
    };

    if (isEdit) {
      updateTraining.mutate(values, { onSuccess: onClose, onError: (e) => setError(extractErrorMessage(e)) });
    } else {
      createTraining.mutate(values, { onSuccess: onClose, onError: (e) => setError(extractErrorMessage(e)) });
    }
  }

  return (
    <ModalShell title={isEdit ? "Edit Program Training" : "Program Training Baru"} onClose={onClose} maxWidth={580}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {isEdit && (
          <F label="Kode Training">
            <div style={{ padding: "0.5rem 0.7rem", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, fontFamily: "monospace", fontWeight: 700, color: "#475569" }}>
              {training?.training_code}
            </div>
          </F>
        )}
        <F label="Judul Training" required>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Certified Data Centre Professional (CDCP)" style={{ width: "100%" }} />
        </F>
        <F label="Provider / Lembaga Penyelenggara">
          <input className="input" value={provider} onChange={e => setProvider(e.target.value)} placeholder="Contoh: EPI Training, Cisco Learning Partner" style={{ width: "100%" }} />
        </F>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <F label="Tanggal Pelaksanaan">
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%" }} />
          </F>
          <F label="Durasi (Jam)">
            <input className="input" type="number" min={0} step={0.5} value={hours} onChange={e => setHours(e.target.value)} placeholder="Contoh: 16" style={{ width: "100%" }} />
          </F>
        </div>

        {/* Section Finansial & Anggaran */}
        <div style={{ padding: "0.85rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 700, color: "#0A2140" }}>
            <Wallet size={15} className="text-[#0A2140]" />
            <span>Alokasi Anggaran & Biaya Pelatihan</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr", gap: "0.75rem" }}>
            <F label="Mata Uang">
              <select className="input" value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: "100%" }}>
                <option value="IDR">IDR (Rp)</option>
                <option value="USD">USD ($)</option>
                <option value="SGD">SGD (S$)</option>
              </select>
            </F>
            <F label="Total Biaya / Anggaran">
              <input className="input" type="number" min={0} value={totalCost} onChange={e => setTotalCost(e.target.value)} placeholder="0" style={{ width: "100%" }} />
            </F>
            <F label="Biaya per Peserta">
              <input className="input" type="number" min={0} value={costPerPax} onChange={e => setCostPerPax(e.target.value)} placeholder="0" style={{ width: "100%" }} />
            </F>
          </div>

          <F label="Cost Center (Departemen / Unit Pemikul Beban)">
            <select className="input" value={costCenterId} onChange={e => setCostCenterId(e.target.value)} style={{ width: "100%" }}>
              <option value="">— Pilih Cost Center (opsional) —</option>
              {costCenters.map(cc => (
                <option key={cc.id} value={cc.id}>
                  {cc.code} - {cc.name}
                </option>
              ))}
            </select>
          </F>
        </div>

        {error && <div style={{ color: "#ef4444", fontSize: "0.8rem" }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button type="submit" className="btn" style={{ background: "#F2A602", border: "none", color: "#ffffff", fontWeight: 700, borderRadius: 8, padding: "0.55rem 1.1rem" }} disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan Training"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Certification Form Modal (create/edit) ─────────────────────────────────
function CertificationFormModal({ certification, onClose }: { certification?: Certification; onClose: () => void }) {
  const isEdit = !!certification;
  const [name, setName] = useState(certification?.cert_name ?? "");
  const [issuer, setIssuer] = useState(certification?.issuing_body ?? "");
  const [months, setMonths] = useState(certification?.validity_months ? String(certification.validity_months) : "");
  const [currency, setCurrency] = useState(certification?.currency ?? "IDR");
  const [examFee, setExamFee] = useState(certification?.exam_fee ? String(certification.exam_fee) : "");
  const [renewalFee, setRenewalFee] = useState(certification?.renewal_fee ? String(certification.renewal_fee) : "");
  const [error, setError] = useState<string | null>(null);

  const createCert = useCreateCertification();
  const updateCert = useUpdateCertification(certification?.id ?? 0);
  const pending = createCert.isPending || updateCert.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Nama sertifikasi wajib diisi."); return; }
    setError(null);

    const values = {
      cert_name: name.trim(),
      issuing_body: issuer.trim() || undefined,
      validity_months: months ? parseInt(months, 10) : undefined,
      currency: currency || "IDR",
      exam_fee: examFee ? parseFloat(examFee) : undefined,
      renewal_fee: renewalFee ? parseFloat(renewalFee) : undefined,
    };

    if (isEdit) {
      updateCert.mutate(values, { onSuccess: onClose, onError: (e) => setError(extractErrorMessage(e)) });
    } else {
      createCert.mutate(values, { onSuccess: onClose, onError: (e) => setError(extractErrorMessage(e)) });
    }
  }

  return (
    <ModalShell title={isEdit ? "Edit Master Sertifikasi" : "Master Sertifikasi Baru"} onClose={onClose} maxWidth={560}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {isEdit && (
          <F label="Kode Sertifikasi">
            <div style={{ padding: "0.5rem 0.7rem", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, fontFamily: "monospace", fontWeight: 700, color: "#475569" }}>
              {certification?.cert_code}
            </div>
          </F>
        )}
        <F label="Nama Sertifikasi" required>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: CDCP, CCNA, Certified K3 Listrik" style={{ width: "100%" }} />
        </F>
        <F label="Lembaga Penerbit">
          <input className="input" value={issuer} onChange={e => setIssuer(e.target.value)} placeholder="Contoh: EPI, Cisco, Kemnaker RI, BNSP" style={{ width: "100%" }} />
        </F>
        <F label="Masa Berlaku (Bulan)">
          <input className="input" type="number" min={1} value={months} onChange={e => setMonths(e.target.value)}
            placeholder="Kosongkan jika seumur hidup / tidak pernah expired" style={{ width: "100%" }} />
        </F>

        {/* Section Estimasi Biaya Sertifikasi */}
        <div style={{ padding: "0.85rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 700, color: "#0A2140" }}>
            <Coins size={15} className="text-[#0A2140]" />
            <span>Estimasi Biaya Sertifikasi & Ujian</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr", gap: "0.75rem" }}>
            <F label="Mata Uang">
              <select className="input" value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: "100%" }}>
                <option value="IDR">IDR (Rp)</option>
                <option value="USD">USD ($)</option>
                <option value="SGD">SGD (S$)</option>
              </select>
            </F>
            <F label="Biaya Ujian Perdana">
              <input className="input" type="number" min={0} value={examFee} onChange={e => setExamFee(e.target.value)} placeholder="0" style={{ width: "100%" }} />
            </F>
            <F label="Biaya Perpanjangan (Renewal)">
              <input className="input" type="number" min={0} value={renewalFee} onChange={e => setRenewalFee(e.target.value)} placeholder="0" style={{ width: "100%" }} />
            </F>
          </div>
        </div>

        {error && <div style={{ color: "#ef4444", fontSize: "0.8rem" }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button type="submit" className="btn" style={{ background: "#F2A602", border: "none", color: "#ffffff", fontWeight: 700, borderRadius: 8, padding: "0.55rem 1.1rem" }} disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan Sertifikasi"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Employee Picker (search + select) ──────────────────────────────────────
function EmployeePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [search, setSearch] = useState("");
  const { data: employeesPage } = useEmployeeList({ per_page: 50, search: search || undefined });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <input
        className="input"
        placeholder="Cari nama / NIK..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ fontSize: "0.8rem", padding: "0.4rem 0.6rem" }}
      />
      <select
        className="input"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ fontSize: "0.85rem", width: "100%" }}
      >
        <option value="">— Pilih Employee —</option>
        {(employeesPage?.data ?? []).map(e => (
          <option key={e.id} value={e.id}>{e.full_name} ({e.employee_number})</option>
        ))}
      </select>
    </div>
  );
}

// ─── Training Detail Modal (participants: enroll + complete) ───────────────
function TrainingDetailModal({ trainingId, onClose }: { trainingId: number; onClose: () => void }) {
  const { data: training, isLoading } = useTraining(trainingId);
  const [employeeId, setEmployeeId] = useState("");
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const enroll = useEnrollTraining();

  function handleEnroll() {
    if (!employeeId) { setEnrollError("Pilih employee dulu."); return; }
    setEnrollError(null);
    enroll.mutate({ employeeId: parseInt(employeeId), trainingId }, {
      onSuccess: () => setEmployeeId(""),
      onError: (e) => setEnrollError(extractErrorMessage(e)),
    });
  }

  return (
    <ModalShell title={training ? training.title : "Detail Training"} onClose={onClose} maxWidth={720}>
      {isLoading && <LoadingState />}
      {training && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Header Summary Training */}
          <div style={{ padding: "0.75rem 1rem", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, fontSize: "0.8rem", color: "#64748b" }}>
              <span className="font-mono font-bold text-slate-800">{training.training_code}</span>
              <span>· Provider: <strong>{training.provider ?? "—"}</strong></span>
              <span>· Tanggal: <strong>{training.training_date ? formatDate(training.training_date) : "—"}</strong></span>
              {training.duration_hours ? <span>· Durasi: <strong>{Number(training.duration_hours)} jam</strong></span> : null}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, marginTop: 8, paddingTop: 8, borderTop: "1px dashed #cbd5e1", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Wallet size={14} className="text-slate-500" />
                <span className="text-slate-600">Total Biaya:</span>
                <strong className="text-slate-900 font-mono">{formatCost(training.total_cost ?? training.budget_amount, training.currency || "IDR")}</strong>
              </div>
              {training.cost_per_participant ? (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="text-slate-600">Biaya/Pax:</span>
                  <strong className="text-slate-900 font-mono">{formatCost(training.cost_per_participant, training.currency || "IDR")}</strong>
                </div>
              ) : null}
              {training.cost_center ? (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Building2 size={14} className="text-slate-500" />
                  <span className="text-slate-600">Cost Center:</span>
                  <strong className="text-slate-900">{training.cost_center.cost_center_code ?? training.cost_center.code}</strong>
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 8 }}>Daftarkan Employee</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}><EmployeePicker value={employeeId} onChange={setEmployeeId} /></div>
              <button className="btn btn-primary" onClick={handleEnroll} disabled={enroll.isPending}>
                {enroll.isPending ? "..." : "Daftarkan"}
              </button>
            </div>
            {enrollError && <div style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: 4 }}>{enrollError}</div>}
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 8 }}>Peserta ({training.participants?.length ?? 0})</div>
            {(!training.participants || training.participants.length === 0) ? (
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Belum ada peserta terdaftar.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Employee</th><th>Status</th><th>Skor</th><th style={{ width: 160 }}></th></tr>
                </thead>
                <tbody>
                  {training.participants.map(p => (
                    <ParticipantRow key={p.id} participation={p} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function ParticipantRow({ participation }: { participation: { id: number; status: EnrollmentStatus; score: string | null; employee?: { id: number; full_name: string } } }) {
  const [score, setScore] = useState("");
  const [error, setError] = useState<string | null>(null);
  const complete = useCompleteTraining();

  function handleComplete() {
    if (score === "") { setError("Isi skor dulu."); return; }
    setError(null);
    complete.mutate({ id: participation.id, values: { score: parseFloat(score) } }, {
      onError: (e) => setError(extractErrorMessage(e)),
    });
  }

  return (
    <tr>
      <td style={{ fontWeight: 600 }}>{participation.employee?.full_name ?? "—"}</td>
      <td>
        <span className={`badge ${participation.status === "completed" ? "badge-active" : "badge-inactive"}`}>
          {ENROLLMENT_LABELS[participation.status]}
        </span>
      </td>
      <td>
        {participation.score ? (
          <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{participation.score}</span>
        ) : (
          <span style={{ color: "#94a3b8" }}>—</span>
        )}
      </td>
      <td>
        {participation.status === "enrolled" && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="number" min={0} max={100} placeholder="Skor"
              value={score} onChange={e => setScore(e.target.value)}
              className="input" style={{ width: 68, padding: "0.25rem 0.4rem", fontSize: "0.8rem" }}
            />
            <button
              className="btn btn-primary"
              style={{ padding: "0.25rem 0.55rem", fontSize: "0.75rem" }}
              disabled={complete.isPending}
              onClick={handleComplete}
            >
              Luluskan
            </button>
            {error && <span style={{ color: "#ef4444", fontSize: "0.7rem" }}>{error}</span>}
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Certification Detail Modal (holders: issue + revoke + Finance Integration) ──
function CertificationDetailModal({ certificationId, onClose }: { certificationId: number; onClose: () => void }) {
  const { data: certification, isLoading } = useCertification(certificationId);
  const [employeeId, setEmployeeId] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [fundingSource, setFundingSource] = useState<FundingSource>("company");
  const [reimbursementStatus, setReimbursementStatus] = useState<ReimbursementStatus>("submitted");
  const [customCost, setCustomCost] = useState("");
  const [issueError, setIssueError] = useState<string | null>(null);
  const issue = useIssueCertification();
  const revoke = useRevokeCertification();
  const submitToFinance = useSubmitCertificationToFinance();
  const postToFinance = usePostCertificationToFinance();

  const baseExamFee = Number(certification?.exam_fee ?? 0) || 0;
  const defaultCalculatedCost =
    fundingSource === "company"
      ? baseExamFee
      : fundingSource === "shared"
      ? Math.round(baseExamFee * 0.5)
      : reimbursementStatus !== "not_applicable"
      ? baseExamFee
      : 0;

  function handleIssue() {
    if (!employeeId) { setIssueError("Pilih employee dulu."); return; }
    setIssueError(null);
    const resolvedCost = customCost !== "" ? parseFloat(customCost) : defaultCalculatedCost;
    issue.mutate({
      employeeId: parseInt(employeeId), certId: certificationId,
      values: {
        certificate_number: certNumber || undefined,
        issued_date: issuedDate || undefined,
        funding_source: fundingSource,
        reimbursement_status: reimbursementStatus,
        cost_amount: resolvedCost > 0 ? resolvedCost : undefined,
      },
    }, {
      onSuccess: () => {
        setEmployeeId(""); setCertNumber(""); setIssuedDate("");
        setFundingSource("company"); setReimbursementStatus("submitted"); setCustomCost("");
      },
      onError: (e) => setIssueError(extractErrorMessage(e)),
    });
  }

  function handleRevoke(id: number) {
    if (!confirm("Cabut sertifikasi employee ini?")) return;
    revoke.mutate(id, { onError: (e) => alert("Gagal: " + extractErrorMessage(e)) });
  }

  function handleSubmitToFinance(id: number) {
    submitToFinance.mutate({ id }, {
      onSuccess: (res) => alert(res.message),
      onError: (e) => alert("Gagal: " + extractErrorMessage(e)),
    });
  }

  function handlePostToFinance(id: number) {
    if (!confirm("Posting biaya sertifikasi ini langsung ke Jurnal GL Finance?")) return;
    postToFinance.mutate(id, {
      onSuccess: (res) => alert(res.message),
      onError: (e) => alert("Gagal: " + extractErrorMessage(e)),
    });
  }

  return (
    <ModalShell title={certification ? certification.cert_name : "Detail Sertifikasi"} onClose={onClose} maxWidth={820}>
      {isLoading && <LoadingState />}
      {certification && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Header Summary Sertifikasi */}
          <div style={{ padding: "0.75rem 1rem", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", flexWrap: "wrap", gap: 12 }}>
              <span className="font-mono font-bold text-slate-800">{certification.cert_code}</span>
              <span>· Penerbit: <strong>{certification.issuing_body ?? "—"}</strong></span>
              <span>· Masa Berlaku: <strong>{certification.validity_months ? `${certification.validity_months} bulan` : "Seumur hidup"}</strong></span>
            </div>
            {(certification.exam_fee || certification.renewal_fee) ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 8, paddingTop: 8, borderTop: "1px dashed #cbd5e1", fontSize: "0.8rem" }}>
                {certification.exam_fee ? (
                  <div>
                    <span className="text-slate-500">Biaya Ujian: </span>
                    <strong className="font-mono text-slate-800">{formatCost(certification.exam_fee, certification.currency || "IDR")}</strong>
                  </div>
                ) : null}
                {certification.renewal_fee ? (
                  <div>
                    <span className="text-slate-500">Biaya Perpanjangan: </span>
                    <strong className="font-mono text-slate-800">{formatCost(certification.renewal_fee, certification.currency || "IDR")}</strong>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 8 }}>Terbitkan ke Employee &amp; Integrasi Biaya Finance</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0.85rem", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <EmployeePicker value={employeeId} onChange={setEmployeeId} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>No. Sertifikat (opsional)</label>
                  <input className="input" placeholder="Contoh: CERT-2026-001" value={certNumber} onChange={e => setCertNumber(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Tanggal Terbit</label>
                  <input className="input" type="date" value={issuedDate} onChange={e => setIssuedDate(e.target.value)} style={{ width: "100%" }} />
                </div>
              </div>

              {/* Finansial Kepemilikan Sertifikasi */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Sumber Pembiayaan</label>
                  <select
                    className="input"
                    style={{ width: "100%" }}
                    value={fundingSource}
                    onChange={e => {
                      const src = e.target.value as FundingSource;
                      setFundingSource(src);
                      if (src === "company" || src === "shared") setReimbursementStatus("submitted");
                      else if (src === "employee" && reimbursementStatus === "not_applicable") setReimbursementStatus("draft");
                    }}
                  >
                    <option value="company">🏢 Company Funded (Kantor 100%)</option>
                    <option value="shared">🤝 Shared (50:50)</option>
                    <option value="employee">👤 Employee Funded (Mandiri)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Status Integrasi Finance</label>
                  <select
                    className="input"
                    style={{ width: "100%" }}
                    value={reimbursementStatus}
                    onChange={e => setReimbursementStatus(e.target.value as ReimbursementStatus)}
                  >
                    <option value="not_applicable">Tidak Ada Klaim (N/A)</option>
                    <option value="draft">Draft Klaim Reimburse</option>
                    <option value="submitted">Diajukan ke Finance (HR Integration)</option>
                    <option value="paid">Terbayar (Paid)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>
                    Nominal Beban Finance ({certification.currency || "IDR"})
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    placeholder={defaultCalculatedCost > 0 ? String(defaultCalculatedCost) : "0"}
                    value={customCost}
                    onChange={e => setCustomCost(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {(defaultCalculatedCost > 0 || Number(customCost) > 0) && (
                <div style={{ fontSize: "0.74rem", color: "#0369a1", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 6, padding: "0.4rem 0.65rem" }}>
                  💡 <strong>Integrasi HR &amp; Finance:</strong> Beban sertifikasi sebesar{" "}
                  <strong>{formatCost(customCost !== "" ? customCost : defaultCalculatedCost, certification.currency || "IDR")}</strong>{" "}
                  akan otomatis terhubung ke menu <strong>Finance &gt; HR Integration (Tab Biaya Sertifikasi SDM)</strong> untuk direview dan diposting ke Jurnal Umum (GL).
                </div>
              )}

              <button className="btn btn-primary" onClick={handleIssue} disabled={issue.isPending} style={{ alignSelf: "flex-start", marginTop: 4 }}>
                {issue.isPending ? "Menerbitkan..." : "Terbitkan Sertifikasi"}
              </button>
            </div>
            {issueError && <div style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: 4 }}>{issueError}</div>}
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 8 }}>
              Dipegang Oleh ({certification.employee_certifications?.length ?? 0})
            </div>
            {(!certification.employee_certifications || certification.employee_certifications.length === 0) ? (
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Belum ada employee yang memegang sertifikasi ini.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>No. Sertifikat</th>
                    <th>Expired</th>
                    <th>Pembiayaan &amp; Biaya</th>
                    <th>Status Finance</th>
                    <th>Status</th>
                    <th style={{ width: 150, textAlign: "right" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {certification.employee_certifications.map(ec => {
                    const effectiveCost = Number(ec.cost_amount ?? 0) || (
                      ec.funding_source === "shared"
                        ? Math.round(baseExamFee * 0.5)
                        : ec.funding_source === "company" || (ec.reimbursement_status && ec.reimbursement_status !== "not_applicable")
                        ? baseExamFee
                        : 0
                    );
                    return (
                      <tr key={ec.id}>
                        <td style={{ fontWeight: 600 }}>{ec.employee?.full_name ?? "—"}</td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{ec.certificate_number ?? "—"}</td>
                        <td>{ec.expiry_date ? formatDate(ec.expiry_date) : "—"}</td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <span style={{
                              fontSize: "0.7rem", fontWeight: 600, padding: "0.1rem 0.4rem", borderRadius: 4, width: "fit-content",
                              background: ec.funding_source === "employee" ? "#f3e8ff" : ec.funding_source === "shared" ? "#fef3c7" : "#e0f2fe",
                              color: ec.funding_source === "employee" ? "#7e22ce" : ec.funding_source === "shared" ? "#b45309" : "#0369a1",
                            }}>
                              {ec.funding_source ? FUNDING_SOURCE_LABELS[ec.funding_source] : "Company Funded"}
                            </span>
                            {effectiveCost > 0 && (
                              <span style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#0f172a" }}>
                                {formatCost(effectiveCost, certification.currency || "IDR")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {ec.gl_journal_number ? (
                              <span style={{
                                fontSize: "0.68rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 4, width: "fit-content",
                                background: "#dcfce7", color: "#166534", fontFamily: "monospace",
                              }}>
                                ✓ GL: {ec.gl_journal_number}
                              </span>
                            ) : ec.reimbursement_status && ec.reimbursement_status !== "not_applicable" ? (
                              <span style={{
                                fontSize: "0.68rem", fontWeight: 600, padding: "0.1rem 0.4rem", borderRadius: 4, width: "fit-content",
                                background: ec.reimbursement_status === "paid" ? "#dcfce7" : ec.reimbursement_status === "submitted" ? "#fef3c7" : "#f1f5f9",
                                color: ec.reimbursement_status === "paid" ? "#166534" : ec.reimbursement_status === "submitted" ? "#b45309" : "#475569",
                              }}>
                                {REIMBURSEMENT_STATUS_LABELS[ec.reimbursement_status]}
                              </span>
                            ) : (
                              <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${ec.status === "active" ? "badge-active" : "badge-inactive"}`}>
                            {CERT_STATUS_LABELS[ec.status]}{ec.is_expiring_soon ? " (segera habis)" : ""}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {ec.status === "active" && (
                            <div style={{ display: "inline-flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                              {!ec.gl_journal_number && effectiveCost > 0 && ec.reimbursement_status !== "submitted" && ec.reimbursement_status !== "paid" && (
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: "0.3rem 0.5rem", fontSize: "0.7rem", color: "#0369a1", borderColor: "#bae6fd", background: "#f0f9ff" }}
                                  disabled={submitToFinance.isPending}
                                  onClick={() => handleSubmitToFinance(ec.id)}
                                  title="Kirim ke antrean Finance > HR Integration"
                                >
                                  Ajukan Finance
                                </button>
                              )}
                              {!ec.gl_journal_number && effectiveCost > 0 && (
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: "0.3rem 0.5rem", fontSize: "0.7rem", color: "#0A2140", borderColor: "#cbd5e1" }}
                                  disabled={postToFinance.isPending}
                                  onClick={() => handlePostToFinance(ec.id)}
                                  title="Posting jurnal beban sertifikasi ke GL Finance"
                                >
                                  Posting GL
                                </button>
                              )}
                              <button
                                className="btn btn-secondary"
                                style={{ padding: "0.3rem 0.5rem", fontSize: "0.7rem" }}
                                onClick={() => handleRevoke(ec.id)}
                              >
                                Cabut
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  );
}
