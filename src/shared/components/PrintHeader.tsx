interface PrintHeaderProps {
  title: string;
}

/**
 * TIDAK terlihat di layar sama sekali (.print-header {display:none} di
 * global.css) - cuma muncul begitu user klik Cetak/Ctrl+P, karena dialog
 * print browser (yang berfungsi sebagai "preview" nya) merender halaman
 * dengan CSS @media print aktif. Tanggal dibuat dinamis SETIAP render,
 * bukan di-cache, supaya selalu akurat kapan dokumennya dicetak.
 */
export function PrintHeader({ title }: PrintHeaderProps) {
  const now = new Date();
  const printedAt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(now);

  return (
    <div className="print-header">
      <div className="print-header__brand">MSDC ERP — Internal Portal</div>
      <h1 className="print-header__title">{title}</h1>
      <div className="print-header__meta">Dicetak pada {printedAt}</div>
    </div>
  );
}
