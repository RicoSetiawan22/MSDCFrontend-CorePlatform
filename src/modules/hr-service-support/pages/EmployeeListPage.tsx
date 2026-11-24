import { PageHeader } from "@shared/components/PageHeader";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, Plus, Briefcase, Award, ShoppingCart, Trash2, User as UserIcon, Camera, PenTool, Download, Users, UserCheck, PlaneTakeoff, UserX, ShieldCheck, FileText, Info, Heart, LayoutDashboard, Mail, Phone, Building2, BadgeCheck, GraduationCap } from "lucide-react";
import {
  useEmployeeList, useEmployeeStats, useEmployee, useCreateEmployee, useUpdateEmployee, useSetEmployeeStatus,
  useUploadEmployeePhoto, useUploadEmployeeSignature,
  useCreateWorkExperience, useUpdateWorkExperience, useDeleteWorkExperience,
  useCreateSkill, useUpdateSkill, useDeleteSkill,
  useCreateFamily, useUpdateFamily, useDeleteFamily,
  useCreateEducation, useUpdateEducation, useDeleteEducation,
} from "../api/useEmployees";
import { usePositions } from "../api/usePositions";
import { employeeApi } from "../api/employeeApi";
import { useDepartments } from "@modules/core-platform/api/useDepartments";
import { useCostCenterList } from "@modules/finance-accounting/api/useCostCenters";
import { useUserList } from "@modules/core-platform/api/useUsers";
import { useFilePreview } from "@modules/core-platform/api/useFilePreview";
import { Pagination } from "@shared/components/Pagination";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { apiClient } from "@shared/lib/api-client";
import { formatDate, formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { Employee, EmploymentStatus, EmployeeType, WorkExperience, Skill, ProficiencyLevel, EmployeeFamily, EmployeeEducation } from "../types/employee";
import type { Position } from "../api/positionApi";
import type { Department } from "@modules/core-platform/types/organization";
import type { CostCenter } from "@modules/finance-accounting/types/costCenter";

const PR_STATUS_LABELS: Record<string, string> = {
  draft: "Draft", submitted: "Menunggu Approval", approved: "Disetujui",
  rejected: "Ditolak", cancelled: "Dibatalkan", converted_to_po: "Sudah Jadi PO",
};

const STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: "Aktif", probation: "Probation", on_leave: "Cuti",
  resigned: "Resigned", terminated: "Terminated", retired: "Pensiun",
};
const TYPE_LABELS: Record<EmployeeType, string> = {
  permanent: "Tetap", contract: "Kontrak", intern: "Magang", outsourced: "Outsource",
};
const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
  beginner: "Pemula", intermediate: "Menengah", advanced: "Mahir", expert: "Ahli",
};
const GENDER_LABELS: Record<string, string> = {
  male: "Laki-laki",
  female: "Perempuan",
};

export function EmployeeListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmploymentStatus | "">("");
  const [showCreate, setShowCreate] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [detailEmployeeId, setDetailEmployeeId] = useState<number | null>(null);

  const { data, isLoading } = useEmployeeList({
    page, per_page: 20,
    search: search || undefined,
    employment_status: statusFilter || undefined,
  });

  // ── Stat Cards ─────────────────────────────────────────────────────────────
  // PRIMER (Task 8): 1 request ke /employees/stats — lebih efisien.
  // FALLBACK: jika endpoint belum ada di backend (stats undefined), gunakan
  // 5 query terpisah agar card tetap tampil angka nyata sekarang juga.
  const { data: stats } = useEmployeeStats();

  const { data: activeStat }     = useEmployeeList({ per_page: 1, employment_status: "active" });
  const { data: probationStat }  = useEmployeeList({ per_page: 1, employment_status: "probation" });
  const { data: leaveStat }      = useEmployeeList({ per_page: 1, employment_status: "on_leave" });
  const { data: resignedStat }   = useEmployeeList({ per_page: 1, employment_status: "resigned" });
  const { data: terminatedStat } = useEmployeeList({ per_page: 1, employment_status: "terminated" });
  const { data: retiredStat }    = useEmployeeList({ per_page: 1, employment_status: "retired" });

  // Pakai data dari stats endpoint jika tersedia; fallback ke query individual
  const totalCount = stats?.total ?? data?.total ?? "—";
  const activeCount = stats
    ? stats.active + stats.probation
    : (activeStat?.total ?? 0) + (probationStat?.total ?? 0);
  const leaveCount = stats
    ? stats.on_leave
    : (leaveStat?.total ?? "—");
  const inactiveCount = stats
    ? (stats.inactive ?? (stats.resigned + stats.terminated + stats.retired))
    : (resignedStat?.total ?? 0) + (terminatedStat?.total ?? 0) + (retiredStat?.total ?? 0);

  function resetFilters() {
    setSearch(""); setStatusFilter(""); setPage(1);
  }

  // Saat mode detail aktif, ganti seluruh konten area dengan komponen Detail
  // (bukan fixed overlay) sehingga header app & sidebar tetap terlihat.
  if (detailEmployeeId) {
    return (
      <EmployeeDetailModal
        employeeId={detailEmployeeId}
        onClose={() => setDetailEmployeeId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Employee Management"
        subtitle="Manajemen data pegawai, struktur jabatan, status kepegawaian, dan integrasi akun portal."
      >
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
            <Download size={15} className="text-slate-500" /> Export
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={15} /> Employee Baru
          </button>
        </div>
      </PageHeader>

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Workflow Info Banner */}
        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
            <Users size={18} />
          </div>
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Integrasi Akun Pegawai:</strong> Setiap pegawai yang ditautkan ke akun user sistem dapat login dan melakukan approval transaksi (Cuti, Overtime, Tiket ITIL) melalui menu <span className="font-semibold text-slate-800">My Approvals</span>. Gunakan Detail untuk melengkapi pengalaman kerja, skill, tanda tangan digital, dan pas foto.
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Employee</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalCount}</span>
              <p className="text-xs text-slate-500 mt-1">Terdaftar di master data</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Aktif &amp; Probation</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <UserCheck size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{activeCount}</span>
              <p className="text-xs text-emerald-600 font-medium mt-1">Pegawai aktif operasional</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sedang Cuti</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <PlaneTakeoff size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{leaveCount}</span>
              <p className="text-xs text-slate-500 mt-1">Status cuti terverifikasi</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tidak Aktif</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
                <UserX size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{inactiveCount}</span>
              <p className="text-xs text-slate-500 mt-1">Resigned / Pensiun</p>
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2140]/10 focus:border-[#0A2140] transition-all"
                placeholder="Cari nama, NIK, atau email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:border-[#0A2140]"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value as EmploymentStatus | ""); setPage(1); }}
              >
                <option value="">Semua Status Kepegawaian</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              {(search || statusFilter) && (
                <button
                  className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                  onClick={resetFilters}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {isLoading && <LoadingState />}
          {data && data.data.length === 0 && (
            <div className="p-8">
              <EmptyState title="Belum Ada Employee" subtitle="Tambahkan data pegawai baru untuk memulai." />
            </div>
          )}
          {data && data.data.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80">
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-12 text-center">
                        <input type="checkbox" className="rounded border-slate-300 text-[#0A2140] focus:ring-0 cursor-pointer" />
                      </th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kode Employee</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">NIK</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Akun Portal</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tipe</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Masuk</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map(emp => (
                      <EmployeeRow key={emp.id} emp={emp} onEdit={setEditEmployee} onDetail={() => setDetailEmployeeId(emp.id)} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
                <span className="text-xs text-slate-500">
                  Menampilkan halaman <strong className="text-slate-700">{data.current_page}</strong> dari <strong className="text-slate-700">{data.last_page}</strong> (total {data.total} pegawai)
                </span>
                <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      {showCreate && <CreateEmployeeModal onClose={() => setShowCreate(false)} />}
      {editEmployee && <EditEmployeeModal employee={editEmployee} onClose={() => setEditEmployee(null)} />}
    </div>
  );
}

// ─── Employee Row (status change + edit) ────────────────────────────────────
function EmployeeRow({ emp, onEdit, onDetail }: { emp: Employee; onEdit: (emp: Employee) => void; onDetail: () => void }) {
  const setStatus = useSetEmployeeStatus(emp.id);

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as EmploymentStatus;
    if (next === emp.employment_status) return;
    if (!confirm(`Ubah status ${emp.full_name} jadi "${STATUS_LABELS[next]}"?`)) { e.target.value = emp.employment_status; return; }
    setStatus.mutate(next, {
      onError: (err) => alert("Gagal ubah status: " + extractErrorMessage(err)),
    });
  }

  return (
    <tr className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
      <td className="px-5 py-3.5 text-center">
        <input type="checkbox" className="rounded border-slate-300 text-[#0A2140] focus:ring-0 cursor-pointer" />
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <EmployeeAvatar photoFileId={emp.photo_file_id} name={emp.full_name} size={36} />
          <div>
            <button
              onClick={onDetail}
              className="text-sm font-semibold text-slate-900 hover:text-[#0A2140] text-left block transition-colors"
            >
              {emp.full_name}
            </button>
            <div className="text-xs text-slate-500">{emp.email}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-600">{emp.employee_number}</td>
      <td className="px-5 py-3.5 font-mono text-xs">
        {emp.nik ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200/80" title="NIK (Nomor Induk Kepegawaian) - 16 Karakter Terkunci">
            {emp.nik}
          </span>
        ) : (
          <span className="text-slate-400 italic">Belum diisi</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-xs">
        {emp.user ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60" title={emp.user.email}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {emp.user.name}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Belum ditautkan
          </span>
        )}
      </td>
      <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
          {TYPE_LABELS[emp.employee_type as EmployeeType] ?? emp.employee_type}
        </span>
      </td>
      <td className="px-5 py-3.5 text-xs text-slate-600">
        <div>{formatDate(emp.join_date)}</div>
        {emp.exit_date && (
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">
            Selesai/Keluar: {formatDate(emp.exit_date)}
          </div>
        )}
      </td>
      <td className="px-5 py-3.5">
        <select
          value={emp.employment_status}
          disabled={setStatus.isPending}
          onChange={handleStatusChange}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer outline-none ${
            emp.employment_status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200/80" :
            emp.employment_status === "probation" ? "bg-amber-50 text-amber-700 border-amber-200/80" :
            emp.employment_status === "on_leave" ? "bg-blue-50 text-blue-700 border-blue-200/80" :
            "bg-rose-50 text-rose-700 border-rose-200/80"
          }`}
        >
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="inline-flex items-center gap-1.5">
          <button
            onClick={onDetail}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Detail
          </button>
          <button
            onClick={() => onEdit(emp)}
            className="px-2.5 py-1 text-xs font-medium text-[#0A2140] hover:text-[#07162c] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Edit
          </button>
        </div>
      </td>
    </tr>
  );
}

function CreateEmployeeModal({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [nik, setNik] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ktpAddress, setKtpAddress] = useState("");
  const [domicileAddress, setDomicileAddress] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [exitDate, setExitDate] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>("probation");
  const [employeeType, setEmployeeType] = useState<EmployeeType>("permanent");
  const [positionId, setPositionId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [linkedUser, setLinkedUser] = useState<LinkedUserRef | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [bpjsKesehatanNumber, setBpjsKesehatanNumber] = useState("");
  const [bpjsKesehatanStatus, setBpjsKesehatanStatus] = useState("");
  const [bpjsTkNumber, setBpjsTkNumber] = useState("");
  const [bpjsTkStatus, setBpjsTkStatus] = useState("");
  const [npwp, setNpwp] = useState("");
  const [ptkpStatus, setPtkpStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { data: positions, isLoading: posLoading } = usePositions();
  const { data: departments, isLoading: deptLoading } = useDepartments({ per_page: 200 });
  const { data: costCenters, isLoading: ccLoading } = useCostCenterList({ per_page: 200 });
  const createEmployee = useCreateEmployee();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email) { setError("Nama dan Email wajib diisi."); return; }
    const cleanNik = nik.trim();
    if (!cleanNik) { setError("NIK (Nomor Induk Kepegawaian) wajib diisi (16 karakter)."); return; }
    if (cleanNik.length !== 16) { setError(`NIK (Nomor Induk Kepegawaian) harus tepat 16 karakter (minimal 16 & maksimal 16 karakter, saat ini ${cleanNik.length} karakter).`); return; }
    setError(null);

    const values: Record<string, unknown> = {
      full_name: fullName, nik: cleanNik, email, phone: phone || undefined,
      birth_date: birthDate || null,
      gender: gender || null,
      ktp_address: ktpAddress.trim() || null,
      domicile_address: domicileAddress.trim() || null,
      join_date: joinDate || undefined,
      exit_date: exitDate || null,
      employment_status: employmentStatus, employee_type: employeeType,
      notes: notes || undefined,
      user_id: linkedUser?.id,
      bpjs_kesehatan_number: bpjsKesehatanNumber || null,
      bpjs_kesehatan_status: bpjsKesehatanStatus || null,
      bpjs_ketenagakerjaan_number: bpjsTkNumber || null,
      bpjs_ketenagakerjaan_status: bpjsTkStatus || null,
      npwp: npwp || null,
      ptkp_status: ptkpStatus || null,
    };
    if (positionId) values.position_id = parseInt(positionId);
    if (departmentId) values.department_id = parseInt(departmentId);
    if (costCenterId) values.cost_center_id = parseInt(costCenterId);

    try {
      const newEmployee = await createEmployee.mutateAsync(values as Partial<Employee>);
      if (photoFile) {
        try {
          await employeeApi.uploadPhoto(newEmployee.data.data.id, photoFile);
        } catch {
          alert("Employee tersimpan, tapi upload foto gagal - coba upload ulang lewat Edit.");
        }
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  function handleReset() {
    setFullName(""); setNik(""); setBirthDate(""); setGender("");
    setEmail(""); setPhone(""); setKtpAddress(""); setDomicileAddress("");
    setJoinDate(""); setExitDate("");
    setEmploymentStatus("probation"); setEmployeeType("permanent");
    setPositionId(""); setDepartmentId(""); setCostCenterId("");
    setLinkedUser(null); setPhotoFile(null); setNotes("");
    setBpjsKesehatanNumber(""); setBpjsKesehatanStatus("");
    setBpjsTkNumber(""); setBpjsTkStatus("");
    setNpwp(""); setPtkpStatus("");
    setError(null);
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="form-modal">
        <div className="form-modal__header">
          <div className="form-modal__title-row">
            <h2 className="form-modal__title">Tambah Employee Baru</h2>
            <span className="form-modal__badge">New Onboarding</span>
            <button type="button" className="form-modal__close" onClick={onClose} style={{ marginLeft: "auto" }}>✕</button>
          </div>
          <p className="form-modal__subtitle">Lengkapi data profil, identitas kepegawaian, dan penugasan employee baru.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
          <div className="form-modal__scroll">
            <div className="form-section">
              <div className="form-section__label-row">
                <span className="form-section__label">01 / Foto Karyawan</span>
              </div>
              <PhotoPicker photoFile={photoFile} currentPhotoFileId={null} name={fullName} onChange={setPhotoFile} />
            </div>

          <div className="form-section" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div className="form-section__label-row">
              <span className="form-section__label">02 / Informasi Personal &amp; Akses Akun</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <F label="Kode Employee (Otomatis Sistem)">
                <input
                  className="input"
                  value="Otomatis (EMP-YYYYMM-XXXXXX)"
                  disabled
                  readOnly
                  style={{ width: "100%", backgroundColor: "#f8fafc", color: "#64748b", fontFamily: "monospace", cursor: "not-allowed" }}
                />
                <div className="form-section__hint" style={{ marginTop: 4 }}>
                  Kode employee di-generate otomatis oleh sistem saat disimpan.
                </div>
              </F>
              <F label="NIK (Nomor Induk Kepegawaian) *" required>
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    value={nik}
                    onChange={e => setNik(e.target.value.slice(0, 16))}
                    minLength={16}
                    maxLength={16}
                    placeholder="Masukkan 16 karakter NIK"
                    style={{ width: "100%", fontFamily: "monospace", letterSpacing: "0.04em", paddingRight: "4.5rem" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: "0.65rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: nik.trim().length === 16 ? "#059669" : "#64748b",
                      backgroundColor: nik.trim().length === 16 ? "#ecfdf5" : "#f1f5f9",
                      padding: "2px 6px",
                      borderRadius: "6px",
                    }}
                  >
                    {nik.trim().length === 16 ? "🔒 16/16" : `${nik.trim().length}/16`}
                  </span>
                </div>
                <div className="form-section__hint" style={{ marginTop: 4 }}>
                  Wajib tepat 16 karakter (min 16 &amp; maks 16 karakter). Dikunci setelah disimpan.
                </div>
              </F>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <F label="Nama Lengkap *" required>
                <input className="input" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="mis. Jonathan Aditya" style={{ width: "100%" }} />
              </F>
              <F label="Email *">
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="nama@msdc.com" style={{ width: "100%" }} />
              </F>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <F label="Tanggal Lahir">
                <input
                  className="input"
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  style={{ width: "100%" }}
                />
              </F>
              <F label="Jenis Kelamin">
                <select className="input" value={gender} onChange={e => setGender(e.target.value)} style={{ width: "100%" }}>
                  <option value="">— Pilih Jenis Kelamin —</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
              </F>
            </div>

            <F label="Akun User (opsional)">
              <UserAccountPicker selected={linkedUser} onSelect={setLinkedUser} onClear={() => setLinkedUser(null)} />
              <div className="form-section__hint" style={{ marginTop: 4 }}>
                Tautkan ke akun login supaya sistem tahu approval (mis. cuti) yang dilakukan akun ini mewakili employee siapa.
              </div>
            </F>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <F label="Telepon">
                <input className="input" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+62..." style={{ width: "100%" }} />
              </F>
              <F label="Tanggal Masuk">
                <input className="input" type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)}
                  style={{ width: "100%" }} />
              </F>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <F label="Tanggal Selesai / Keluar (Opsional)">
                <input
                  className="input"
                  type="date"
                  value={exitDate}
                  onChange={e => setExitDate(e.target.value)}
                  style={{ width: "100%" }}
                />
                <div className="form-section__hint" style={{ marginTop: 4 }}>
                  Diisi untuk masa berakhir kontrak, resign, atau pensiun.
                </div>
              </F>
              <div />
            </div>

            <F label="Alamat KTP">
              <textarea
                className="input"
                value={ktpAddress}
                onChange={e => setKtpAddress(e.target.value)}
                placeholder="Masukkan alamat lengkap sesuai KTP (Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Provinsi)..."
                style={{ width: "100%", minHeight: 60, resize: "vertical" }}
              />
            </F>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Alamat Domisili</label>
                {ktpAddress.trim() && (
                  <button
                    type="button"
                    onClick={() => setDomicileAddress(ktpAddress)}
                    style={{ fontSize: "11px", color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Samakan dengan Alamat KTP
                  </button>
                )}
              </div>
              <textarea
                className="input"
                value={domicileAddress}
                onChange={e => setDomicileAddress(e.target.value)}
                placeholder="Masukkan alamat domisili tempat tinggal saat ini..."
                style={{ width: "100%", minHeight: 60, resize: "vertical" }}
              />
            </div>
          </div>

          <div className="form-section" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div className="form-section__label-row">
              <span className="form-section__label">03 / Posisi &amp; Struktur Organisasi</span>
            </div>

            <F label="Posisi / Jabatan">
              {posLoading ? (
                <input className="input" disabled placeholder="Memuat..." style={{ width: "100%" }} />
              ) : (
                <div>
                  <select className="input" value={positionId} onChange={e => setPositionId(e.target.value)} style={{ width: "100%" }}>
                    <option value="">— Pilih Posisi —</option>
                    {(positions ?? []).map((p: Position) => (
                      <option key={p.id} value={p.id}>
                        {p.position_title}{p.department_name ? ` (${p.department_name})` : ""}
                      </option>
                    ))}
                  </select>
                  <div className="form-section__hint" style={{ marginTop: 4 }}>
                    Posisi baru? Buat di menu <strong style={{ color: "var(--msdc-blue)" }}>Position / Jabatan</strong> di sidebar HR terlebih dahulu.
                  </div>
                </div>
              )}
            </F>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <F label="Department">
                {deptLoading ? (
                  <input className="input" disabled placeholder="Memuat..." style={{ width: "100%" }} />
                ) : (
                  <select className="input" value={departmentId} onChange={e => setDepartmentId(e.target.value)} style={{ width: "100%" }}>
                    <option value="">— Pilih Department —</option>
                    {(departments?.data ?? []).map((d: Department) => (
                      <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                    ))}
                  </select>
                )}
              </F>
              <F label="Cost Center">
                {ccLoading ? (
                  <input className="input" disabled placeholder="Memuat..." style={{ width: "100%" }} />
                ) : (
                  <select className="input" value={costCenterId} onChange={e => setCostCenterId(e.target.value)} style={{ width: "100%" }}>
                    <option value="">— Pilih Cost Center —</option>
                    {(costCenters ?? []).map((cc: CostCenter) => (
                      <option key={cc.id} value={cc.id}>{cc.code} — {cc.name}</option>
                    ))}
                  </select>
                )}
              </F>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <F label="Employment Status">
                <select className="input" value={employmentStatus}
                  onChange={e => setEmploymentStatus(e.target.value as EmploymentStatus)} style={{ width: "100%" }}>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </F>
              <F label="Employee Type">
                <select className="input" value={employeeType}
                  onChange={e => setEmployeeType(e.target.value as EmployeeType)} style={{ width: "100%" }}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </F>
            </div>

            <F label="Catatan">
              <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Catatan tambahan..." style={{ width: "100%", minHeight: 60, resize: "vertical" }} />
            </F>
          </div>

          <div className="form-section" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div className="form-section__label-row">
              <span className="form-section__label">04 / BPJS &amp; Perpajakan (Opsional)</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <F label="No. BPJS Kesehatan">
                <input className="input" value={bpjsKesehatanNumber} onChange={e => setBpjsKesehatanNumber(e.target.value)}
                  placeholder="13 digit No. KIS" style={{ width: "100%" }} />
              </F>
              <F label="Status BPJS Kesehatan">
                <select className="input" value={bpjsKesehatanStatus} onChange={e => setBpjsKesehatanStatus(e.target.value)} style={{ width: "100%" }}>
                  <option value="">— Pilih Status —</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Dalam Proses">Dalam Proses</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                </select>
              </F>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <F label="No. BPJS Ketenagakerjaan (KPJ)">
                <input className="input" value={bpjsTkNumber} onChange={e => setBpjsTkNumber(e.target.value)}
                  placeholder="11 digit No. KPJ" style={{ width: "100%" }} />
              </F>
              <F label="Status BPJS Ketenagakerjaan">
                <select className="input" value={bpjsTkStatus} onChange={e => setBpjsTkStatus(e.target.value)} style={{ width: "100%" }}>
                  <option value="">— Pilih Status —</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Dalam Proses">Dalam Proses</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                </select>
              </F>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <F label="NPWP">
                <input className="input" value={npwp} onChange={e => setNpwp(e.target.value)}
                  placeholder="15 / 16 digit NPWP" style={{ width: "100%" }} />
              </F>
              <F label="Status PTKP">
                <select className="input" value={ptkpStatus} onChange={e => setPtkpStatus(e.target.value)} style={{ width: "100%" }}>
                  <option value="">— Pilih Status PTKP —</option>
                  {["TK/0", "TK/1", "TK/2", "TK/3", "K/0", "K/1", "K/2", "K/3"].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </F>
            </div>

            {error && <div className="input-error">{error}</div>}
          </div>

          </div>

          <div className="form-modal__footer">
            <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset Form</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
              <button type="submit" className="btn btn-accent" disabled={createEmployee.isPending}>
                {createEmployee.isPending ? "Menyimpan..." : "Simpan & Tambah Karyawan"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Employee Modal ────────────────────────────────────────────────────
function EditEmployeeModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [fullName, setFullName] = useState(employee.full_name);
  const [nik, setNik] = useState(employee.nik ?? "");
  const [isNikLocked, setIsNikLocked] = useState(() => (employee.nik ?? "").trim().length === 16);
  const [birthDate, setBirthDate] = useState(() => (employee.birth_date ? String(employee.birth_date).slice(0, 10) : ""));
  const [gender, setGender] = useState(employee.gender ?? "");
  const [email, setEmail] = useState(employee.email ?? "");
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [ktpAddress, setKtpAddress] = useState(employee.ktp_address ?? "");
  const [domicileAddress, setDomicileAddress] = useState(employee.domicile_address ?? "");
  const [joinDate, setJoinDate] = useState(() => (employee.join_date ? String(employee.join_date).slice(0, 10) : ""));
  const [exitDate, setExitDate] = useState(() => (employee.exit_date ? String(employee.exit_date).slice(0, 10) : ""));
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>(
    (employee.employment_status as EmploymentStatus) || "active"
  );
  const [employeeType, setEmployeeType] = useState<EmployeeType>(
    (employee.employee_type as EmployeeType) || "permanent"
  );
  const [positionId, setPositionId] = useState(employee.position_id ? String(employee.position_id) : "");
  const [departmentId, setDepartmentId] = useState(employee.department_id ? String(employee.department_id) : "");
  const [costCenterId, setCostCenterId] = useState(employee.cost_center_id ? String(employee.cost_center_id) : "");
  const [notes, setNotes] = useState(employee.notes ?? "");
  const [linkedUser, setLinkedUser] = useState<LinkedUserRef | null>(employee.user ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [bpjsKesehatanNumber, setBpjsKesehatanNumber] = useState(employee.bpjs_kesehatan_number ?? "");
  const [bpjsKesehatanStatus, setBpjsKesehatanStatus] = useState(employee.bpjs_kesehatan_status ?? "");
  const [bpjsTkNumber, setBpjsTkNumber] = useState(employee.bpjs_ketenagakerjaan_number ?? "");
  const [bpjsTkStatus, setBpjsTkStatus] = useState(employee.bpjs_ketenagakerjaan_status ?? "");
  const [npwp, setNpwp] = useState(employee.npwp ?? "");
  const [ptkpStatus, setPtkpStatus] = useState(employee.ptkp_status ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: detailEmployee } = useEmployee(employee.id);
  const { data: positions, isLoading: posLoading } = usePositions();
  const { data: departments, isLoading: deptLoading } = useDepartments({ per_page: 200 });
  const { data: costCenters, isLoading: ccLoading } = useCostCenterList({ per_page: 200 });
  const update = useUpdateEmployee(employee.id);
  const uploadPhoto = useUploadEmployeePhoto(employee.id);
  const uploadSignature = useUploadEmployeeSignature(employee.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setError("Nama wajib diisi."); return; }
    const cleanNik = nik.trim();
    if (cleanNik.length > 0 && cleanNik.length !== 16) {
      setError(`NIK (Nomor Induk Kepegawaian) harus tepat 16 karakter (minimal 16 & maksimal 16 karakter, saat ini ${cleanNik.length} karakter).`);
      return;
    }
    setError(null);

    const values: Record<string, unknown> = {
      full_name: fullName.trim(),
      nik: cleanNik || null,
      birth_date: birthDate || null,
      gender: gender || null,
      email: email || undefined,
      phone: phone || undefined,
      ktp_address: ktpAddress.trim() || null,
      domicile_address: domicileAddress.trim() || null,
      join_date: joinDate || null,
      exit_date: exitDate || null,
      employment_status: employmentStatus,
      employee_type: employeeType,
      notes: notes || undefined,
      position_id: positionId ? parseInt(positionId) : null,
      department_id: departmentId ? parseInt(departmentId) : null,
      cost_center_id: costCenterId ? parseInt(costCenterId) : null,
      user_id: linkedUser?.id ?? null,
      bpjs_kesehatan_number: bpjsKesehatanNumber || null,
      bpjs_kesehatan_status: bpjsKesehatanStatus || null,
      bpjs_ketenagakerjaan_number: bpjsTkNumber || null,
      bpjs_ketenagakerjaan_status: bpjsTkStatus || null,
      npwp: npwp || null,
      ptkp_status: ptkpStatus || null,
    };

    try {
      if (photoFile) await uploadPhoto.mutateAsync(photoFile);
      if (signatureFile) await uploadSignature.mutateAsync(signatureFile);
      await update.mutateAsync(values as Partial<Employee>);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  function handleReset() {
    const src = detailEmployee ?? employee;
    setFullName(src.full_name);
    setNik(src.nik ?? "");
    setIsNikLocked((src.nik ?? "").trim().length === 16);
    setBirthDate(src.birth_date ? String(src.birth_date).slice(0, 10) : "");
    setGender(src.gender ?? "");
    setEmail(src.email ?? "");
    setPhone(src.phone ?? "");
    setKtpAddress(src.ktp_address ?? "");
    setDomicileAddress(src.domicile_address ?? "");
    setJoinDate(src.join_date ? String(src.join_date).slice(0, 10) : "");
    setExitDate(src.exit_date ? String(src.exit_date).slice(0, 10) : "");
    setEmploymentStatus((src.employment_status as EmploymentStatus) || "active");
    setEmployeeType((src.employee_type as EmployeeType) || "permanent");
    setPositionId(src.position_id ? String(src.position_id) : "");
    setDepartmentId(src.department_id ? String(src.department_id) : "");
    setCostCenterId(src.cost_center_id ? String(src.cost_center_id) : "");
    setNotes(src.notes ?? "");
    setLinkedUser(src.user ?? null);
    setPhotoFile(null);
    setSignatureFile(null);
    setBpjsKesehatanNumber(src.bpjs_kesehatan_number ?? "");
    setBpjsKesehatanStatus(src.bpjs_kesehatan_status ?? "");
    setBpjsTkNumber(src.bpjs_ketenagakerjaan_number ?? "");
    setBpjsTkStatus(src.bpjs_ketenagakerjaan_status ?? "");
    setNpwp(src.npwp ?? "");
    setPtkpStatus(src.ptkp_status ?? "");
    setError(null);
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="form-modal">
        <div className="form-modal__header">
          <div className="form-modal__title-row">
            <h2 className="form-modal__title">Edit Employee — {employee.employee_number}</h2>
            <button type="button" className="form-modal__close" onClick={onClose} style={{ marginLeft: "auto" }}>✕</button>
          </div>
          <p className="form-modal__subtitle">Perbarui data profil, identitas kepegawaian, dan penugasan employee.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
          <div className="form-modal__scroll">
            <div className="form-section" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-section__label-row">
                <span className="form-section__label">01 / Foto &amp; Tanda Tangan</span>
              </div>
              <F label="Foto">
                <PhotoPicker photoFile={photoFile} currentPhotoFileId={employee.photo_file_id} name={fullName} onChange={setPhotoFile} />
              </F>
              <F label="Tanda Tangan">
                <SignaturePicker signatureFile={signatureFile} currentSignatureFileId={employee.signature_file_id} onChange={setSignatureFile} />
                <div className="form-section__hint" style={{ marginTop: 4 }}>
                  Dicetak sebagai tanda tangan sungguhan di PDF Purchase Request/Order/Payment Request - WAJIB diisi sebelum employee ini bisa approve dokumen Procurement.
                </div>
              </F>
            </div>

            <div className="form-section" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div className="form-section__label-row">
                <span className="form-section__label">02 / Informasi Personal &amp; Akses Akun</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <F label="Kode Employee">
                  <input
                    className="input"
                    value={employee.employee_number}
                    disabled
                    readOnly
                    style={{ width: "100%", backgroundColor: "#f8fafc", color: "#475569", fontFamily: "monospace", fontWeight: 600, cursor: "not-allowed" }}
                  />
                  <div className="form-section__hint" style={{ marginTop: 4 }}>
                    Kode unik sistem kepegawaian (otomatis &amp; permanen).
                  </div>
                </F>
                <F label="NIK (Nomor Induk Kepegawaian)">
                  <div style={{ position: "relative" }}>
                    <input
                      className="input"
                      value={nik}
                      readOnly={isNikLocked}
                      onChange={e => setNik(e.target.value.slice(0, 16))}
                      maxLength={16}
                      placeholder="Masukkan 16 karakter NIK"
                      style={{
                        width: "100%",
                        fontFamily: "monospace",
                        letterSpacing: "0.04em",
                        paddingRight: "5.25rem",
                        backgroundColor: isNikLocked ? "#f8fafc" : undefined,
                        color: isNikLocked ? "#334155" : undefined,
                        fontWeight: isNikLocked ? 600 : undefined,
                        cursor: isNikLocked ? "not-allowed" : undefined,
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: "0.65rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: nik.trim().length === 16 ? "#059669" : "#64748b",
                        backgroundColor: nik.trim().length === 16 ? "#ecfdf5" : "#f1f5f9",
                        padding: "2px 6px",
                        borderRadius: "6px",
                      }}
                    >
                      {isNikLocked ? "🔒 16/16" : `${nik.trim().length}/16`}
                    </span>
                  </div>
                  <div className="form-section__hint" style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>{isNikLocked ? "Terkunci (16 karakter)." : "Wajib tepat 16 karakter (min 16 & maks 16)."}</span>
                    {isNikLocked ? (
                      <button
                        type="button"
                        onClick={() => setIsNikLocked(false)}
                        style={{ fontSize: "11px", color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        Ubah NIK
                      </button>
                    ) : nik.trim().length === 16 ? (
                      <button
                        type="button"
                        onClick={() => setIsNikLocked(true)}
                        style={{ fontSize: "11px", color: "#059669", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        Kunci NIK
                      </button>
                    ) : null}
                  </div>
                </F>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <F label="Nama Lengkap *" required>
                  <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: "100%" }} />
                </F>
                <F label="Email">
                  <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%" }} />
                </F>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <F label="Tanggal Lahir">
                  <input
                    className="input"
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </F>
                <F label="Jenis Kelamin">
                  <select className="input" value={gender} onChange={e => setGender(e.target.value)} style={{ width: "100%" }}>
                    <option value="">— Pilih Jenis Kelamin —</option>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </F>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <F label="Telepon">
                  <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+62..." style={{ width: "100%" }} />
                </F>
                <F label="Tanggal Masuk">
                  <input className="input" type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)} style={{ width: "100%" }} />
                </F>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <F label="Tanggal Selesai / Keluar">
                  <input
                    className="input"
                    type="date"
                    value={exitDate}
                    onChange={e => setExitDate(e.target.value)}
                    style={{ width: "100%" }}
                  />
                  <div className="form-section__hint" style={{ marginTop: 4 }}>
                    Diisi untuk tanggal selesai kontrak, resign, atau pensiun.
                  </div>
                </F>
                <div />
              </div>

              <F label="Alamat KTP">
                <textarea
                  className="input"
                  value={ktpAddress}
                  onChange={e => setKtpAddress(e.target.value)}
                  placeholder="Masukkan alamat lengkap sesuai KTP..."
                  style={{ width: "100%", minHeight: 60, resize: "vertical" }}
                />
              </F>

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>Alamat Domisili</label>
                  {ktpAddress.trim() && (
                    <button
                      type="button"
                      onClick={() => setDomicileAddress(ktpAddress)}
                      style={{ fontSize: "11px", color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      Samakan dengan Alamat KTP
                    </button>
                  )}
                </div>
                <textarea
                  className="input"
                  value={domicileAddress}
                  onChange={e => setDomicileAddress(e.target.value)}
                  placeholder="Masukkan alamat domisili tempat tinggal saat ini..."
                  style={{ width: "100%", minHeight: 60, resize: "vertical" }}
                />
              </div>

              <F label="Akun User">
                <UserAccountPicker selected={linkedUser} onSelect={setLinkedUser} onClear={() => setLinkedUser(null)} />
                <div className="form-section__hint" style={{ marginTop: 4 }}>
                  Tautkan ke akun login supaya sistem tahu approval (mis. cuti) yang dilakukan akun ini mewakili employee siapa.
                </div>
              </F>
            </div>

            <div className="form-section" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div className="form-section__label-row">
                <span className="form-section__label">03 / Posisi &amp; Struktur Organisasi</span>
              </div>

              <F label="Posisi / Jabatan">
                {posLoading ? (
                  <input className="input" disabled placeholder="Memuat..." style={{ width: "100%" }} />
                ) : (
                  <select className="input" value={positionId} onChange={e => setPositionId(e.target.value)} style={{ width: "100%" }}>
                    <option value="">— Pilih Posisi —</option>
                    {(positions ?? []).map((p: Position) => (
                      <option key={p.id} value={p.id}>{p.position_title}{p.department_name ? ` (${p.department_name})` : ""}</option>
                    ))}
                  </select>
                )}
              </F>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <F label="Department">
                  {deptLoading ? (
                    <input className="input" disabled placeholder="Memuat..." style={{ width: "100%" }} />
                  ) : (
                    <select className="input" value={departmentId} onChange={e => setDepartmentId(e.target.value)} style={{ width: "100%" }}>
                      <option value="">— Pilih Department —</option>
                      {(departments?.data ?? []).map((d: Department) => (
                        <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                      ))}
                    </select>
                  )}
                </F>
                <F label="Cost Center">
                  {ccLoading ? (
                    <input className="input" disabled placeholder="Memuat..." style={{ width: "100%" }} />
                  ) : (
                    <select className="input" value={costCenterId} onChange={e => setCostCenterId(e.target.value)} style={{ width: "100%" }}>
                      <option value="">— Pilih Cost Center —</option>
                      {(costCenters ?? []).map((cc: CostCenter) => (
                        <option key={cc.id} value={cc.id}>{cc.code} — {cc.name}</option>
                      ))}
                    </select>
                  )}
                </F>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <F label="Employment Status">
                  <select
                    className="input"
                    value={employmentStatus}
                    onChange={e => setEmploymentStatus(e.target.value as EmploymentStatus)}
                    style={{ width: "100%" }}
                  >
                    {Object.entries(STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </F>
                <F label="Employee Type">
                  <select
                    className="input"
                    value={employeeType}
                    onChange={e => setEmployeeType(e.target.value as EmployeeType)}
                    style={{ width: "100%" }}
                  >
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </F>
              </div>

              <F label="Catatan">
                <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Catatan tambahan..." style={{ width: "100%", minHeight: 60, resize: "vertical" }} />
              </F>
            </div>

            <div className="form-section" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div className="form-section__label-row">
                <span className="form-section__label">04 / BPJS &amp; Perpajakan</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <F label="No. BPJS Kesehatan">
                  <input className="input" value={bpjsKesehatanNumber} onChange={e => setBpjsKesehatanNumber(e.target.value)}
                    placeholder="13 digit No. KIS" style={{ width: "100%" }} />
                </F>
                <F label="Status BPJS Kesehatan">
                  <select className="input" value={bpjsKesehatanStatus} onChange={e => setBpjsKesehatanStatus(e.target.value)} style={{ width: "100%" }}>
                    <option value="">— Pilih Status —</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </select>
                </F>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <F label="No. BPJS Ketenagakerjaan (KPJ)">
                  <input className="input" value={bpjsTkNumber} onChange={e => setBpjsTkNumber(e.target.value)}
                    placeholder="11 digit No. KPJ" style={{ width: "100%" }} />
                </F>
                <F label="Status BPJS Ketenagakerjaan">
                  <select className="input" value={bpjsTkStatus} onChange={e => setBpjsTkStatus(e.target.value)} style={{ width: "100%" }}>
                    <option value="">— Pilih Status —</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </select>
                </F>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <F label="NPWP">
                  <input className="input" value={npwp} onChange={e => setNpwp(e.target.value)}
                    placeholder="15 / 16 digit NPWP" style={{ width: "100%" }} />
                </F>
                <F label="Status PTKP">
                  <select className="input" value={ptkpStatus} onChange={e => setPtkpStatus(e.target.value)} style={{ width: "100%" }}>
                    <option value="">— Pilih Status PTKP —</option>
                    {["TK/0", "TK/1", "TK/2", "TK/3", "K/0", "K/1", "K/2", "K/3"].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </F>
              </div>
            </div>
          </div>

          {error && (
            <div className="input-error" style={{ margin: "0 1.5rem 0.75rem" }}>
              {error}
            </div>
          )}

          <div className="form-modal__footer">
            <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={update.isPending || uploadPhoto.isPending || uploadSignature.isPending}>
                {update.isPending || uploadPhoto.isPending || uploadSignature.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// SESUDAH
function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="input-label">
        {label}{required && <span style={{ color: "var(--bad)", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Avatar (foto atau inisial nama) ────────────────────────────────────────
function EmployeeAvatar({ photoFileId, name, size = 32 }: { photoFileId?: number | null; name: string; size?: number }) {
  const { url } = useFilePreview(photoFileId);
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";
  if (url) {
    return (
      <img src={url} alt={name} width={size} height={size}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    );
  }
  // SESUDAH
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "var(--accent-light)", color: "var(--msdc-blue)", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

// ─── Photo Picker (pilih file baru, preview lokal kalau ada / foto lama lewat File Management kalau tidak) ─
function PhotoPicker({ photoFile, currentPhotoFileId, name, onChange }: {
  photoFile: File | null; currentPhotoFileId: number | null; name: string; onChange: (f: File | null) => void;
}) {
  // File baru yang belum diupload cuma di-preview lokal (belum punya file id
  // di File Management) - useMemo supaya object URL cuma dibuat ULANG saat
  // photoFile berubah, bukan di setiap render (mis. tiap keystroke Nama).
  const localPreviewUrl = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : null), [photoFile]);
  useEffect(() => () => { if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl); }, [localPreviewUrl]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {localPreviewUrl ? (
        <img src={localPreviewUrl} alt={name || "?"} width={48} height={48}
          style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <EmployeeAvatar photoFileId={currentPhotoFileId} name={name || "?"} size={48} />
      )}
      <label className="btn btn-secondary" style={{ fontSize: "0.78rem", cursor: "pointer" }}>
        <Camera size={13} /> {photoFile || currentPhotoFileId ? "Ganti Foto" : "Upload Foto"}
        <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
          onChange={e => onChange(e.target.files?.[0] ?? null)} />
      </label>
      {photoFile && (
        <button type="button" onClick={() => onChange(null)}
          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.78rem" }}>
          Batal
        </button>
      )}
    </div>
  );
}

// ─── Signature Picker (sama pola dengan PhotoPicker, preview persegi bukan bulat) ─
function SignaturePicker({ signatureFile, currentSignatureFileId, onChange }: {
  signatureFile: File | null; currentSignatureFileId: number | null; onChange: (f: File | null) => void;
}) {
  const localPreviewUrl = useMemo(() => (signatureFile ? URL.createObjectURL(signatureFile) : null), [signatureFile]);
  useEffect(() => () => { if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl); }, [localPreviewUrl]);
  const { url: currentUrl } = useFilePreview(currentSignatureFileId);
  const previewUrl = localPreviewUrl ?? currentUrl;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 100, height: 48, borderRadius: "var(--radius)", border: "1px dashed var(--border)", background: "var(--bg-subtle)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden",
      }}>
        {previewUrl ? (
          <img src={previewUrl} alt="Tanda tangan" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        ) : (
          <span style={{ fontSize: "0.65rem", color: "var(--grey)" }}>Belum ada</span>
        )}
      </div>
      <label className="btn btn-secondary" style={{ fontSize: "0.78rem", cursor: "pointer" }}>
        <PenTool size={13} /> {signatureFile || currentSignatureFileId ? "Ganti Tanda Tangan" : "Upload Tanda Tangan"}
        <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }}
          onChange={e => onChange(e.target.files?.[0] ?? null)} />
      </label>
      {signatureFile && (
        <button type="button" onClick={() => onChange(null)}
          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.78rem" }}>
          Batal
        </button>
      )}
    </div>
  );
}

// ─── User Account Picker (cari & tautkan akun login) ────────────────────────
type LinkedUserRef = { id: number; name: string; email: string };
function UserAccountPicker({ selected, onSelect, onClear }: {
  selected: LinkedUserRef | null; onSelect: (u: LinkedUserRef) => void; onClear: () => void;
}) {
  const [search, setSearch] = useState("");
  const { data: results } = useUserList({ search: search || undefined, per_page: 10 });

  if (selected) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--color-semantic-success-bg)", borderRadius: "var(--radius)", fontSize: "0.85rem" }}>
        <UserIcon size={14} color="var(--color-semantic-success-text)" />
        <span style={{ flex: 1, color: "var(--color-semantic-success-text)", fontWeight: 600 }}>{selected.name} ({selected.email})</span>
        <button type="button" onClick={onClear}
          style={{ border: "none", background: "none", color: "var(--bad)", cursor: "pointer", fontSize: "0.78rem" }}>
          Lepas
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <input className="input" placeholder="Cari nama atau email user (min 2 huruf)..."
        value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%" }} />
      {search.length >= 2 && results && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "#1e293b", border: "1px solid #334155", borderRadius: 6, boxShadow: "0 8px 20px rgba(0,0,0,0.4)", maxHeight: 180, overflowY: "auto" }}>
          {results.data.length === 0 && <div style={{ padding: "0.5rem 0.7rem", color: "#64748b", fontSize: "0.78rem" }}>Tidak ditemukan.</div>}
          {results.data.map(u => (
            <button key={u.id} type="button" onClick={() => { onSelect(u); setSearch(""); }}
              style={{ display: "block", width: "100%", padding: "0.45rem 0.7rem", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: "0.8rem", color: "#f1f5f9" }}>
              {u.name} <span style={{ color: "#64748b" }}>({u.email})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Employee Detail Modal (Full Screen + Tabs) ─────────────────────────────
// Dirender sebagai halaman penuh DALAM layout app (header & sidebar tetap terlihat),
// bukan overlay fixed yang menutupi seluruh layar.
function EmployeeDetailModal({ employeeId, onClose }: { employeeId: number; onClose: () => void }) {
  const { data: employee, isLoading } = useEmployee(employeeId);
  const [tab, setTab] = useState<"general" | "family" | "riwayat_pendidikan" | "work_experience" | "skills" | "bpjs_tax" | "procurement">("general");

  // Tutup saat tombol Escape ditekan
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const tabs = [
    { key: "general" as const,              label: "Informasi Umum",     icon: <LayoutDashboard size={15} /> },
    { key: "family" as const,               label: "Data Keluarga",      icon: <Heart size={15} /> },
    { key: "riwayat_pendidikan" as const,   label: "Riwayat Pendidikan", icon: <GraduationCap size={15} /> },
    { key: "work_experience" as const,      label: "Pengalaman Kerja",   icon: <Briefcase size={15} /> },
    { key: "skills" as const,               label: "Skill",              icon: <Award size={15} /> },
    { key: "bpjs_tax" as const,             label: "BPJS & Pajak",       icon: <ShieldCheck size={15} /> },
    { key: "procurement" as const,          label: "Riwayat Pengadaan",  icon: <ShoppingCart size={15} /> },
  ];

  return (
    // min-h-screen agar konten pendek tetap mengisi viewport.
    // TIDAK menggunakan fixed/absolute inset-0 supaya header app & sidebar tetap terlihat.
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* ── PageHeader Banner (sama style dengan AttendanceReportPage) ────── */}
      <PageHeader
        title="Detail Pegawai"
        subtitle={
          employee
            ? `${employee.full_name} · Kode: ${employee.employee_number}${employee.nik ? ` · NIK: ${employee.nik}` : ""} · ${STATUS_LABELS[employee.employment_status] ?? employee.employment_status}`
            : "Memuat data profil lengkap pegawai…"
        }
      >
        <div className="flex items-center gap-2">
          {employee && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${
                employee.employment_status === "active"   ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30" :
                employee.employment_status === "probation"? "bg-amber-500/20  text-amber-200  border-amber-400/30"    :
                employee.employment_status === "on_leave" ? "bg-blue-500/20   text-blue-200   border-blue-400/30"     :
                "bg-rose-500/20 text-rose-200 border-rose-400/30"
              }`}>
                {STATUS_LABELS[employee.employment_status] ?? employee.employment_status}
              </span>
              <span className="text-xs px-3 py-1.5 rounded-xl bg-[#F2A602]/20 text-[#F2A602] font-semibold border border-[#F2A602]/30">
                {TYPE_LABELS[employee.employee_type as EmployeeType] ?? employee.employee_type}
              </span>
            </div>
          )}
        </div>
      </PageHeader>

      {/* ── Info Bar: Kembali ke Daftar (sama pola dengan Attendance Report) */}
      <div className="px-7 pt-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              onClick={onClose}
            >
              <ArrowLeft size={14} /> Kembali ke Daftar
            </button>
            {employee && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {employee.email && (
                  <span className="flex items-center gap-1"><Mail size={12} className="text-slate-400" />{employee.email}</span>
                )}
                {employee.phone && (
                  <span className="flex items-center gap-1 text-slate-300">·</span>
                )}
                {employee.phone && (
                  <span className="flex items-center gap-1"><Phone size={12} className="text-slate-400" />{employee.phone}</span>
                )}
                {employee.position?.position_title && (
                  <span className="flex items-center gap-1 text-slate-300">·</span>
                )}
                {employee.position?.position_title && (
                  <span className="flex items-center gap-1"><Briefcase size={12} className="text-slate-400" />{employee.position.position_title}</span>
                )}
              </div>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {employee ? (
              <span>Pegawai: <strong className="text-slate-900">{employee.full_name}</strong></span>
            ) : (
              <span className="text-slate-400">Memuat…</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/80 px-7 shadow-sm mt-4">
        <div className="max-w-6xl mx-auto w-full flex items-center gap-0.5 overflow-x-auto">
          {tabs.map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? "border-[#0A2140] text-[#0A2140]"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content Area ─────────────────────────────────────────────── */}
      <div className="px-7 py-5 flex flex-col gap-6">
        <div className="max-w-6xl mx-auto w-full">
          {isLoading && <LoadingState />}
          {employee && (
            <>
              {tab === "general"            && <GeneralInfoTab employee={employee} />}
              {tab === "family"             && <FamilyDataTab employeeId={employee.id} families={employee.family_members ?? employee.families ?? []} />}
              {tab === "riwayat_pendidikan" && <EducationHistoryTab employeeId={employee.id} educations={employee.educations ?? []} />}
              {tab === "work_experience"    && <WorkExperienceTab employeeId={employee.id} experiences={employee.work_experiences ?? []} />}
              {tab === "skills"             && <SkillsTab employeeId={employee.id} skills={employee.skills ?? []} />}
              {tab === "bpjs_tax"           && <BpjsTaxTab employee={employee} />}
              {tab === "procurement"        && <ProcurementHistoryTab employeeId={employee.id} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Informasi Umum ─────────────────────────────────────────────────────
function GeneralInfoTab({ employee }: { employee: Employee }) {
  function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className={`text-sm font-semibold text-slate-800 ${mono ? "font-mono" : ""}`}>
          {value || <span className="text-slate-400 font-normal">—</span>}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#0A2140] to-[#1e40af]" />
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <EmployeeAvatar photoFileId={employee.photo_file_id} name={employee.full_name} size={72} />
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{employee.full_name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold border border-slate-200" title="Kode Employee">
                Kode: {employee.employee_number}
              </span>
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200" title="NIK (Nomor Induk Kepegawaian)">
                NIK: {employee.nik || "Belum diisi"}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                employee.employment_status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                employee.employment_status === "probation" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                employee.employment_status === "on_leave" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {STATUS_LABELS[employee.employment_status] ?? employee.employment_status}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-[#F2A602]/10 text-amber-700 font-semibold border border-[#F2A602]/30">
                {TYPE_LABELS[employee.employee_type as EmployeeType] ?? employee.employee_type}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
              {employee.email && (
                <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> {employee.email}</span>
              )}
              {employee.phone && (
                <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> {employee.phone}</span>
              )}
              {employee.position?.position_title && (
                <span className="flex items-center gap-1.5"><Briefcase size={12} className="text-slate-400" /> {employee.position.position_title}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identitas Kepegawaian */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-[#0A2140]/10 flex items-center justify-center text-[#0A2140]">
              <BadgeCheck size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Identitas Kepegawaian</h4>
              <p className="text-xs text-slate-400">Status dan tipe hubungan kerja</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Kode Employee" value={employee.employee_number} mono />
            <InfoRow label="NIK (Nomor Induk Kepegawaian)" value={employee.nik ? `${employee.nik} 🔒` : null} mono />
            <InfoRow label="Tanggal Lahir" value={employee.birth_date ? formatDate(employee.birth_date) : null} />
            <InfoRow
              label="Jenis Kelamin"
              value={employee.gender ? (GENDER_LABELS[employee.gender] ?? employee.gender) : null}
            />
            <InfoRow label="Tanggal Masuk" value={employee.join_date ? formatDate(employee.join_date) : null} />
            <InfoRow
              label="Tanggal Selesai / Keluar"
              value={employee.exit_date ? formatDate(employee.exit_date) : null}
            />
            <InfoRow label="Status" value={STATUS_LABELS[employee.employment_status] ?? employee.employment_status} />
            <InfoRow label="Tipe Pegawai" value={TYPE_LABELS[employee.employee_type as EmployeeType] ?? employee.employee_type} />
          </div>
          {employee.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Catatan</span>
              <p className="text-xs text-slate-600 leading-relaxed">{employee.notes}</p>
            </div>
          )}
        </div>

        {/* Kontak & Alamat */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Phone size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Informasi Kontak &amp; Alamat</h4>
              <p className="text-xs text-slate-400">Saluran komunikasi serta alamat KTP &amp; domisili pegawai</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="Email" value={employee.email} />
            <InfoRow label="No. Telepon" value={employee.phone} />
          </div>
          <div className="grid grid-cols-1 gap-4 mt-4 pt-4 border-t border-slate-100">
            <InfoRow label="Alamat KTP" value={employee.ktp_address} />
            <InfoRow label="Alamat Domisili" value={employee.domicile_address} />
          </div>
        </div>

        {/* Posisi & Organisasi */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Building2 size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Posisi &amp; Struktur Organisasi</h4>
              <p className="text-xs text-slate-400">Jabatan, departemen, dan cost center</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <InfoRow label="Jabatan / Posisi" value={employee.position?.position_title} />
            <InfoRow label="Lokasi Kerja" value={
              employee.position?.work_location === "field" ? "Lapangan (Field)" :
              employee.position?.work_location === "office" ? "Kantor (Office)" : null
            } />
            <InfoRow label="Department" value={(employee as unknown as Record<string, {name?: string}>).department?.name} />
            <InfoRow label="Cost Center" value={(employee as unknown as Record<string, {name?: string}>).cost_center?.name} />
          </div>
        </div>

        {/* Akun & Akses Sistem */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-[#F2A602]/10 flex items-center justify-center text-[#F2A602]">
              <UserIcon size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Akun &amp; Akses Sistem</h4>
              <p className="text-xs text-slate-400">Integrasi akun login portal</p>
            </div>
          </div>
          {employee.user ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200/60">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                {employee.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-emerald-800">{employee.user.name}</div>
                <div className="text-xs text-emerald-600">{employee.user.email}</div>
              </div>
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Tertaut</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                <UserIcon size={16} />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Belum ditautkan ke akun user</div>
                <div className="text-xs text-slate-400">Gunakan modal Edit untuk menautkan akun</div>
              </div>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <InfoRow label="Foto Profil" value={employee.photo_file_id ? `File #${employee.photo_file_id}` : "Belum ada"} />
            <InfoRow label="Tanda Tangan" value={employee.signature_file_id ? `File #${employee.signature_file_id}` : "Belum ada"} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Data Keluarga ───────────────────────────────────────────────────────
const RELATIONSHIP_LABELS: Record<EmployeeFamily["relationship"], string> = {
  spouse: "Pasangan (Suami/Istri)",
  child: "Anak",
  parent: "Orang Tua",
  sibling: "Saudara Kandung",
  other: "Lainnya",
};

function FamilyDataTab({ employeeId, families }: { employeeId: number; families: EmployeeFamily[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<EmployeeFamily | null>(null);
  const [fullName, setFullName] = useState("");
  const [relationship, setRelationship] = useState<EmployeeFamily["relationship"]>("spouse");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [nik, setNik] = useState("");
  const [occupation, setOccupation] = useState("");
  const [phone, setPhone] = useState("");
  const [isDependent, setIsDependent] = useState(true);
  const [isEmergencyContact, setIsEmergencyContact] = useState(false);

  const createFamily = useCreateFamily();
  const updateFamily = useUpdateFamily();
  const deleteFamily = useDeleteFamily();

  function openCreate() {
    setEditItem(null);
    setFullName("");
    setRelationship("spouse");
    setBirthDate("");
    setGender("");
    setNik("");
    setOccupation("");
    setPhone("");
    setIsDependent(true);
    setIsEmergencyContact(false);
    setShowForm(true);
  }

  function openEdit(item: EmployeeFamily) {
    setEditItem(item);
    setFullName(item.full_name);
    setRelationship(item.relationship);
    setBirthDate(item.birth_date ? item.birth_date.slice(0, 10) : "");
    setGender(item.gender ?? "");
    setNik(item.nik ?? "");
    setOccupation(item.occupation ?? "");
    setPhone(item.phone ?? "");
    setIsDependent(Boolean(item.is_dependent));
    setIsEmergencyContact(Boolean(item.is_emergency_contact));
    setShowForm(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    const payload: Partial<EmployeeFamily> = {
      full_name: fullName.trim(),
      relationship,
      birth_date: birthDate || null,
      gender: (gender || null) as "male" | "female" | null,
      nik: nik || null,
      occupation: occupation || null,
      phone: phone || null,
      is_dependent: isDependent,
      is_emergency_contact: isEmergencyContact,
    };

    if (editItem) {
      updateFamily.mutate(
        { id: editItem.id, values: payload },
        {
          onSuccess: () => setShowForm(false),
          onError: err => alert("Gagal: " + extractErrorMessage(err)),
        }
      );
    } else {
      createFamily.mutate(
        { employeeId, values: payload },
        {
          onSuccess: () => setShowForm(false),
          onError: err => alert("Gagal: " + extractErrorMessage(err)),
        }
      );
    }
  }

  function handleDelete(item: EmployeeFamily) {
    if (!confirm(`Hapus anggota keluarga "${item.full_name}"?`)) return;
    deleteFamily.mutate(item.id, {
      onError: err => alert("Gagal: " + extractErrorMessage(err)),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3.5 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
            <Heart size={18} />
          </div>
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Data Keluarga &amp; Tanggungan:</strong>{" "}
            Digunakan untuk perhitungan tanggungan PTKP, BPJS keluarga, dan kontak darurat pegawai.
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm shrink-0"
        >
          <Plus size={13} /> Tambah Anggota Keluarga
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="text-sm font-bold text-slate-900">
            {editItem ? "Edit Anggota Keluarga" : "Tambah Anggota Keluarga Baru"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <F label="Nama Lengkap *" required>
              <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ width: "100%" }} />
            </F>
            <F label="Hubungan Keluarga *" required>
              <select className="input" value={relationship} onChange={e => setRelationship(e.target.value as EmployeeFamily["relationship"])} style={{ width: "100%" }}>
                {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </F>
            <F label="Tanggal Lahir">
              <input className="input" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} style={{ width: "100%" }} />
            </F>
            <F label="Jenis Kelamin">
              <select className="input" value={gender} onChange={e => setGender(e.target.value as "male" | "female" | "")} style={{ width: "100%" }}>
                <option value="">— Pilih —</option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </F>
            <F label="NIK">
              <input className="input" value={nik} onChange={e => setNik(e.target.value)} placeholder="16 digit NIK" style={{ width: "100%" }} />
            </F>
            <F label="No. Telepon">
              <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+62..." style={{ width: "100%" }} />
            </F>
            <F label="Pekerjaan">
              <input className="input" value={occupation} onChange={e => setOccupation(e.target.value)} style={{ width: "100%" }} />
            </F>
            <div className="flex items-center gap-4 pt-5 col-span-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={isDependent} onChange={e => setIsDependent(e.target.checked)} />
                Tanggungan PTKP / BPJS
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={isEmergencyContact} onChange={e => setIsEmergencyContact(e.target.checked)} />
                Kontak Darurat
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={createFamily.isPending || updateFamily.isPending}>
              {createFamily.isPending || updateFamily.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      )}

      {families.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm py-12">
          <EmptyState title="Belum Ada Data Keluarga" subtitle="Klik tombol Tambah Anggota Keluarga untuk mulai mengisi data tanggungan dan kontak darurat." />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {families.map(item => (
            <div key={item.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 flex justify-between items-start gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-[#F2A602] shrink-0">
                  <Heart size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{item.full_name}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {RELATIONSHIP_LABELS[item.relationship] ?? item.relationship}
                    </span>
                    {item.is_dependent && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Tanggungan
                      </span>
                    )}
                    {item.is_emergency_contact && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        Kontak Darurat
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-xs mt-1 flex flex-wrap gap-3">
                    {item.birth_date && <span>Lahir: {formatDate(item.birth_date)}</span>}
                    {item.nik && <span>NIK: {item.nik}</span>}
                    {item.occupation && <span>Pekerjaan: {item.occupation}</span>}
                    {item.phone && <span>Telp: {item.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Riwayat Pendidikan ──────────────────────────────────────────────────
const DEGREE_LEVELS: EmployeeEducation["degree_level"][] = [
  "SD", "SMP", "SMA/SMK", "D1", "D2", "D3", "D4", "S1", "S2", "S3", "Non-Formal",
];

function EducationHistoryTab({ employeeId, educations }: { employeeId: number; educations: EmployeeEducation[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<EmployeeEducation | null>(null);
  const [degreeLevel, setDegreeLevel] = useState<EmployeeEducation["degree_level"]>("S1");
  const [institutionName, setInstitutionName] = useState("");
  const [major, setMajor] = useState("");
  const [startYear, setStartYear] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [gpa, setGpa] = useState("");
  const [degreeTitle, setDegreeTitle] = useState("");

  const createEdu = useCreateEducation();
  const updateEdu = useUpdateEducation();
  const deleteEdu = useDeleteEducation();

  function openCreate() {
    setEditItem(null);
    setDegreeLevel("S1");
    setInstitutionName("");
    setMajor("");
    setStartYear("");
    setGraduationYear("");
    setGpa("");
    setDegreeTitle("");
    setShowForm(true);
  }

  function openEdit(item: EmployeeEducation) {
    setEditItem(item);
    setDegreeLevel(item.degree_level);
    setInstitutionName(item.institution_name);
    setMajor(item.major ?? "");
    setStartYear(item.start_year ? String(item.start_year) : "");
    setGraduationYear(item.graduation_year ? String(item.graduation_year) : "");
    setGpa(item.gpa ? String(item.gpa) : "");
    setDegreeTitle(item.degree_title ?? item.notes ?? "");
    setShowForm(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!institutionName.trim()) return;
    const payload: Partial<EmployeeEducation> = {
      degree_level: degreeLevel,
      institution_name: institutionName.trim(),
      major: major.trim() || null,
      start_year: startYear ? parseInt(startYear, 10) : null,
      graduation_year: graduationYear ? parseInt(graduationYear, 10) : null,
      gpa: gpa.trim() ? String(gpa).trim() : null,
      degree_title: degreeTitle.trim() || null,
      notes: degreeTitle.trim() || null,
    };

    if (editItem) {
      updateEdu.mutate(
        { id: editItem.id, values: payload },
        {
          onSuccess: () => setShowForm(false),
          onError: err => alert("Gagal: " + extractErrorMessage(err)),
        }
      );
    } else {
      createEdu.mutate(
        { employeeId, values: payload },
        {
          onSuccess: () => setShowForm(false),
          onError: err => alert("Gagal: " + extractErrorMessage(err)),
        }
      );
    }
  }

  function handleDelete(item: EmployeeEducation) {
    if (!confirm(`Hapus riwayat pendidikan di "${item.institution_name}"?`)) return;
    deleteEdu.mutate(item.id, {
      onError: err => alert("Gagal: " + extractErrorMessage(err)),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#0A2140] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3.5 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#0A2140]/10 text-[#0A2140] shrink-0">
            <GraduationCap size={18} />
          </div>
          <div className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Riwayat Pendidikan Pegawai:</strong>{" "}
            Data jenjang pendidikan formal maupun non-formal, institusi, jurusan, dan tahun kelulusan.
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm shrink-0"
        >
          <Plus size={13} /> Tambah Pendidikan
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="text-sm font-bold text-slate-900">
            {editItem ? "Edit Riwayat Pendidikan" : "Tambah Riwayat Pendidikan"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <F label="Jenjang *" required>
              <select className="input" value={degreeLevel} onChange={e => setDegreeLevel(e.target.value as EmployeeEducation["degree_level"])} style={{ width: "100%" }}>
                {DEGREE_LEVELS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </F>
            <F label="Nama Institusi / Universitas *" required>
              <input className="input" value={institutionName} onChange={e => setInstitutionName(e.target.value)} required style={{ width: "100%" }} />
            </F>
            <F label="Jurusan / Program Studi">
              <input className="input" value={major} onChange={e => setMajor(e.target.value)} style={{ width: "100%" }} />
            </F>
            <F label="Tahun Masuk">
              <input className="input" type="number" value={startYear} onChange={e => setStartYear(e.target.value)} placeholder="2018" style={{ width: "100%" }} />
            </F>
            <F label="Tahun Lulus">
              <input className="input" type="number" value={graduationYear} onChange={e => setGraduationYear(e.target.value)} placeholder="2022" style={{ width: "100%" }} />
            </F>
            <div className="grid grid-cols-2 gap-2">
              <F label="IPK / Nilai">
                <input className="input" type="text" value={gpa} onChange={e => setGpa(e.target.value)} placeholder="3.75" style={{ width: "100%" }} />
              </F>
              <F label="Gelar">
                <input className="input" value={degreeTitle} onChange={e => setDegreeTitle(e.target.value)} placeholder="S.Kom" style={{ width: "100%" }} />
              </F>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={createEdu.isPending || updateEdu.isPending}>
              {createEdu.isPending || updateEdu.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      )}

      {educations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm py-12">
          <EmptyState title="Belum Ada Riwayat Pendidikan" subtitle="Klik tombol Tambah Pendidikan untuk mencatat riwayat pendidikan pegawai." />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {educations.map(item => (
            <div key={item.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 flex justify-between items-start gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#0A2140] shrink-0">
                  <GraduationCap size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-[#0A2140] text-white">
                      {item.degree_level}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{item.institution_name}</span>
                    {(item.degree_title || item.notes) && (
                      <span className="text-xs font-semibold text-blue-700">({item.degree_title || item.notes})</span>
                    )}
                  </div>
                  <div className="text-slate-600 text-xs font-medium mt-1">
                    {item.major || "—"}
                  </div>
                  <div className="text-slate-400 text-xs mt-1 flex gap-3">
                    <span>Tahun: {item.start_year ?? "?"} — {item.graduation_year ?? "Sekarang"}</span>
                    {item.gpa && <span>IPK/Nilai: {item.gpa}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: BPJS & Pajak ──────────────────────────────────────────────────────
function BpjsTaxTab({ employee }: { employee: Employee }) {
  const empAny = employee as unknown as Record<string, unknown>;
  const bpjsKesehatanNo = employee.bpjs_kesehatan_number || (empAny.bpjs_kesehatan_no as string) || (empAny.bpjs_kesehatan as string) || null;
  const bpjsKesehatanStatus = employee.bpjs_kesehatan_status || (empAny.status_bpjs_kesehatan as string) || null;

  const bpjsTkNo = employee.bpjs_ketenagakerjaan_number || (empAny.bpjs_ketenagakerjaan_no as string) || (empAny.kpj as string) || (empAny.bpjs_tk as string) || null;
  const bpjsTkStatus = employee.bpjs_ketenagakerjaan_status || (empAny.status_bpjs_ketenagakerjaan as string) || null;

  const npwp = employee.npwp || (empAny.tax_number as string) || null;
  const ptkpStatus = employee.ptkp_status || (empAny.ptkp as string) || null;

  function InfoField({ label, value, hint, mono }: { label: string; value: string | null; hint?: string; mono?: boolean }) {
    return (
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">{label}</label>
        {value ? (
          <div className={`text-sm font-semibold text-slate-800 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/80 ${mono ? "font-mono tracking-wide" : ""}`}>
            {value}
          </div>
        ) : (
          <div className="text-slate-400 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between text-sm">
            <span>— Belum ada data —</span>
            {hint && <span className="text-[11px] text-slate-400 font-mono">{hint}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Banner Integrasi */}
      <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#F2A602] rounded-2xl p-4 shadow-sm flex items-start sm:items-center gap-3.5 text-xs text-slate-600">
        <div className="p-2 rounded-xl bg-amber-50 text-[#F2A602] shrink-0">
          <ShieldCheck size={18} />
        </div>
        <div className="leading-relaxed">
          <strong className="text-slate-900 font-semibold">Integrasi Jaminan Sosial &amp; Perpajakan:</strong> Informasi kepesertaan BPJS Kesehatan, BPJS Ketenagakerjaan, dan Pajak Penghasilan (PPh 21 / PTKP) terhubung dengan profil pegawai untuk keperluan administrasi dan penggajian.
        </div>
      </div>

      {/* Grid Informasi Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: BPJS Kesehatan */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">BPJS Kesehatan</h3>
                  <p className="text-xs text-slate-400">Jaminan Pemeliharaan Kesehatan</p>
                </div>
              </div>
              {bpjsKesehatanStatus ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {bpjsKesehatanStatus}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                  Belum Terdaftar
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <InfoField label="Nomor Peserta BPJS Kesehatan" value={bpjsKesehatanNo} hint="13 digit KIS" mono />
              <InfoField label="Status Kepesertaan" value={bpjsKesehatanStatus} />
              <InfoField label="Fasilitas Kesehatan Tingkat I" value={null} />
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Iuran ditanggung bersama perusahaan &amp; pekerja sesuai regulasi BPJS Kesehatan.
          </div>
        </div>

        {/* Card 2: BPJS Ketenagakerjaan */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">BPJS Ketenagakerjaan</h3>
                  <p className="text-xs text-slate-400">Jaminan Sosial Tenaga Kerja (KPJ)</p>
                </div>
              </div>
              {bpjsTkStatus ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {bpjsTkStatus}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                  Belum Terdaftar
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <InfoField label="Nomor Peserta (KPJ)" value={bpjsTkNo} hint="11 digit KPJ" mono />
              <InfoField label="Status Kepesertaan" value={bpjsTkStatus} />
              <InfoField label="Program Perlindungan" value={null} hint="JKK, JKM, JHT, JP" />
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Perlindungan kecelakaan kerja, kematian, hari tua, dan jaminan pensiun.
          </div>
        </div>

        {/* Card 3: Perpajakan */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F2A602] flex items-center justify-center border border-amber-100">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Perpajakan &amp; PTKP</h3>
                  <p className="text-xs text-slate-400">Pajak Penghasilan (PPh 21)</p>
                </div>
              </div>
              {npwp ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  NPWP Terdaftar
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                  Belum Ada NPWP
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <InfoField label="Nomor Pokok Wajib Pajak (NPWP)" value={npwp} hint="15/16 digit" mono />
              <InfoField label="Status PTKP" value={ptkpStatus} hint="TK/0, K/0, K/1, dll." />
              <InfoField label="Kategori TER PPh 21" value={null} />
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Dasar pemotongan PPh 21 bulanan sesuai tarif efektif rata-rata (TER).
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-center gap-3">
        <Info size={16} className="text-slate-400 shrink-0" />
        <span>
          Field data kepesertaan BPJS &amp; Perpajakan akan terisi otomatis saat integrasi master payroll dan biodata perpajakan karyawan diperbarui oleh tim HR.
        </span>
      </div>
    </div>
  );
}

// ─── Tab: Riwayat Pengadaan (Purchase Request yang pernah diajukan employee ini) ───
/** Cross-module: employee_id di sini adalah hr_employee.id, ditautkan
 * langsung ke proc_purchase_request.employee_id (bukan lewat users.id) -
 * lihat PurchaseRequestService::create() dan filter employee_id di
 * PurchaseRequestController::index(). Read-only - aksi (submit/batal/edit)
 * tetap lewat menu Procurement & Inventory > Purchase Request. */
function ProcurementHistoryTab({ employeeId }: { employeeId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["employee-purchase-requests", employeeId] as const,
    queryFn: () => apiClient
      .get<{ data: Array<{
        id: number; pr_number: string; purpose: string | null; status: string;
        created_at: string;
        lines?: Array<{ quantity: number; estimated_unit_price: number }>;
      }> }>("/v1/procurement-inventory/purchase-requests", { params: { employee_id: employeeId, per_page: 50 } })
      .then(r => r.data.data),
  });

  if (isLoading) return <LoadingState />;
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm py-14">
        <EmptyState title="Belum Ada Riwayat Pengadaan" subtitle="Employee ini belum pernah mengajukan Purchase Request." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-[#0A2140]" />
            <span className="text-sm font-bold text-slate-800">Riwayat Purchase Request</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">{data.length} transaksi</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80">
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">No. PR</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Keperluan</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Estimasi</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map(pr => {
                const total = (pr.lines ?? []).reduce((sum, l) => sum + Number(l.quantity) * Number(l.estimated_unit_price ?? 0), 0);
                const statusColor = pr.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  pr.status === "rejected" ? "bg-rose-50 text-rose-700 border-rose-200" :
                  pr.status === "submitted" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  pr.status === "converted_to_po" ? "bg-purple-50 text-purple-700 border-purple-200" :
                  "bg-slate-100 text-slate-600 border-slate-200";
                return (
                  <tr key={pr.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100 last:border-none">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-bold text-[#0A2140]">{pr.pr_number}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[200px]">
                      <span className="truncate block">{pr.purpose ?? "—"}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{formatDate(pr.created_at)}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-emerald-700 font-mono">{formatCurrency(total)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColor}`}>
                        {PR_STATUS_LABELS[pr.status] ?? pr.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Pengalaman Kerja (digunakan internal di Informasi Umum) ─────────────
function WorkExperienceTab({ employeeId, experiences }: { employeeId: number; experiences: WorkExperience[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editExp, setEditExp] = useState<WorkExperience | null>(null);
  const deleteExp = useDeleteWorkExperience();

  function handleDelete(exp: WorkExperience) {
    if (!confirm(`Hapus pengalaman kerja di "${exp.company_name}"?`)) return;
    deleteExp.mutate(exp.id, { onError: (e) => alert("Gagal: " + extractErrorMessage(e)) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm"
          onClick={() => setShowForm(true)}
        >
          <Plus size={13} /> Tambah Pengalaman
        </button>
      </div>

      {experiences.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm py-12">
          <EmptyState title="Belum Ada Pengalaman Kerja" subtitle="Tambahkan riwayat pengalaman kerja pegawai ini." />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {experiences.map(exp => (
          <div key={exp.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 flex justify-between items-start gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <Briefcase size={16} />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-sm">{exp.position_title}</div>
                <div className="text-slate-600 text-xs font-medium mt-0.5">{exp.company_name}</div>
                <div className="text-slate-400 text-xs mt-1">
                  {formatDate(exp.start_date)} — {exp.end_date ? formatDate(exp.end_date) : "Sekarang"}
                </div>
                {exp.description && (
                  <div className="text-slate-600 text-xs mt-2 leading-relaxed">{exp.description}</div>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                onClick={() => setEditExp(exp)}
              >Edit</button>
              <button
                className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                onClick={() => handleDelete(exp)}
              ><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && <WorkExperienceFormModal employeeId={employeeId} onClose={() => setShowForm(false)} />}
      {editExp && <WorkExperienceFormModal employeeId={employeeId} experience={editExp} onClose={() => setEditExp(null)} />}
    </div>
  );
}

function WorkExperienceFormModal({ employeeId, experience, onClose }: { employeeId: number; experience?: WorkExperience; onClose: () => void }) {
  const isEdit = !!experience;
  const [companyName, setCompanyName] = useState(experience?.company_name ?? "");
  const [positionTitle, setPositionTitle] = useState(experience?.position_title ?? "");
  const [startDate, setStartDate] = useState(experience?.start_date?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(experience?.end_date?.slice(0, 10) ?? "");
  const [description, setDescription] = useState(experience?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const createExp = useCreateWorkExperience();
  const updateExp = useUpdateWorkExperience();
  const pending = createExp.isPending || updateExp.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !positionTitle.trim() || !startDate) { setError("Nama perusahaan, posisi, dan tanggal mulai wajib diisi."); return; }
    setError(null);

    const values = {
      company_name: companyName.trim(), position_title: positionTitle.trim(),
      start_date: startDate, end_date: endDate || undefined, description: description.trim() || undefined,
    };

    if (isEdit) {
      updateExp.mutate({ id: experience.id, values }, { onSuccess: onClose, onError: (e) => setError(extractErrorMessage(e)) });
    } else {
      createExp.mutate({ employeeId, values }, { onSuccess: onClose, onError: (e) => setError(extractErrorMessage(e)) });
    }
  }

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(15,23,42,0.85)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: "1.5rem",
        width: "100%", maxWidth: 480, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.9)",
      }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#f1f5f9", marginBottom: "1rem" }}>
          {isEdit ? "Edit Pengalaman Kerja" : "Tambah Pengalaman Kerja"}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <F label="Nama Perusahaan" required>
            <input className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ width: "100%" }} />
          </F>
          <F label="Posisi / Jabatan" required>
            <input className="input" value={positionTitle} onChange={e => setPositionTitle(e.target.value)} style={{ width: "100%" }} />
          </F>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <F label="Tanggal Mulai" required>
              <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: "100%" }} />
            </F>
            <F label="Tanggal Selesai">
              <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: "100%" }} />
            </F>
          </div>
          <F label="Deskripsi">
            <textarea className="input" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Tanggung jawab, pencapaian, dll..." style={{ width: "100%", minHeight: 60, resize: "vertical" }} />
          </F>

          {error && <div style={{ color: "#ef4444", fontSize: "0.8rem" }}>{error}</div>}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4, paddingTop: 8, borderTop: "1px solid #334155" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tab: Skill ───────────────────────────────────────────────────────────
function SkillsTab({ employeeId, skills }: { employeeId: number; skills: Skill[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editSkill, setEditSkill] = useState<Skill | null>(null);
  const deleteSkill = useDeleteSkill();

  const PROFICIENCY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    beginner:     { bg: "bg-slate-100",   text: "text-slate-600",   border: "border-slate-200" },
    intermediate: { bg: "bg-blue-50",     text: "text-blue-700",   border: "border-blue-200" },
    advanced:     { bg: "bg-[#0A2140]/10",text: "text-[#0A2140]",  border: "border-[#0A2140]/20" },
    expert:       { bg: "bg-[#F2A602]/10",text: "text-amber-700",  border: "border-[#F2A602]/30" },
  };

  function handleDelete(skill: Skill) {
    if (!confirm(`Hapus skill "${skill.skill_name}"?`)) return;
    deleteSkill.mutate(skill.id, { onError: (e) => alert("Gagal: " + extractErrorMessage(e)) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm"
          onClick={() => setShowForm(true)}
        >
          <Plus size={13} /> Tambah Skill
        </button>
      </div>

      {skills.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm py-12">
          <EmptyState title="Belum Ada Skill" subtitle="Tambahkan kompetensi dan skill pegawai ini." />
        </div>
      )}

      {skills.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {skills.map(s => {
            const clr = PROFICIENCY_COLORS[s.proficiency_level] ?? PROFICIENCY_COLORS.beginner;
            return (
              <div key={s.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Award size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">{s.skill_name}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${clr.bg} ${clr.text} ${clr.border}`}>
                      {PROFICIENCY_LABELS[s.proficiency_level]}
                    </span>
                    {s.years_of_experience !== null && (
                      <span className="text-xs text-slate-400">{s.years_of_experience} thn</span>
                    )}
                  </div>
                  {s.notes && (
                    <div className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{s.notes}</div>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    onClick={() => setEditSkill(s)}
                  >Edit</button>
                  <button
                    className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center"
                    onClick={() => handleDelete(s)}
                  ><Trash2 size={12} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <SkillFormModal employeeId={employeeId} onClose={() => setShowForm(false)} />}
      {editSkill && <SkillFormModal employeeId={employeeId} skill={editSkill} onClose={() => setEditSkill(null)} />}
    </div>
  );
}

function SkillFormModal({ employeeId, skill, onClose }: { employeeId: number; skill?: Skill; onClose: () => void }) {
  const isEdit = !!skill;
  const [skillName, setSkillName] = useState(skill?.skill_name ?? "");
  const [proficiency, setProficiency] = useState<ProficiencyLevel>(skill?.proficiency_level ?? "intermediate");
  const [years, setYears] = useState(skill?.years_of_experience !== null && skill?.years_of_experience !== undefined ? String(skill.years_of_experience) : "");
  const [notes, setNotes] = useState(skill?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const pending = createSkill.isPending || updateSkill.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!skillName.trim()) { setError("Nama skill wajib diisi."); return; }
    setError(null);

    const values = {
      skill_name: skillName.trim(), proficiency_level: proficiency,
      years_of_experience: years ? parseInt(years) : undefined, notes: notes.trim() || undefined,
    };

    if (isEdit) {
      updateSkill.mutate({ id: skill.id, values }, { onSuccess: onClose, onError: (e) => setError(extractErrorMessage(e)) });
    } else {
      createSkill.mutate({ employeeId, values }, { onSuccess: onClose, onError: (e) => setError(extractErrorMessage(e)) });
    }
  }

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(15,23,42,0.85)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: "1.5rem",
        width: "100%", maxWidth: 420, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.9)",
      }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#f1f5f9", marginBottom: "1rem" }}>
          {isEdit ? "Edit Skill" : "Tambah Skill"}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <F label="Nama Skill" required>
            <input className="input" value={skillName} onChange={e => setSkillName(e.target.value)}
              placeholder="mis. Cisco Routing, Laravel" style={{ width: "100%" }} />
          </F>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <F label="Level">
              <select className="input" value={proficiency} onChange={e => setProficiency(e.target.value as ProficiencyLevel)} style={{ width: "100%" }}>
                {Object.entries(PROFICIENCY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </F>
            <F label="Lama Pengalaman (thn)">
              <input className="input" type="number" min={0} max={60} value={years} onChange={e => setYears(e.target.value)} style={{ width: "100%" }} />
            </F>
          </div>
          <F label="Catatan">
            <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} style={{ width: "100%", minHeight: 50, resize: "vertical" }} />
          </F>

          {error && <div style={{ color: "#ef4444", fontSize: "0.8rem" }}>{error}</div>}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4, paddingTop: 8, borderTop: "1px solid #334155" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
