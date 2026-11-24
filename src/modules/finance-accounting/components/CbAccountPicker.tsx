
import { useCbAccountList } from "../api/useCbAccounts";
import type { CbAccount } from "../types/cbAccount";

interface CbAccountPickerProps {
  value?: number;
  onChange: (id: number | undefined) => void;
  label?: string;
}

export function CbAccountPicker({ value, onChange, label = "Akun Kas/Bank" }: CbAccountPickerProps) {
  const { data } = useCbAccountList({});
  const accounts: CbAccount[] = data ?? [];

  return (
    <div>
      {label && <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>{label}</label>}
      <select
        className="input"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v ? Number(v) : undefined);
        }}
        style={{ width: "100%", minWidth: 200 }}
      >
        <option value="">— Pilih Akun —</option>
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.account.account_name} ({acc.account.account_code})
          </option>
        ))}
      </select>
    </div>
  );
}
