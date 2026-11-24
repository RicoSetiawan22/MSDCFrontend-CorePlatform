import { useState } from "react";
import { SearchableSelect } from "./FormKit";
import { useAccountLookup } from "./useLookup";

interface AccountPickerProps {
  label?: string;
  value: string | number | "";
  onChange: (value: string) => void;
  accountType?: string;
  includeInactive?: boolean;
  placeholder?: string;
  error?: string;
}

export function AccountPicker({
  value,
  onChange,
  accountType,
  includeInactive = false,
  placeholder = "Cari akun...",
  error,
}: AccountPickerProps) {
  const [search, setSearch] = useState("");
  const { data } = useAccountLookup({
    q: search,
    type: accountType,
    is_active: includeInactive ? undefined : true,
    limit: 25,
  });

  const options = (data?.data ?? []).map((acc) => ({
    value: String(acc.id),
    label: acc.account_name,
    sublabel: `[${acc.account_code}] ${acc.account_type}`,
  }));

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder="Ketik nama atau kode akun..."
      error={error}
      emptyMessage="Ketik untuk mencari akun."
      onSearchChange={setSearch}
    />
  );
}
