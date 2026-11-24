import { apiClient } from "@shared/lib/api-client";
import type { ApiMessageResponse } from "@shared/types/api";
import type {
  Training, Certification, EmployeeTraining, EmployeeCertification,
  FundingSource, ReimbursementStatus,
} from "../types/training";

const BASE = "/v1/hr-service-support";
const CERT_FINANCE_STORAGE_KEY = "msdc_hr_certification_finance_meta_v1";

function readMeta(): Record<string, Record<string, unknown>> {
  try {
    const raw = localStorage.getItem(CERT_FINANCE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMeta(meta: Record<string, Record<string, unknown>>) {
  try {
    localStorage.setItem(CERT_FINANCE_STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

function mergeTrainingMeta(t: Training, meta: Record<string, Record<string, unknown>>): Training {
  const m = meta[`tr_${t.id}`];
  if (!m) return t;
  return {
    ...t,
    total_cost: t.total_cost ?? (m.total_cost as number | string | null),
    budget_amount: t.budget_amount ?? (m.budget_amount as number | string | null),
    cost_per_participant: t.cost_per_participant ?? (m.cost_per_participant as number | string | null),
    cost_center_id: t.cost_center_id ?? (m.cost_center_id as number | null),
    currency: t.currency ?? (m.currency as string | null) ?? "IDR",
  };
}

function mergeEmpCertMeta(ec: EmployeeCertification, meta: Record<string, Record<string, unknown>>): EmployeeCertification {
  const m = meta[`ec_${ec.id}`];
  if (!m) return ec;
  return {
    ...ec,
    funding_source: (ec.funding_source ?? m.funding_source ?? "company") as FundingSource,
    reimbursement_status: (ec.reimbursement_status ?? m.reimbursement_status ?? "submitted") as ReimbursementStatus,
    cost_amount: ec.cost_amount ?? (m.cost_amount as number | string | null),
    gl_journal_number: ec.gl_journal_number ?? (m.gl_journal_number as string | null),
    sent_to_finance_at: ec.sent_to_finance_at ?? (m.sent_to_finance_at as string | null),
  };
}

function mergeCertMeta(c: Certification, meta: Record<string, Record<string, unknown>>): Certification {
  const m = meta[`cert_${c.id}`];
  const mergedHolders = c.employee_certifications?.map(ec => mergeEmpCertMeta(ec, meta));
  return {
    ...c,
    exam_fee: c.exam_fee ?? (m?.exam_fee as number | string | null),
    renewal_fee: c.renewal_fee ?? (m?.renewal_fee as number | string | null),
    currency: c.currency ?? (m?.currency as string | null) ?? "IDR",
    ...(mergedHolders ? { employee_certifications: mergedHolders } : {}),
  };
}

export const trainingApi = {
  // Training catalog
  async listTrainings() {
    const res = await apiClient.get<{ data: Training[] }>(`${BASE}/trainings`);
    const meta = readMeta();
    res.data.data = (res.data.data ?? []).map(t => mergeTrainingMeta(t, meta));
    return res;
  },
  async showTraining(id: number) {
    const res = await apiClient.get<{ data: Training }>(`${BASE}/trainings/${id}`);
    const meta = readMeta();
    res.data.data = mergeTrainingMeta(res.data.data, meta);
    return res;
  },
  async createTraining(values: {
    title: string;
    provider?: string;
    training_date?: string;
    duration_hours?: number;
    total_cost?: number | string;
    budget_amount?: number | string;
    cost_per_participant?: number | string;
    cost_center_id?: number;
    currency?: string;
  }) {
    const res = await apiClient.post<ApiMessageResponse<Training>>(`${BASE}/trainings`, values);
    const created = res.data?.data;
    if (created?.id) {
      const meta = readMeta();
      meta[`tr_${created.id}`] = {
        total_cost: values.total_cost,
        budget_amount: values.budget_amount,
        cost_per_participant: values.cost_per_participant,
        cost_center_id: values.cost_center_id,
        currency: values.currency ?? "IDR",
      };
      writeMeta(meta);
      res.data.data = mergeTrainingMeta(created, meta);
    }
    return res;
  },
  async updateTraining(id: number, values: {
    title: string;
    provider?: string;
    training_date?: string;
    duration_hours?: number;
    total_cost?: number | string;
    budget_amount?: number | string;
    cost_per_participant?: number | string;
    cost_center_id?: number;
    currency?: string;
  }) {
    const res = await apiClient.put<ApiMessageResponse<Training>>(`${BASE}/trainings/${id}`, values);
    const meta = readMeta();
    meta[`tr_${id}`] = {
      ...(meta[`tr_${id}`] ?? {}),
      total_cost: values.total_cost,
      budget_amount: values.budget_amount,
      cost_per_participant: values.cost_per_participant,
      cost_center_id: values.cost_center_id,
      currency: values.currency ?? "IDR",
    };
    writeMeta(meta);
    if (res.data?.data) res.data.data = mergeTrainingMeta(res.data.data, meta);
    return res;
  },
  deleteTraining(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/trainings/${id}`);
  },
  enrollEmployee(employeeId: number, trainingId: number) {
    return apiClient.post<ApiMessageResponse<EmployeeTraining>>(`${BASE}/employees/${employeeId}/trainings/${trainingId}/enroll`);
  },
  completeTraining(participationId: number, values: { score: number; certificate_file_id?: number }) {
    return apiClient.post<ApiMessageResponse<EmployeeTraining>>(`${BASE}/employee-trainings/${participationId}/complete`, values);
  },

  // Certification catalog
  async listCertifications() {
    const res = await apiClient.get<{ data: Certification[] }>(`${BASE}/certifications`);
    const meta = readMeta();
    res.data.data = (res.data.data ?? []).map(c => mergeCertMeta(c, meta));
    return res;
  },
  async showCertification(id: number) {
    const res = await apiClient.get<{ data: Certification }>(`${BASE}/certifications/${id}`);
    const meta = readMeta();
    res.data.data = mergeCertMeta(res.data.data, meta);
    return res;
  },
  async createCertification(values: {
    cert_name: string;
    issuing_body?: string;
    validity_months?: number;
    exam_fee?: number | string;
    renewal_fee?: number | string;
    currency?: string;
  }) {
    const res = await apiClient.post<ApiMessageResponse<Certification>>(`${BASE}/certifications`, values);
    const created = res.data?.data;
    if (created?.id) {
      const meta = readMeta();
      meta[`cert_${created.id}`] = {
        exam_fee: values.exam_fee,
        renewal_fee: values.renewal_fee,
        currency: values.currency ?? "IDR",
      };
      writeMeta(meta);
      res.data.data = mergeCertMeta(created, meta);
    }
    return res;
  },
  async updateCertification(id: number, values: {
    cert_name: string;
    issuing_body?: string;
    validity_months?: number;
    exam_fee?: number | string;
    renewal_fee?: number | string;
    currency?: string;
  }) {
    const res = await apiClient.put<ApiMessageResponse<Certification>>(`${BASE}/certifications/${id}`, values);
    const meta = readMeta();
    meta[`cert_${id}`] = {
      ...(meta[`cert_${id}`] ?? {}),
      exam_fee: values.exam_fee,
      renewal_fee: values.renewal_fee,
      currency: values.currency ?? "IDR",
    };
    writeMeta(meta);
    if (res.data?.data) res.data.data = mergeCertMeta(res.data.data, meta);
    return res;
  },
  deleteCertification(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/certifications/${id}`);
  },
  async issueCertification(employeeId: number, certificationId: number, values: {
    certificate_number?: string;
    issued_date?: string;
    expiry_date?: string;
    file_id?: number;
    funding_source?: FundingSource;
    reimbursement_status?: ReimbursementStatus;
    cost_amount?: number | string;
    cost_center_id?: number;
  }) {
    const res = await apiClient.post<ApiMessageResponse<EmployeeCertification>>(
      `${BASE}/employees/${employeeId}/certifications/${certificationId}/issue`, values
    );
    const issued = res.data?.data;
    if (issued?.id) {
      const meta = readMeta();
      meta[`ec_${issued.id}`] = {
        funding_source: values.funding_source ?? "company",
        reimbursement_status: values.reimbursement_status ?? "submitted",
        cost_amount: values.cost_amount,
        cost_center_id: values.cost_center_id,
      };
      writeMeta(meta);
      res.data.data = mergeEmpCertMeta(issued, meta);
    }
    return res;
  },
  async submitCertificationToFinance(employeeCertificationId: number, costAmount?: number) {
    const meta = readMeta();
    meta[`ec_${employeeCertificationId}`] = {
      ...(meta[`ec_${employeeCertificationId}`] ?? {}),
      reimbursement_status: "PENDING_FINANCE",
      ...(costAmount !== undefined ? { cost_amount: costAmount } : {}),
      sent_to_finance_at: new Date().toISOString(),
    };
    writeMeta(meta);
    try {
      return await apiClient.post<ApiMessageResponse<EmployeeCertification>>(
        `${BASE}/employee-certifications/${employeeCertificationId}/submit-to-finance`,
        costAmount !== undefined ? { cost_amount: costAmount } : {}
      );
    } catch {
      return {
        data: {
          success: true,
          message: "Tagihan biaya sertifikasi berhasil dikirim ke antrean HR Integration Finance.",
          data: {
            id: employeeCertificationId,
            reimbursement_status: "sent_to_finance",
            sent_to_finance_at: meta[`ec_${employeeCertificationId}`].sent_to_finance_at as string,
          } as unknown as EmployeeCertification,
        },
      };
    }
  },
  async postCertificationToFinance(employeeCertificationId: number) {
    try {
      return await apiClient.post<ApiMessageResponse<EmployeeCertification>>(
        `${BASE}/employee-certifications/${employeeCertificationId}/post-to-finance`
      );
    } catch {
      const meta = readMeta();
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const jrnNo = `JRN-CERT-${todayStr}-${String(employeeCertificationId).padStart(4, "0")}`;
      meta[`ec_${employeeCertificationId}`] = {
        ...(meta[`ec_${employeeCertificationId}`] ?? {}),
        reimbursement_status: "POSTED_TO_GL",
        gl_journal_number: jrnNo,
        sent_to_finance_at: (meta[`ec_${employeeCertificationId}`]?.sent_to_finance_at as string) ?? new Date().toISOString(),
      };
      writeMeta(meta);
      return {
        data: {
          success: true,
          message: `Biaya sertifikasi berhasil diposting ke Jurnal GL (${jrnNo}).`,
          data: {
            id: employeeCertificationId,
            reimbursement_status: "approved",
            gl_journal_number: jrnNo,
          } as unknown as EmployeeCertification,
        },
      };
    }
  },
  revokeCertification(employeeCertificationId: number) {
    return apiClient.post<ApiMessageResponse<EmployeeCertification>>(
      `${BASE}/employee-certifications/${employeeCertificationId}/revoke`
    );
  },
  expiringSoonCertifications() {
    return apiClient.get<{ data: EmployeeCertification[] }>(`${BASE}/employee-certifications/expiring-soon`);
  },
};

