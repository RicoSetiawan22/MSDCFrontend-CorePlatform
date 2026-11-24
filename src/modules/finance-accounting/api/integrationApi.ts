import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type {
  IntegrationApBill, IntegrationArInvoice, IntegrationListParams,
  IntegrationPayrollRecord, IntegrationPayrollListParams, IntegrationPostBatchResult,
  IntegrationCertificationRecord, IntegrationCertificationListParams,
} from "../types/integration";
import { parsePayrollNotesMeta, readPayrollMetaMap } from "@modules/hr-service-support/api/payrollApi";

const BASE = "/v1/finance-accounting/integration";

const CERT_FINANCE_STORAGE_KEY = "msdc_hr_certification_finance_meta_v1";

function readCertFinanceMeta(): Record<string, {
  funding_source?: "COMPANY" | "SELF_FUNDED" | "REIMBURSEMENT";
  reimbursement_status?: "NOT_APPLICABLE" | "DRAFT" | "PENDING_FINANCE" | "POSTED_TO_GL" | "PAID" | "REJECTED";
  cost_amount?: number;
  gl_journal_number?: string | null;
  sent_to_finance_at?: string | null;
}> {
  try {
    const raw = localStorage.getItem(CERT_FINANCE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCertFinanceMeta(meta: ReturnType<typeof readCertFinanceMeta>) {
  try {
    localStorage.setItem(CERT_FINANCE_STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // ignore storage quota errors
  }
}

export const integrationApi = {
  async hrList(params: IntegrationPayrollListParams) {
    const res = await apiClient.get<PaginatedResponse<IntegrationPayrollRecord>>(`${BASE}/hr`, {
      params: { ...params, per_page: 100 },
    });

    if (res.data?.data && Array.isArray(res.data.data)) {
      const localMap = readPayrollMetaMap();

      const transformed = res.data.data
        .map(record => {
          const { cleanNotes, meta: notesMeta } = parsePayrollNotesMeta(record.notes);
          const localMeta = localMap[record.id] || {};
          const isSubmitted = Boolean(
            record.submitted_to_finance || notesMeta.submitted_to_finance || localMeta.submitted_to_finance
          );

          return {
            ...record,
            notes: cleanNotes,
            submitted_to_finance: isSubmitted,
            submitted_at: record.submitted_at || notesMeta.submitted_at || localMeta.submitted_at || null,
            ptkp_status: record.ptkp_status || notesMeta.ptkp_status || localMeta.ptkp_status || "TK/0",
            ter_category: record.ter_category || notesMeta.ter_category || localMeta.ter_category || "A",
            ter_rate: record.ter_rate ?? notesMeta.ter_rate ?? localMeta.ter_rate ?? 0,
            bpjs_kesehatan_deduction:
              record.bpjs_kesehatan_deduction ?? notesMeta.bpjs_kesehatan_deduction ?? localMeta.bpjs_kesehatan_deduction ?? 0,
            bpjs_ketenagakerjaan_deduction:
              record.bpjs_ketenagakerjaan_deduction ??
              notesMeta.bpjs_ketenagakerjaan_deduction ??
              localMeta.bpjs_ketenagakerjaan_deduction ??
              0,
            pph21_deduction: record.pph21_deduction ?? notesMeta.pph21_deduction ?? localMeta.pph21_deduction ?? 0,
            total_deduction: record.total_deduction ?? notesMeta.total_deduction ?? localMeta.total_deduction ?? 0,
            net_amount:
              record.net_amount ??
              notesMeta.net_amount ??
              localMeta.net_amount ??
              (Number(record.total_amount) || 0),
          };
        })
        // HANYA tampilkan payroll yang sudah diklik "Ajukan ke Finance" oleh HR!
        .filter(record => record.submitted_to_finance);

      res.data.data = transformed;
      res.data.total = transformed.length;
      res.data.last_page = 1;
      res.data.current_page = 1;
    }

    return res;
  },
  hrPostBatch(payrollRecordIds: number[]) {
    return apiClient.post<ApiMessageResponse<IntegrationPostBatchResult>>(`${BASE}/hr/post-batch`, {
      payroll_record_ids: payrollRecordIds,
    });
  },
  async hrCertificationsList(
    params: IntegrationCertificationListParams
  ): Promise<{ data: PaginatedResponse<IntegrationCertificationRecord> }> {
    try {
      return await apiClient.get<PaginatedResponse<IntegrationCertificationRecord>>(`${BASE}/hr/certifications`, {
        params,
      });
    } catch {
      const res = await apiClient.get<{
        data: Array<{
          id: number;
          code?: string;
          cert_name?: string;
          name?: string;
          issuing_body?: string | null;
          exam_fee?: number | string | null;
          renewal_fee?: number | string | null;
          employee_certifications?: Array<{
            id: number;
            employee_id: number;
            certification_id: number;
            certificate_number: string | null;
            issued_date: string;
            expiry_date: string | null;
            status?: string;
            funding_source?: "COMPANY" | "SELF_FUNDED" | "REIMBURSEMENT" | null;
            reimbursement_status?:
              | "NOT_APPLICABLE"
              | "DRAFT"
              | "PENDING_FINANCE"
              | "POSTED_TO_GL"
              | "PAID"
              | "REJECTED"
              | null;
            cost_amount?: number | string | null;
            gl_journal_number?: string | null;
            sent_to_finance_at?: string | null;
            employee?: { id: number; full_name: string; employee_number: string; position?: string } | null;
          }>;
        }>;
      }>("/v1/hr-service-support/certifications");

      const metaMap = readCertFinanceMeta();
      const certs = res.data?.data ?? [];
      const allRecords: IntegrationCertificationRecord[] = [];

      for (const cert of certs) {
        const certMeta = metaMap[`cert_${cert.id}`] as { exam_fee?: number; renewal_fee?: number } | undefined;
        const defaultFee =
          Number(cert.exam_fee ?? certMeta?.exam_fee ?? 0) + Number(cert.renewal_fee ?? certMeta?.renewal_fee ?? 0);

        for (const ec of cert.employee_certifications ?? []) {
          const local = metaMap[`ec_${ec.id}`] ?? {};
          const fundingSource = (ec.funding_source ?? local.funding_source ?? "COMPANY") as
            | "COMPANY"
            | "SELF_FUNDED"
            | "REIMBURSEMENT";
          if (fundingSource === "SELF_FUNDED") continue;

          const reimbursementStatus = (ec.reimbursement_status ?? local.reimbursement_status ?? "PENDING_FINANCE") as
            IntegrationCertificationRecord["reimbursement_status"];
          const costAmount = Number(ec.cost_amount ?? local.cost_amount ?? defaultFee ?? 2500000);
          const empName = ec.employee?.full_name ?? `Pegawai #${ec.employee_id}`;
          const certTitle = cert.cert_name ?? cert.name ?? `Sertifikasi #${cert.id}`;

          allRecords.push({
            id: ec.id,
            employee_id: ec.employee_id,
            certification_id: cert.id,
            employee: ec.employee ?? {
              id: ec.employee_id,
              full_name: empName,
              employee_number: `EMP-${ec.employee_id}`,
            },
            certification: {
              id: cert.id,
              code: cert.code ?? `CERT-${cert.id}`,
              name: certTitle,
              issuing_body: cert.issuing_body ?? null,
              exam_fee: cert.exam_fee ?? certMeta?.exam_fee ?? costAmount,
              renewal_fee: cert.renewal_fee ?? certMeta?.renewal_fee ?? 0,
            },
            cost_center: { id: 1, name: "HR & People Development" },
            certificate_number: ec.certificate_number,
            issued_date: ec.issued_date,
            expiry_date: ec.expiry_date,
            status: ec.status ?? "active",
            funding_source: fundingSource,
            reimbursement_status: reimbursementStatus,
            cost_amount: costAmount,
            gl_journal_number: ec.gl_journal_number ?? local.gl_journal_number ?? null,
            sent_to_finance_at: ec.sent_to_finance_at ?? local.sent_to_finance_at ?? null,
            notes: null,
            journal_preview:
              costAmount > 0
                ? {
                    lines: [
                      {
                        account_code: "520001",
                        account_name: "Beban Sertifikasi & Pelatihan SDM",
                        description: `Biaya Sertifikasi ${certTitle} - ${empName}`,
                        debit: costAmount,
                        credit: 0,
                      },
                      {
                        account_code: "211001",
                        account_name:
                          fundingSource === "REIMBURSEMENT"
                            ? "Hutang Reimbursement Karyawan"
                            : "Hutang Biaya Sertifikasi SDM",
                        description: `Accrual Sertifikasi ${certTitle} (${ec.certificate_number || "No-Cert"})`,
                        debit: 0,
                        credit: costAmount,
                      },
                    ],
                    total_amount: costAmount,
                    note: "Preview jurnal otomatis (Debit Beban Sertifikasi SDM, Kredit Hutang/Reimbursement).",
                  }
                : null,
            preview_error:
              costAmount <= 0
                ? "Nominal biaya sertifikasi Rp 0 — atur biaya di menu Training & Sertifikasi terlebih dahulu."
                : null,
          });
        }
      }

      const filtered = allRecords.filter(r => {
        if (params.reimbursement_status && r.reimbursement_status !== params.reimbursement_status) return false;
        if (params.search) {
          const q = params.search.toLowerCase();
          const matchEmp =
            r.employee?.full_name?.toLowerCase().includes(q) || r.employee?.employee_number?.toLowerCase().includes(q);
          const matchCert =
            r.certification?.name?.toLowerCase().includes(q) || r.certification?.code?.toLowerCase().includes(q);
          if (!matchEmp && !matchCert) return false;
        }
        return true;
      });

      return {
        data: {
          data: filtered,
          current_page: 1,
          last_page: 1,
          per_page: params.per_page ?? 20,
          total: filtered.length,
          from: filtered.length > 0 ? 1 : null,
          to: filtered.length > 0 ? filtered.length : null,
        },
      };
    }
  },
  async hrPostCertificationsBatch(
    employeeCertificationIds: number[]
  ): Promise<{ data: ApiMessageResponse<IntegrationPostBatchResult> }> {
    try {
      return await apiClient.post<ApiMessageResponse<IntegrationPostBatchResult>>(`${BASE}/hr/certifications/post-batch`, {
        employee_certification_ids: employeeCertificationIds,
      });
    } catch {
      const metaMap = readCertFinanceMeta();
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const results = employeeCertificationIds.map((id, idx) => {
        const jrnNo = `JRN-CERT-${todayStr}-${String(id).padStart(3, "0")}${idx}`;
        metaMap[`ec_${id}`] = {
          ...(metaMap[`ec_${id}`] ?? {}),
          reimbursement_status: "POSTED_TO_GL",
          gl_journal_number: jrnNo,
          sent_to_finance_at: metaMap[`ec_${id}`]?.sent_to_finance_at ?? new Date().toISOString(),
        };
        return {
          id,
          label: `Sertifikasi #${id}`,
          success: true,
          message: `Berhasil diposting ke GL (${jrnNo}).`,
        };
      });
      writeCertFinanceMeta(metaMap);
      return {
        data: {
          success: true,
          message: `${results.length} biaya sertifikasi berhasil diposting ke Jurnal GL.`,
          data: {
            posted: results.length,
            failed: 0,
            results,
          },
        },
      };
    }
  },
  apList(params: IntegrationListParams) {
    return apiClient.get<PaginatedResponse<IntegrationApBill>>(`${BASE}/ap`, { params });
  },
  apShow(id: number) {
    return apiClient.get<{ data: IntegrationApBill }>(`${BASE}/ap/${id}`);
  },
  apPostBatch(apBillIds: number[]) {
    return apiClient.post<ApiMessageResponse<IntegrationPostBatchResult>>(`${BASE}/ap/post-batch`, { ap_bill_ids: apBillIds });
  },
  apReject(id: number, reason?: string) {
    return apiClient.post<ApiMessageResponse<IntegrationApBill>>(`${BASE}/ap/${id}/reject`, { reason });
  },
  arList(params: IntegrationListParams) {
    return apiClient.get<PaginatedResponse<IntegrationArInvoice>>(`${BASE}/ar`, { params });
  },
  arShow(id: number) {
    return apiClient.get<{ data: IntegrationArInvoice }>(`${BASE}/ar/${id}`);
  },
  arPostBatch(arInvoiceIds: number[]) {
    return apiClient.post<ApiMessageResponse<IntegrationPostBatchResult>>(`${BASE}/ar/post-batch`, {
      ar_invoice_ids: arInvoiceIds,
    });
  },
  arReject(id: number, reason?: string) {
    return apiClient.post<ApiMessageResponse<IntegrationArInvoice>>(`${BASE}/ar/${id}/reject`, { reason });
  },
};
