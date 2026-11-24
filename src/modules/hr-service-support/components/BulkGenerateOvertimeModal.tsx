import { useState, useEffect } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import { formatDate, formatCurrency } from "@shared/lib/format";
import { employeeApi } from "../api/employeeApi";
import { overtimeApi } from "../api/overtimeApi";
import { useDefaultOvertimeRate } from "../api/useOvertime";
import type { OvertimeRecord, OvertimeCandidateDay } from "../types/overtime";
import {
  CheckCircle2, AlertCircle, RefreshCw, Send, Users, Clock, Wallet
} from "lucide-react";

interface EmployeeCandidateSummary {
  employeeId: number;
  employeeName: string;
  employeeNumber?: string;
  candidates: OvertimeCandidateDay[];
  totalHours: number;
  existingStatus?: string;
  canSubmit: boolean;
}

interface BulkGenerateOvertimeModalProps {
  initialMonth: number;
  initialYear: number;
  existingRecords?: OvertimeRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkGenerateOvertimeModal({
  initialMonth,
  initialYear,
  existingRecords: _existingRecords,
  onClose,
  onSuccess,
}: BulkGenerateOvertimeModalProps) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [candidatesList, setCandidatesList] = useState<EmployeeCandidateSummary[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Record<number, boolean>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState({ current: 0, total: 0, currentName: "" });
  const [submitResults, setSubmitResults] = useState<{ success: number; failed: { name: string; error: string }[] } | null>(null);

  const { data: defaultRate } = useDefaultOvertimeRate();

  useEffect(() => {
    let isCancelled = false;

    async function scanCandidates() {
      setIsScanning(true);
      setCandidatesList([]);
      setSelectedEmployees({});
      setSubmitResults(null);

      try {
        // Ambil daftar karyawan aktif dan SELURUH data lembur yang sudah ada di periode ini langsung dari API
        const [empRes, existingOtRes] = await Promise.all([
          employeeApi.list({ per_page: 100, employment_status: "active" }),
          overtimeApi.list({ period_month: month, period_year: year, per_page: 100 }),
        ]);

        const employees = empRes.data.data ?? [];
        const existingRecords = existingOtRes.data.data ?? [];
        const existingMap = new Map<number, OvertimeRecord>();
        existingRecords.forEach((r) => existingMap.set(r.employee_id, r));

        if (employees.length === 0) {
          setIsScanning(false);
          return;
        }

        const summaries: EmployeeCandidateSummary[] = [];
        setScanProgress({ current: 0, total: employees.length });

        for (let i = 0; i < employees.length; i++) {
          if (isCancelled) return;
          const emp = employees[i];
          setScanProgress({ current: i + 1, total: employees.length });

          try {
            const candRes = await overtimeApi.candidates(emp.id, month, year);
            const candidates = candRes.data.data ?? [];
            if (candidates.length > 0) {
              const totalHours = candidates.reduce((sum, c) => sum + Number(c.overtime_hours), 0);
              if (totalHours > 0) {
                const existing = existingMap.get(emp.id);
                const existingStatus = existing?.status;

                // Karyawan sudah selesai jika pending_approval, approved, atau sent_to_finance
                const isAlreadyProcessed =
                  existingStatus === "pending_approval" ||
                  existingStatus === "approved" ||
                  existingStatus === "sent_to_finance";

                const canSubmit = !isAlreadyProcessed;

                summaries.push({
                  employeeId: emp.id,
                  employeeName: emp.full_name,
                  employeeNumber: emp.employee_number,
                  candidates,
                  totalHours: Math.round(totalHours * 100) / 100,
                  existingStatus,
                  canSubmit,
                });
              }
            }
          } catch {
            // Abaikan error per employee saat scan agar tidak memblokir yang lain
          }
        }

        if (!isCancelled) {
          setCandidatesList(summaries);
          const initialSelected: Record<number, boolean> = {};
          summaries.forEach((s) => {
            if (s.canSubmit) {
              initialSelected[s.employeeId] = true;
            }
          });
          setSelectedEmployees(initialSelected);
        }
      } catch (err) {
        alert("Gagal memindai data absensi karyawan: " + extractErrorMessage(err));
      } finally {
        if (!isCancelled) {
          setIsScanning(false);
        }
      }
    }

    scanCandidates();

    return () => {
      isCancelled = true;
    };
  }, [month, year]);

  const pendingCandidates = candidatesList.filter((c) => c.canSubmit);
  const completedCandidates = candidatesList.filter((c) => !c.canSubmit);

  const selectedCount = Object.values(selectedEmployees).filter(Boolean).length;
  const allSelected = pendingCandidates.length > 0 && pendingCandidates.every((c) => selectedEmployees[c.employeeId]);

  function toggleSelectAll() {
    const nextState = !allSelected;
    const updated: Record<number, boolean> = { ...selectedEmployees };
    pendingCandidates.forEach((c) => {
      updated[c.employeeId] = nextState;
    });
    setSelectedEmployees(updated);
  }

  function toggleEmployee(employeeId: number) {
    setSelectedEmployees((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId],
    }));
  }

  async function handleBulkSubmit() {
    const toSubmit = pendingCandidates.filter((c) => selectedEmployees[c.employeeId]);
    if (toSubmit.length === 0) {
      alert("Pilih minimal 1 karyawan untuk diajukan.");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    const failedList: { name: string; error: string }[] = [];

    for (let i = 0; i < toSubmit.length; i++) {
      const item = toSubmit[i];
      setSubmitProgress({ current: i + 1, total: toSubmit.length, currentName: item.employeeName });

      try {
        const daysPayload = item.candidates.map((c) => ({
          overtime_date: c.overtime_date,
          notes: `Lembur actual ${c.actual_hours ?? 0}j (terjadwal ${c.scheduled_hours ?? 0}j)`,
        }));

        await overtimeApi.submit({
          employee_id: item.employeeId,
          month,
          year,
          days: daysPayload,
        });

        successCount++;

        // Tandai employee ini langsung selesai sehingga hilang dari antrean generate!
        setCandidatesList((prev) =>
          prev.map((c) =>
            c.employeeId === item.employeeId
              ? { ...c, existingStatus: "pending_approval", canSubmit: false }
              : c
          )
        );

        setSelectedEmployees((prev) => ({
          ...prev,
          [item.employeeId]: false,
        }));
      } catch (err) {
        failedList.push({
          name: item.employeeName,
          error: extractErrorMessage(err),
        });
      }
    }

    setIsSubmitting(false);
    setSubmitResults({ success: successCount, failed: failedList });

    if (successCount > 0) {
      onSuccess();
    }
  }

  const totalSelectedHours = pendingCandidates
    .filter((c) => selectedEmployees[c.employeeId])
    .reduce((sum, c) => sum + c.totalHours, 0);

  const totalSelectedCost = defaultRate ? totalSelectedHours * defaultRate.rate_per_hour : 0;

  return (
    <Modal title="Generate & Ajukan Lembur Massal (Bulk Overtime)" onClose={onClose} maxWidth={820}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Info header */}
        <div style={{
          background: "#F0F5FA",
          border: "1px solid #D2E1F0",
          borderRadius: 10,
          padding: "0.85rem 1rem",
          fontSize: "0.82rem",
          color: "#0A2140",
          lineHeight: 1.45,
        }}>
          <strong>Pemberitahuan Otomasi Workflow:</strong> Memindai jam kerja aktual vs jadwal seluruh karyawan aktif.
          Karyawan yang memiliki kelebihan jam kerja dan belum diproses akan disubmit ke <strong>Workflow Engine (My Approvals)</strong>.
          Setelah data berhasil digenerate, karyawan otomatis <strong>selesai dan berpindah dari antrean</strong>.
        </div>

        {/* Filter Periode */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0A2140" }}>Periode Bulan:</label>
            <select
              value={month}
              disabled={isScanning || isSubmitting}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="input"
              style={{ padding: "0.4rem 0.6rem", fontSize: "0.82rem" }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, "0")}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0A2140" }}>Tahun:</label>
            <select
              value={year}
              disabled={isScanning || isSubmitting}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="input"
              style={{ padding: "0.4rem 0.6rem", fontSize: "0.82rem" }}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {isScanning && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#4A5C74", marginLeft: "auto" }}>
              <RefreshCw size={14} className="animate-spin" />
              <span>Memindai karyawan ({scanProgress.current}/{scanProgress.total})...</span>
            </div>
          )}
        </div>

        {/* Scanning State */}
        {isScanning && (
          <div style={{ padding: "2.5rem 1rem", textAlign: "center" }}>
            <LoadingState />
            <p style={{ marginTop: 12, fontSize: "0.85rem", color: "#4A5C74" }}>
              Sedang memindai kehadiran dan menghitung jam lembur dari seluruh karyawan aktif...
            </p>
          </div>
        )}

        {/* Submitting Progress */}
        {isSubmitting && (
          <div style={{
            background: "#FFFBF0",
            border: "1px solid #F2A602",
            borderRadius: 12,
            padding: "1.5rem",
            textAlign: "center",
          }}>
            <RefreshCw size={24} className="animate-spin" style={{ color: "#F2A602", margin: "0 auto 10px" }} />
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0A2140" }}>
              Sedang Mengajukan Overtime ke My Approvals...
            </div>
            <div style={{ fontSize: "0.85rem", color: "#4A5C74", marginTop: 4 }}>
              Memproses {submitProgress.current} dari {submitProgress.total}: <strong>{submitProgress.currentName}</strong>
            </div>
            <div style={{
              width: "100%",
              height: 8,
              background: "#E4E8EE",
              borderRadius: 4,
              overflow: "hidden",
              marginTop: 12,
            }}>
              <div style={{
                height: "100%",
                background: "#F2A602",
                width: `${(submitProgress.current / submitProgress.total) * 100}%`,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        )}

        {/* Submit Results */}
        {submitResults && (
          <div style={{
            background: submitResults.failed.length === 0 ? "#E4F7EF" : "#FCEAEA",
            border: `1px solid ${submitResults.failed.length === 0 ? "#1BA672" : "#E14B4B"}`,
            borderRadius: 12,
            padding: "1rem 1.25rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {submitResults.failed.length === 0 ? (
                <CheckCircle2 size={20} color="#1BA672" />
              ) : (
                <AlertCircle size={20} color="#E14B4B" />
              )}
              <span style={{ fontWeight: 700, fontSize: "0.92rem", color: submitResults.failed.length === 0 ? "#1BA672" : "#E14B4B" }}>
                {submitResults.success > 0
                  ? `Berhasil men-generate & mengajukan lembur untuk ${submitResults.success} employee ke My Approvals! Data yang selesai otomatis dipindahkan dari antrean.`
                  : "Pengajuan lembur gagal diproses."}
              </span>
            </div>
            {submitResults.failed.length > 0 && (
              <div style={{ marginTop: 8, fontSize: "0.8rem", color: "#4A5C74" }}>
                <p style={{ fontWeight: 600 }}>Terdapat {submitResults.failed.length} employee yang gagal diajukan:</p>
                <ul style={{ listStyleType: "disc", paddingLeft: 20, marginTop: 4 }}>
                  {submitResults.failed.map((f, i) => (
                    <li key={i}>{f.name}: {f.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Result Table & Summary */}
        {!isScanning && !isSubmitting && (
          <>
            {/* Tabs Antrean vs Sudah Selesai */}
            <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #E4E8EE", paddingBottom: 8 }}>
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                style={{
                  border: "none",
                  background: activeTab === "pending" ? "#0A2140" : "#F0F3F7",
                  color: activeTab === "pending" ? "#fff" : "#4A5C74",
                  padding: "0.45rem 0.9rem",
                  borderRadius: 8,
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>Antrean Siap Digenerate</span>
                <span style={{
                  background: activeTab === "pending" ? "#F2A602" : "#D2D9E2",
                  color: activeTab === "pending" ? "#0A2140" : "#4A5C74",
                  padding: "0.1rem 0.45rem",
                  borderRadius: 999,
                  fontSize: "0.72rem",
                }}>
                  {pendingCandidates.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("completed")}
                style={{
                  border: "none",
                  background: activeTab === "completed" ? "#0A2140" : "#F0F3F7",
                  color: activeTab === "completed" ? "#fff" : "#4A5C74",
                  padding: "0.45rem 0.9rem",
                  borderRadius: 8,
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>Sudah Selesai Diproses</span>
                <span style={{
                  background: activeTab === "completed" ? "#1BA672" : "#D2D9E2",
                  color: activeTab === "completed" ? "#fff" : "#4A5C74",
                  padding: "0.1rem 0.45rem",
                  borderRadius: 999,
                  fontSize: "0.72rem",
                }}>
                  {completedCandidates.length}
                </span>
              </button>
            </div>

            {/* TAB 1: ANTREAN SIAP DIGENERATE */}
            {activeTab === "pending" && (
              <>
                {pendingCandidates.length === 0 ? (
                  <div style={{
                    padding: "2.5rem 1rem",
                    textAlign: "center",
                    background: "#F7F8FA",
                    border: "1px dashed #E4E8EE",
                    borderRadius: 12,
                  }}>
                    <CheckCircle2 size={38} color="#1BA672" style={{ margin: "0 auto 8px" }} />
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0A2140" }}>
                      Seluruh Overtime Periode Ini Sudah Selesai Digenerate
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#4A5C74", marginTop: 4, maxWidth: 460, margin: "4px auto 0" }}>
                      Semua karyawan yang terdeteksi lembur di periode {String(month).padStart(2, "0")}/{year} sudah berhasil diajukan / disetujui
                      {completedCandidates.length > 0 && ` (${completedCandidates.length} karyawan sudah selesai)`}.
                      Anda dapat melihat daftarnya pada tab <strong>"Sudah Selesai Diproses"</strong>.
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Summary stat cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                      <div style={{ background: "#F7F8FA", border: "1px solid #E4E8EE", borderRadius: 10, padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#4A5C74", fontWeight: 700 }}>
                          <Users size={14} /> EMPLOYEE DALAM ANTREAN
                        </div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A2140", marginTop: 4 }}>
                          {pendingCandidates.length} <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>orang</span>
                        </div>
                      </div>
                      <div style={{ background: "#F7F8FA", border: "1px solid #E4E8EE", borderRadius: 10, padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#4A5C74", fontWeight: 700 }}>
                          <Clock size={14} /> TOTAL JAM DIPILIH
                        </div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A2140", marginTop: 4 }}>
                          {totalSelectedHours.toFixed(2)} <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>jam</span>
                        </div>
                      </div>
                      <div style={{ background: "#F7F8FA", border: "1px solid #E4E8EE", borderRadius: 10, padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#4A5C74", fontWeight: 700 }}>
                          <Wallet size={14} /> ESTIMASI TOTAL BIAYA
                        </div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#F2A602", marginTop: 4 }}>
                          {totalSelectedCost > 0 ? formatCurrency(totalSelectedCost) : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Candidate list table */}
                    <div style={{ border: "1px solid #E4E8EE", borderRadius: 12, overflow: "hidden", maxHeight: 340, overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                        <thead style={{ background: "#F7F8FA", position: "sticky", top: 0, zIndex: 1 }}>
                          <tr style={{ borderBottom: "1px solid #E4E8EE" }}>
                            <th style={{ padding: "0.6rem 0.8rem", textAlign: "left", width: 40 }}>
                              <input
                                type="checkbox"
                                checked={allSelected}
                                disabled={pendingCandidates.length === 0}
                                onChange={toggleSelectAll}
                              />
                            </th>
                            <th style={{ padding: "0.6rem 0.8rem", textAlign: "left", color: "#4A5C74", fontWeight: 700 }}>Employee</th>
                            <th style={{ padding: "0.6rem 0.8rem", textAlign: "left", color: "#4A5C74", fontWeight: 700 }}>Hari Lembur Terdeteksi</th>
                            <th style={{ padding: "0.6rem 0.8rem", textAlign: "right", color: "#4A5C74", fontWeight: 700 }}>Total Jam</th>
                            <th style={{ padding: "0.6rem 0.8rem", textAlign: "center", color: "#4A5C74", fontWeight: 700 }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingCandidates.map((item) => {
                            const isChecked = !!selectedEmployees[item.employeeId];
                            return (
                              <tr
                                key={item.employeeId}
                                style={{
                                  borderBottom: "1px solid #E4E8EE",
                                  background: isChecked ? "#FCFDFE" : "#fff",
                                }}
                              >
                                <td style={{ padding: "0.6rem 0.8rem" }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleEmployee(item.employeeId)}
                                  />
                                </td>
                                <td style={{ padding: "0.6rem 0.8rem" }}>
                                  <div style={{ fontWeight: 700, color: "#0A2140" }}>{item.employeeName}</div>
                                  {item.employeeNumber && (
                                    <div style={{ fontSize: "0.72rem", color: "#4A5C74" }}>{item.employeeNumber}</div>
                                  )}
                                </td>
                                <td style={{ padding: "0.6rem 0.8rem", color: "#4A5C74" }}>
                                  <div style={{ fontWeight: 600 }}>{item.candidates.length} hari lembur</div>
                                  <div style={{ fontSize: "0.72rem", color: "#718096" }}>
                                    {item.candidates.slice(0, 3).map((c) => `${formatDate(c.overtime_date)} (+${c.overtime_hours}j)`).join(", ")}
                                    {item.candidates.length > 3 && ` +${item.candidates.length - 3} lainnya`}
                                  </div>
                                </td>
                                <td style={{ padding: "0.6rem 0.8rem", textAlign: "right", fontWeight: 800, color: "#0A2140" }}>
                                  +{item.totalHours.toFixed(2)} jam
                                </td>
                                <td style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>
                                  {item.existingStatus === "draft" ? (
                                    <span style={{ background: "#EEF1F4", color: "#4A5C74", padding: "0.2rem 0.5rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700 }}>
                                      Draft
                                    </span>
                                  ) : item.existingStatus === "rejected" ? (
                                    <span style={{ background: "#FCEAEA", color: "#E14B4B", padding: "0.2rem 0.5rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700 }}>
                                      Ditolak (Resubmit)
                                    </span>
                                  ) : (
                                    <span style={{ background: "#E4F7EF", color: "#1BA672", padding: "0.2rem 0.5rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700 }}>
                                      Siap Diajukan
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            {/* TAB 2: SUDAH SELESAI DIPROSES */}
            {activeTab === "completed" && (
              <>
                {completedCandidates.length === 0 ? (
                  <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#4A5C74", fontSize: "0.85rem" }}>
                    Belum ada karyawan yang selesai diproses di periode ini.
                  </div>
                ) : (
                  <div style={{ border: "1px solid #E4E8EE", borderRadius: 12, overflow: "hidden", maxHeight: 340, overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                      <thead style={{ background: "#F7F8FA", position: "sticky", top: 0, zIndex: 1 }}>
                        <tr style={{ borderBottom: "1px solid #E4E8EE" }}>
                          <th style={{ padding: "0.6rem 0.8rem", textAlign: "left", color: "#4A5C74", fontWeight: 700 }}>Employee</th>
                          <th style={{ padding: "0.6rem 0.8rem", textAlign: "left", color: "#4A5C74", fontWeight: 700 }}>Hari Lembur Terdeteksi</th>
                          <th style={{ padding: "0.6rem 0.8rem", textAlign: "right", color: "#4A5C74", fontWeight: 700 }}>Total Jam</th>
                          <th style={{ padding: "0.6rem 0.8rem", textAlign: "center", color: "#4A5C74", fontWeight: 700 }}>Status Saat Ini</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedCandidates.map((item) => (
                          <tr key={item.employeeId} style={{ borderBottom: "1px solid #E4E8EE", background: "#fff" }}>
                            <td style={{ padding: "0.6rem 0.8rem" }}>
                              <div style={{ fontWeight: 700, color: "#0A2140" }}>{item.employeeName}</div>
                              {item.employeeNumber && (
                                <div style={{ fontSize: "0.72rem", color: "#4A5C74" }}>{item.employeeNumber}</div>
                              )}
                            </td>
                            <td style={{ padding: "0.6rem 0.8rem", color: "#4A5C74" }}>
                              <div style={{ fontWeight: 600 }}>{item.candidates.length} hari lembur</div>
                              <div style={{ fontSize: "0.72rem", color: "#718096" }}>
                                {item.candidates.slice(0, 3).map((c) => `${formatDate(c.overtime_date)} (+${c.overtime_hours}j)`).join(", ")}
                                {item.candidates.length > 3 && ` +${item.candidates.length - 3} lainnya`}
                              </div>
                            </td>
                            <td style={{ padding: "0.6rem 0.8rem", textAlign: "right", fontWeight: 800, color: "#0A2140" }}>
                              +{item.totalHours.toFixed(2)} jam
                            </td>
                            <td style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>
                              {item.existingStatus === "pending_approval" ? (
                                <span style={{ background: "#FDF1D9", color: "#B57500", padding: "0.2rem 0.5rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700 }}>
                                  Menunggu Approval
                                </span>
                              ) : item.existingStatus === "approved" ? (
                                <span style={{ background: "#E4F7EF", color: "#1BA672", padding: "0.2rem 0.5rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700 }}>
                                  ✓ Disetujui
                                </span>
                              ) : item.existingStatus === "sent_to_finance" ? (
                                <span style={{ background: "#E8EEF7", color: "#0A2140", padding: "0.2rem 0.5rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700 }}>
                                  ✓ Posted ke Finance
                                </span>
                              ) : (
                                <span style={{ background: "#EEF1F4", color: "#4A5C74", padding: "0.2rem 0.5rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700 }}>
                                  Selesai
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Modal actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #E4E8EE" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ fontSize: "0.82rem" }}
          >
            Tutup
          </button>

          {activeTab === "pending" && (
            <Button
              onClick={handleBulkSubmit}
              disabled={isScanning || isSubmitting || selectedCount === 0}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#F2A602",
                borderColor: "#F2A602",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.82rem",
              }}
            >
              <Send size={14} />
              {isSubmitting
                ? "Sedang Mengajukan ke Workflow..."
                : `Generate & Ajukan ke My Approvals (${selectedCount} Employee)`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
