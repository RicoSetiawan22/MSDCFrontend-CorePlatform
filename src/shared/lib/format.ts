/**
 * Number(value) di sini SENGAJA - Laravel men-serialize kolom bertipe
 * decimal:2 (mis. debit, credit, amount) sebagai STRING di JSON (demi
 * presisi desimal, bukan float), BUKAN angka asli. formatCurrency()
 * TETAP aman dipanggil langsung dengan nilai begitu dari API (string
 * numerik bersih ter-parse benar), tapi lapisan pertahanan ini mencegah
 * "RpNaN" kalau value yang masuk sudah rusak duluan (mis. hasil
 * penjumlahan string yang salah di tempat lain).
 */
export function formatCurrency(value: number | string): string {
  const n = Number(value);
  if (isNaN(n)) return "Rp 0"; // defense-in-depth: NaN tidak pernah tampil
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

/**
 * Backend balas tanggal sebagai ISO lengkap (mis.
 * "2026-08-06T00:00:00.000000Z") kalau kolomnya di-cast 'date'/'datetime'
 * TANPA format eksplisit - ini yang ubah jadi "6 Agu 2026" yang enak
 * dibaca. Aman dipanggil untuk tanggal-saja ("2026-08-06") maupun
 * datetime lengkap - keduanya diterima baik oleh `new Date()`.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value; // fallback - tampilkan apa adanya daripada "Invalid Date"
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** Sama seperti formatDate() tapi ikut tampilkan jam:menit - dipakai untuk
 * timestamp "kapan tepatnya" (mis. kapan item checklist dicentang selesai),
 * bukan cuma tanggal kejadian. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

/** Jam saja (HH:mm), dikonversi ke zona waktu browser - dipakai untuk kolom
 * seperti "Jam Masuk"/"Jam Keluar" absensi. JANGAN pernah substring string
 * ISO mentah (mis. `value.substring(11, 16)`) untuk ambil jam - backend
 * selalu balas UTC (lihat komentar formatDate() di atas), jadi substring
 * akan menampilkan jam UTC apa adanya, mundur 7 jam dari WIB. */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatNumber(value: number | string, decimals = 0): string {
  const n = Number(value);
  if (isNaN(n)) return "0";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}
