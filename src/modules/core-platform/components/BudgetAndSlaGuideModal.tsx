import { 
  Sliders, X, Clock, CheckCircle2, ShieldAlert, 
  Code2, Calculator, Timer, Zap, AlertTriangle, ArrowRight
} from "lucide-react";

interface BudgetAndSlaGuideModalProps {
  onClose: () => void;
}

export function BudgetAndSlaGuideModal({ onClose }: BudgetAndSlaGuideModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-[#1e293b] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Sliders size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">Panduan Rumus Kondisi Budget & SLA</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Engine Logic
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Konfigurasi batas nominal otomatis, evaluasi ekspresi, dan eskalasi batas waktu.
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
          
          {/* SECTION 1: CARA KERJA KONDISI DINAMIS */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Calculator size={16} className="text-blue-600" />
              <h3>1. Logika Kondisi Dinamis (*Conditional Branching*)</h3>
            </div>
            <p>
              Setiap level/node approval tidak harus selalu dijalankan. Dengan memasang <strong>Rumus Kondisi</strong>, sistem hanya akan mengaktifkan tier tersebut jika nilai dokumen memenuhi syarat yang ditentukan. Jika tidak memenuhi, level akan dilewati (*auto-bypass*) secara otomatis.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
                <div className="font-bold text-blue-900 text-[11px] flex items-center gap-1.5">
                  <Zap size={13} className="text-blue-600" />
                  Kondisi Bernilai TRUE (Aktif)
                </div>
                <p className="text-[11px] text-blue-800">
                  Dokumen wajib diapprove oleh pihak di level ini sebelum lanjut ke level berikutnya.
                </p>
              </div>

              <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                  <ArrowRight size={13} className="text-slate-500" />
                  Kondisi Bernilai FALSE (Bypass)
                </div>
                <p className="text-[11px] text-slate-600">
                  Level dilewati otomatis tanpa mengganggu alur dokumen, langsung loncat ke tier di atasnya.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2: SINTAKS RUMUS DAN CONTOH */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Code2 size={16} className="text-amber-500" />
              <h3>2. Variabel & Format Rumus yang Didukung</h3>
            </div>
            <p>
              Gunakan nama variabel dari dokumen transaksi yang sedang diajukan. Operator yang didukung: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">{">"}</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">{">="}</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">{"<"}</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">{"=="}</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">{"&&"}</code> (dan).
            </p>

            <div className="space-y-2 pt-1 font-mono text-[11px]">
              <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-1">
                <div className="text-[10px] text-amber-400 font-sans font-bold">Contoh 1: Filter Nilai Transaksi (Threshold)</div>
                <div className="text-emerald-400">total_amount &gt; 50000000</div>
                <div className="text-[10px] text-slate-400 font-sans">Level ini hanya aktif jika total nilai dokumen di atas Rp 50 Juta.</div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-1">
                <div className="text-[10px] text-amber-400 font-sans font-bold">Contoh 2: Kombinasi Nilai & Kategori Pengadaan</div>
                <div className="text-emerald-400">total_amount &gt;= 100000000 && is_capex == true</div>
                <div className="text-[10px] text-slate-400 font-sans">Khusus pengadaan Belanja Modal (Capex) dengan nilai minimal Rp 100 Juta.</div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-1">
                <div className="text-[10px] text-amber-400 font-sans font-bold">Contoh 3: Spesifik Departemen</div>
                <div className="text-emerald-400">department_code == "DCO"</div>
                <div className="text-[10px] text-slate-400 font-sans">Level khusus untuk validasi internal Data Center Operations.</div>
              </div>
            </div>
          </section>

          {/* SECTION 3: ATURAN SLA & ESKALASI */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Timer size={16} className="text-purple-600" />
              <h3>3. Batas Waktu SLA (Service Level Agreement) & Eskalasi</h3>
            </div>
            
            <p>
              Tiap level memiliki target waktu penyelesaian (dihitung dalam satuan <strong>Jam Kerja</strong>). Status SLA dapat dipantau di halaman approval:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="font-bold text-emerald-800 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  On Track
                </div>
                <div className="text-[10px] text-emerald-700 mt-1">Masih dalam batas aman waktu SLA.</div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="font-bold text-amber-800 text-[11px] flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-600" />
                  Due Soon
                </div>
                <div className="text-[10px] text-amber-700 mt-1">Sisa waktu kurang dari 4 jam kerja.</div>
              </div>

              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="font-bold text-rose-800 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-rose-600" />
                  Overdue / Breached
                </div>
                <div className="text-[10px] text-rose-700 mt-1">Melebihi batas toleransi SLA.</div>
              </div>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl space-y-1 mt-2">
              <div className="font-bold text-purple-900 text-[11px] flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-purple-600" />
                Mekanisme Eskalasi Otomatis
              </div>
              <p className="text-[11px] text-purple-800">
                Ketika status menjadi <strong>Overdue</strong>, sistem akan secara otomatis melayangkan notifikasi berkala ke approver bersangkutan dan menduplikasi hak otorisasi ke atasan langsung (mis. Supervisor $\rightarrow$ Manager) agar alur bisnis tidak macet.
              </p>
            </div>
          </section>

          {/* SECTION 4: TABEL STANDAR THRESHOLD MSDC */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-700">
              📊 Rekomendasi Matriks Batas Budget MSDC ERP
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Tingkat Tier</th>
                    <th className="p-2.5">Rentang Nominal</th>
                    <th className="p-2.5">Otorisator Default</th>
                    <th className="p-2.5 text-right">Target SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  <tr>
                    <td className="p-2.5 font-bold text-slate-900">Tier 1</td>
                    <td className="p-2.5 font-mono">&lt; Rp 10.000.000</td>
                    <td className="p-2.5">Supervisor Pemohon</td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">12 Jam</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-900">Tier 2</td>
                    <td className="p-2.5 font-mono">Rp 10 Juta - Rp 50 Juta</td>
                    <td className="p-2.5">Head of Department</td>
                    <td className="p-2.5 text-right font-bold text-blue-600">24 Jam</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-900">Tier 3</td>
                    <td className="p-2.5 font-mono">Rp 50 Juta - Rp 250 Juta</td>
                    <td className="p-2.5">Finance Manager &amp; GM</td>
                    <td className="p-2.5 text-right font-bold text-amber-600">48 Jam</td>
                  </tr>
                  <tr className="bg-amber-50/40">
                    <td className="p-2.5 font-bold text-slate-900">Tier 4</td>
                    <td className="p-2.5 font-mono font-bold text-rose-600">&gt; Rp 250.000.000</td>
                    <td className="p-2.5 font-bold text-slate-900">Direksi / Managing Director</td>
                    <td className="p-2.5 text-right font-bold text-purple-600">72 Jam</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            SLA &amp; Threshold Engine • MSDC ERP Platform
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Mengerti &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  );
}