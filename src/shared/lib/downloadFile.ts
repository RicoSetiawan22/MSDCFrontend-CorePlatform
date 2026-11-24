/**
 * Pola standar unduh file dari respons blob axios (bukan <a href download>
 * polos - itu tidak bisa bawa header Authorization Bearer, lihat catatan
 * di useGlJournals.ts). Dipakai bersama SEMUA fitur unduh PDF di app ini.
 */
export function downloadBlobAsFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * BUG YANG DIPERBAIKI: axios dengan responseType:'blob' membungkus
 * SEMUA respons jadi Blob - TERMASUK body error JSON dari Laravel kalau
 * request-nya gagal (mis. validasi 422, atau job Browsershot gagal).
 * extractErrorMessage() yang SINKRON tidak bisa baca isi Blob (Blob.text()
 * itu asynchronous) - itu sebabnya error di fitur unduh PDF selalu jatuh
 * ke pesan generik "Terjadi kesalahan tak terduga", MESKIPUN backend
 * sebenarnya sudah balas pesan spesifik yang jelas.
 *
 * Panggil ini di catch block SEMUA mutation unduh PDF - "buka" Blob-nya,
 * parse JSON di dalamnya, lalu lempar ulang error yang BENTUKNYA SAMA
 * seperti error API biasa. extractErrorMessage() yang SUDAH ADA (di
 * shared/types/api.ts) jadi bisa dipakai APA ADANYA di kode pemanggil
 * (modal) - TIDAK PERLU logic baru di sana sama sekali.
 */
export async function normalizeBlobError(error: unknown): Promise<never> {
  if (
    typeof error === "object" && error !== null && "response" in error &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).response?.data instanceof Blob
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = await (error as any).response.data.text();
      const json = JSON.parse(text);
      throw { response: { data: json } };
    } catch (parseErr) {
      // Blob-nya BUKAN JSON valid (mis. respons HTML dari error 500
      // mentah tanpa pesan terstruktur) - lempar error ASLI apa adanya,
      // extractErrorMessage() akan jatuh ke pesan generik SEWAJARNYA
      // (bukan bug, memang tidak ada pesan spesifik untuk diambil).
      if (parseErr instanceof SyntaxError) throw error;
      throw parseErr;
    }
  }
  throw error;
}
