import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Employee, EmployeeListParams, EmployeeStats, WorkExperience, Skill, EmployeeFamily, EmployeeEducation } from "../types/employee";

const BASE = "/v1/hr-service-support";
const EMP_META_STORAGE_KEY = "msdc_hr_employee_meta_v1";
const META_REGEX = /\n?<!--HR_META:(\{[\s\S]*?\})-->\s*$/;

interface EmployeeExtraMeta {
  nik?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  ktp_address?: string | null;
  domicile_address?: string | null;
  join_date?: string | null;
  exit_date?: string | null;
  employee_type?: Employee["employee_type"] | null;
  bpjs_kesehatan_number?: string | null;
  bpjs_kesehatan_status?: string | null;
  bpjs_ketenagakerjaan_number?: string | null;
  bpjs_ketenagakerjaan_status?: string | null;
  npwp?: string | null;
  ptkp_status?: string | null;
  _cleanNotes?: string | null;
}

function readLocalMetaMap(): Record<number, EmployeeExtraMeta> {
  try {
    const raw = localStorage.getItem(EMP_META_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalMeta(empId: number, meta: EmployeeExtraMeta) {
  try {
    const map = readLocalMetaMap();
    map[empId] = { ...(map[empId] || {}), ...meta };
    localStorage.setItem(EMP_META_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

function parseNotesMeta(rawNotes?: string | null): { cleanNotes: string | null; meta: EmployeeExtraMeta } {
  if (!rawNotes) return { cleanNotes: null, meta: {} };
  const match = rawNotes.match(META_REGEX);
  if (!match) {
    return { cleanNotes: rawNotes, meta: {} };
  }
  const clean = rawNotes.replace(META_REGEX, "").trim();
  try {
    const parsed = JSON.parse(match[1]) as EmployeeExtraMeta;
    return { cleanNotes: clean || null, meta: parsed || {} };
  } catch {
    return { cleanNotes: clean || null, meta: {} };
  }
}

function packNotesWithMeta(cleanNotes: string | null | undefined, meta: EmployeeExtraMeta): string | null {
  const payloadMeta: Record<string, string> = {};
  const keys: (keyof Omit<EmployeeExtraMeta, "_cleanNotes">)[] = [
    "nik",
    "birth_date",
    "gender",
    "ktp_address",
    "domicile_address",
    "join_date",
    "exit_date",
    "employee_type",
    "bpjs_kesehatan_number",
    "bpjs_kesehatan_status",
    "bpjs_ketenagakerjaan_number",
    "bpjs_ketenagakerjaan_status",
    "npwp",
    "ptkp_status",
  ];
  for (const k of keys) {
    const val = meta[k];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      payloadMeta[k] = String(val).trim();
    }
  }
  const baseText = (cleanNotes ?? "").replace(META_REGEX, "").trim();
  if (Object.keys(payloadMeta).length === 0) {
    return baseText || null;
  }
  const tag = `<!--HR_META:${JSON.stringify(payloadMeta)}-->`;
  return baseText ? `${baseText}\n${tag}` : tag;
}

function unpackEmployee(emp: Employee): Employee {
  if (!emp) return emp;
  const { cleanNotes, meta: notesMeta } = parseNotesMeta(emp.notes);
  const localMap = readLocalMetaMap();
  const localMeta = localMap[emp.id] || {};

  // Untuk employee_type & join_date: utamakan hasil edit (notesMeta / localMeta),
  // dan jika belum pernah diedit, ambil langsung dari kolom asli database (emp.employee_type / emp.join_date).
  const editedEmployeeType = notesMeta.employee_type || localMeta.employee_type || undefined;
  const resolvedEmployeeType =
    (editedEmployeeType || emp.employee_type || "permanent") as Employee["employee_type"];

  const editedJoinDate = notesMeta.join_date || localMeta.join_date || undefined;
  const resolvedJoinDate =
    editedJoinDate || emp.join_date || null;

  const mergedMeta: EmployeeExtraMeta = {
    nik: emp.nik || notesMeta.nik || localMeta.nik || null,
    birth_date: emp.birth_date || notesMeta.birth_date || localMeta.birth_date || null,
    gender: emp.gender || notesMeta.gender || localMeta.gender || null,
    ktp_address: emp.ktp_address || notesMeta.ktp_address || localMeta.ktp_address || null,
    domicile_address: emp.domicile_address || notesMeta.domicile_address || localMeta.domicile_address || null,
    join_date: editedJoinDate ?? null,
    exit_date: emp.exit_date || notesMeta.exit_date || localMeta.exit_date || null,
    employee_type: editedEmployeeType ?? null,
    bpjs_kesehatan_number: emp.bpjs_kesehatan_number || notesMeta.bpjs_kesehatan_number || localMeta.bpjs_kesehatan_number || null,
    bpjs_kesehatan_status: emp.bpjs_kesehatan_status || notesMeta.bpjs_kesehatan_status || localMeta.bpjs_kesehatan_status || null,
    bpjs_ketenagakerjaan_number: emp.bpjs_ketenagakerjaan_number || notesMeta.bpjs_ketenagakerjaan_number || localMeta.bpjs_ketenagakerjaan_number || null,
    bpjs_ketenagakerjaan_status: emp.bpjs_ketenagakerjaan_status || notesMeta.bpjs_ketenagakerjaan_status || localMeta.bpjs_ketenagakerjaan_status || null,
    npwp: emp.npwp || notesMeta.npwp || localMeta.npwp || null,
    ptkp_status: emp.ptkp_status || notesMeta.ptkp_status || localMeta.ptkp_status || null,
    _cleanNotes: cleanNotes,
  };

  if (emp.id) {
    writeLocalMeta(emp.id, mergedMeta);
  }

  return {
    ...emp,
    notes: cleanNotes,
    nik: mergedMeta.nik ?? null,
    birth_date: mergedMeta.birth_date ?? null,
    gender: mergedMeta.gender ?? null,
    ktp_address: mergedMeta.ktp_address ?? null,
    domicile_address: mergedMeta.domicile_address ?? null,
    join_date: resolvedJoinDate,
    exit_date: mergedMeta.exit_date ?? null,
    employee_type: resolvedEmployeeType,
    bpjs_kesehatan_number: mergedMeta.bpjs_kesehatan_number ?? null,
    bpjs_kesehatan_status: mergedMeta.bpjs_kesehatan_status ?? null,
    bpjs_ketenagakerjaan_number: mergedMeta.bpjs_ketenagakerjaan_number ?? null,
    bpjs_ketenagakerjaan_status: mergedMeta.bpjs_ketenagakerjaan_status ?? null,
    npwp: mergedMeta.npwp ?? null,
    ptkp_status: mergedMeta.ptkp_status ?? null,
  };
}

export const employeeApi = {
  async list(params: EmployeeListParams) {
    const res = await apiClient.get<PaginatedResponse<Employee>>(`${BASE}/employees`, { params });
    if (res.data?.data && Array.isArray(res.data.data)) {
      res.data.data = res.data.data.map(unpackEmployee);
    }
    return res;
  },
  stats() {
    return apiClient.get<{ data: EmployeeStats }>(`${BASE}/employees/stats`);
  },
  async show(id: number) {
    const res = await apiClient.get<{ data: Employee }>(`${BASE}/employees/${id}`);
    if (res.data?.data) {
      res.data.data = unpackEmployee(res.data.data);
    }
    return res;
  },
  async create(values: Partial<Employee>) {
    const meta: EmployeeExtraMeta = {
      nik: values.nik ?? null,
      birth_date: values.birth_date ?? null,
      gender: values.gender ?? null,
      ktp_address: values.ktp_address ?? null,
      domicile_address: values.domicile_address ?? null,
      join_date: values.join_date ?? null,
      exit_date: values.exit_date ?? null,
      employee_type: values.employee_type ?? null,
      bpjs_kesehatan_number: values.bpjs_kesehatan_number ?? null,
      bpjs_kesehatan_status: values.bpjs_kesehatan_status ?? null,
      bpjs_ketenagakerjaan_number: values.bpjs_ketenagakerjaan_number ?? null,
      bpjs_ketenagakerjaan_status: values.bpjs_ketenagakerjaan_status ?? null,
      npwp: values.npwp ?? null,
      ptkp_status: values.ptkp_status ?? null,
    };
    const packedNotes = packNotesWithMeta(values.notes, meta);
    const fullPayload: Record<string, unknown> = {
      ...values,
      notes: packedNotes,
    };
    if (!values.nik || String(values.nik).trim().length !== 16) {
      delete fullPayload.nik;
    }

    let res;
    try {
      res = await apiClient.post<ApiMessageResponse<Employee>>(`${BASE}/employees`, fullPayload);
    } catch {
      const compatiblePayload: Record<string, unknown> = { ...fullPayload };
      delete compatiblePayload.nik;
      delete compatiblePayload.birth_date;
      delete compatiblePayload.gender;
      delete compatiblePayload.ktp_address;
      delete compatiblePayload.domicile_address;
      delete compatiblePayload.exit_date;
      res = await apiClient.post<ApiMessageResponse<Employee>>(`${BASE}/employees`, compatiblePayload);
    }

    if (res.data?.data) {
      writeLocalMeta(res.data.data.id, { ...meta, _cleanNotes: values.notes ?? null });
      res.data.data = unpackEmployee({
        ...res.data.data,
        ...meta,
        join_date: meta.join_date ?? res.data.data.join_date,
        employee_type: meta.employee_type ?? res.data.data.employee_type,
      });
    }
    return res;
  },
  async update(id: number, values: Partial<Employee>) {
    const existing = readLocalMetaMap()[id] || {};
    const mergedMeta: EmployeeExtraMeta = {
      nik: values.nik !== undefined ? values.nik : existing.nik,
      birth_date: values.birth_date !== undefined ? values.birth_date : existing.birth_date,
      gender: values.gender !== undefined ? values.gender : existing.gender,
      ktp_address: values.ktp_address !== undefined ? values.ktp_address : existing.ktp_address,
      domicile_address: values.domicile_address !== undefined ? values.domicile_address : existing.domicile_address,
      join_date: values.join_date !== undefined ? values.join_date : existing.join_date,
      exit_date: values.exit_date !== undefined ? values.exit_date : existing.exit_date,
      employee_type: values.employee_type !== undefined ? values.employee_type : existing.employee_type,
      bpjs_kesehatan_number: values.bpjs_kesehatan_number !== undefined ? values.bpjs_kesehatan_number : existing.bpjs_kesehatan_number,
      bpjs_kesehatan_status: values.bpjs_kesehatan_status !== undefined ? values.bpjs_kesehatan_status : existing.bpjs_kesehatan_status,
      bpjs_ketenagakerjaan_number: values.bpjs_ketenagakerjaan_number !== undefined ? values.bpjs_ketenagakerjaan_number : existing.bpjs_ketenagakerjaan_number,
      bpjs_ketenagakerjaan_status: values.bpjs_ketenagakerjaan_status !== undefined ? values.bpjs_ketenagakerjaan_status : existing.bpjs_ketenagakerjaan_status,
      npwp: values.npwp !== undefined ? values.npwp : existing.npwp,
      ptkp_status: values.ptkp_status !== undefined ? values.ptkp_status : existing.ptkp_status,
    };
    const cleanNotes = values.notes !== undefined
      ? parseNotesMeta(values.notes).cleanNotes
      : (existing._cleanNotes ?? null);
    const packedNotes = packNotesWithMeta(cleanNotes, mergedMeta);

    const fullPayload: Record<string, unknown> = {
      ...values,
      notes: packedNotes,
    };
    if (!values.nik || String(values.nik).trim().length !== 16) {
      delete fullPayload.nik;
    }

    const compatiblePayload: Record<string, unknown> = { ...fullPayload };
    delete compatiblePayload.nik;
    delete compatiblePayload.birth_date;
    delete compatiblePayload.gender;
    delete compatiblePayload.ktp_address;
    delete compatiblePayload.domicile_address;
    delete compatiblePayload.exit_date;

    const minimalPayload: Record<string, unknown> = { ...compatiblePayload };
    delete minimalPayload.user_id;

    let res;
    try {
      res = await apiClient.put<ApiMessageResponse<Employee>>(`${BASE}/employees/${id}`, fullPayload);
    } catch {
      try {
        res = await apiClient.put<ApiMessageResponse<Employee>>(`${BASE}/employees/${id}`, compatiblePayload);
      } catch {
        res = await apiClient.put<ApiMessageResponse<Employee>>(`${BASE}/employees/${id}`, minimalPayload);
      }
    }

    if (values.employment_status) {
      try {
        await apiClient.post<ApiMessageResponse<Employee>>(`${BASE}/employees/${id}/employment-status`, {
          status: values.employment_status,
        });
      } catch {
        // Abaikan jika sudah terupdate lewat PUT
      }
    }

    writeLocalMeta(id, { ...mergedMeta, _cleanNotes: cleanNotes });

    if (res.data?.data) {
      res.data.data = unpackEmployee({
        ...res.data.data,
        ...mergedMeta,
        employment_status: values.employment_status ?? res.data.data.employment_status,
        join_date: mergedMeta.join_date ?? res.data.data.join_date,
        employee_type: mergedMeta.employee_type ?? res.data.data.employee_type,
      });
    }
    return res;
  },
  /** Key body HARUS "status" - EmployeeController::setEmploymentStatus()
   * validasi 'status' => ['required',...], BUKAN 'employment_status'
   * (sebelumnya salah kirim key, jadi request ini selalu gagal 422 kalau
   * dipanggil - hook-nya juga belum pernah benar-benar dipakai di UI). */
  async setStatus(id: number, status: string) {
    const res = await apiClient.post<ApiMessageResponse<Employee>>(`${BASE}/employees/${id}/employment-status`, { status });
    if (res.data?.data) {
      res.data.data = unpackEmployee(res.data.data);
    }
    return res;
  },
  /** Content-Type SENGAJA tidak di-set manual - axios otomatis pakai
   * multipart/form-data dengan boundary yang benar begitu body-nya FormData,
   * override manual di sini malah bisa bikin boundary hilang & request gagal. */
  async uploadPhoto(id: number, file: File) {
    const form = new FormData();
    form.append("photo", file);
    const res = await apiClient.post<ApiMessageResponse<Employee>>(`${BASE}/employees/${id}/photo`, form);
    if (res.data?.data) {
      res.data.data = unpackEmployee(res.data.data);
    }
    return res;
  },
  /** Gambar tanda tangan - dipakai cetak PDF PO/PR/FPP (ProcurementInventory).
   * WorkflowEngineService::assertSignatureUploaded() MEWAJIBKAN ini terisi
   * sebelum employee bisa approve dokumen Procurement apapun. */
  async uploadSignature(id: number, file: File) {
    const form = new FormData();
    form.append("signature", file);
    const res = await apiClient.post<ApiMessageResponse<Employee>>(`${BASE}/employees/${id}/signature`, form);
    if (res.data?.data) {
      res.data.data = unpackEmployee(res.data.data);
    }
    return res;
  },

  // Pengalaman Kerja
  createWorkExperience(employeeId: number, values: { company_name: string; position_title: string; start_date: string; end_date?: string; description?: string }) {
    return apiClient.post<ApiMessageResponse<WorkExperience>>(`${BASE}/employees/${employeeId}/work-experiences`, values);
  },
  updateWorkExperience(id: number, values: { company_name: string; position_title: string; start_date: string; end_date?: string; description?: string }) {
    return apiClient.put<ApiMessageResponse<WorkExperience>>(`${BASE}/work-experiences/${id}`, values);
  },
  deleteWorkExperience(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/work-experiences/${id}`);
  },

  // Skill
  createSkill(employeeId: number, values: { skill_name: string; proficiency_level?: string; years_of_experience?: number; notes?: string }) {
    return apiClient.post<ApiMessageResponse<Skill>>(`${BASE}/employees/${employeeId}/skills`, values);
  },
  updateSkill(id: number, values: { skill_name: string; proficiency_level?: string; years_of_experience?: number; notes?: string }) {
    return apiClient.put<ApiMessageResponse<Skill>>(`${BASE}/skills/${id}`, values);
  },
  deleteSkill(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/skills/${id}`);
  },

  // Data Keluarga
  createFamily(employeeId: number, values: Partial<EmployeeFamily>) {
    return apiClient.post<ApiMessageResponse<EmployeeFamily>>(`${BASE}/employees/${employeeId}/family-members`, values);
  },
  updateFamily(id: number, values: Partial<EmployeeFamily>) {
    return apiClient.put<ApiMessageResponse<EmployeeFamily>>(`${BASE}/family-members/${id}`, values);
  },
  deleteFamily(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/family-members/${id}`);
  },

  // Riwayat Pendidikan
  createEducation(employeeId: number, values: Partial<EmployeeEducation>) {
    const payload = {
      ...values,
      gpa: values.gpa !== undefined && values.gpa !== null && String(values.gpa).trim() !== ""
        ? String(values.gpa).trim()
        : null,
    };
    return apiClient.post<ApiMessageResponse<EmployeeEducation>>(`${BASE}/employees/${employeeId}/educations`, payload);
  },
  updateEducation(id: number, values: Partial<EmployeeEducation>) {
    const payload = {
      ...values,
      gpa: values.gpa !== undefined && values.gpa !== null && String(values.gpa).trim() !== ""
        ? String(values.gpa).trim()
        : null,
    };
    return apiClient.put<ApiMessageResponse<EmployeeEducation>>(`${BASE}/educations/${id}`, payload);
  },
  deleteEducation(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/educations/${id}`);
  },
};
