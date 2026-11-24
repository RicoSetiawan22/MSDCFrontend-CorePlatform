import { useEffect, useState } from "react";
import { daysUntilTokenExpiry } from "@shared/lib/api-client";

/**
 * Karena TIDAK ADA endpoint refresh token di backend (lihat catatan di
 * api-client.ts), satu-satunya cara "menyelamatkan" user dari logout
 * mendadak adalah peringatan PROAKTIF beberapa hari sebelum token
 * kedaluwarsa (masa berlaku 6 bulan) - supaya user sempat logout & login
 * ulang di waktu yang mereka pilih sendiri, bukan tiba-tiba di tengah
 * kerja penting.
 */
export function SessionExpiryBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    setDaysLeft(daysUntilTokenExpiry());
  }, []);

  if (daysLeft === null || daysLeft > 7) return null;

  return (
    <div className="session-banner">
      Sesi Anda akan berakhir dalam {daysLeft} hari — simpan pekerjaan Anda dan login ulang sebelum kedaluwarsa.
    </div>
  );
}
