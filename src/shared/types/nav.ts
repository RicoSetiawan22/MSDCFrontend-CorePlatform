export interface NavItem {
  label: string;
  path: string;
  /** Permission yang HARUS dipunyai user supaya menu ini muncul - cocokkan
   * dengan nama permission sungguhan di backend (Spatie). Kosongkan array
   * kalau menu ini boleh dilihat siapa saja yang sudah login. */
  requiredPermissions: string[];
  /** Opsional - kelompokkan item ini di bawah sub-judul tertentu DALAM
   * modul yang sama (mis. "Master Data", "Transaksi", "Laporan" di dalam
   * modul Finance & Accounting). Item TANPA group tampil rata sebelum
   * grup manapun - lihat Sidebar.tsx untuk cara render-nya. Modul yang
   * tidak butuh sub-grouping (item sedikit) boleh abaikan field ini sama
   * sekali, tetap tampil flat seperti biasa. */
  group?: string;
}
