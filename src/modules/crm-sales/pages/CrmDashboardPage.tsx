import { createPortal } from "react-dom";
import { type ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customerApi } from "../api/customerApi";
import { contractApi } from "../api/contractApi";
import type { Customer } from "../types/customer";
import type { Contract } from "../types/contract";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MSDC_PDF_LOGO } from "../lib/pdfBrand";
import {
  Download,
  ClipboardList,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Plus,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useLeadList } from "../api/useLeads";
import {
  useOpportunityList,
  usePipelineSummary,
} from "../api/useOpportunities";
import { useQuotationList } from "../api/useQuotations";
import { useContractList } from "../api/useContracts";
import { useSalesOrderList } from "../api/useSalesOrders";
import { useCustomerRevenueReport } from "../api/useReports";
import { LoadingState } from "@shared/components/LoadingState";
import { PageHeader } from "@shared/components/PageHeader";



// Styling dashboard disimpan di file TSX ini agar perubahan cukup satu file.
const CRM_DASHBOARD_STYLES = String.raw`
/* Scoped dashboard presentation: CRM-Sales only. */
.crm-dashboard {
  min-height: 100%;
  padding-bottom: 2.5rem;
  color: #0f172a;
  background: #f5f7fa;
}

.crm-dashboard__content {
  display: flex;
  width: 100%;
  max-width: 1600px;
  flex-direction: column;
  gap: 1rem;
  margin: 0 auto;
  padding: 0 1.75rem 3rem;
}

.crm-dashboard__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  margin-bottom: 0.1rem;
}

.crm-dashboard__button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 1rem;
  border: 1px solid transparent;
  border-radius: 11px;
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 750;
  line-height: 1;
  text-decoration: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease, border-color 0.18s ease;
}

.crm-dashboard__button:hover {
  transform: translateY(-1px);
}

.crm-dashboard__button:focus-visible,
.crm-dashboard__text-link:focus-visible,
.crm-customer-table a:focus-visible,
.crm-export-modal button:focus-visible {
  outline: 3px solid rgba(247, 171, 0, 0.62);
  outline-offset: 3px;
}

.crm-dashboard__button--secondary {
  border-color: #dbe3ed;
  color: #16324f;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.crm-dashboard__button--secondary:hover {
  border-color: #b9c7d8;
  background: #f8fafc;
  box-shadow: 0 5px 12px rgba(15, 23, 42, 0.07);
}

.crm-dashboard__button--primary {
  color: #092747;
  background: #f7ab00;
  box-shadow: 0 2px 5px rgba(217, 146, 0, 0.16);
}

.crm-dashboard__button--primary:hover {
  background: #efa300;
  box-shadow: 0 7px 15px rgba(217, 146, 0, 0.22);
}

.crm-dashboard__kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.crm-kpi-card {
  display: flex;
  min-width: 0;
  min-height: 154px;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 16px;
  outline: none;
  background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
}

.crm-kpi-card:hover {
  transform: translateY(-4px);
  border-color: #cbd5e1;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.09);
}

.crm-kpi-card:focus-visible {
  transform: translateY(-2px);
  outline: 3px solid rgba(247, 171, 0, 0.66);
  outline-offset: 3px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.09);
}

.crm-kpi-card__heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
}

.crm-kpi-card__icon {
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.crm-kpi-card:hover .crm-kpi-card__icon {
  transform: scale(1.06) rotate(-3deg);
}

.crm-kpi-card__label {
  overflow: hidden;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.055em;
  line-height: 1.45;
  text-overflow: ellipsis;
  text-transform: uppercase;
}

.crm-kpi-card__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.35rem;
}

.crm-kpi-card__value {
  overflow-wrap: anywhere;
  color: #0f2946;
  font-size: clamp(1.65rem, 2.2vw, 2rem);
  font-weight: 850;
  letter-spacing: -0.045em;
  line-height: 1.08;
  font-variant-numeric: tabular-nums;
}

.crm-kpi-card__note {
  color: #64748b;
  font-size: 0.73rem;
  font-weight: 500;
  line-height: 1.45;
}

.crm-dashboard__chart-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 1rem;
}

.crm-dashboard__chart-grid > .crm-dashboard__panel {
  min-height: 218px;
}

.crm-dashboard__panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.crm-dashboard__panel-header {
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #edf1f5;
}

.crm-dashboard__panel-title {
  margin: 0;
  color: #162d49;
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.35;
}

.crm-dashboard__panel-subtitle {
  margin: 0.25rem 0 0;
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 500;
  line-height: 1.45;
}

.crm-dashboard__panel-chip {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  padding: 0.35rem 0.65rem;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  color: #64748b;
  background: #f8fafc;
  font-size: 0.64rem;
  font-weight: 750;
  letter-spacing: 0.035em;
  text-transform: uppercase;
}

.crm-dashboard__panel-body {
  padding: 1.25rem;
}

.crm-progress-list {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.crm-progress-row {
  display: grid;
  grid-template-columns: minmax(104px, 130px) minmax(0, 1fr) 38px;
  align-items: center;
  gap: 0.8rem;
}

.crm-progress-row__label {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 650;
  line-height: 1.35;
}

.crm-progress-track,
.crm-distribution-track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #f1f5f9;
}

.crm-progress-track__fill,
.crm-distribution-track__fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.42s cubic-bezier(0.16, 1, 0.3, 1);
}

.crm-progress-row__value {
  color: #162d49;
  font-size: 0.76rem;
  font-weight: 800;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.crm-distribution-list {
  display: flex;
  flex-direction: column;
  gap: 1.05rem;
}

.crm-distribution-row__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.45rem;
}

.crm-distribution-row__label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 650;
}

.crm-distribution-row__dot {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
}

.crm-distribution-row__count {
  color: #162d49;
  font-size: 0.76rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.crm-distribution-chart {
  display: grid;
  min-height: 218px;
  grid-template-columns: minmax(0, 1.15fr) minmax(118px, 0.85fr);
  align-items: center;
  gap: 0.35rem;
}
.crm-distribution-chart__visual { width: 100%; min-width: 0; height: 218px; }
.crm-distribution-chart__legend { display: flex; min-width: 0; flex-direction: column; gap: 0.8rem; }
.crm-distribution-legend__item {
  display: grid; min-width: 0; grid-template-columns: 9px minmax(0, 1fr) auto;
  align-items: center; gap: 0.45rem;
}
.crm-distribution-legend__dot { width: 9px; height: 9px; border-radius: 50%; }
.crm-distribution-legend__label {
  overflow: hidden; color: #64748b; font-size: 0.7rem; font-weight: 650;
  text-overflow: ellipsis; white-space: nowrap;
}
.crm-distribution-legend__value {
  color: #162d49; font-size: 0.72rem; font-weight: 850; font-variant-numeric: tabular-nums;
}
.crm-distribution-legend__percentage {
  grid-column: 2 / 4; margin-top: -0.35rem; color: #94a3b8; font-size: 0.62rem;
}
.crm-distribution-chart__empty {
  display: flex; min-height: 190px; flex-direction: column; align-items: center;
  justify-content: center; gap: 0.45rem; color: #64748b; text-align: center;
}
.crm-distribution-chart__empty strong { color: #334155; font-size: 0.76rem; }

.crm-dashboard__customer-panel {
  margin-top: 0.05rem;
}

.crm-dashboard__customer-header {
  min-height: 76px;
}

.crm-dashboard__text-link {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.35rem;
  color: #b77900;
  font-size: 0.74rem;
  font-weight: 800;
  text-decoration: none;
  transition: color 0.18s ease, gap 0.18s ease;
}

.crm-dashboard__text-link:hover {
  gap: 0.55rem;
  color: #8f5b00;
}

.crm-dashboard__table-wrap {
  width: 100%;
  overflow-x: auto;
}

.crm-customer-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.77rem;
}

.crm-customer-table thead th {
  padding: 0.9rem 1.15rem;
  border-bottom: 1px solid #e2e8f0;
  color: #94a3b8;
  background: #f8fafc;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.055em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.crm-customer-table tbody tr {
  transition: background-color 0.16s ease;
}

.crm-customer-table tbody tr:hover {
  background: #f8fafc;
}

.crm-customer-table tbody td {
  padding: 0.95rem 1.15rem;
  border-bottom: 1px solid #eef2f6;
  color: #475569;
  vertical-align: middle;
}

.crm-customer-table tbody tr:last-child td {
  border-bottom: 0;
}

.crm-customer-table__name {
  min-width: 190px;
  color: #162d49 !important;
  font-weight: 750;
}

.crm-customer-table__number {
  color: #162d49 !important;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}

.crm-customer-table__revenue {
  color: #64748b !important;
  font-variant-numeric: tabular-nums;
}

.crm-status-badge {
  display: inline-flex;
  min-height: 25px;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.65rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 750;
  line-height: 1.2;
  white-space: nowrap;
}

.crm-status-badge--success {
  border-color: #bbf7d0;
  color: #15803d;
  background: #f0fdf4;
}

.crm-status-badge--warning {
  border-color: #fde68a;
  color: #a16207;
  background: #fffbeb;
}

.crm-status-badge--danger {
  border-color: #fecaca;
  color: #b91c1c;
  background: #fef2f2;
}

.crm-status-badge--info {
  border-color: #bfdbfe;
  color: #1d4ed8;
  background: #eff6ff;
}

.crm-status-badge--neutral {
  border-color: #e2e8f0;
  color: #64748b;
  background: #f8fafc;
}

.crm-dashboard__table-state {
  padding: 1.75rem;
}

.crm-dashboard__empty-state {
  display: flex;
  min-height: 190px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 2rem;
  color: #64748b;
  text-align: center;
}

.crm-dashboard__empty-state strong {
  color: #334155;
  font-size: 0.82rem;
  font-weight: 800;
}

.crm-dashboard__empty-state > span:last-child {
  font-size: 0.72rem;
  line-height: 1.5;
}

.crm-dashboard__empty-icon {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.35rem;
  border-radius: 14px;
  color: #64748b;
  background: #f1f5f9;
}

.crm-dashboard__table-note {
  padding: 0.8rem 1.15rem;
  border-top: 1px solid #edf1f5;
  color: #94a3b8;
  background: #fafbfd;
  font-size: 0.68rem;
  line-height: 1.6;
}

.crm-export-overlay {
  position: fixed;
  z-index: 1300;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(15, 23, 42, 0.54);
  backdrop-filter: blur(4px);
}

.crm-export-modal {
  width: min(760px, 100%);
  max-height: calc(100vh - 2.5rem);
  overflow: auto;
  border: 0;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
}

.crm-export-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.125rem 1.5rem;
  border-bottom: 3px solid #f0a800;
  background: #102b4e;
  color: #ffffff;
}

.crm-export-modal__heading { display: flex; min-width: 0; align-items: center; gap: 0.85rem; }
.crm-export-modal__mark {
  display: inline-flex; width: 42px; height: 42px; flex: 0 0 42px;
  align-items: center; justify-content: center; border: 1px solid #fde68a;
  border-radius: 13px; color: #b77900; background: #fffbeb;
}
.crm-export-modal__subtitle { margin: 0.2rem 0 0; color: #dbe7f3; font-size: 0.68rem; line-height: 1.4; }

.crm-export-modal__eyebrow {
  margin-bottom: 0.3rem;
  color: #f7ab00;
  font-size: 0.65rem;
  font-weight: 850;
  letter-spacing: 0.11em;
}

.crm-export-modal__title {
  margin: 0;
  color: #ffffff;
  font-size: 1.12rem;
  font-weight: 850;
  line-height: 1.3;
}

.crm-export-modal__header-actions {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.crm-export-modal__logo {
  width: 92px;
  height: 48px;
  flex-shrink: 0;
  object-fit: contain;
}

.crm-export-modal__close {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #64748b;
  background: #ffffff;
  cursor: pointer;
  font-size: 1.45rem;
  line-height: 1;
  transition: border-color 0.18s ease, color 0.18s ease, background-color 0.18s ease;
}

.crm-export-modal__close:hover {
  border-color: #cbd5e1;
  color: #162d49;
  background: #f8fafc;
}

.crm-export-modal__body {
  padding: 1.5rem;
}

.crm-export-intro {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1.125rem;
  padding: 0.95rem 1.05rem;
  border: 1px solid #e2e8f0;
  border-radius: 13px;
  background: #f8fafc;
}

.crm-export-intro__icon {
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #2563eb;
  background: #eff6ff;
}

.crm-export-intro__copy { min-width: 0; }

.crm-export-intro__title {
  display: block;
  margin: 0;
  color: #162d49;
  font-size: 0.82rem;
  font-weight: 850;
  line-height: 1.45;
}

.crm-export-intro__description {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.7rem;
  line-height: 1.55;
}

.crm-export-intro__fields {
  margin: 0.35rem 0 0;
  color: #94a3b8;
  font-size: 0.64rem;
  line-height: 1.5;
}

.crm-export-format-title {
  margin: 0 0 0.375rem;
  color: #162d49;
  font-size: 0.95rem;
  font-weight: 850;
}

.crm-export-format-description {
  margin: 0 0 1.125rem;
  color: #64748b;
  font-size: 0.75rem;
  line-height: 1.55;
}

.crm-export-option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.crm-export-option {
  display: flex;
  min-height: 126px;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1.1rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  color: inherit;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.crm-export-option:hover,
.crm-export-option:focus-visible,
.crm-export-option:active {
  transform: translateY(-2px);
  border-color: #f0a800;
  background: #fffbeb;
  box-shadow: 0 10px 22px rgba(240, 168, 0, 0.15);
}
.crm-export-option:active { transform: translateY(0) scale(0.99); }

.crm-export-option__icon {
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.crm-export-option__icon--pdf {
  color: #dc2626;
  background: #fef2f2;
}

.crm-export-option__icon--excel {
  color: #059669;
  background: #ecfdf5;
}

.crm-export-option__copy {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding-top: 0.1rem;
}

.crm-export-option__copy strong {
  color: #162d49;
  font-size: 0.82rem;
  font-weight: 850;
}

.crm-export-option__copy span {
  color: #64748b;
  font-size: 0.7rem;
  line-height: 1.55;
}

@media (max-width: 1100px) {
  .crm-dashboard__kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .crm-dashboard__content {
    padding-right: 1.25rem;
    padding-left: 1.25rem;
  }

  .crm-dashboard__chart-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .crm-dashboard {
    padding-bottom: 1.5rem;
  }

  .crm-dashboard__content {
    gap: 0.85rem;
    padding: 0 1rem 1.75rem;
  }

  .crm-dashboard__actions {
    justify-content: stretch;
  }

  .crm-dashboard__button {
    flex: 1 1 0;
    padding: 0 0.75rem;
  }

  .crm-dashboard__kpi-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.75rem;
  }

  .crm-kpi-card {
    min-height: 132px;
    padding: 1.05rem;
  }

  .crm-dashboard__panel-header {
    align-items: flex-start;
    padding: 0.95rem 1rem;
  }

  .crm-dashboard__panel-body {
    padding: 1rem;
  }

  .crm-progress-row {
    grid-template-columns: minmax(82px, 96px) minmax(0, 1fr) 30px;
    gap: 0.55rem;
  }

  .crm-progress-row__label,
  .crm-distribution-row__label {
    font-size: 0.69rem;
  }

  .crm-dashboard__customer-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .crm-customer-table thead th,
  .crm-customer-table tbody td {
    padding-right: 0.85rem;
    padding-left: 0.85rem;
  }

  .crm-dashboard__table-note {
    padding-right: 1rem;
    padding-left: 1rem;
  }

  .crm-export-modal__header {
    padding: 1rem;
  }

  .crm-export-modal__logo {
    width: 68px;
    height: 40px;
  }

  .crm-export-modal__header-actions {
    gap: 0.45rem;
  }

  .crm-export-modal__body {
    padding: 1rem;
  }

  .crm-export-intro {
    padding: 1rem;
  }

  .crm-export-option-grid {
    grid-template-columns: minmax(0, 1fr);
  }


  .crm-distribution-chart { grid-template-columns: minmax(0, 1fr); gap: 0.65rem; }
  .crm-distribution-chart__visual { height: 190px; }
  .crm-distribution-chart__legend {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem 0.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .crm-dashboard__button,
  .crm-kpi-card,
  .crm-kpi-card__icon,
  .crm-progress-track__fill,
  .crm-distribution-track__fill,
  .crm-dashboard__text-link,
  .crm-customer-table tbody tr,
  .crm-customer-table__name a,
  .crm-export-modal__close,
  .crm-export-option {
    transition: none;
  }

  .crm-kpi-card:hover,
  .crm-kpi-card:focus-visible,
  .crm-export-option:hover {
    transform: none;
  }
}


/* ===== MSDC CRM / Sales — perapian dashboard dengan KPI standar ===== */
.crm-dashboard {
  background: #f3f6fb;
  color: #102b4a;
  padding-bottom: 3.25rem;
}
.crm-dashboard .crm-dashboard__content {
  width: 100%;
  max-width: 1560px;
  padding: 0 1.75rem 3rem;
  gap: 1rem;
}
.crm-dashboard .crm-dashboard__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: .65rem;
  margin: 0;
}
.crm-dashboard .crm-dashboard__button {
  min-height: 42px;
  padding: 0 1.12rem;
  border-radius: 10px;
  font-size: .76rem;
  box-shadow: 0 3px 10px rgba(9, 39, 71, .035);
}
.crm-dashboard .crm-dashboard__button--secondary {
  color: #0b2b4d;
  border: 1px solid #dbe3ef;
  background: #fff;
}
.crm-dashboard .crm-dashboard__button--primary {
  color: #ffffff;
  background: #f7ab00;
  border: 1px solid #efa500;
  box-shadow: 0 6px 15px rgba(247,171,0,.16);
}
/* KPI selaras dengan Data Center Ops & Core Platform: seluruh kartu putih, ringkas, ikon di kiri judul. */
.crm-dashboard .crm-dashboard__actions--standalone {
  width: 100%;
  min-height: 42px;
  margin: 0;
  align-items: center;
  justify-content: flex-end;
}
.crm-dashboard .crm-dashboard__kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .88rem;
}
.crm-dashboard .crm-kpi-card {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 140px;
  flex-direction: column;
  justify-content: space-between;
  gap: .7rem;
  overflow: hidden;
  padding: 1.05rem 1.12rem;
  border: 1px solid #e5edf5;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%);
  box-shadow: 0 4px 16px rgba(15, 23, 42, .038);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
/* Tidak ada lagi garis warna atau kartu KPI yang berwarna penuh. */
.crm-dashboard .crm-kpi-card::before,
.crm-dashboard .crm-kpi-card::after {
  content: none;
}
.crm-dashboard .crm-kpi-card:hover {
  transform: translateY(-2px);
  border-color: #d5e2ee;
  box-shadow: 0 10px 24px rgba(15, 23, 42, .065);
}
.crm-dashboard .crm-kpi-card__heading {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;
  gap: .7rem;
}
.crm-dashboard .crm-kpi-card__icon {
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.crm-dashboard .crm-kpi-card__label {
  display: block;
  min-width: 0;
  max-width: none;
  padding: 0;
  overflow: visible;
  color: #64748b;
  font-size: .73rem;
  font-weight: 800;
  letter-spacing: .025em;
  line-height: 1.35;
  text-overflow: clip;
  white-space: normal;
  text-transform: uppercase;
}
.crm-dashboard .crm-kpi-card__content {
  gap: .26rem;
}
.crm-dashboard .crm-kpi-card__value {
  color: var(--color-text-primary, #0a2140);
  font-size: clamp(1.58rem, 1.85vw, 1.9rem);
  font-weight: 850;
  letter-spacing: -.045em;
  line-height: 1.13;
}
.crm-dashboard .crm-kpi-card__note {
  padding: 0;
  color: #72859c;
  font-size: .71rem;
  font-weight: 560;
  line-height: 1.35;
}
/* Analitik: panel lebih berkarakter dan tiap tahapan terlihat sebagai unit */
.crm-dashboard .crm-dashboard__chart-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(0, .88fr);
  gap: 1rem;
  align-items: stretch;
}
.crm-dashboard .crm-dashboard__panel {
  border: 1px solid #e4ebf3;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
  box-shadow: 0 7px 20px rgba(12,37,66,.042);
}
.crm-dashboard .crm-dashboard__chart-grid > .crm-dashboard__panel { min-height: 348px; }
.crm-dashboard .crm-dashboard__chart-grid > .crm-dashboard__panel:nth-child(1) {
  border-top: 3px solid rgba(23, 59, 97, .85);
  box-shadow: inset 0 1px 0 rgba(23, 59, 97, .05), 0 7px 20px rgba(12,37,66,.042);
}
.crm-dashboard .crm-dashboard__chart-grid > .crm-dashboard__panel:nth-child(2) {
  border-top: 3px solid rgba(247, 171, 0, .95);
  box-shadow: inset 0 1px 0 rgba(247, 171, 0, .08), 0 7px 20px rgba(12,37,66,.042);
}
.crm-dashboard .crm-dashboard__panel-header {
  min-height: 79px;
  padding: 1.25rem 1.45rem 1rem;
  align-items: center;
  border-bottom: 1px solid #edf1f6;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}
.crm-dashboard .crm-dashboard__panel-title {
  color: #0b2d4f;
  font-size: .96rem;
  font-weight: 850;
  letter-spacing: -.023em;
}
.crm-dashboard .crm-dashboard__panel-subtitle {
  margin-top: .34rem;
  color: #8396ac;
  font-size: .73rem;
}
.crm-dashboard .crm-dashboard__panel-chip {
  border: 1px solid #d9e5f2;
  background: #f4f8fd;
  color: #36618b;
  font-size: .64rem;
  letter-spacing: .04em;
}
.crm-dashboard .crm-dashboard__panel-body { padding: 1.28rem 1.45rem; }
.crm-dashboard .crm-progress-list { gap: .68rem; }
.crm-dashboard .crm-progress-row {
  display: grid;
  grid-template-columns: minmax(112px, 130px) minmax(0, 1fr) 30px;
  align-items: center;
  min-height: 48px;
  gap: .82rem;
  padding: .76rem .95rem;
  border: 1px solid #edf2f7;
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfcfe 0%, #f7f9fc 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.8);
}
.crm-dashboard .crm-progress-row__label {
  color: #38526e;
  font-size: .73rem;
  font-weight: 730;
}
.crm-dashboard .crm-progress-track {
  height: 10px;
  border-radius: 999px;
  background: #e9eef5;
  box-shadow: inset 0 1px 2px rgba(15,23,42,.05);
}
.crm-dashboard .crm-progress-row__value {
  color: #0e2f51;
  font-size: .8rem;
  font-weight: 850;
}
/* Pie chart tetap menggunakan Recharts Pie, bukan diganti menjadi ilustrasi. */
.crm-dashboard .crm-distribution-chart {
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(168px, .98fr);
  align-items: center;
  gap: 1rem;
  min-height: 244px;
}
.crm-dashboard .crm-distribution-chart__visual {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  width: 100%;
  height: 236px;
  padding: .5rem;
  border: 1px solid #edf2f7;
  border-radius: 22px;
  background: radial-gradient(circle at 50% 45%, #ffffff 0%, #ffffff 42%, #f8fafd 78%, #f1f6fb 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.95);
}
.crm-dashboard .crm-distribution-chart__legend {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .7rem;
}
.crm-dashboard .crm-distribution-legend__item {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  align-items: center;
  column-gap: .55rem;
  row-gap: .28rem;
  min-height: 72px;
  padding: .72rem .8rem;
  border: 1px solid #e8eff6;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbfe 100%);
  box-shadow: 0 2px 8px rgba(15,23,42,.03);
}
.crm-dashboard .crm-distribution-legend__label {
  color: #39536d;
  font-size: .73rem;
  font-weight: 760;
}
.crm-dashboard .crm-distribution-legend__value {
  color: #0b2949;
  font-size: .9rem;
  font-weight: 850;
}
.crm-dashboard .crm-distribution-legend__percentage {
  margin-top: -.04rem;
  color: #8fa1b5;
  font-size: .67rem;
}
/* Tabel: navigasi terlihat seperti tombol dan pelanggan dipisahkan visualnya. */
.crm-dashboard .crm-dashboard__customer-panel { margin-top: .02rem; }
.crm-dashboard .crm-dashboard__customer-header { min-height: 90px; }
.crm-dashboard__customer-titleline {
  display: flex;
  align-items: center;
  gap: .75rem;
  flex-wrap: wrap;
}
.crm-dashboard__customer-count {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: .2rem .55rem;
  border: 1px solid #deebf7;
  border-radius: 999px;
  background: #f3f8fd;
  color: #51718f;
  font-size: .64rem;
  font-weight: 750;
}
.crm-dashboard .crm-dashboard__text-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .72rem;
  min-height: 42px;
  padding: .42rem .62rem .42rem 1.08rem;
  border: 1px solid #f0c13d;
  border-radius: 12px;
  background: linear-gradient(180deg, #fff8e8 0%, #ffefbf 100%);
  color: #8b5b00;
  font-size: .75rem;
  font-weight: 820;
  line-height: 1;
  box-shadow: 0 7px 16px rgba(247,171,0,.13);
  transition: background-color .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease, color .18s ease;
}
.crm-dashboard .crm-dashboard__text-link:hover {
  gap: .72rem;
  transform: translateY(-1px);
  color: #7a4f00;
  border-color: #e7b220;
  background: linear-gradient(180deg, #fff3d0 0%, #ffe7a0 100%);
  box-shadow: 0 10px 22px rgba(247,171,0,.18);
}
.crm-dashboard__link-arrow {
  display: inline-flex;
  width: 29px;
  height: 29px;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: #7a4f00;
  background: #ffd766;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.65);
}
.crm-dashboard__link-arrow svg {
  width: 15px;
  height: 15px;
}
.crm-dashboard .crm-customer-table { border-spacing: 0; font-size: .78rem; }
.crm-dashboard .crm-customer-table thead th {
  padding: 1rem 1.45rem;
  border-bottom: 1px solid #e0e8f1;
  color: #647e9a;
  background: #f2f6fb;
  font-size: .67rem;
  letter-spacing: .09em;
}
.crm-dashboard .crm-customer-table tbody td {
  padding: .9rem 1.45rem;
  border-bottom: 1px solid #eaf0f7;
  color: #425a75;
}
.crm-dashboard .crm-customer-table tbody tr:nth-child(even) { background: #fbfcfe; }
.crm-dashboard .crm-customer-table tbody tr:hover { background: #f0f6fc; }
.crm-customer-table__person {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: .75rem;
  min-width: 0;
}
.crm-customer-table__rank {
  display: inline-flex;
  width: 31px;
  height: 31px;
  align-items: center;
  justify-content: center;
  flex: 0 0 31px;
  border: 1px solid #e0e9f4;
  border-radius: 9px;
  color: #567391;
  background: #f1f6fc;
  font-size: .67rem;
  font-weight: 850;
  font-variant-numeric: tabular-nums;
}
.crm-dashboard .crm-customer-table__name { color: #0c2e50 !important; font-weight: 790; }
.crm-dashboard .crm-customer-table__number { color: #103353 !important; font-weight: 850; }
.crm-dashboard .crm-customer-table__revenue { color: #42627f !important; font-weight: 650; }
.crm-dashboard .crm-status-badge { min-height: 28px; padding: .3rem .72rem; font-size: .67rem; }
.crm-dashboard .crm-dashboard__table-note {
  padding: .85rem 1.45rem;
  border-top: 1px solid #eaf0f7;
  background: #f8fafc;
  color: #8395aa;
  font-size: .69rem;
}
@media (max-width: 1320px) {
  .crm-dashboard .crm-dashboard__chart-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .crm-dashboard .crm-distribution-chart { grid-template-columns: minmax(0,1fr); gap: .5rem; }
  .crm-dashboard .crm-distribution-chart__visual { height: 210px; }
  .crm-dashboard .crm-distribution-chart__legend { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); }
}
@media (max-width: 1050px) {
  .crm-dashboard .crm-dashboard__kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .crm-dashboard .crm-dashboard__chart-grid { grid-template-columns: minmax(0,1fr); }
  .crm-dashboard .crm-distribution-chart { grid-template-columns: minmax(0,1fr) minmax(0,1fr); }
  .crm-dashboard .crm-distribution-chart__visual { height: 235px; }
  .crm-dashboard .crm-distribution-chart__legend { display: flex; }
}
@media (max-width: 700px) {
  .crm-dashboard .crm-dashboard__content { padding: 0 1rem 2rem; gap: .95rem; }
  .crm-dashboard .crm-dashboard__actions { justify-content: stretch; }
  .crm-dashboard .crm-dashboard__button { flex: 1 1 0; }
  .crm-dashboard .crm-dashboard__kpi-grid { gap: .75rem; }
  .crm-dashboard .crm-kpi-card { min-height: 130px; padding: .9rem; }
  .crm-dashboard .crm-kpi-card__icon { width: 35px; height: 35px; flex-basis: 35px; }
  .crm-dashboard .crm-kpi-card__label { font-size: .68rem; }
  .crm-dashboard .crm-kpi-card__value { font-size: 1.67rem; }
  .crm-dashboard .crm-dashboard__panel-header { padding: 1.05rem 1rem; }
  .crm-dashboard .crm-dashboard__panel-body { padding: 1rem; }
  .crm-dashboard .crm-progress-row { grid-template-columns: 105px minmax(0,1fr) 26px; gap: .5rem; padding: .68rem; }
  .crm-dashboard .crm-dashboard__customer-header { flex-direction: row; align-items: center; flex-wrap: wrap; gap: .8rem; }
  .crm-dashboard .crm-customer-table thead th, .crm-dashboard .crm-customer-table tbody td { padding-left: 1rem; padding-right: 1rem; }
  .crm-dashboard .crm-dashboard__table-note { padding: .8rem 1rem; }
}
@media (max-width: 520px) {
  .crm-dashboard .crm-dashboard__kpi-grid { grid-template-columns: 1fr 1fr; }
  .crm-dashboard .crm-kpi-card { min-height: 136px; padding: .85rem; gap: .5rem; }
  .crm-dashboard .crm-kpi-card__heading { gap: .45rem; }
  .crm-dashboard .crm-kpi-card__icon { width: 32px; height: 32px; flex-basis: 32px; }
  .crm-dashboard .crm-kpi-card__value { font-size: 1.43rem; }
  .crm-dashboard .crm-kpi-card__note { font-size: .64rem; }
  .crm-dashboard .crm-kpi-card__label { font-size: .61rem; }
  .crm-dashboard .crm-distribution-chart { grid-template-columns: minmax(0,1fr); }
  .crm-dashboard .crm-distribution-chart__legend { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); }
  .crm-dashboard .crm-distribution-chart__visual { height: 205px; }
}
@media (max-width: 360px) {
  .crm-dashboard .crm-dashboard__kpi-grid { grid-template-columns: minmax(0,1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .crm-dashboard .crm-kpi-card, .crm-dashboard .crm-dashboard__text-link { transition: none; }
  .crm-dashboard .crm-kpi-card:hover, .crm-dashboard .crm-dashboard__text-link:hover { transform: none; }
}


/* ===== Visualisasi analitik baru: data, filter, dan fungsi bisnis tidak diubah ===== */
.crm-dashboard .crm-dashboard__chart-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.1rem;
}
.crm-dashboard .crm-dashboard__chart-grid > .crm-dashboard__panel:first-child {
  grid-column: 1 / -1;
  border-top: 1px solid #e4ebf3;
}
.crm-dashboard .crm-dashboard__chart-grid > .crm-dashboard__panel:nth-child(2),
.crm-dashboard .crm-dashboard__chart-grid > .crm-dashboard__panel:nth-child(3) {
  border-top: 1px solid #e4ebf3;
}
.crm-dashboard .crm-dashboard__chart-grid .crm-dashboard__panel {
  transition: box-shadow .22s ease, border-color .22s ease;
}
.crm-dashboard .crm-dashboard__chart-grid .crm-dashboard__panel:hover {
  border-color: #d4e2f1;
  box-shadow: 0 12px 30px rgba(12, 37, 66, .075);
}
.crm-dashboard .crm-dashboard__chart-grid .crm-dashboard__panel-header {
  border-bottom: 1px solid #e9f0f7;
}
.crm-dashboard .crm-dashboard__chart-surface {
  width: 100%;
  min-width: 0;
  height: 345px;
  border: 1px solid #eaf0f7;
  border-radius: 17px;
  background: radial-gradient(ellipse at 50% 0%, #fff 0%, #fcfdff 72%, #f7faff 100%);
}
.crm-dashboard .crm-dashboard__chart-surface--compact { height: 308px; }
.crm-dashboard .crm-dashboard__chart-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: .65rem;
  margin-bottom: .9rem;
}
.crm-dashboard .crm-dashboard__chart-stat {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  padding: .44rem .7rem;
  border: 1px solid #e2eaf3;
  border-radius: 11px;
  color: #5e7896;
  background: #fff;
  font-size: .72rem;
  font-weight: 650;
}
.crm-dashboard .crm-dashboard__chart-stat strong {
  color: #102d51;
  font-size: .8rem;
  font-weight: 850;
  font-variant-numeric: tabular-nums;
}
.crm-dashboard .crm-dashboard__chart-stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f7ab00;
}
.crm-dashboard .crm-dashboard__chart-footnote {
  margin: .85rem 0 0;
  color: #8191a7;
  font-size: .7rem;
  line-height: 1.55;
}
.crm-dashboard .crm-dashboard__chart-grid > .crm-dashboard__panel:nth-child(2) .crm-distribution-chart {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
  min-height: auto;
}
.crm-dashboard .crm-dashboard__chart-grid > .crm-dashboard__panel:nth-child(2) .crm-distribution-chart__visual {
  position: relative;
  width: 100%;
  max-width: none;
  height: 258px;
  border-radius: 16px;
}
.crm-dashboard .crm-dashboard__donut-center {
  position: absolute;
  inset: 50% auto auto 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .2rem;
  transform: translate(-50%, -50%);
  pointer-events: none;
  white-space: nowrap;
}
.crm-dashboard .crm-dashboard__donut-center strong {
  color: #0e2b4e;
  font-size: 1.65rem;
  font-weight: 850;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.crm-dashboard .crm-dashboard__donut-center span {
  color: #8a9ab0;
  font-size: .7rem;
  font-weight: 750;
}
.crm-dashboard .crm-dashboard__chart-grid > .crm-dashboard__panel:nth-child(2) .crm-distribution-chart__legend {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .55rem;
}
.crm-dashboard .crm-dashboard__chart-grid > .crm-dashboard__panel:nth-child(2) .crm-distribution-legend__item {
  min-height: 65px;
  padding: .65rem .75rem;
  border-radius: 12px;
}
.crm-dashboard .crm-dashboard__chart-grid > .crm-dashboard__panel:nth-child(2) .crm-distribution-legend__percentage {
  margin-top: 0;
}
.crm-dashboard .crm-dashboard__chart-grid > .crm-dashboard__panel:nth-child(3) .crm-dashboard__chart-surface {
  height: 310px;
}
.crm-dashboard .crm-dashboard__chart-no-data {
  display: flex;
  min-height: 225px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  padding: 1rem;
  color: #8494a9;
  text-align: center;
}
.crm-dashboard .crm-dashboard__chart-no-data strong { color: #314967; font-size: .88rem; }
.crm-dashboard .crm-dashboard__chart-no-data span { max-width: 300px; font-size: .73rem; line-height: 1.55; }
@media (max-width: 1080px) {
  .crm-dashboard .crm-dashboard__chart-grid { grid-template-columns: minmax(0, 1fr); }
  .crm-dashboard .crm-dashboard__chart-grid > .crm-dashboard__panel:first-child { grid-column: auto; }
}
@media (max-width: 580px) {
  .crm-dashboard .crm-dashboard__chart-grid .crm-dashboard__panel-header { gap: .5rem; flex-wrap: wrap; }
  .crm-dashboard .crm-dashboard__chart-surface { height: 300px; }
  .crm-dashboard .crm-dashboard__chart-stats { gap: .35rem; }
  .crm-dashboard .crm-dashboard__chart-stat { font-size: .65rem; }
  .crm-dashboard .crm-dashboard__chart-grid > .crm-dashboard__panel:nth-child(2) .crm-distribution-chart__legend { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (prefers-reduced-motion: reduce) {
  .crm-dashboard .crm-dashboard__chart-grid .crm-dashboard__panel { transition: none; }
}

`;

// PERTAHANKAN deklarasi MSDC_EXPORT_LOGO asli
// tepat di sini, sebelum EXPORT_BRAND.

const MSDC_EXPORT_LOGO = MSDC_PDF_LOGO;
const EXPORT_BRAND = {
  navy: "#092747",
  navyText: "#16213D",
  orange: "#F7AB00",
  slate: "#64748B",
  border: "#E5E7EB",
  light: "#F8FAFC",
  green: "#16A34A",
  red: "#DC2626",
};

const COLORS = {
  navy: "#16213d",
  navyDark: "#0b1c33",
  slate: "#64748b",
  slateLight: "#94a3b8",
  orange: "#f2a602",
  orangeDark: "#d99200",
  yellow: "#facc15",
  green: "#16a34a",
  red: "#dc2626",
  border: "#e5e7eb",
  track: "#eef2f6",
  page: "#f5f7fa",
  white: "#ffffff",
};

function rupiah(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function compactRupiah(value: number) {
  if (!value) return "Rp 0";

  if (value >= 1_000_000_000) {
    const n = value / 1_000_000_000;
    return `Rp ${
      Number.isInteger(n)
        ? n.toFixed(0)
        : n.toFixed(1)
    } M`;
  }

  if (value >= 1_000_000) {
    const n = value / 1_000_000;
    return `Rp ${
      Number.isInteger(n)
        ? n.toFixed(0)
        : n.toFixed(1)
    } Jt`;
  }

  return rupiah(value);
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const variant =
    status === "Aktif"
      ? "success"
      : status === "Perpanjangan"
        ? "warning"
        : status === "Churned"
          ? "danger"
          : status === "Prospek"
            ? "info"
            : "neutral";

  return (
    <span
      className={`crm-status-badge crm-status-badge--${variant}`}
      aria-label={`Status ${status}`}
    >
      {status}
    </span>
  );
}

function KpiCard({
  label,
  value,
  note,
  icon,
  iconColor,
  iconBackground,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: ReactNode;
  iconColor: string;
  iconBackground: string;
}) {
  return (
    <article
      className="crm-kpi-card"
      role="group"
      tabIndex={0}
      aria-label={`${label}: ${value}`}
    >
      <div className="crm-kpi-card__heading">
        <span
          className="crm-kpi-card__icon"
          style={{ color: iconColor, backgroundColor: iconBackground }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="crm-kpi-card__label">{label}</span>
      </div>

      <div className="crm-kpi-card__content">
        <div className="crm-kpi-card__value">{value}</div>
        <div className="crm-kpi-card__note">{note}</div>
      </div>
    </article>
  );
}

function ExportFormatModal({
  onClose,
  onPdf,
  onExcel,
}: {
  onClose: () => void;
  onPdf: () => void | Promise<void>;
  onExcel: () => void | Promise<void>;
}) {
  return createPortal(
    <div
      className="crm-export-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="crm-export-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crm-export-title"
      >
        <div className="crm-export-modal__header">
          <div className="crm-export-modal__heading">
            <span className="crm-export-modal__mark" aria-hidden="true"><Download size={19} /></span>
            <div>
              <div className="crm-export-modal__eyebrow">CRM &amp; SALES</div>
              <h2 id="crm-export-title" className="crm-export-modal__title">Export Report</h2>
              <p className="crm-export-modal__subtitle">Dashboard CRM-Sales</p>
            </div>
          </div>

          <div className="crm-export-modal__header-actions">
            <img
              src={MSDC_EXPORT_LOGO}
              alt="MSDC Surabaya"
              className="crm-export-modal__logo"
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="crm-export-modal__close"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>

        <div className="crm-export-modal__body">
          <div className="crm-export-intro">
            <span className="crm-export-intro__icon" aria-hidden="true">
              <ClipboardList size={17} />
            </span>
            <div className="crm-export-intro__copy">
              <strong className="crm-export-intro__title">Data yang diekspor: Dashboard CRM-Sales</strong>
              <p className="crm-export-intro__description">
                Ringkasan performa CRM &amp; Sales yang mencakup KPI dashboard dan daftar pelanggan teratas.
              </p>
              <p className="crm-export-intro__fields">
                Isi file: KPI CRM-Sales, nama pelanggan, jumlah kontrak, pendapatan, dan status pelanggan.
              </p>
            </div>
          </div>

          <h3 className="crm-export-format-title">Pilih format file</h3>
          <p className="crm-export-format-description">
            Pilih format laporan yang ingin diunduh. PDF siap dicetak atau dibagikan, sedangkan Excel dapat diolah kembali.
          </p>

          <div className="crm-export-option-grid">
            <button type="button" onClick={onPdf} className="crm-export-option">
              <span className="crm-export-option__icon crm-export-option__icon--pdf" aria-hidden="true">
                <FileText size={21} strokeWidth={2} />
              </span>
              <span className="crm-export-option__copy">
                <strong>PDF</strong>
                <span>Laporan Dashboard CRM-Sales dengan identitas MSDC, siap dicetak atau dibagikan.</span>
              </span>
            </button>

            <button type="button" onClick={onExcel} className="crm-export-option">
              <span className="crm-export-option__icon crm-export-option__icon--excel" aria-hidden="true">
                <FileSpreadsheet size={21} strokeWidth={2} />
              </span>
              <span className="crm-export-option__copy">
                <strong>Excel (.xlsx)</strong>
                <span>Spreadsheet berisi ringkasan KPI dan daftar pelanggan teratas yang dapat diolah kembali.</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function exportDateId(date: Date) {
  return date.toISOString().slice(0, 10);
}

function exportDateText(date: Date) {
  return date.toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

// ==========================================
// DASHBOARD UTAMA CRM & SALES
// ==========================================

export function CrmDashboardPage() {
  const [showExportModal, setShowExportModal] =
    useState(false);

  // ==========================================
  // RINGKASAN DATA DARI API
  // ==========================================

  const {
    data: leads,
    isLoading: loadingLeads,
  } = useLeadList({
    per_page: 1,
  });

  // Lead yang sudah dikonversi menjadi Customer
  const {
    data: customers,
    isLoading: loadingCustomers,
  } = useLeadList({
    per_page: 1,
    status: "converted",
  });

  const {
    data: opportunities,
    isLoading: loadingOpps,
  } = useOpportunityList({
    per_page: 1,
  });

  const {
    data: quotations,
    isLoading: loadingQuotations,
  } = useQuotationList({
    per_page: 1,
  });

  const {
    data: contracts,
    isLoading: loadingContracts,
  } = useContractList({
    per_page: 1,
  });

const {
  data: salesOrders,
  isLoading: loadingSalesOrders,
} = useSalesOrderList({
  per_page: 1,
});
const {
  data: customerRevenue,
  isLoading: loadingCustomerRevenue,
  isError: customerRevenueError,
} = useCustomerRevenueReport(true, {});

  const { data: pipeline } = usePipelineSummary();

  // ==========================================
  // DATA CUSTOMER DAN CONTRACT ASLI
  // ==========================================
  // Mengambil seluruh halaman data dari API.
  // Data ini digunakan untuk Daftar Pelanggan
  // pada Dashboard, PDF, dan Excel.

  const {
    data: dashboardSource,
    isLoading: loadingDashboardSource,
  } = useQuery({
    queryKey: [
      "crm-sales",
      "dashboard",
      "customers-and-contracts",
    ],

    queryFn: async () => {
      const customerRows: Customer[] = [];
      const contractRows: Contract[] = [];

      // AMBIL SELURUH CUSTOMER
      let page = 1;

      while (true) {
        const result = (
          await customerApi.list({
            page,
            per_page: 100,
          })
        ).data;

        customerRows.push(...result.data);

        if (
          page >= result.last_page ||
          result.data.length === 0
        ) {
          break;
        }

        page += 1;
      }

      // AMBIL SELURUH CONTRACT
      page = 1;

      while (true) {
        const result = (
          await contractApi.list({
            page,
            per_page: 100,
          })
        ).data;

        contractRows.push(...result.data);

        if (
          page >= result.last_page ||
          result.data.length === 0
        ) {
          break;
        }

        page += 1;
      }

      return {
        customerRows,
        contractRows,
      };
    },
  });

  // ==========================================
  // DAFTAR PELANGGAN BERDASARKAN DATA ASLI
  // ==========================================
  // Jumlah kontrak dihitung berdasarkan
  // customer_id pada data Contract.
  //
  // Pendapatan belum diisi karena kita belum
  // memiliki data pembayaran terealisasi.
  //
  // Lima pelanggan diurutkan berdasarkan
  // jumlah kontrak terbanyak.

  
const dashboardTopCustomers = [
  ...(customerRevenue?.top_customers ?? []),
]
  .sort(
    (a, b) => Number(b.mrr ?? 0) - Number(a.mrr ?? 0)
  )
  .slice(0, 5)
  .map((customer) => ({
    id: customer.customer_id,
    name: customer.customer_name,
    contracts: customer.contract_count,
    revenue: Number(customer.mrr ?? 0),
    status:
      customer.status === "active"
        ? "Aktif"
        : customer.status === "inactive"
          ? "Tidak Aktif"
          : customer.status === "churned"
            ? "Churned"
            : "Prospek",
  }));


  // ==========================================
  // STATUS LOADING DASHBOARD
  // ==========================================

const loading =
  loadingLeads ||
  loadingCustomers ||
  loadingOpps ||
  loadingQuotations ||
  loadingContracts ||
  loadingSalesOrders ||
  loadingDashboardSource ||
  loadingCustomerRevenue;

  // ==========================================
  // TOTAL DATA DARI API
  // ==========================================

  const totalLeads = leads?.total ?? 0;

  const totalCustomers =
    dashboardSource?.customerRows.length ??
    customers?.total ??
    0;

const totalActiveCustomers = dashboardSource
  ? dashboardSource.customerRows.filter(
      (customer) => customer.status === "active"
    ).length
  : null;

  const totalOpportunities =
    opportunities?.total ?? 0;

  const totalQuotations =
    quotations?.total ?? 0;

  const totalContracts =
    contracts?.total ?? 0;
    const totalSalesOrders =
  salesOrders?.total ?? 0;

  // ==========================================
  // NILAI PIPELINE
  // ==========================================
  // Pipeline adalah potensi nilai penjualan,
  // BUKAN pendapatan yang sudah terealisasi.

  const monthlyRevenue =
    pipeline?.reduce?.(
      (
        sum: number,
        item: { total_value?: number }
      ) => sum + (item.total_value ?? 0),
      0
    ) ?? 0;

  // ==========================================
  // DATA SALES FUNNEL
  // ==========================================

  
const progress = [
  {
    label: "Calon Pelanggan",
    value: totalLeads,
    color: COLORS.navy,
  },
  {
    label: "Peluang",
    value: totalOpportunities,
    color: COLORS.orange,
  },
  {
    label: "Penawaran",
    value: totalQuotations,
    color: COLORS.yellow,
  },
  {
    label: "Kontrak",
    value: totalContracts,
    color: COLORS.green,
  },
  {
    label: "Sales Order",
    value: totalSalesOrders,
    color: COLORS.navyDark,
  },
];

  const maxProgress = Math.max(
    ...progress.map((item) => item.value),
    1
  );


  // Visual tambahan menggunakan dataset yang sudah dipakai tabel "Daftar Pelanggan Teratas".
  // Bukan tren bulanan dan bukan pendapatan terealisasi.
  const dashboardTopMrrChart = dashboardTopCustomers.map((customer) => ({
    name: customer.name,
    revenue: customer.revenue,
  }));
  const hasTopCustomerMrr = dashboardTopMrrChart.some((customer) => customer.revenue > 0);
  const dashboardTopMrrSum = dashboardTopMrrChart.reduce((sum, customer) => sum + customer.revenue, 0);

  const customerDistribution = [
    { label: "Aktif", status: "active", color: COLORS.green },
    { label: "Prospek", status: "prospect", color: COLORS.orange },
    { label: "Nonaktif", status: "inactive", color: COLORS.slate },
    { label: "Churned", status: "churned", color: COLORS.red },
  ].map((item) => ({
    ...item,
    value: (dashboardSource?.customerRows ?? []).filter((customer) => customer.status === item.status).length,
  }));
  const totalCustomerDistribution = dashboardSource?.customerRows.length ?? 0;
  const visibleCustomerDistribution = customerDistribution.reduce((total, item) => total + item.value, 0);

  // ==========================================
  // KPI UNTUK LAPORAN PDF DAN EXCEL
  // ==========================================

  function exportKpis() {
    return [
      {
        label: "TOTAL PELANGGAN",
        value: String(totalCustomers),
        delta: "Total berdasarkan data sistem",
        color: EXPORT_BRAND.green,
      },
      {
        label: "TOTAL PELUANG",
        value: String(totalOpportunities),
        delta: "Seluruh status peluang",
        color: EXPORT_BRAND.green,
      },
      {
        label: "TOTAL KONTRAK",
        value: String(totalContracts),
        delta: "Seluruh status kontrak",
        color: EXPORT_BRAND.red,
      },
      {
        label: "NILAI PIPELINE",
        value: compactRupiah(monthlyRevenue),
        delta: "Nilai peluang, bukan pendapatan",
        color: EXPORT_BRAND.green,
      },
    ];
  }

  // ==========================================
  // EXPORT DASHBOARD KE PDF
  // ==========================================

  async function handleExportPdf() {
    setShowExportModal(false);

    const exportedAt = new Date();

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // HEADER MSDC
    const drawHeader = () => {
      const marginX = 10;

      // Background navy
      doc.setFillColor(EXPORT_BRAND.navy);
      doc.rect(0, 0, W, 35, "F");

      // Garis kuning
      doc.setFillColor(EXPORT_BRAND.orange);
      doc.rect(0, 35, W, 2.2, "F");

      // Logo MSDC
      try {
        doc.addImage(
          MSDC_EXPORT_LOGO,
          "PNG",
          marginX,
          8.5,
          39,
          15.5,
          undefined,
          "FAST"
        );
      } catch {
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("MSDC", marginX, 15);
        doc.setFontSize(6);
        doc.text("SURABAYA", marginX, 20);
      }

      // Judul laporan
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);

      doc.text(
        "Ringkasan CRM & Sales",
        W / 2,
        14.5,
        { align: "center" }
      );

      // Subtitle
      doc.setTextColor(203, 213, 225);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.6);

      doc.text(
        "Kelola pelanggan, peluang, dan kontrak layanan Data Center",
        W / 2,
        20.2,
        { align: "center" }
      );

      // Branding kanan
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);

      doc.text(
        "CRM & SALES",
        W - marginX,
        13.5,
        { align: "right" }
      );

      doc.setTextColor(203, 213, 225);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.1);

      doc.text(
        "MSDC Surabaya",
        W - marginX,
        18.4,
        { align: "right" }
      );

      doc.text(
        "Dokumen Ringkasan",
        W - marginX,
        22.6,
        { align: "right" }
      );

      // Informasi tanggal ekspor
      doc.setTextColor(EXPORT_BRAND.slate);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);

      doc.text(
        "MSDC Surabaya | CRM & Sales",
        marginX,
        44
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.3);

      doc.text(
        `Diekspor: ${exportDateText(exportedAt)}`,
        W - marginX,
        44,
        { align: "right" }
      );
    };

    drawHeader();

    // ==========================================
    // KARTU KPI
    // ==========================================
    

<KpiCard
  label="Total Sales Order"
  value={loading ? "—" : totalSalesOrders}
  note="Seluruh sales order"
  icon={<span>SO</span>}
  iconColor={COLORS.navy}
  iconBackground="#EAF0F7"
/>

    let y = 50;
    const kpis = exportKpis();
    const gap = 3;

    const cardW =
      (W - 20 - gap * (kpis.length - 1)) /
      kpis.length;

    kpis.forEach((kpi, index) => {
      const x = 10 + index * (cardW + gap);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(229, 231, 235);

      doc.roundedRect(
        x,
        y,
        cardW,
        18,
        2,
        2,
        "FD"
      );

      // Label KPI
      doc.setTextColor(EXPORT_BRAND.slate);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);

      doc.text(
        kpi.label,
        x + 3,
        y + 5
      );

      // Nilai KPI
      doc.setTextColor(EXPORT_BRAND.navyText);
      doc.setFontSize(11);

      doc.text(
        kpi.value,
        x + 3,
        y + 11
      );

      // Keterangan KPI
      doc.setTextColor(kpi.color);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);

      doc.text(
        kpi.delta,
        x + 3,
        y + 15.5,
        { maxWidth: cardW - 6 }
      );
    });

    y += 25;

    // ==========================================
    // JUDUL TABEL PELANGGAN
    // ==========================================

    doc.setTextColor(EXPORT_BRAND.navyText);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    doc.text(
      "Daftar Pelanggan Teratas",
      10,
      y
    );

    y += 3;

    // ==========================================
    // TABEL CUSTOMER DARI API
    // ==========================================

    autoTable(doc, {
      startY: y,

      head: [[
        "Pelanggan",
        "Kontrak",
        "Pendapatan (belum tersedia)",
        "Status",
      ]],

      body: dashboardTopCustomers.map((customer) => [
        customer.name,
        String(customer.contracts),
        customer.revenue === null
          ? "—"
          : rupiah(customer.revenue),
        customer.status,
      ]),

      theme: "grid",

      margin: {
        left: 10,
        right: 10,
        top: 50,
        bottom: 12,
      },

      styles: {
        font: "helvetica",
        fontSize: 7,
        cellPadding: 2,
        textColor: EXPORT_BRAND.navyText,
        lineColor: EXPORT_BRAND.border,
        lineWidth: 0.2,
      },

      headStyles: {
        fillColor: EXPORT_BRAND.navy,
        textColor: "#FFFFFF",
        fontStyle: "bold",
      },

      alternateRowStyles: {
        fillColor: EXPORT_BRAND.light,
      },

      didDrawPage: drawHeader,
    });

    // ==========================================
    // NOMOR HALAMAN
    // ==========================================

    const pages = doc.getNumberOfPages();

    for (let page = 1; page <= pages; page += 1) {
      doc.setPage(page);

      doc.setTextColor(EXPORT_BRAND.slate);
      doc.setFontSize(7);

      doc.text(
        `Halaman ${page} / ${pages}`,
        W - 10,
        H - 5,
        { align: "right" }
      );
    }

    // ==========================================
    // SIMPAN PDF
    // ==========================================

    doc.save(
      `msdc-crm-sales-ringkasan-${exportDateId(exportedAt)}.pdf`
    );
  }

  // ==========================================
  // EXPORT DASHBOARD KE EXCEL
  // ==========================================

  async function handleExportExcel() {
    setShowExportModal(false);

    try {
    const exportedAt = new Date();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MSDC Surabaya";
    workbook.created = exportedAt;

    const ws = workbook.addWorksheet("Ringkasan", {
      views: [{ showGridLines: false }],
      pageSetup: {
        orientation: "landscape",
        paperSize: 9,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    const cols = 8;

    // ==========================================
    // UKURAN AWAL KOLOM
    // ==========================================

    for (let c = 1; c <= cols; c += 1) {
      ws.getColumn(c).width = 18;
    }

    // ==========================================
    // BACKGROUND HEADER NAVY
    // ==========================================

    for (let r = 1; r <= 4; r += 1) {
      ws.getRow(r).height = r === 2 ? 25 : 22;

      for (let c = 1; c <= cols; c += 1) {
        ws.getCell(r, c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF092747" },
        };
      }
    }

    // ==========================================
    // LOGO MSDC
    // ==========================================

    const msdcImage = workbook.addImage({
      base64: MSDC_EXPORT_LOGO,
      extension: "png",
    });

    ws.addImage(msdcImage, {
      tl: { col: 0.38, row: 0.35 },
      ext: { width: 158, height: 62 },
    });

    // ==========================================
    // JUDUL LAPORAN
    // ==========================================

    ws.mergeCells("C2:F2");

    ws.getCell("C2").value = "Ringkasan CRM & Sales";

    ws.getCell("C2").font = {
      name: "Aptos Display",
      size: 17,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };

    ws.getCell("C2").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    ws.mergeCells("C3:F3");

    ws.getCell("C3").value =
      "Kelola pelanggan, peluang, dan kontrak layanan Data Center";

    ws.getCell("C3").font = {
      name: "Aptos",
      size: 9,
      color: { argb: "FFCBD5E1" },
    };

    ws.getCell("C3").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    // ==========================================
    // BRANDING KANAN HEADER
    // ==========================================

    ws.mergeCells("G2:H2");

    ws.getCell("G2").value = "CRM & SALES";

    ws.getCell("G2").font = {
      name: "Aptos",
      size: 9,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };

    ws.getCell("G2").alignment = {
      horizontal: "right",
      vertical: "middle",
      indent: 2,
    };

    ws.mergeCells("G3:H3");

    ws.getCell("G3").value = "MSDC Surabaya";

    ws.getCell("G3").font = {
      name: "Aptos",
      size: 8,
      color: { argb: "FFCBD5E1" },
    };

    ws.getCell("G3").alignment = {
      horizontal: "right",
      vertical: "middle",
      indent: 2,
    };

    ws.mergeCells("G4:H4");

    ws.getCell("G4").value = "Dokumen Ringkasan";

    ws.getCell("G4").font = {
      name: "Aptos",
      size: 8,
      color: { argb: "FFCBD5E1" },
    };

    ws.getCell("G4").alignment = {
      horizontal: "right",
      vertical: "middle",
      indent: 2,
    };

    // ==========================================
    // GARIS KUNING
    // ==========================================

    for (let c = 1; c <= cols; c += 1) {
      ws.getCell(5, c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF7AB00" },
      };
    }

    ws.getRow(5).height = 5;

    // ==========================================
    // INFORMASI TANGGAL EXPORT
    // ==========================================

    ws.mergeCells("A6:D6");

    ws.getCell("A6").value =
      "MSDC Surabaya | CRM & Sales";

    ws.getCell("A6").font = {
      size: 9,
      bold: true,
      color: { argb: "FF64748B" },
    };

    ws.mergeCells("E6:H6");

    ws.getCell("E6").value =
      `Diekspor: ${exportDateText(exportedAt)}`;

    ws.getCell("E6").alignment = {
      horizontal: "right",
    };

    ws.getCell("E6").font = {
      size: 9,
      color: { argb: "FF64748B" },
    };

    // ==========================================
    // KARTU KPI
    // ==========================================

    let row = 8;

    const kpis = exportKpis();

    kpis.forEach((kpi, i) => {
      const start = 1 + i * 2;
      const end = start + 1;

      ws.mergeCells(row, start, row, end);

      ws.mergeCells(
        row + 1,
        start,
        row + 1,
        end
      );

      ws.mergeCells(
        row + 2,
        start,
        row + 2,
        end
      );

      ws.getCell(row, start).value = kpi.label;

      ws.getCell(row + 1, start).value =
        kpi.value;

      ws.getCell(row + 2, start).value =
        kpi.delta;

      // LABEL KPI
      ws.getCell(row, start).font = {
        size: 9,
        bold: true,
        color: { argb: "FF64748B" },
      };

      // NILAI KPI
      ws.getCell(row + 1, start).font = {
        size: 15,
        bold: true,
        color: { argb: "FF16213D" },
      };

      // KETERANGAN KPI
      ws.getCell(row + 2, start).font = {
        size: 8,
        color: {
          argb:
            kpi.color === EXPORT_BRAND.red
              ? "FFDC2626"
              : "FF16A34A",
        },
      };

      // BACKGROUND DAN BORDER KARTU
      for (
        let rr = row;
        rr <= row + 2;
        rr += 1
      ) {
        for (
          let cc = start;
          cc <= end;
          cc += 1
        ) {
          const cell = ws.getCell(rr, cc);

          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" },
          };

          cell.border = {
            top: {
              style: "thin",
              color: { argb: "FFE5E7EB" },
            },
            bottom: {
              style: "thin",
              color: { argb: "FFE5E7EB" },
            },
            left: {
              style: "thin",
              color: { argb: "FFE5E7EB" },
            },
            right: {
              style: "thin",
              color: { argb: "FFE5E7EB" },
            },
          };
        }
      }
    });

    row += 5;

    // ==========================================
    // JUDUL TABEL PELANGGAN
    // ==========================================

    ws.mergeCells(row, 1, row, 8);

    ws.getCell(row, 1).value =
      "Daftar Pelanggan Teratas";

    ws.getCell(row, 1).font = {
      size: 11,
      bold: true,
      color: { argb: "FF16213D" },
    };

    row += 1;

    // ==========================================
    // HEADER TABEL
    // ==========================================

    const headerRow = row;

    const spans = [
      [1, 2, "Pelanggan"],
      [3, 3, "Kontrak"],
      [4, 6, "Pendapatan (belum tersedia)"],
      [7, 8, "Status"],
    ] as const;

    spans.forEach(([start, end, label]) => {
      if (start !== end) {
        ws.mergeCells(
          headerRow,
          start,
          headerRow,
          end
        );
      }

      for (let c = start; c <= end; c += 1) {
        ws.getCell(headerRow, c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF092747" },
        };
      }

      const cell = ws.getCell(
        headerRow,
        start
      );

      cell.value = label;

      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
        size: 9,
      };

      cell.alignment = {
        vertical: "middle",
      };
    });

    ws.getRow(headerRow).height = 24;

    row += 1;

    // ==========================================
    // ISI TABEL DARI API CUSTOMER & CONTRACT
    // ==========================================

    dashboardTopCustomers.forEach(
      (customer, index) => {
        const rowFill =
          index % 2
            ? "FFF8FAFC"
            : "FFFFFFFF";

        const cells = [
          [1, 2, customer.name],
          [3, 3, customer.contracts],
          [
            4,
            6,
            customer.revenue === null
              ? "—"
              : rupiah(customer.revenue),
          ],
          [7, 8, customer.status],
        ] as const;

        cells.forEach(
          ([start, end, value]) => {
            if (start !== end) {
              ws.mergeCells(
                row,
                start,
                row,
                end
              );
            }

            const cell = ws.getCell(
              row,
              start
            );

            cell.value = value;

            cell.font = {
              size: 9,
              color: { argb: "FF16213D" },
              bold: start === 1,
            };

            // WARNA DAN BORDER BARIS
            for (
              let c = start;
              c <= end;
              c += 1
            ) {
              ws.getCell(row, c).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                  argb: rowFill,
                },
              };

              ws.getCell(row, c).border = {
                bottom: {
                  style: "hair",
                  color: {
                    argb: "FFE5E7EB",
                  },
                },
              };
            }
          }
        );

        row += 1;
      }
    );

    // ==========================================
    // LEBAR KOLOM FINAL
    // ==========================================

    ws.getColumn(1).width = 24;
    ws.getColumn(2).width = 8;
    ws.getColumn(3).width = 12;
    ws.getColumn(4).width = 16;
    ws.getColumn(5).width = 14;
    ws.getColumn(6).width = 14;
    ws.getColumn(7).width = 13;
    ws.getColumn(8).width = 13;

    // ==========================================
    // PENGATURAN PRINT DAN FOOTER
    // ==========================================

    ws.views = [
      {
        state: "frozen",
        ySplit: 6,
        showGridLines: false,
      },
    ];

    ws.headerFooter.oddFooter =
      "&LMSDC Surabaya | CRM & Sales&CCRM & Sales&RPage &P / &N";

    // ==========================================
    // DOWNLOAD EXCEL
    // ==========================================

    const buffer =
      await workbook.xlsx.writeBuffer();

    downloadBlob(
      new Blob(
        [buffer as unknown as BlobPart],
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      ),
      `msdc-crm-sales-ringkasan-${exportDateId(
        exportedAt
      )}.xlsx`
    );
    } catch (error) {
      console.error("Gagal mengekspor Dashboard CRM-Sales ke Excel:", error);
      window.alert("File Excel gagal dibuat atau diunduh. Silakan coba kembali.");
    }
  }

  // ==========================================
  // TAMPILAN UTAMA DASHBOARD
  // ==========================================

  return (
    <div className="crm-dashboard">
      <style>{CRM_DASHBOARD_STYLES}</style>
      <PageHeader
        title="CRM & Penjualan"
        subtitle="Kelola pelanggan, peluang, dan kontrak layanan Data Center"
        containerClassName="px-7 pt-5 pb-2"
      />

      <div className="crm-dashboard__content">
        {/* AKSI DASHBOARD — ringkas, sejajar dengan tampilan awal Data Center/Core */}
        <div className="crm-dashboard__actions crm-dashboard__actions--standalone">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="crm-dashboard__button crm-dashboard__button--secondary"
            aria-haspopup="dialog"
          >
            <Download size={15} aria-hidden="true" />
            Ekspor
          </button>
          <Link
            to="/crm-sales/leads"
            className="crm-dashboard__button crm-dashboard__button--primary"
          >
            <Plus size={16} aria-hidden="true" />
            Prospek Baru
          </Link>
        </div>

        {/* KARTU KPI */}
        
<div className="crm-dashboard__kpi-grid">

  <KpiCard
    label="Total Customer"
    value={loading ? "—" : totalCustomers}
    note={`${totalActiveCustomers ?? 0} pelanggan aktif`}
    icon={<Users size={19} />}
    iconColor="#2563EB"
    iconBackground="#EFF6FF"
  />

  <KpiCard
    label="Total Lead"
    value={loading ? "—" : totalLeads}
    note="Seluruh status Lead"
    icon={<Users size={19} />}
    iconColor="#0891B2"
    iconBackground="#ECFEFF"
  />

  <KpiCard
    label="Total Opportunity"
    value={loading ? "—" : totalOpportunities}
    note="Seluruh status peluang"
    icon={<Target size={19} />}
    iconColor="#7C3AED"
    iconBackground="#F5F3FF"
  />

  <KpiCard
    label="Total Quotation"
    value={loading ? "—" : totalQuotations}
    note="Seluruh status penawaran"
    icon={<FileText size={19} />}
    iconColor="#0284C7"
    iconBackground="#F0F9FF"
  />

  <KpiCard
    label="Total Contract"
    value={loading ? "—" : totalContracts}
    note="Seluruh status kontrak"
    icon={<FileCheck2 size={19} />}
    iconColor="#059669"
    iconBackground="#ECFDF5"
  />

  <KpiCard
    label="Total Sales Order"
    value={loading ? "—" : totalSalesOrders}
    note="Seluruh sales order"
    icon={<FileSpreadsheet size={19} />}
    iconColor="#1D4ED8"
    iconBackground="#EFF6FF"
  />

  <KpiCard
    label="MRR Aktif"
    value={
      loading
        ? "—"
        : customerRevenueError
          ? "Tidak tersedia"
          : compactRupiah(Number(customerRevenue?.total_mrr ?? 0))
    }
    note={
      customerRevenueError
        ? "Data pendapatan gagal dimuat"
        : `ARR ${compactRupiah(Number(customerRevenue?.total_arr ?? 0))}`
    }
    icon={<TrendingUp size={19} />}
    iconColor="#D97706"
    iconBackground="#FFFBEB"
  />

  <KpiCard
    label="Nilai Pipeline"
    value={loading ? "—" : compactRupiah(monthlyRevenue)}
    note="Potensi nilai penjualan"
    icon={<Target size={19} />}
    iconColor="#D97706"
    iconBackground="#FFFBEB"
  />

</div>


        {/* VISUALISASI ANALITIK CRM-SALES — memakai data API yang sama */}
        <div className="crm-dashboard__chart-grid">
          {/* 1. JUMLAH DATA PADA SETIAP TAHAP (BUKAN KONVERSI KOHORT) */}
          <section className="crm-dashboard__panel" aria-labelledby="crm-pipeline-analytics-title">
            <div className="crm-dashboard__panel-header">
              <div>
                <h2 id="crm-pipeline-analytics-title" className="crm-dashboard__panel-title">Alur Aktivitas CRM-Sales</h2>
                <p className="crm-dashboard__panel-subtitle">Perbandingan jumlah data pada lima tahap proses penjualan</p>
              </div>
              <span className="crm-dashboard__panel-chip">5 Tahapan · Live Data</span>
            </div>
            <div className="crm-dashboard__panel-body">
              {loading ? (
                <LoadingState label="Memuat alur CRM..." />
              ) : (
                <>
                  <div className="crm-dashboard__chart-stats">
                    <span className="crm-dashboard__chart-stat"><span className="crm-dashboard__chart-stat-dot" style={{ backgroundColor: "#2563eb" }} /> Lead <strong>{totalLeads.toLocaleString("id-ID")}</strong></span>
                    <span className="crm-dashboard__chart-stat"><span className="crm-dashboard__chart-stat-dot" style={{ backgroundColor: "#f0a800" }} /> Quotation <strong>{totalQuotations.toLocaleString("id-ID")}</strong></span>
                    <span className="crm-dashboard__chart-stat"><span className="crm-dashboard__chart-stat-dot" style={{ backgroundColor: "#16a34a" }} /> Kontrak <strong>{totalContracts.toLocaleString("id-ID")}</strong></span>
                  </div>
                  <div className="crm-dashboard__chart-surface" role="img" aria-label="Grafik batang interaktif yang menunjukkan jumlah lead, peluang, penawaran, kontrak, dan sales order">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={progress}
                        layout="vertical"
                        margin={{ top: 24, right: 64, bottom: 16, left: 8 }}
                        barCategoryGap="26%"
                      >
                        <defs>
                          {progress.map((item, index) => (
                            <linearGradient id={`crm-dashboard-funnel-gradient-${index}`} key={item.label} x1="0" x2="1" y1="0" y2="0">
                              <stop offset="0%" stopColor={item.color} stopOpacity={0.75} />
                              <stop offset="100%" stopColor={item.color} stopOpacity={1} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid horizontal={false} stroke="#e7eef7" strokeDasharray="4 6" />
                        <XAxis type="number" domain={[0, Math.ceil(maxProgress * 1.22)]} allowDecimals={false} tick={{ fill: "#8a9cb0", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="label" width={116} tick={{ fill: "#405c7a", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: "rgba(226, 236, 247, .45)" }}
                          formatter={(value) => [`${Number(value ?? 0).toLocaleString("id-ID")} data`, "Jumlah"]}
                          contentStyle={{ background: "#0b2342", border: "none", borderRadius: 12, boxShadow: "0 16px 38px rgba(9,39,71,.24)", color: "#ffffff", fontSize: 12, padding: "11px 14px" }}
                          labelStyle={{ color: "#ffffff", fontWeight: 800, marginBottom: 5 }}
                          itemStyle={{ color: "#f5bb3f", fontWeight: 700 }}
                        />
                        <Bar dataKey="value" name="Jumlah" radius={[0, 9, 9, 0]} maxBarSize={36} isAnimationActive animationBegin={140} animationDuration={1200}>
                          {progress.map((item, index) => <Cell key={item.label} fill={`url(#crm-dashboard-funnel-gradient-${index})`} />)}
                          <LabelList dataKey="value" position="right" offset={10} style={{ fill: "#153456", fontSize: 12, fontWeight: 800 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="crm-dashboard__chart-footnote">Jumlah setiap kategori berasal dari total masing-masing modul. Perbandingan ini bukan conversion rate antar-record. Arahkan kursor pada batang untuk melihat jumlah persisnya.</p>
                </>
              )}
            </div>
          </section>

          {/* 2. STATUS CUSTOMER DALAM DONUT INTERAKTIF */}
          <section className="crm-dashboard__panel" aria-labelledby="crm-customer-status-title">
            <div className="crm-dashboard__panel-header">
              <div>
                <h2 id="crm-customer-status-title" className="crm-dashboard__panel-title">Komposisi Status Customer</h2>
                <p className="crm-dashboard__panel-subtitle">Jumlah dan persentase berdasarkan status pelanggan</p>
              </div>
              <span className="crm-dashboard__panel-chip">Status Aktual</span>
            </div>
            <div className="crm-dashboard__panel-body">
              {loadingDashboardSource ? (
                <LoadingState label="Memuat customer..." />
              ) : (
                <div className="crm-distribution-chart" aria-label="Distribusi status customer">
                  {visibleCustomerDistribution > 0 ? (
                    <div className="crm-distribution-chart__visual">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={customerDistribution} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={61} outerRadius={90} paddingAngle={3} cornerRadius={7} stroke="#fff" strokeWidth={2} isAnimationActive animationBegin={130} animationDuration={1150}>
                            {customerDistribution.map((item) => <Cell key={item.status} fill={item.color} />)}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${Number(value ?? 0).toLocaleString("id-ID")} customer`, "Jumlah"]}
                            contentStyle={{ background: "#0b2342", border: "none", borderRadius: 12, boxShadow: "0 16px 38px rgba(9,39,71,.24)", color: "#ffffff", fontSize: 12, padding: "11px 14px" }}
                            labelStyle={{ color: "#ffffff", fontWeight: 800 }}
                            itemStyle={{ color: "#ffffff", fontWeight: 700 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="crm-dashboard__donut-center" aria-hidden="true">
                        <strong>{totalCustomerDistribution.toLocaleString("id-ID")}</strong>
                        <span>Customer</span>
                      </div>
                    </div>
                  ) : (
                    <div className="crm-distribution-chart__empty">
                      <span className="crm-dashboard__empty-icon" aria-hidden="true"><Users size={20} /></span>
                      <strong>Belum ada data customer.</strong>
                    </div>
                  )}
                  <div className="crm-distribution-chart__legend">
                    {customerDistribution.map((item) => {
                      const percentage = totalCustomerDistribution > 0 ? Math.round((item.value / totalCustomerDistribution) * 100) : 0;
                      return (
                        <div className="crm-distribution-legend__item" key={item.status}>
                          <span className="crm-distribution-legend__dot" style={{ backgroundColor: item.color }} aria-hidden="true" />
                          <span className="crm-distribution-legend__label">{item.label}</span>
                          <strong className="crm-distribution-legend__value">{item.value.toLocaleString("id-ID")}</strong>
                          <small className="crm-distribution-legend__percentage">{percentage}% dari seluruh customer</small>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 3. GRAFIK TAMBAHAN: MRR CUSTOMER (DATA SUDAH TERSEDIA) */}
          <section className="crm-dashboard__panel" aria-labelledby="crm-top-mrr-title">
            <div className="crm-dashboard__panel-header">
              <div>
                <h2 id="crm-top-mrr-title" className="crm-dashboard__panel-title">Top Customer berdasarkan MRR</h2>
                <p className="crm-dashboard__panel-subtitle">Perbandingan pendapatan berulang bulanan (MRR) dari 5 customer dengan kontribusi pendapatan tertinggi</p>
              </div>
              <span className="crm-dashboard__panel-chip">MRR · Rupiah</span>
            </div>
            <div className="crm-dashboard__panel-body">
              {loadingCustomerRevenue ? (
                <LoadingState label="Memuat MRR pelanggan..." />
              ) : customerRevenueError || !hasTopCustomerMrr ? (
                <div className="crm-dashboard__chart-no-data" role="status">
                  <TrendingUp size={26} aria-hidden="true" />
                  <strong>{customerRevenueError ? "MRR belum dapat dimuat" : "Belum ada MRR yang tercatat"}</strong>
                  <span>{customerRevenueError ? "Data dari laporan pendapatan sedang tidak tersedia." : "Grafik akan tampil setelah data MRR pelanggan tersedia."}</span>
                </div>
              ) : (
                <>
                  <div className="crm-dashboard__chart-stats">
                    <span className="crm-dashboard__chart-stat"><span className="crm-dashboard__chart-stat-dot" style={{ backgroundColor: "#059669" }} /> Total MRR Top {dashboardTopMrrChart.length} <strong>{compactRupiah(dashboardTopMrrSum)}</strong></span>
                    <span className="crm-dashboard__chart-stat">MRR pelanggan terbesar <strong>{compactRupiah(dashboardTopMrrChart[0]?.revenue ?? 0)}</strong></span>
                  </div>
                  <div className="crm-dashboard__chart-surface crm-dashboard__chart-surface--compact" role="img" aria-label="Grafik batang MRR untuk lima customer teratas">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardTopMrrChart} layout="vertical" margin={{ top: 22, right: 58, bottom: 16, left: 4 }} barCategoryGap="27%">
                        <defs>
                          <linearGradient id="crm-dashboard-mrr-gradient" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor="#0891b2" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid horizontal={false} stroke="#e7eef7" strokeDasharray="4 6" />
                        <XAxis type="number" tick={{ fill: "#8a9cb0", fontSize: 10 }} tickFormatter={(value) => compactRupiah(Number(value)).replace("Rp ", "")} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={119} tick={{ fill: "#405c7a", fontSize: 11, fontWeight: 650 }} tickFormatter={(value: string) => value.length > 17 ? `${value.slice(0, 15)}…` : value} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: "rgba(226, 236, 247, .45)" }}
                          formatter={(value) => [rupiah(Number(value ?? 0)), "MRR"]}
                          contentStyle={{ background: "#0b2342", border: "none", borderRadius: 12, boxShadow: "0 16px 38px rgba(9,39,71,.24)", color: "#ffffff", fontSize: 12, padding: "11px 14px" }}
                          labelStyle={{ color: "#ffffff", fontWeight: 800, marginBottom: 5 }}
                          itemStyle={{ color: "#8ee0f0", fontWeight: 700 }}
                        />
                        <Bar dataKey="revenue" name="MRR" fill="url(#crm-dashboard-mrr-gradient)" radius={[0, 8, 8, 0]} maxBarSize={31} isAnimationActive animationBegin={220} animationDuration={1300}>
                          <LabelList dataKey="revenue" position="right" offset={8} formatter={(value) => compactRupiah(Number(value ?? 0))} style={{ fill: "#153456", fontSize: 10, fontWeight: 800 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="crm-dashboard__chart-footnote">MRR bersumber dari laporan customer revenue yang sama dengan kartu MRR Aktif. Nilai ini bukan total pembayaran terealisasi.</p>
                </>
              )}
            </div>
          </section>
        </div>

        {/* DAFTAR PELANGGAN DARI API */}
        <section className="crm-dashboard__panel crm-dashboard__customer-panel">
          <div className="crm-dashboard__panel-header crm-dashboard__customer-header">
            <div>
              <div className="crm-dashboard__customer-titleline">
                <h2 className="crm-dashboard__panel-title">Daftar Pelanggan Teratas</h2>
                <span className="crm-dashboard__customer-count">{dashboardTopCustomers.length} pelanggan</span>
              </div>
              <p className="crm-dashboard__panel-subtitle">
                Berdasarkan jumlah kontrak yang tercatat
              </p>
            </div>

            <Link
              to="/crm-sales/customers"
              className="crm-dashboard__text-link"
            >
              <span>Lihat Semua Customer</span><span className="crm-dashboard__link-arrow" aria-hidden="true"><Users size={15} /></span>
            </Link>
          </div>

          {loadingDashboardSource ? (
            <div className="crm-dashboard__table-state">
              <LoadingState label="Memuat data pelanggan..." />
            </div>
          ) : dashboardTopCustomers.length === 0 ? (
            <div className="crm-dashboard__empty-state">
              <span className="crm-dashboard__empty-icon" aria-hidden="true">
                <Users size={22} />
              </span>
              <strong>Belum ada data pelanggan yang tersedia.</strong>
            </div>
          ) : (
            <div className="crm-dashboard__table-wrap">
              <table className="crm-customer-table">
                <thead>
                  <tr>
                    {[
                      "Pelanggan",
                      "Kontrak",
                      "MRR",
                      "Status",
                    ].map((heading) => (
                      <th key={heading} scope="col">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {dashboardTopCustomers.map(
                    (customer, index) => (
                      <tr key={customer.id}>
                        {/* NAMA CUSTOMER */}
                        <td className="crm-customer-table__name">
                          <span className="crm-customer-table__person">
                            <span className="crm-customer-table__rank" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                            <span>{customer.name}</span>
                          </span>
                        </td>

                        {/* JUMLAH KONTRAK */}
                        <td className="crm-customer-table__number">
                          {customer.contracts}
                        </td>

                        {/* MRR */}
                        <td
                          className="crm-customer-table__revenue"
                          title="Monthly Recurring Revenue berdasarkan kontrak aktif"
                        >
                          {customer.revenue === null
                            ? "—"
                            : rupiah(customer.revenue)}
                        </td>

                        {/* STATUS */}
                        <td>
                          <StatusBadge
                            status={customer.status}
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* KETERANGAN DATA */}
          <div className="crm-dashboard__table-note">
            Jumlah kontrak dihitung berdasarkan data Contract yang terhubung
            ke Customer. Pendapatan ditampilkan setelah sumber transaksi
            terealisasi tersedia.
          </div>
        </section>
      </div>

      {/* MODAL EXPORT PDF / EXCEL */}
      {showExportModal && (
        <ExportFormatModal
          onClose={() => setShowExportModal(false)}
          onPdf={handleExportPdf}
          onExcel={handleExportExcel}
        />
      )}
    </div>
  );
}
