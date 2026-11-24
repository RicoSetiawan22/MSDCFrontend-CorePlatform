import { useAccountList } from "@modules/finance-accounting/api/useAccounts";

interface AccountCodePickerProps {
  value: string;
  onChange: (accountCode: string) => void;
}

/** Dropdown akun Chart of Accounts (by account_code) - dipakai form Posting
 * Rule supaya admin pilih dari daftar akun yang benar-benar ada & bisa
 * diposting, bukan ketik kode manual (rawan typo/kode tidak valid). Cuma
 * akun aktif+postable yang ditampilkan - akun header/non-postable tidak
 * boleh jadi tujuan posting jurnal (lihat GeneralLedgerService::postJournal()). */
export function AccountCodePicker({ value, onChange }: AccountCodePickerProps) {
  const { data } = useAccountList({ is_active: true, per_page: 100 });
  const accounts = (data?.data ?? []).filter(a => a.is_postable);

  return (
    <select className="input" style={{ width: "100%" }} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">— Pilih Akun —</option>
      {accounts.map(a => (
        <option key={a.id} value={a.account_code}>{a.account_code} — {a.account_name}</option>
      ))}
    </select>
  );
}
