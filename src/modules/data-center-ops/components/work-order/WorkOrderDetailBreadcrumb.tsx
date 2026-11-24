import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface WorkOrderDetailBreadcrumbProps {
  soNumber?: string;
}

export const WorkOrderDetailBreadcrumb: React.FC<WorkOrderDetailBreadcrumbProps> = ({
  soNumber,
}) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className="px-7 pt-4 pb-1 text-xs text-slate-500 font-medium flex items-center gap-1.5"
    >
      <Link
        to="/dc/work-orders"
        className="hover:text-amber-600 transition-colors cursor-pointer text-slate-600 font-semibold"
      >
        Perintah Kerja
      </Link>
      <ChevronRight size={13} className="text-slate-400 shrink-0" />
      <span className="text-slate-900 font-bold font-mono">
        {soNumber ?? "Memuat..."}
      </span>
    </nav>
  );
};

export default WorkOrderDetailBreadcrumb;
