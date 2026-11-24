import { Printer } from "lucide-react";
import { Button } from "./Button";

/**
 * window.print() membuka dialog print NATIVE browser - dialog itu SENDIRI
 * yang berfungsi sebagai "preview cetak" (semua browser modern nampilkan
 * pratinjau halaman sebelum benar-benar kirim ke printer/simpan PDF).
 * Tombol ini sendiri diberi class "no-print" - masuk akal, tombol tidak
 * perlu ikut tercetak di kertasnya.
 */
export function PrintButton() {
  return (
    <Button variant="secondary" className="no-print" onClick={() => window.print()}>
      <Printer size={15} /> Cetak
    </Button>
  );
}
