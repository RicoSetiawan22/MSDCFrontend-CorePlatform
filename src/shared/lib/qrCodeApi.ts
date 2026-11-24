import { apiClient } from "./api-client";

const BASE = "/v1/core-platform/qrcode";

/**
 * Klien generik untuk servis QR Code terpusat di CorePlatform
 * (Modules/CorePlatform/app/Services/QrCodeService.php, delegasi ke
 * endroid/qr-code) - dipakai module MANAPUN yang butuh render QR (label
 * rak/aset DataCenterOps, kode produk, tautan approval, dst), supaya
 * tidak ada module yang install library QR sendiri-sendiri.
 *
 * Butuh permission "qrcode.generate" (role staff/admin/super-admin sudah
 * dapat secara default - lihat RolePermissionSeeder.php). 2FA setup TIDAK
 * lewat sini - QR-nya dirender langsung di server oleh TwoFactorAuthService
 * lewat QrCodeService yang sama, supaya user manapun bisa setup 2FA
 * akunnya sendiri tanpa harus punya permission qrcode.generate.
 */
export const qrCodeApi = {
  /** Cek apakah package endroid/qr-code tersedia di server sebelum menampilkan fitur QR. */
  status() {
    return apiClient.get<{ data: { available: boolean } }>(`${BASE}/status`);
  },

  /** Generate QR sebagai Blob (SVG/PNG) - convert ke Object URL sendiri di pemanggil untuk <img src>. */
  async generateBlob(value: string, options?: { size?: number; format?: "svg" | "png" }): Promise<Blob> {
    const res = await apiClient.post(
      `${BASE}/generate`,
      { value, size: options?.size, format: options?.format },
      { responseType: "blob" }
    );
    return res.data as Blob;
  },

  /** Sama seperti generateBlob(), tapi langsung balikin data URI - siap pakai di <img src> tanpa perlu revokeObjectURL. */
  async generateDataUri(value: string, options?: { size?: number; format?: "svg" | "png" }): Promise<string> {
    const blob = await qrCodeApi.generateBlob(value, options);
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },
};
