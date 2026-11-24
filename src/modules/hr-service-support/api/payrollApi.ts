import { apiClient } from "@shared/lib/api-client";
import { fileApi, createFileUploadIdempotencyKey } from "@shared/api/fileApi";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { PayrollRecord, PayrollListParams, EmployeeSalary, EmployeeSalaryListParams } from "../types/payroll";
import type { Employee } from "../types/employee";
import { calculateMonthlyPayrollDeductions } from "../lib/indonesianTax";

const BASE = "/v1/hr-service-support";
export const PR_META_STORAGE_KEY = "msdc_hr_payroll_meta_v1";
export const TAX_CERT_STORAGE_KEY = "msdc_hr_tax_cert_meta_v1";
const EMP_META_STORAGE_KEY = "msdc_hr_employee_meta_v1";
export const PR_META_REGEX = /\n?<!--PR_META:(\{[\s\S]*?\})-->\s*$/;

export interface AnnualTaxCertificateMeta {
  file_id: number;
  file_name: string;
  uploaded_at: string;
  mime_type?: string | null;
}

export interface PayrollStoredMeta {
  ptkp_status?: string | null;
  ter_category?: "A" | "B" | "C" | null;
  ter_rate?: number | null;
  bpjs_kesehatan_deduction?: number | null;
  bpjs_jht_deduction?: number | null;
  bpjs_jp_deduction?: number | null;
  bpjs_ketenagakerjaan_deduction?: number | null;
  bpjs_deduction?: number | null;
  pph21_deduction?: number | null;
  kasbon_installment?: number | null;
  total_deduction?: number | null;
  net_amount?: number | null;
  calculated_at?: string | null;
  submitted_to_finance?: boolean;
  submitted_at?: string | null;
  tax_certificate_file_id?: number | null;
  tax_certificate_file_name?: string | null;
  tax_certificate_uploaded_at?: string | null;
  _cleanNotes?: string | null;
}

export function readAnnualTaxCertificateMap(): Record<string, AnnualTaxCertificateMeta> {
  try {
    const raw = localStorage.getItem(TAX_CERT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function readAnnualTaxCertificateMeta(employeeId: number, year: number): AnnualTaxCertificateMeta | null {
  const map = readAnnualTaxCertificateMap();
  return map[`${employeeId}_${year}`] ?? null;
}

export function writeAnnualTaxCertificateMeta(employeeId: number, year: number, meta: AnnualTaxCertificateMeta) {
  try {
    const map = readAnnualTaxCertificateMap();
    map[`${employeeId}_${year}`] = meta;
    localStorage.setItem(TAX_CERT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function deleteAnnualTaxCertificateMeta(employeeId: number, year: number) {
  try {
    const map = readAnnualTaxCertificateMap();
    delete map[`${employeeId}_${year}`];
    localStorage.setItem(TAX_CERT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function readPayrollMetaMap(): Record<number, PayrollStoredMeta> {
  try {
    const raw = localStorage.getItem(PR_META_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writePayrollMeta(id: number, meta: PayrollStoredMeta) {
  try {
    const map = readPayrollMetaMap();
    map[id] = { ...(map[id] || {}), ...meta };
    localStorage.setItem(PR_META_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

function readEmployeeMetaMap(): Record<number, Partial<Employee>> {
  try {
    const raw = localStorage.getItem(EMP_META_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function parsePayrollNotesMeta(rawNotes?: string | null): { cleanNotes: string | null; meta: PayrollStoredMeta } {
  if (!rawNotes) return { cleanNotes: null, meta: {} };
  const match = rawNotes.match(PR_META_REGEX);
  if (!match) return { cleanNotes: rawNotes, meta: {} };
  const clean = rawNotes.replace(PR_META_REGEX, "").trim();
  try {
    return { cleanNotes: clean || null, meta: JSON.parse(match[1]) || {} };
  } catch {
    return { cleanNotes: clean || null, meta: {} };
  }
}

function packPayrollNotesWithMeta(cleanNotes: string | null | undefined, meta: PayrollStoredMeta): string | null {
  const baseText = (cleanNotes ?? "").replace(PR_META_REGEX, "").trim();
  const payloadMeta: Record<string, unknown> = {};
  const keys: (keyof Omit<PayrollStoredMeta, "_cleanNotes">)[] = [
    "ptkp_status",
    "ter_category",
    "ter_rate",
    "bpjs_kesehatan_deduction",
    "bpjs_jht_deduction",
    "bpjs_jp_deduction",
    "bpjs_ketenagakerjaan_deduction",
    "bpjs_deduction",
    "pph21_deduction",
    "kasbon_installment",
    "total_deduction",
    "net_amount",
    "calculated_at",
    "submitted_to_finance",
    "submitted_at",
    "tax_certificate_file_id",
    "tax_certificate_file_name",
    "tax_certificate_uploaded_at",
  ];
  for (const k of keys) {
    if (meta[k] !== undefined && meta[k] !== null) {
      payloadMeta[k] = meta[k];
    }
  }
  if (Object.keys(payloadMeta).length === 0) {
    return baseText || null;
  }
  const tag = `<!--PR_META:${JSON.stringify(payloadMeta)}-->`;
  return baseText ? `${baseText}\n${tag}` : tag;
}

/**
 * Enrich PayrollRecord dengan perhitungan otomatis BPJS & PPh 21 sesuai
 * PP 58/2023 & PMK 168/2023 berdasarkan data asli database karyawan & payroll.
 * PENTING: status 'sent_to_finance' HANYA berasal dari backend ketika sudah
 * diposting oleh Finance lewat menu HR Integration. Saat HR klik "Ajukan ke Finance",
 * yang berubah adalah flag `submitted_to_finance = true` agar masuk antrean HR Integration!
 */
export function enrichPayrollRecord(record: PayrollRecord, employeeOverride?: Partial<Employee> | null): PayrollRecord {
  if (!record) return record;

  const { cleanNotes, meta: notesMeta } = parsePayrollNotesMeta(record.notes);
  const localPrMeta = readPayrollMetaMap()[record.id] || {};
  const localEmpMeta = readEmployeeMetaMap()[record.employee_id] || {};
  const annualCertMeta = readAnnualTaxCertificateMeta(record.employee_id, record.period_year);

  const mergedEmployee: Partial<Employee> = {
    ...localEmpMeta,
    ...(record.employee || {}),
    ...(employeeOverride || {}),
  };

  const kasbonVal =
    Number(record.kasbon_installment ?? notesMeta.kasbon_installment ?? localPrMeta.kasbon_installment ?? 0) || 0;

  const calc = calculateMonthlyPayrollDeductions(
    {
      base_salary: record.base_salary,
      meal_allowance: record.meal_allowance,
      overtime_amount: record.overtime_amount,
      kasbon_installment: String(kasbonVal),
      ptkp_status: record.ptkp_status ?? notesMeta.ptkp_status ?? localPrMeta.ptkp_status ?? mergedEmployee.ptkp_status,
    },
    mergedEmployee
  );

  const isSubmittedToFinance = Boolean(
    record.status === "sent_to_finance" ||
      record.submitted_to_finance ||
      notesMeta.submitted_to_finance ||
      localPrMeta.submitted_to_finance
  );

  const submittedAt =
    record.submitted_at || notesMeta.submitted_at || localPrMeta.submitted_at || record.sent_at || null;

  const taxCertFileId =
    record.tax_certificate_file_id ??
    notesMeta.tax_certificate_file_id ??
    localPrMeta.tax_certificate_file_id ??
    annualCertMeta?.file_id ??
    null;

  const taxCertFileName =
    record.tax_certificate_file_name ??
    notesMeta.tax_certificate_file_name ??
    localPrMeta.tax_certificate_file_name ??
    annualCertMeta?.file_name ??
    null;

  const taxCertUploadedAt =
    record.tax_certificate_uploaded_at ??
    notesMeta.tax_certificate_uploaded_at ??
    localPrMeta.tax_certificate_uploaded_at ??
    annualCertMeta?.uploaded_at ??
    null;

  if (taxCertFileId && taxCertFileName && !annualCertMeta) {
    writeAnnualTaxCertificateMeta(record.employee_id, record.period_year, {
      file_id: Number(taxCertFileId),
      file_name: taxCertFileName,
      uploaded_at: taxCertUploadedAt || new Date().toISOString(),
    });
  }

  const enriched: PayrollRecord = {
    ...record,
    notes: cleanNotes,
    // Jangan pernah memalsukan status menjadi 'sent_to_finance' sebelum diposting di HR Integration Finance!
    status: record.status,
    submitted_to_finance: isSubmittedToFinance,
    submitted_at: submittedAt,
    tax_certificate_file_id: taxCertFileId ? Number(taxCertFileId) : null,
    tax_certificate_file_name: taxCertFileName,
    tax_certificate_uploaded_at: taxCertUploadedAt,
    ptkp_status: calc.ptkpStatus,
    ter_category: calc.terCategory,
    ter_rate: calc.terRate,
    bpjs_kesehatan_deduction: String(calc.bpjsKesehatanEmployee),
    bpjs_jht_deduction: String(calc.bpjsJhtEmployee),
    bpjs_jp_deduction: String(calc.bpjsJpEmployee),
    bpjs_ketenagakerjaan_deduction: String(calc.bpjsKetenagakerjaanEmployee),
    bpjs_deduction: String(calc.bpjsTotalEmployee),
    pph21_deduction: String(calc.pph21Monthly),
    kasbon_installment: String(calc.kasbonInstallment),
    total_deduction: String(calc.totalEmployeeDeduction),
    net_amount: String(calc.netTakeHomePay),
    calculated_at:
      record.calculated_at || notesMeta.calculated_at || localPrMeta.calculated_at || new Date().toISOString(),
    employee: record.employee
      ? {
          ...mergedEmployee,
          id: record.employee.id,
          full_name: record.employee.full_name,
        }
      : undefined,
  };

  if (record.id) {
    writePayrollMeta(record.id, {
      ptkp_status: calc.ptkpStatus,
      ter_category: calc.terCategory,
      ter_rate: calc.terRate,
      bpjs_kesehatan_deduction: calc.bpjsKesehatanEmployee,
      bpjs_jht_deduction: calc.bpjsJhtEmployee,
      bpjs_jp_deduction: calc.bpjsJpEmployee,
      bpjs_ketenagakerjaan_deduction: calc.bpjsKetenagakerjaanEmployee,
      bpjs_deduction: calc.bpjsTotalEmployee,
      pph21_deduction: calc.pph21Monthly,
      kasbon_installment: calc.kasbonInstallment,
      total_deduction: calc.totalEmployeeDeduction,
      net_amount: calc.netTakeHomePay,
      calculated_at: enriched.calculated_at,
      submitted_to_finance: isSubmittedToFinance,
      submitted_at: submittedAt,
      tax_certificate_file_id: enriched.tax_certificate_file_id,
      tax_certificate_file_name: enriched.tax_certificate_file_name,
      tax_certificate_uploaded_at: enriched.tax_certificate_uploaded_at,
      _cleanNotes: cleanNotes,
    });
  }

  return enriched;
}

export const payrollApi = {
  async list(params: PayrollListParams) {
    const res = await apiClient.get<PaginatedResponse<PayrollRecord>>(`${BASE}/payroll-records`, { params });
    if (res.data?.data && Array.isArray(res.data.data)) {
      res.data.data = res.data.data.map(r => enrichPayrollRecord(r));
    }
    return res;
  },
  async show(id: number) {
    const res = await apiClient.get<{ data: PayrollRecord }>(`${BASE}/payroll-records/${id}`);
    if (res.data?.data) {
      res.data.data = enrichPayrollRecord(res.data.data);
    }
    return res;
  },
  async create(
    employeeId: number,
    values: { period_month: number; period_year: number; base_salary?: number; meal_allowance?: number; notes?: string }
  ) {
    const res = await apiClient.post<ApiMessageResponse<PayrollRecord>>(
      `${BASE}/employees/${employeeId}/payroll-records`,
      values
    );
    if (res.data?.data) {
      res.data.data = enrichPayrollRecord(res.data.data);
    }
    return res;
  },
  async update(id: number, values: { meal_allowance?: number; kasbon_installment?: number; notes?: string }) {
    const existing = readPayrollMetaMap()[id] || {};
    const cleanNotes =
      values.notes !== undefined ? parsePayrollNotesMeta(values.notes).cleanNotes : (existing._cleanNotes ?? null);
    const packedNotes = packPayrollNotesWithMeta(cleanNotes, {
      ...existing,
      kasbon_installment:
        values.kasbon_installment !== undefined ? values.kasbon_installment : existing.kasbon_installment,
    });

    const res = await apiClient.put<ApiMessageResponse<PayrollRecord>>(`${BASE}/payroll-records/${id}`, {
      ...values,
      notes: packedNotes ?? undefined,
    });
    if (res.data?.data) {
      res.data.data = enrichPayrollRecord(res.data.data);
    }
    return res;
  },
  /**
   * Hitung otomatis / hitung ulang potongan BPJS Kesehatan, BPJS Ketenagakerjaan (JHT + JP),
   * dan PPh Pasal 21 (TER PP 58/2023) dari data asli karyawan di database dan simpan ke record.
   */
  async calculateDeductions(record: PayrollRecord, employee?: Partial<Employee> | null): Promise<PayrollRecord> {
    const enriched = enrichPayrollRecord(record, employee);
    if (record.status !== "sent_to_finance") {
      try {
        const existing = readPayrollMetaMap()[record.id] || {};
        const packedNotes = packPayrollNotesWithMeta(record.notes, {
          ...existing,
          ptkp_status: enriched.ptkp_status,
          ter_category: enriched.ter_category,
          ter_rate: Number(enriched.ter_rate) || 0,
          bpjs_kesehatan_deduction: Number(enriched.bpjs_kesehatan_deduction) || 0,
          bpjs_jht_deduction: Number(enriched.bpjs_jht_deduction) || 0,
          bpjs_jp_deduction: Number(enriched.bpjs_jp_deduction) || 0,
          bpjs_ketenagakerjaan_deduction: Number(enriched.bpjs_ketenagakerjaan_deduction) || 0,
          bpjs_deduction: Number(enriched.bpjs_deduction) || 0,
          pph21_deduction: Number(enriched.pph21_deduction) || 0,
          kasbon_installment: Number(enriched.kasbon_installment) || 0,
          total_deduction: Number(enriched.total_deduction) || 0,
          net_amount: Number(enriched.net_amount) || 0,
          calculated_at: new Date().toISOString(),
        });
        const putRes = await apiClient.put<ApiMessageResponse<PayrollRecord>>(`${BASE}/payroll-records/${record.id}`, {
          meal_allowance: Number(record.meal_allowance) || 0,
          notes: packedNotes ?? undefined,
        });
        if (putRes.data?.data) {
          return enrichPayrollRecord(putRes.data.data, employee);
        }
      } catch {
        // ignore if locked
      }
    }
    return enriched;
  },
  /**
   * Ajukan Payroll dari HR ke antrean Finance > HR Integration.
   * TIDAK langsung mem-posting jurnal GL dan TIDAK mengubah status backend jadi sent_to_finance!
   * Melainkan meng-upload / menyimpan rincian potongan & flag submitted_to_finance=true ke database
   * supaya masuk ke daftar Finance > HR Integration untuk direview dan diposting oleh Finance.
   */
  async submitToFinance(record: PayrollRecord, employee?: Partial<Employee> | null): Promise<PayrollRecord> {
    const enriched = enrichPayrollRecord(record, employee);
    const nowIso = new Date().toISOString();

    const existing = readPayrollMetaMap()[record.id] || {};
    const updatedMeta: PayrollStoredMeta = {
      ...existing,
      ptkp_status: enriched.ptkp_status,
      ter_category: enriched.ter_category,
      ter_rate: Number(enriched.ter_rate) || 0,
      bpjs_kesehatan_deduction: Number(enriched.bpjs_kesehatan_deduction) || 0,
      bpjs_jht_deduction: Number(enriched.bpjs_jht_deduction) || 0,
      bpjs_jp_deduction: Number(enriched.bpjs_jp_deduction) || 0,
      bpjs_ketenagakerjaan_deduction: Number(enriched.bpjs_ketenagakerjaan_deduction) || 0,
      bpjs_deduction: Number(enriched.bpjs_deduction) || 0,
      pph21_deduction: Number(enriched.pph21_deduction) || 0,
      kasbon_installment: Number(enriched.kasbon_installment) || 0,
      total_deduction: Number(enriched.total_deduction) || 0,
      net_amount: Number(enriched.net_amount) || 0,
      calculated_at: nowIso,
      submitted_to_finance: true,
      submitted_at: nowIso,
      _cleanNotes: record.notes,
    };
    writePayrollMeta(record.id, updatedMeta);

    if (record.status !== "sent_to_finance") {
      const packedNotes = packPayrollNotesWithMeta(record.notes, updatedMeta);
      const putRes = await apiClient.put<ApiMessageResponse<PayrollRecord>>(`${BASE}/payroll-records/${record.id}`, {
        meal_allowance: Number(record.meal_allowance) || 0,
        notes: packedNotes ?? undefined,
      });
      if (putRes.data?.data) {
        return enrichPayrollRecord(
          {
            ...putRes.data.data,
            submitted_to_finance: true,
            submitted_at: nowIso,
          },
          employee
        );
      }
    }

    return {
      ...enriched,
      submitted_to_finance: true,
      submitted_at: nowIso,
    };
  },
  /** Generate/refresh payroll SEMUA employee aktif untuk 1 periode */
  generate(periodMonth: number, periodYear: number) {
    return apiClient.post<ApiMessageResponse<{ generated: number; updated: number; skipped: number }>>(
      `${BASE}/payroll-records/generate`,
      {
        period_month: periodMonth,
        period_year: periodYear,
      }
    );
  },
  destroy(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/payroll-records/${id}`);
  },
  // Master gaji pokok per employee
  listSalaries(params: EmployeeSalaryListParams) {
    return apiClient.get<PaginatedResponse<EmployeeSalary>>(`${BASE}/payroll-salaries`, { params });
  },
  getSalary(employeeId: number) {
    return apiClient.get<{ data: EmployeeSalary }>(`${BASE}/employees/${employeeId}/salary`);
  },
  setSalary(employeeId: number, baseSalary: number) {
    return apiClient.put<ApiMessageResponse<EmployeeSalary>>(`${BASE}/employees/${employeeId}/salary`, {
      base_salary: baseSalary,
    });
  },
  /**
   * Upload Dokumen Bukti Potong Tahunan (Formulir 1721-A1) untuk karyawan pada tahun pajak tertentu.
   * Menyimpan file ke CorePlatform File Management, menyinkronkan ke field database hr_payroll_record
   * (tax_certificate_file_id, tax_certificate_file_name, tax_certificate_uploaded_at),
   * dokumen karyawan, serta storage lokal agar tetap tersimpan walaupun payroll sudah sent_to_finance.
   */
  async uploadTaxCertificate(params: {
    employeeId: number;
    year: number;
    file: File;
    records?: PayrollRecord[];
  }): Promise<AnnualTaxCertificateMeta> {
    const { employeeId, year, file, records = [] } = params;
    const uploadRes = await fileApi.upload(
      file,
      "HrServiceSupport",
      "tax_certificate_1721_a1",
      undefined,
      undefined,
      createFileUploadIdempotencyKey()
    );
    const uploadedFile = uploadRes.data.data;
    const nowIso = new Date().toISOString();

    const certMeta: AnnualTaxCertificateMeta = {
      file_id: uploadedFile.id,
      file_name: uploadedFile.original_name || file.name,
      uploaded_at: nowIso,
      mime_type: uploadedFile.mime_type || file.type,
    };

    writeAnnualTaxCertificateMeta(employeeId, year, certMeta);

    // Simpan ke semua payroll record tahun ini (utamakan record bulan terakhir / draft)
    const sortedRecords = [...records].sort((a, b) => b.period_month - a.period_month);
    for (const rec of sortedRecords) {
      const existing = readPayrollMetaMap()[rec.id] || {};
      const updatedMeta: PayrollStoredMeta = {
        ...existing,
        tax_certificate_file_id: certMeta.file_id,
        tax_certificate_file_name: certMeta.file_name,
        tax_certificate_uploaded_at: certMeta.uploaded_at,
        _cleanNotes: rec.notes ?? existing._cleanNotes ?? null,
      };
      writePayrollMeta(rec.id, updatedMeta);
    }

    // Update ke backend pada payroll record terbaru (atau yang masih draft)
    const targetRecord = sortedRecords.find(r => r.status !== "sent_to_finance") ?? sortedRecords[0];
    if (targetRecord) {
      try {
        const existing = readPayrollMetaMap()[targetRecord.id] || {};
        const packedNotes = packPayrollNotesWithMeta(targetRecord.notes, {
          ...existing,
          tax_certificate_file_id: certMeta.file_id,
          tax_certificate_file_name: certMeta.file_name,
          tax_certificate_uploaded_at: certMeta.uploaded_at,
        });
        await apiClient.put<ApiMessageResponse<PayrollRecord>>(`${BASE}/payroll-records/${targetRecord.id}`, {
          meal_allowance: Number(targetRecord.meal_allowance) || 0,
          tax_certificate_file_id: certMeta.file_id,
          tax_certificate_file_name: certMeta.file_name,
          tax_certificate_uploaded_at: certMeta.uploaded_at,
          notes: packedNotes ?? undefined,
        });
      } catch {
        // Abaikan jika server remote mengunci record yang sudah sent_to_finance
      }
    }

    // Cadangkan juga ke tabel hr_employee_document supaya selalu tersimpan di DB server
    try {
      await apiClient.post(`${BASE}/employees/${employeeId}/documents`, {
        document_type: `1721-A1-${year}`,
        file_id: certMeta.file_id,
        notes: `Formulir 1721-A1 Tahun Pajak ${year}: ${certMeta.file_name}`,
      });
    } catch {
      // Abaikan jika gagal
    }

    return certMeta;
  },

  async removeTaxCertificate(params: {
    employeeId: number;
    year: number;
    records?: PayrollRecord[];
  }): Promise<void> {
    const { employeeId, year, records = [] } = params;
    deleteAnnualTaxCertificateMeta(employeeId, year);

    for (const rec of records) {
      const existing = readPayrollMetaMap()[rec.id] || {};
      const updatedMeta: PayrollStoredMeta = {
        ...existing,
        tax_certificate_file_id: null,
        tax_certificate_file_name: null,
        tax_certificate_uploaded_at: null,
      };
      writePayrollMeta(rec.id, updatedMeta);
    }

    const sortedRecords = [...records].sort((a, b) => b.period_month - a.period_month);
    const targetRecord = sortedRecords.find(r => r.status !== "sent_to_finance") ?? sortedRecords[0];
    if (targetRecord) {
      try {
        const existing = readPayrollMetaMap()[targetRecord.id] || {};
        const packedNotes = packPayrollNotesWithMeta(targetRecord.notes, {
          ...existing,
          tax_certificate_file_id: null,
          tax_certificate_file_name: null,
          tax_certificate_uploaded_at: null,
        });
        await apiClient.put<ApiMessageResponse<PayrollRecord>>(`${BASE}/payroll-records/${targetRecord.id}`, {
          meal_allowance: Number(targetRecord.meal_allowance) || 0,
          tax_certificate_file_id: null,
          tax_certificate_file_name: null,
          tax_certificate_uploaded_at: null,
          notes: packedNotes ?? undefined,
        });
      } catch {
        // Abaikan jika server mengunci record sent_to_finance
      }
    }
  },
};
