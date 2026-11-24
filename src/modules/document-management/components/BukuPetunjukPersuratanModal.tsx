import { useState } from "react";
import { 
  BookOpen, X, GitMerge, Hash, ShieldAlert, FileCheck, 
  CheckCircle2, AlertTriangle, FileText, 
  Clock, Shield, Sparkles, UploadCloud
} from "lucide-react";

interface BukuPetunjukPersuratanModalProps {
  onClose: () => void;
}

type TabKey = "disposisi" | "penomoran" | "klasifikasi" | "berkas";

export function BukuPetunjukPersuratanModal({ onClose }: BukuPetunjukPersuratanModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("disposisi");

  const tabs: { key: TabKey; label: string; icon: typeof GitMerge }[] = [
    { key: "disposisi", label: "Alur Disposisi", icon: GitMerge },
    { key: "penomoran", label: "Format Penomoran", icon: Hash },
    { key: "klasifikasi", label: "Klasifikasi & Derajat", icon: ShieldAlert },
    { key: "berkas", label: "Ketentuan Berkas", icon: FileCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-[#1e293b] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">Buku Petunjuk Tata Kelola Persuratan</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Pedoman Resmi
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Standar operasional prosedur penerimaan, penomoran agenda, disposisi, dan digitalisasi berkas MSDC ERP.
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

        {/* TAB NAVIGATION */}
        <div className="px-6 border-b border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto shrink-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`py-3.5 px-3.5 flex items-center gap-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? "border-amber-500 text-amber-600 bg-white" 
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon size={15} className={isActive ? "text-amber-500" : "text-slate-400"} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6 text-xs text-slate-600 leading-relaxed">
          
          {/* ================= TAB 1: ALUR DISPOSISI ================= */}
          {activeTab === "disposisi" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <GitMerge size={16} className="text-amber-600" />
                  <h3>Alur Distribusi &amp; Lembar Disposisi Surat Masuk</h3>
                </div>
                <p>
                  Setiap dokumen fisik maupun elektronik yang masuk dari pihak eksternal wajib melalui 4 tahapan berurutan berikut agar memiliki rekam jejak legal:
                </p>
              </div>

              {/* 4 Langkah Bertingkat */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tahap 1 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">1</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tahap Penerimaan</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Penerimaan Fisik &amp; Ekspedisi</h4>
                  <p className="text-[11px] text-slate-500">
                    Surat diterima oleh resepsionis / sekretariat. Petugas memeriksa kelengkapan fisik, amplop, tujuan pengirim, dan menandatangani tanda terima kurir.
                  </p>
                </div>

                {/* Tahap 2 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">2</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pencatatan Sistem</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Pencatatan Agenda &amp; Scan Digital</h4>
                  <p className="text-[11px] text-slate-500">
                    Petugas menginput data surat ke menu <strong>Surat Masuk</strong> (tombol <em>+ Surat Baru</em>). Sistem menerbitkan <strong>Nomor Agenda Unik</strong> dan berkas scan PDF diunggah.
                  </p>
                </div>

                {/* Tahap 3 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">3</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instruksi Pimpinan</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Disposisi Pimpinan / Direksi</h4>
                  <p className="text-[11px] text-slate-500">
                    Surat masuk diteruskan ke Pimpinan terkait. Pimpinan mengisi lembar disposisi digital (arahan: <em>Tindak lanjuti, Hadiri rapat, Kordinasikan, atau Simpan sebagai arsip</em>).
                  </p>
                </div>

                {/* Tahap 4 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">4</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Eksekusi</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Tindak Lanjut Unit Kerja</h4>
                  <p className="text-[11px] text-slate-500">
                    Kepala Unit/Departemen yang menerima disposisi menugaskan staf untuk mengeksekusi instruksi hingga tuntas, lalu mengupdate status surat menjadi <strong>Terdisposisi (Approved)</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: FORMAT PENOMORAN ================= */}
          {activeTab === "penomoran" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Hash size={16} className="text-blue-600" />
                  <h3>Standar Baku Format Penomoran Agenda Surat</h3>
                </div>
                <p>
                  Seluruh surat resmi yang diterbitkan maupun diagendakan di MSDC ERP menggunakan struktur format 5 segmen standar:
                </p>

                {/* Visual Kotak Format */}
                <div className="p-4 bg-slate-900 rounded-2xl text-center space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Struktur Penomoran Agenda</span>
                  <div className="text-base sm:text-lg font-mono font-bold text-amber-400 tracking-wider">
                    [KODE] / [NOMOR URUT] / [KODE DEPT] / [BULAN ROMAWI] / [TAHUN]
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400">
                    Contoh: SM / 0142 / OPS / X / 2026
                  </div>
                </div>
              </div>

              {/* Tabel Bedah Komponen */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800">
                  Rincian 5 Segmen Penomoran
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-3.5 flex items-start gap-4">
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-24 text-center shrink-0">SM</span>
                    <div>
                      <strong className="text-slate-800">Kode Klasifikasi Surat:</strong> Menandakan jenis naskah dinas (<code className="font-mono text-slate-700">SM</code>: Surat Masuk, <code className="font-mono text-slate-700">SK</code>: Surat Keluar, <code className="font-mono text-slate-700">ND</code>: Nota Dinas, <code className="font-mono text-slate-700">SP</code>: Surat Perintah).
                    </div>
                  </div>

                  <div className="p-3.5 flex items-start gap-4">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 w-24 text-center shrink-0">0142</span>
                    <div>
                      <strong className="text-slate-800">Nomor Urut Buku Agenda:</strong> Dibuat otomatis oleh sistem (<em>Number Sequence</em>) berurutan 4 digit mulai dari 0001 dan direset setiap awal tahun kalender.
                    </div>
                  </div>

                  <div className="p-3.5 flex items-start gap-4">
                    <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 w-24 text-center shrink-0">OPS</span>
                    <div>
                      <strong className="text-slate-800">Kode Unit Pemrakarsa / Tujuan:</strong> Singkatan resmi departemen terkait (<code className="font-mono text-slate-700">OPS</code>: Operations DC, <code className="font-mono text-slate-700">FIN</code>: Finance, <code className="font-mono text-slate-700">HRD</code>: Human Resource, <code className="font-mono text-slate-700">DIR</code>: Direksi).
                    </div>
                  </div>

                  <div className="p-3.5 flex items-start gap-4">
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-24 text-center shrink-0">X</span>
                    <div>
                      <strong className="text-slate-800">Bulan Romawi:</strong> Bulan pencatatan dokumen menggunakan angka romawi (I s/d XII).
                    </div>
                  </div>

                  <div className="p-3.5 flex items-start gap-4">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-24 text-center shrink-0">2026</span>
                    <div>
                      <strong className="text-slate-800">Tahun Penerbitan:</strong> 4 digit tahun masehi berjalan saat surat didaftarkan.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: KLASIFIKASI & DERAJAT ================= */}
          {activeTab === "klasifikasi" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <ShieldAlert size={16} className="text-rose-500" />
                  <h3>Derajat Kecepatan &amp; Kerahasiaan Surat</h3>
                </div>
                <p>
                  Tingkat perlakuan surat masuk dibagi menjadi 3 kategori prioritas untuk menentukan batas waktu respon (SLA) staf:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Biasa */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">BIASA</span>
                    <Clock size={15} className="text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">Derajat Biasa / Rutin</h4>
                  <p className="text-[11px] text-slate-500">
                    Surat edaran umum, brosur promosi rekanan, atau permohonan informasi umum yang tidak membutuhkan tindakan darurat.
                  </p>
                  <div className="pt-2 border-t border-slate-100 font-semibold text-[10px] text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Target SLA: 3 - 5 Hari Kerja
                  </div>
                </div>

                {/* Segera */}
                <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-2.5 bg-amber-50/20">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">SEGERA</span>
                    <AlertTriangle size={15} className="text-amber-600" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">Derajat Segera (Penting)</h4>
                  <p className="text-[11px] text-slate-500">
                    Undangan rapat mendadak, surat tagihan/invoice jatuh tempo, atau surat konfirmasi operasional site data center.
                  </p>
                  <div className="pt-2 border-t border-amber-100 font-semibold text-[10px] text-amber-700 flex items-center gap-1">
                    <Clock size={12} /> Target SLA: Maksimal 24 Jam
                  </div>
                </div>

                {/* Rahasia */}
                <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs space-y-2.5 bg-rose-50/20">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">RAHASIA</span>
                    <Shield size={15} className="text-rose-600" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">Derajat Rahasia (Confidential)</h4>
                  <p className="text-[11px] text-slate-500">
                    Dokumen tender rahasia, audit hukum/legal, berkas kepegawaian sensitif, atau nota keuangan terbatas.
                  </p>
                  <div className="pt-2 border-t border-rose-100 font-semibold text-[10px] text-rose-700 flex items-center gap-1">
                    <ShieldAlert size={12} /> Khusus Pimpinan Tertentu
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: KETENTUAN BERKAS DIGITAL ================= */}
          {activeTab === "berkas" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <FileCheck size={16} className="text-emerald-600" />
                  <h3>Ketentuan Unggah Lampiran &amp; Berkas Pindaian (Scan)</h3>
                </div>
                <p>
                  Setiap dokumen fisik wajib dipindai agar tersimpan di sistem arsip digital MSDC ERP sesuai standar:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <FileText size={15} className="text-blue-500" />
                    <span>Format Ekstensi Berkas</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Wajib menggunakan format <strong>PDF (.pdf)</strong> sebagai berkas utama. Untuk surat 1 halaman, diperbolehkan gambar <strong>JPG / PNG</strong> berkualitas tinggi.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <UploadCloud size={15} className="text-amber-500" />
                    <span>Batas Ukuran Maksimal</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Batas kapasitas maksimal berkas adalah <strong>10 MB</strong> per berkas dokumen untuk menjaga efisiensi penyimpanan server dan kecepatan pratinjau.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <Sparkles size={15} className="text-purple-500" />
                    <span>Standar Kualitas Scan</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Gunakan resolusi pemindai <strong>200 s/d 300 DPI</strong> dengan orientasi tegak (<em>Portrait</em>). Pastikan teks, nomor registrasi, dan stempel fisik terbaca jernih.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <CheckCircle2 size={15} className="text-emerald-500" />
                    <span>Penyimpanan Fisik Asli</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Surat fisik asli tetap wajib diarsipkan ke dalam <em>Bindex / Ordner</em> lemari arsip sesuai nomor agenda urut setelah proses pemindaian selesai.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER MODAL */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            SOP Tata Naskah Dinas &amp; Persuratan • MSDC ERP
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}