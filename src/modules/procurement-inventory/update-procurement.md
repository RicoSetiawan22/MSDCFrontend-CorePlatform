ATURAN MUTLAK (WAJIB DIPATUHI):
1. Saya adalah frontend developer. JANGAN membuat, mengubah, atau menyarankan kode backend (database, SQL, Prisma schema, API routes, server logic). Fokus 100% hanya pada kode React, TypeScript, dan Tailwind CSS di sisi klien.
2. SCOPE MODUL: Perubahan HANYA boleh dilakukan di dalam scope modul "Procurement & Inventory". 
   - File yang boleh diubah HANYA yang berada di D:\===CODING===\MAGANG\JTV - Copy\MSDCFrontend\src\modules\procurement-inventory
   - JANGAN menyentuh file atau komponen yang berkaitan dengan modul lain (seperti Finance, HR, CRM atau Global Master Data, dan lainnya selain modul procurement-inventory)
3. Jika ada instruksi di file yang ambigu atau butuh konfirmasi, tanyakan kepada saya sebelum menggenerate kode.

A. Master Data
1. Vendor (Tambah Vendor Baru)

Sudah ada: dokumen legalitas, nama vendor, badan hukum, status pajak, NPWP, kategori, payment term, rekening bank, catatan.

Perlu ditambah:

[Wajib] Kontak vendor: nama PIC, jabatan, no. telepon/WhatsApp, email. Ini dasar untuk RFQ, PO, dan klaim garansi, tapi belum ada.
[Wajib] Alamat lengkap (alamat, kota, provinsi, kode pos).
[Wajib] Logika kondisional pajak: jika status PKP, maka NPWP dan No. SPPKP wajib diisi dan upload SPPKP wajib. Jika Non-PKP, NPWP opsional.
[Wajib] Validasi NPWP. Pada list terlihat NPWP seperti 123124 dan 888888. Terima format 15 digit dan 16 digit (NPWP baru berbasis NIK), dengan input mask dan cek jumlah digit.
[Wajib] Validasi payment term. Di list ada “Net 111111 hari”, jadi perlu batas (misalnya 0–180) atau dropdown (COD, Net 7/14/30/45/60).
[Wajib] Deteksi duplikat berdasarkan NPWP atau nama + badan hukum.
[Disarankan] Jenis PPh default (PPh 23 untuk jasa, PPh 22, dll.) supaya otomatis terisi di FPP.
[Disarankan] Mata uang, limit kredit, status (Aktif / Blacklist / Ditangguhkan), website, NIB/SIUP, rating atau evaluasi vendor.
[Disarankan] Kategori vendor multi-select (satu vendor bisa Hardware sekaligus Jasa).
[Disarankan] Validasi nama pemilik rekening (A.N.) harus sesuai nama badan hukum, dan field bank dibuat satu paket (kalau satu diisi, semua wajib).
2. Item & Inventory (Tambah Item Baru)

Sudah ada: unit of measure, nama item, tipe item, reorder point, reorder qty, catatan.

Perlu ditambah:

[Wajib] UOM sebagai dropdown dari master satuan, bukan teks bebas. Sekarang rawan “pcs”, “Pcs”, “pieces”.
[Wajib] Kategori/sub-kategori dan deskripsi/spesifikasi item.
[Wajib] Flag “Item ini dicatat sebagai Aset?” dan tracking type (tanpa tracking / serial number / batch). Ini menentukan apakah checkbox “Beri Kode Barang” di FSTB muncul.
[Wajib] Validasi nama: minimal panjang tertentu dan cek duplikat. Di list ada dua item “pigsat” dan nama sangat pendek (“ac”, “pc”).
[Disarankan] Kode SKU/barcode (tampilkan walau auto), harga standar atau harga pembelian terakhir, default vendor, default warehouse, lokasi rak/bin.
[Disarankan] Max stock, lead time, konversi UOM (misalnya 1 box = 12 pcs), shelf life/expiry jika relevan, foto, status aktif/nonaktif.
[Disarankan] Validasi reorder qty ≥ reorder point, dan jumlah desimal mengikuti UOM (pcs = bulat, roll/meter = desimal).
3. Warehouse (Tambah Warehouse Baru)

Sudah ada: nama, tipe gudang, kapasitas, keterangan, alamat, telepon, PIC.

Perlu ditambah:

[Wajib] Validasi nama unik. Sekarang ada dua gudang bernama “Gudang MSDC Surabaya” (WH-Main dan WH-001), sehingga di dropdown Transfer dan Penyesuaian user tidak bisa membedakannya. Tampilkan kode + nama di semua dropdown.
[Wajib] Validasi alamat minimal panjang (data “aaaa” lolos).
[Wajib] Tipe gudang dan kapasitas diwajibkan. Di list keduanya “—”, dan Total Kapasitas jadi 0 m³.
[Disarankan] Flag “Gudang Utama / default” (kartu “Gudang Utama” di header sekarang 0).
[Disarankan] Site/Cabang induk (berhubungan dengan field Site di Asset), format telepon, status aktif/nonaktif di form, jam operasional.
B. Transaksi Pengadaan
4. Purchase Request (FPR Baru)

Sudah ada: diajukan atas nama, tujuan, departemen, cost center, lampiran, daftar barang/jasa (item, deskripsi, qty, satuan, estimasi).

Perlu ditambah:

[Wajib] Estimasi harga wajib > 0. Ada PR “bersih bersih” dengan estimasi Rp 0.
[Wajib] Tanggal dibutuhkan dan prioritas (Normal/Urgent). Ini dipakai untuk menentukan urgensi RFQ.
[Wajib] Satuan dinamis. Saat tab “Jasa/Service” dipilih, satuan tidak boleh tetap “pcs” (pakai paket/jam/hari/kali). Di Service Log terlihat jasa “perbaikan printer” berkuantitas “3.00 pcs”.
[Wajib] Total estimasi otomatis dihitung per baris dan keseluruhan, plus cek terhadap budget cost center.
[Wajib] Alasan/justifikasi, terutama untuk item di luar master atau nominal besar.
[Disarankan] Jenis kebutuhan (restock stok / aset baru / habis pakai / jasa), warehouse atau lokasi pengiriman, preferred vendor (opsional), link ke item master (item baru bisa “usulkan item baru”).
[Disarankan] Satuan harga vs total harga per baris, referensi PR otomatis dari reorder point (“Pengadaan kolektif stok kritis” sudah mengarah ke sini).
[Disarankan] Validasi lampiran (tipe dan ukuran), dan batas minimal satu baris item.
5. RFQ / Vendor Quotation

Screenshot hanya menampilkan daftar PR approved, belum ada form. Form yang dibutuhkan:

[Wajib] Pilih minimal 2–3 vendor untuk dibandingkan (atau alasan jika hanya 1).
[Wajib] Per vendor dan per item: harga satuan, qty yang ditawarkan, diskon, PPN, ongkos kirim, lead time, masa berlaku penawaran, payment term, garansi.
[Wajib] Upload dokumen penawaran vendor, dan alasan pemilihan pemenang (justifikasi) untuk audit.
[Disarankan] Deadline penawaran, tabel komparasi otomatis (harga terendah ditandai), scoring (harga/kualitas/waktu).
6. Purchase Order

PO dibuat otomatis dari RFQ, tetapi tetap perlu form ringan:

[Wajib] Alasan pembatalan saat status “Dibatalkan” (PO-SBY-26.003-023 dibatalkan tanpa terlihat alasannya).
[Disarankan] Alamat/warehouse pengiriman, tanggal estimasi pengiriman (kolom Est. Delivery masih “—”), payment term, syarat dan ketentuan, PPN dan diskon, catatan untuk vendor.
7. Payment Request (FPP Baru)

Sudah ada: PO, jenis pembayaran (DP/Pelunasan), persentase, jumlah diminta, potongan pajak, metode pembayaran, dokumen pendukung.

Perlu ditambah:

[Wajib] Dokumen pendukung diubah dari textarea menjadi upload file. Placeholder-nya “Kwitansi DP, Faktur Proforma”, tapi field-nya teks, padahal itu dokumen.
[Wajib] Tampilkan total PO, sudah dibayar, dan sisa tagihan, dengan validasi jumlah ≤ sisa.
[Wajib] Persentase dan jumlah saling sinkron (isi salah satu, yang lain terhitung otomatis).
[Wajib] No. invoice/faktur vendor dan tanggal invoice, serta tanggal jatuh tempo (dihitung dari payment term vendor).
[Wajib] 3-way matching untuk Pelunasan: cek PO ↔ GRN ↔ Invoice. Pelunasan hanya boleh jika barang sudah diterima (GRN posted).
[Disarankan] Rekening tujuan otomatis dari master vendor (read-only dan bisa dikonfirmasi), jenis pajak terpisah (PPN, PPh 21/23/4(2)) dengan nilai dan persentase, nomor faktur pajak.
[Disarankan] Catatan, dan rincian approval chain yang akan dilewati sebelum submit.
8. History PO

Halaman read-only, tapi layak ditambah filter rentang tanggal, filter vendor, dan export (Excel/PDF).

9. Goods Receipt (GRN)

Belum terlihat form-nya. Field yang dibutuhkan:

[Wajib] No. surat jalan vendor dan tanggal terima.
[Wajib] Per baris item: qty dipesan, qty diterima, qty ditolak, alasan penolakan. Ini mendukung partial receipt.
[Wajib] Warehouse tujuan dan kondisi barang (baik/rusak).
[Wajib] Kolom “Diterima Oleh” di list ada yang kosong (“—”), jadi penerima harus wajib.
[Disarankan] Serial number/batch/expiry (mengikuti tracking type item), foto atau upload surat jalan dan BAST, catatan.
C. Distribusi Barang & Aset
10. Serah Terima Barang (FSTB Baru)

Sudah ada: GRN, baris barang (qty + checkbox kode barang), diterima oleh, catatan.

Perlu ditambah:

[Wajib] Tanggal serah terima dan unit kerja/departemen penerima. Subjudul form menyebut “employee/unit kerja” tapi field unit kerja tidak ada.
[Wajib] Validasi qty ≤ sisa tersedia, dan tampilkan sisa yang belum diserahkan.
[Wajib] Jika “Beri Kode Barang” dicentang: field serial number (satu per unit) dan kategori aset muncul, supaya otomatis terdaftar di Asset Maintenance.
[Disarankan] Lokasi penempatan, bukti tanda terima (tanda tangan digital atau upload BAST), cost center yang dibebani.
[Disarankan] Dropdown GRN hanya menampilkan GRN yang masih punya sisa barang untuk diserahkan.
11. Garansi Barang (FGBG – Klaim Baru)

Sudah ada: PO, tanggal pembelian dan garansi s.d., tanggal klaim, plus aksi “Bukti” di list.

Perlu ditambah:

[Wajib] Pilih item/aset spesifik dari PO (field barang tidak terlihat di form), beserta serial number.
[Wajib] Deskripsi kerusakan/masalah. Ini inti klaim tapi belum ada.
[Wajib] Upload bukti langsung di form (foto, invoice, kartu garansi), jangan hanya sebagai aksi terpisah.
[Wajib] Validasi: tanggal klaim ≤ garansi s.d., dan tampilkan status garansi (aktif/kedaluwarsa). Dropdown PO hanya menampilkan PO yang berstatus “Selesai Diterima”.
[Disarankan] Jenis tuntutan (perbaikan/penggantian/refund), kontak vendor, nomor tiket/RMA vendor, apakah tanggal pembelian dan garansi diambil otomatis dari BAST (jika ya, jadikan read-only).
12. Peminjaman Barang (FPBG Baru)

Sudah ada: aset, tanggal (rencana kembali), peminjam, keperluan, kondisi saat dipinjam (opsional).

Perlu ditambah:

[Wajib] Tanggal pinjam (mulai) terpisah dari rencana tanggal kembali, dengan validasi kembali ≥ pinjam. Form hanya menunjukkan satu field tanggal.
[Wajib] Validasi ketersediaan: hanya aset berstatus Aktif yang tidak sedang dipinjam atau maintenance yang bisa dipilih.
[Wajib] Peminjam dipilih dari daftar (bukan teks bebas) agar konsisten, ditambah no. kontak.
[Disarankan] Kondisi saat dipinjam sebagai dropdown (Baik/Lecet/dll.) + foto, lokasi penggunaan, akseori yang ikut dipinjam, dan approver (Manager) yang ditampilkan.
[Disarankan] Dua baris di list menampilkan barang “—”, jadi barang harus wajib dan tidak bisa dihapus selama masih terkait peminjaman.
13. Pengembalian Barang Rusak (FPRG Baru)

Sudah ada: barang/aset, dikembalikan oleh, tanggal pengembalian, kerusakan/kondisi.

Perlu ditambah:

[Wajib] Tanggal pengembalian default hari ini dan tidak boleh di masa depan. Field tanggal kejadian.
[Wajib] Tingkat kerusakan (ringan/sedang/berat) dan penyebab (wajar/kelalaian/kecelakaan).
[Wajib] Foto bukti kerusakan saat input (sekarang hanya aksi “Bukti Kerusakan” setelah dokumen dibuat).
[Wajib] Link otomatis ke FPBG terkait jika barang berasal dari peminjaman.
[Disarankan] Rekomendasi tindak lanjut (perbaikan internal / klaim garansi / ganti baru / write-off), estimasi biaya perbaikan, dan indikator apakah masih dalam masa garansi (sekaligus tombol buat FGBG).
[Disarankan] Kondisi kerusakan dibuat template + catatan, bukan hanya teks bebas.
14. Surat Procurement (Buat Surat Baru)

Sudah ada: jenis surat, cabang, judul, ditujukan kepada, tanggal, isi.

Perlu ditambah:

[Wajib] Nomor surat otomatis (tampilkan sebagai preview) dan referensi dokumen (PO/GRN/FSTB) agar surat terhubung ke transaksi.
[Wajib] Penanda tangan/approver, karena ada status “Menunggu Approval”.
[Wajib] Upload lampiran. Helper text menyebut surat bisa berupa file, tapi field upload tidak tampak di form.
[Disarankan] Sifat surat (biasa/penting/segera), tembusan (CC), template per jenis surat (misalnya surat jalan butuh daftar barang, kendaraan, dan driver), editor teks kaya, bukan textarea polos.
[Disarankan] Samakan istilah: search memakai “perihal”, form memakai “judul”.
D. Stock Movement
15. Keluar Barang (Non-FSTB)
[Wajib] Alasan pengeluaran sebagai dropdown wajib (pemakaian operasional / rusak-dibuang / koreksi teknis). Banner menyebut ketiganya, tapi field “Catatan” hanya opsional.
[Wajib] Tampilkan saldo tersedia di warehouse asal, dengan validasi qty ≤ saldo dan satuan item.
[Wajib] Tanggal pengeluaran dan penanggung jawab.
[Disarankan] Cost center yang dibebani, lampiran bukti (foto barang rusak), approval untuk qty/nilai di atas ambang.
16. Transfer Antar Gudang
[Wajib] Validasi asal ≠ tujuan, dan dropdown tujuan mengecualikan gudang asal.
[Wajib] Saldo tersedia di gudang asal, dengan validasi qty.
[Wajib] Pisahkan no. surat jalan dan alasan transfer (sekarang digabung di satu kolom opsional).
[Disarankan] Status in-transit → diterima dengan konfirmasi penerimaan di gudang tujuan, tanggal kirim/terima, PIC pengirim/penerima.
[Disarankan] “Warehouse Asal/Tujuan” tampak seperti nilai terpilih. Ganti dengan placeholder “Pilih…” agar tidak menyesatkan.
17. Penyesuaian Stok (Stock Opname)
[Wajib] Ubah pendekatan jadi input hitungan fisik: tampilkan saldo sistem, user mengisi qty fisik, selisih dihitung otomatis. Pendekatan sekarang (tambah/kurangi manual) lebih rawan salah.
[Wajib] Alasan sebagai dropdown (selisih opname, rusak, hilang, koreksi input) + catatan.
[Wajib] Tanggal opname, dan blokir penyesuaian yang membuat stok negatif.
[Disarankan] Lampiran berita acara opname, approval jika selisih di atas ambang, serial/batch jika item ber-tracking.
E. Asset & Report
18. Asset Maintenance (Daftarkan Asset)

Sudah ada: nama, kategori, kondisi, merk, model, serial number, site, lokasi spesifik, PIC, tanggal beli, nilai perolehan, garansi s.d., vendor, plus section jadwal maintenance.

Perlu ditambah:

[Wajib] Sumber aset: link ke PO/GRN/FSTB dan item master, agar jejak audit lengkap. Aset yang dibuat manual tanpa sumber sebaiknya ditandai.
[Wajib] Vendor dari master vendor (dropdown), bukan teks bebas.
[Wajib] Kode aset/label (QR/barcode) untuk pelabelan fisik.
[Wajib] Validasi tanggal: garansi s.d. ≥ tanggal beli. Pada list, kolom Site, Garansi, dan Next Maintenance masih “—”, jadi field ini perlu diwajibkan atau diisi default.
[Disarankan] Data depresiasi: metode, umur ekonomis, nilai residu (kartu “Valuasi Aset” ada, tapi field pendukungnya tidak).
[Disarankan] Field kondisional per kategori (misalnya server: hostname, IP, OS, spesifikasi CPU/RAM/storage).
[Disarankan] Foto aset, dokumen (invoice, manual), interval maintenance (bulanan/kuartalan/tahunan), tanggal maintenance terakhir.
[Disarankan] Nama aset dan merk saat ini sama-sama tampil “merk lg”. Bedakan nama deskriptif dan merk, dan cek duplikat serial number.

Form tambahan yang belum ada: “Catat Maintenance/Perbaikan”. Isinya: tanggal, jenis (preventive/corrective), teknisi atau vendor, deskripsi pekerjaan, sparepart yang dipakai (terhubung ke stok), biaya, downtime, hasil, jadwal berikutnya, lampiran.

19. Service Log

Halaman laporan, tapi perlu penyambung ke aset: kolom aset terkait, tanggal pelaksanaan servis, teknisi/vendor, hasil/BA servis, dan SLA. Pertimbangkan juga tombol “Catat Service Log” agar servis internal (non-PO) ikut tercatat.

20. Dashboard

Tidak ada form. Opsional: tombol quick action (Buat PR, Buat FPP) dan filter periode.

Rekomendasi lintas halaman
Validasi inline dengan pesan jelas, input mask untuk Rupiah (pemisah ribuan), NPWP, dan telepon.
Deteksi duplikat (vendor, item, warehouse, serial number) dan min-length pada field teks. Data uji seperti “aaaa”, “ac”, “pigsat” ganda menunjukkan celah ini.
Satuan dan desimal mengikuti UOM item di semua form qty (Stock Movement, FSTB, GRN).
Upload file konsisten: batasi tipe dan ukuran, tampilkan preview, dan pakai field upload (bukan textarea) untuk semua dokumen pendukung.
Alasan wajib pada setiap aksi pembatalan, penolakan, dan penyesuaian stok.
Dropdown informatif: tampilkan kode + nama, dan filter hanya opsi yang valid (PO yang sudah diterima untuk garansi, aset aktif untuk peminjaman, sisa barang untuk FSTB).
Tampilkan konteks sebelum submit: saldo tersedia, sisa tagihan, status garansi, dan alur approval.
Konsistensi bahasa: label saat ini campuran (Warehouse, Site, PIC vs Gudang, Penanggung Jawab). Pilih satu.
Jejak audit di setiap dokumen: dibuat oleh, waktu, dan perubahan status.
Simpan draft otomatis untuk form panjang (PR, Asset, Vendor).