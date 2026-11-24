/** Subset MINIMAL dari Customer (CRM) - cuma field yang dibutuhkan untuk
 * pencarian & tampilan singkat lintas modul (mis. pemilih customer di
 * form AR Invoice). CRUD penuh (semua field, kontak, alamat, dokumen)
 * TETAP cuma ada di modul crm-sales sendiri - ini BUKAN duplikasi tipe
 * Customer yang sudah ada di sana. */
export interface CustomerSummary {
  id: number;
  customer_code: string;
  company_name: string;
  status: string;
}
