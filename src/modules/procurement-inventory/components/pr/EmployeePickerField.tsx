import { useState } from "react";
import { Search, X, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/api-client";

interface Employee {
  id: number;
  full_name: string;
  employee_number?: string;
}

interface EmployeePickerFieldProps {
  employeeId?: number | string | null;
  employeeName?: string | null;
  onSelect: (emp: Employee | null) => void;
}

export function EmployeePickerField({
  employeeId,
  employeeName,
  onSelect,
}: EmployeePickerFieldProps) {
  const [search, setSearch] = useState("");

  const { data: results } = useQuery({
    queryKey: ["employee-search", search],
    queryFn: async () => {
      const res = await apiClient.get<{ data?: { data?: Employee[] } }>(
        "/v1/hr-service-support/employees",
        { params: { search, per_page: 10 } }
      );
      return res.data?.data?.data ?? [];
    },
    enabled: search.length >= 2,
  });

  if (employeeId) {
    return (
      <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 font-medium">
        <div className="flex items-center gap-2 truncate">
          <UserCheck size={16} className="text-amber-600 shrink-0" />
          <span className="truncate">{employeeName ?? "Karyawan Dipilih"}</span>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-amber-700 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
          title="Hapus / Pilih Ulang"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
          placeholder="Cari nama karyawan... (Kosongkan jika untuk diri sendiri)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {search.length >= 2 && results && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          {results.length === 0 ? (
            <div className="p-3 text-xs text-slate-400 text-center">
              Karyawan tidak ditemukan.
            </div>
          ) : (
            results.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => {
                  onSelect(emp);
                  setSearch("");
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-amber-50/50 text-xs flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-semibold text-slate-800">
                  {emp.full_name}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {emp.employee_number}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}