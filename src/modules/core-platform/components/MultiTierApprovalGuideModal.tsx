import { 
  Layers, X, CheckCircle2, ArrowRight, ShieldCheck, 
  Users, UserCheck, AlertTriangle, Clock, GitCommit, Sparkles
} from "lucide-react";

interface MultiTierApprovalGuideModalProps {
  onClose: () => void;
}

export function MultiTierApprovalGuideModal({ onClose }: MultiTierApprovalGuideModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-[#1e293b] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">Panduan Aturan Multi-Tier Approval</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Dokumentasi
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Prinsip kerja hierarki persetujuan berjenjang dan jenis otorisasi di MSDC ERP.
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* KONTEN UTAMA (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 text-xs text-slate-600 leading-relaxed">
          
          {/* SECTION 1: APA ITU MULTI-TIER? */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Sparkles size={16} className="text-amber-500" />
              <h3>Konsep Dasar Multi-Tier Approval</h3>
            </div>
            <p>
              <strong>Multi-Tier Approval</strong> adalah alur persetujuan dokumen yang berjalan secara bertingkat/sekuensial (Level 1 $\rightarrow$ Level 2 $\rightarrow$ Level 3). Dokumen yang diajukan oleh pengguna tidak akan dinyatakan resmi/selesai sebelum seluruh tier wajib selesai diverifikasi oleh pihak berwenang.
            </p>
            
            {/* Visualisasi Mini Alur */}
            <div className="pt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-center font-bold text-[11px]">
                <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs text-slate-700">
                  📄 Dokumen Diajukan
                </div>
                <ArrowRight size={14} className="text-slate-400 shrink-0" />
                <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-700">
                  Tier 1: Review Teknis
                </div>
                <ArrowRight size={14} className="text-slate-400 shrink-0" />
                <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-blue-700">
                  Tier 2: Head Dept
                </div>
                <ArrowRight size={14} className="text-slate-400 shrink-0" />
                <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-700">
                  Tier 3: Finance / BOD
                </div>
                <ArrowRight size={14} className="text-slate-400 shrink-0" />
                <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg shadow-xs">
                  ✅ Selesai / Approved
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: 4 TIPE APPROVER */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <UserCheck size={16} className="text-blue-600" />
              <h3>4 Tipe Approver yang Didukung</h3>
            </div>
            <p>
              Saat merancang tiap level persetujuan di visual designer, Anda dapat memilih tipe approver berikut:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-[12px]">
                  <Users size={14} className="text-amber-500" />
                  <span>1. Role-based (Peran)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Dokumen akan masuk ke semua user yang memegang Role tertentu (misal: <em>Finance Manager</em> atau <em>Procurement Specialist</em>).
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-[12px]">
                  <ShieldCheck size={14} className="text-blue-500" />
                  <span>2. Department Head</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Sistem otomatis mencari Kepala Departemen dari staf yang mengajukan dokumen secara dinamis.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-[12px]">
                  <UserCheck size={14} className="text-emerald-500" />
                  <span>3. Specific User</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Ditugaskan langsung kepada satu nama akun pegawai spesifik yang tidak boleh diwakilkan.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-[12px]">
                  <GitCommit size={14} className="text-purple-500" />
                  <span>4. Dynamic Field</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Approver ditentukan dari kolom formulir dokumen (misalnya: PIC Vendor, Manajer Site Data Center tujuan).
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 3: ATURAN EVALUASI & REJECTION */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <AlertTriangle size={16} className="text-rose-500" />
              <h3>Aturan Penolakan (Reject) & Eskalasi SLA</h3>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-800">Prinsip Strict Sequential:</strong> Dokumen di Tier 2 tidak akan pernah muncul di daftar approval atasan sebelum Tier 1 memberikan konfirmasi setuju.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-800">Dampak Penolakan (Reject):</strong> Jika salah satu tier menolak dokumen, alur workflow otomatis terhenti seketika (status: <em>Rejected</em>). Dokumen dikembalikan ke pemohon lengkap dengan catatan alasan penolakan.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-800">Batas Waktu (SLA):</strong> Tiap level dapat memiliki SLA waktu (mis. 24 jam). Jika lewat batas, sistem memicu pengingat bot otomatis atau eskalasi ke tier berikutnya.
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: CONTOH KASUS DI MSDC */}
          <section className="bg-amber-50/50 border border-amber-200/80 p-5 rounded-2xl space-y-2.5">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-amber-800">
              📌 Contoh Kasus: Alur Approval Purchase Order (PO)
            </div>
            <p className="text-slate-700">
              Untuk pengadaan barang inventaris senilai <strong>Rp 75.000.000</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Level 1 (Staff Buyer):</strong> Memvalidasi vendor quotation terendah & ketersediaan stok.</li>
              <li><strong>Level 2 (Head of Procurement):</strong> Otorisasi pemilihan rekanan resmi.</li>
              <li><strong>Level 3 (Finance Manager):</strong> Memeriksa alokasi anggaran kas perusahaan.</li>
              <li><strong>Level 4 (Managing Director):</strong> Persetujuan final karena nominal di atas ambang batas (Threshold {'>'} Rp 50 Juta).</li>
            </ul>
          </section>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            MSDC Enterprise Workflow Engine • Core Platform
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}