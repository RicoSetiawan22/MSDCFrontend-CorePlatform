import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { apiClient } from "@shared/lib/api-client";

interface EmployeeFilterPickerProps {
  value: { id: number; full_name: string } | null;
  onChange: (emp: { id: number; full_name: string } | null) => void;
}

interface EmployeeItem {
  id: number;
  full_name: string;
  employee_number?: string;
}

export function EmployeeFilterPicker({ value, onChange }: EmployeeFilterPickerProps) {
  const [search, setSearch] = useState("");

  const { data: results } = useQuery({
    queryKey: ["grn-employee-filter-search", search],
    queryFn: () =>
      apiClient
        .get<{ data: { data: EmployeeItem[] } }>("/v1/hr-service-support/employees", {
          params: { search, per_page: 10 },
        })
        .then((r) => r.data?.data?.data ?? []),
    enabled: search.length >= 2,
  });

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700">
        <span className="flex-1 truncate">Diterima: {value.full_name}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-slate-400 hover:text-red-500 cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <input
        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
        placeholder="Filter: Diterima oleh employee..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search.length >= 2 && results && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto mt-1 divide-y divide-slate-100">
          {results.length === 0 && (
            <div className="p-3 text-xs text-slate-400">Tidak ditemukan.</div>
          )}
          {results.map((emp) => (
            <button
              key={emp.id}
              type="button"
              className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
              onClick={() => {
                onChange({ id: emp.id, full_name: emp.full_name });
                setSearch("");
              }}
            >
              <span className="font-semibold">{emp.full_name}</span>{" "}
              {emp.employee_number && (
                <span className="text-slate-400">({emp.employee_number})</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}