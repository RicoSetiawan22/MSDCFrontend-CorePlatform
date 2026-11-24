import { useEffect, useMemo, useState } from "react";
import { Modal } from "@shared/components/Modal";
import { useOrganization } from "@shared/lib/organization-context";
import { extractErrorMessage } from "@shared/types/api";
import { EmployeePicker, type EmployeePickerResult } from "@modules/hr-service-support/components/EmployeePicker";
import { useCreateDocument, useDocumentTypes, useDocumentTemplates } from "../api/useDocuments";
import type { DocumentDetail, DocumentDirection } from "../types/document";

/** Ambil daftar nama placeholder {{var}} dari isi Template - dipakai
 * bikin form dinamis per-template TANPA hardcode field per document_type
 * (lihat TemplateService::render() di backend, syntax sama persis). */
function extractPlaceholders(content: string): string[] {
  const matches = content.matchAll(/\{\{\s*(\w+)\s*\}\}/g);
  const names = new Set<string>();
  for (const m of matches) {
    if (m[1] !== "nomor_surat") names.add(m[1]);
  }
  return Array.from(names);
}

/** new Date().toISOString() konversi ke UTC dulu - di jam-jam awal hari
 * (WIB = UTC+7), itu bisa mundur ke tanggal KEMARIN. "Tanggal Surat" harus
 * tanggal hari ini menurut jam LOKAL pengguna, bukan UTC. */
function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DocumentFormModal({ defaultDirection, moduleCode, lockDocumentType, employeeLinked, onClose, onCreated }: {
  defaultDirection?: DocumentDirection;
  /** Batasi pilihan Jenis Surat ke yang document_type.meta.module-nya cocok
   * (lihat DocumentListView.tsx) - dipakai ModuleSuratPage.tsx supaya form
   * create di halaman "Surat HRD" dst cuma nawarin jenis yang memang
   * dikonfigurasi untuk modul itu. */
  moduleCode?: string;
  /** Kalau diisi, jenis surat langsung terpilih dan dropdown-nya
   * disembunyikan - dipakai halaman yang sudah spesifik ke 1 jenis surat
   * (mis. GaGoodsEntryListPage cuma untuk izin_masuk_barang), supaya user
   * tidak perlu pilih ulang dari daftar campur "Semua Jenis". */
  lockDocumentType?: string;
  /** Kalau true, "Ditujukan Kepada" diganti EmployeePicker (issued_to_type=
   * 'employee', issued_to_ref=id) - dipakai surat yang memang ditujukan ke
   * 1 employee tertentu (SK, Teguran, Surat Tugas), supaya tercatat sebagai
   * link terstruktur (bisa dicari "semua SK milik employee X"), bukan
   * cuma nama bebas seperti surat ke pihak luar. */
  employeeLinked?: boolean;
  onClose: () => void;
  onCreated: (doc: DocumentDetail) => void;
}) {
  const { data: types } = useDocumentTypes();
  const { data: templates } = useDocumentTemplates();
  const { activeOrg } = useOrganization();
  const createDocument = useCreateDocument();

  const [documentType, setDocumentType] = useState(lockDocumentType ?? "");
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState<number | "">("");
  const [fieldData, setFieldData] = useState<Record<string, string>>({});
  const [manualBody, setManualBody] = useState("");
  const [issuedToName, setIssuedToName] = useState("");
  const [employee, setEmployee] = useState<EmployeePickerResult | null>(null);
  const [pickingEmployee, setPickingEmployee] = useState(true);
  const [issuedDate, setIssuedDate] = useState(todayLocalDate());
  const [error, setError] = useState<string | null>(null);

  const filteredTypes = useMemo(() => {
    let list = types ?? [];
    if (moduleCode) list = list.filter(t => t.meta.module === moduleCode);
    if (defaultDirection) list = list.filter(t => t.meta.direction === defaultDirection);
    return list;
  }, [types, defaultDirection, moduleCode]);

  const selectedTemplate = templates?.find(t => t.id === templateId);
  const placeholders = selectedTemplate ? extractPlaceholders(selectedTemplate.content) : [];
  const selectedType = filteredTypes.find(t => t.code === documentType);
  const hasDefaultTemplate = !!selectedType?.meta.default_template_id;

  // Jenis surat dipilih (atau berubah) -> pakai Template Default yang
  // diatur di "Kelola Jenis Surat" (meta.default_template_id) TANPA user
  // pilih sendiri - dropdown Template SENGAJA dihilangkan dari form ini
  // (dulu ada, user bisa pilih bebas template mana saja lepas dari jenis
  // suratnya - membingungkan dan bikin templatenya tidak konsisten per
  // jenis surat). Kalau jenis ini belum ada Template Default-nya,
  // templateId tetap kosong -> fallback ke "Isi Surat" manual di bawah.
  useEffect(() => {
    setTemplateId(selectedType?.meta.default_template_id ?? "");
  }, [documentType, selectedType]);

  function handleSubmit() {
    if (!documentType) { setError("Pilih jenis surat."); return; }
    if (!title.trim()) { setError("Judul surat wajib diisi."); return; }
    if (employeeLinked && !employee) { setError("Pilih employee tujuan surat."); return; }

    setError(null);
    createDocument.mutate({
      document_type: documentType,
      title: title.trim(),
      template_id: templateId || undefined,
      // employee_name selalu diikutkan supaya template bisa pakai
      // {{employee_name}} tanpa user ketik ulang nama yang sudah dipilih
      // lewat picker di atas.
      field_data: templateId ? { ...fieldData, ...(employeeLinked && employee ? { employee_name: employee.full_name } : {}) } : undefined,
      body_html: !templateId ? manualBody : undefined,
      // organization_id TIDAK dikirim - sudah otomatis dari org yang
      // ditentukan saat login (X-Organization-Id, lihat api-client.ts
      // interceptor + ScopesOrganization trait di backend), bukan pilihan
      // manual per surat.
      issued_to_type: employeeLinked ? "employee" : undefined,
      issued_to_ref: employeeLinked && employee ? String(employee.id) : undefined,
      issued_to_name: employeeLinked ? employee?.full_name : (issuedToName || undefined),
      issued_date: issuedDate || undefined,
    }, {
      onSuccess: onCreated,
      onError: e => setError(extractErrorMessage(e)),
    });
  }

  return (
    <Modal title="Buat Surat Baru" onClose={onClose} maxWidth={560}>
      {!lockDocumentType && (
        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label">Jenis Surat</label>
          <select className="input" style={{ width: "100%" }} value={documentType} onChange={e => setDocumentType(e.target.value)}>
            <option value="">— Pilih —</option>
            {filteredTypes.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
          </select>
        </div>
      )}

      {/* Cabang/kop surat TIDAK dipilih di sini - sudah ditentukan saat
          login (lihat organization-context.tsx), cuma ditampilkan supaya
          user tahu surat ini akan diterbitkan atas nama cabang mana. */}
      {activeOrg && (
        <div style={{ fontSize: "0.78rem", color: "var(--grey)", marginBottom: "1rem" }}>
          Cabang: <strong>{activeOrg.name}</strong>
        </div>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <label className="input-label">Judul Surat</label>
        <input className="input" style={{ width: "100%" }} value={title} onChange={e => setTitle(e.target.value)} placeholder="mis. Surat Keterangan Kerja Sama" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label className="input-label">Ditujukan Kepada</label>
          {employeeLinked ? (
            !employee || pickingEmployee ? (
              <EmployeePicker onSelect={emp => { setEmployee(emp); setPickingEmployee(false); }} onCancel={() => setPickingEmployee(false)} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.7rem", background: "var(--bg-subtle)", borderRadius: 6 }}>
                <div style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600 }}>{employee.full_name}</div>
                <button type="button" className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }} onClick={() => setPickingEmployee(true)}>Ganti</button>
              </div>
            )
          ) : (
            <input className="input" style={{ width: "100%" }} value={issuedToName} onChange={e => setIssuedToName(e.target.value)} placeholder="mis. PT Contoh Vendor" />
          )}
        </div>
        <div>
          <label className="input-label">Tanggal Surat</label>
          <input className="input" type="date" style={{ width: "100%" }} value={issuedDate} onChange={e => setIssuedDate(e.target.value)} />
        </div>
      </div>

      {/* Template TIDAK dipilih manual di sini - otomatis ikut Template
          Default jenis surat ini (diatur di Core Platform > Kelola Jenis
          Surat). Kalau jenis surat belum punya Template Default, tampilkan
          keterangan supaya admin tahu harus mengaturnya dulu di sana kalau
          mau isi surat ini otomatis dari template. */}
      {documentType && !hasDefaultTemplate && (
        <div style={{
          marginBottom: "1rem", fontSize: "0.8rem", color: "#92600a",
          background: "#fff7e6", border: "1px solid #f5d78e", borderRadius: 6, padding: "0.6rem 0.75rem",
        }}>
          Jenis surat ini belum memiliki Template Default. Pilih dulu template surat untuk jenis ini di{" "}
          <strong>Core Platform → Kelola Jenis Surat</strong> jika ingin memakainya - untuk sekarang, isi surat bisa
          diketik manual di bawah atau cukup dilampirkan sebagai file setelah surat dibuat.
        </div>
      )}

      {templateId && placeholders.length > 0 && (
        <div style={{ marginBottom: "1rem", border: "1px solid var(--border)", borderRadius: 8, padding: "0.75rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--grey)" }}>ISI VARIABEL TEMPLATE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {placeholders.map(name => {
              const isMultiline =
                name.toLowerCase().includes("isi") ||
                name.toLowerCase().includes("body") ||
                name.toLowerCase().includes("keterangan") ||
                name.toLowerCase().includes("deskripsi") ||
                name.toLowerCase().includes("catatan") ||
                name.toLowerCase().includes("rincian") ||
                name.toLowerCase().includes("pesan");

              return (
                <div key={name}>
                  <label className="input-label" style={{ textTransform: "capitalize" }}>
                    {name.replace(/_/g, " ")}
                  </label>
                  {isMultiline ? (
                    <textarea
                      className="input"
                      style={{ width: "100%", minHeight: 120, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
                      rows={5}
                      placeholder={`Ketik ${name.replace(/_/g, " ")} (bisa tekan Enter untuk baris baru)...`}
                      value={fieldData[name] ?? ""}
                      onChange={e => setFieldData(prev => ({ ...prev, [name]: e.target.value }))}
                    />
                  ) : (
                    <input
                      className="input"
                      style={{ width: "100%" }}
                      value={fieldData[name] ?? ""}
                      onChange={e => setFieldData(prev => ({ ...prev, [name]: e.target.value }))}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!templateId && (
        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label">Isi Surat (opsional — boleh kosong kalau isi surat cuma dilampirkan sebagai file setelah surat dibuat)</label>
          <textarea className="input" style={{ width: "100%", minHeight: 90 }} value={manualBody} onChange={e => setManualBody(e.target.value)} />
        </div>
      )}

      {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn btn-primary" disabled={createDocument.isPending} onClick={handleSubmit}>
          {createDocument.isPending ? "Menyimpan..." : "Simpan Draft"}
        </button>
      </div>
    </Modal>
  );
}
