
import type { RouteObject } from "react-router-dom";
import { CustomerListPage } from "./pages/CustomerListPage";
import { CustomerFormPage } from "./pages/CustomerFormPage";
import { Customer360Page } from "./pages/Customer360Page";
import { CrmDashboardPage } from "./pages/CrmDashboardPage";
import {
  CrmReportsPage,
  MonitoringSalesPage
} from "./pages/CrmReportsPage";
import { LeadListPage } from "./pages/LeadListPage";
import { OpportunityListPage } from "./pages/OpportunityListPage";
import { QuotationListPage } from "./pages/QuotationListPage";
import { QuotationSendPage } from "./pages/QuotationSendPage";
import { SalesOrderListPage } from "./pages/SalesOrderListPage";
import { SalesOrderDetailPage } from "./pages/SalesOrderDetailPage";
import { ContractListPage } from "./pages/ContractListPage";
import { ContractDetailPage } from "./pages/ContractDetailPage";
import { ContractSlaPage } from "./pages/ContractSlaPage";
import { SlaListPage } from "./pages/SlaListPage";
import { PromoPackageListPage } from "./pages/PromoPackageListPage";
import { ProductListPage } from "./pages/ProductListPage";
import { QuotationFormPage } from "./pages/QuotationFormModal";
import { RenewalListPage } from "./pages/RenewalListPage";
import { RenewalDetailPage } from "./pages/RenewalDetailPage";

/**
 * CRM Sales Routes
 *
 * Form Create/Edit menggunakan Modal INLINE di dalam list page
 * (bukan route terpisah) — lihat file page masing-masing
 * untuk implementasi modal.
 */
export const crmSalesRoutes: RouteObject[] = [
  // Dashboard & Laporan
  { path: "crm-sales", element: <CrmDashboardPage /> },
  { path: "crm-sales/reports", element: <CrmReportsPage /> },
  {
  path: "crm-sales/monitoring-sales",
  element: <MonitoringSalesPage />
},

  // Customer
  { path: "crm-sales/customers", element: <CustomerListPage /> },
  { path: "crm-sales/customers/new", element: <CustomerFormPage /> },
  { path: "crm-sales/customers/:id", element: <CustomerFormPage /> },
  { path: "crm-sales/customer-360", element: <Customer360Page /> },

  // Leads
  { path: "crm-sales/leads", element: <LeadListPage /> },

  // Opportunity
  { path: "crm-sales/opportunities", element: <OpportunityListPage /> },

  // Quotation
  { path: "crm-sales/quotations", element: <QuotationListPage /> },
  { path: "crm-sales/quotations/new", element: <QuotationFormPage /> },
  { path: "crm-sales/quotations/:id/send", element: <QuotationSendPage /> },
  { path: "crm-sales/quotations/:id", element: <QuotationListPage /> },

  // Sales Order & Invoice
  { path: "crm-sales/sales-orders", element: <SalesOrderListPage /> },
  { path: "crm-sales/sales-orders/:id", element: <SalesOrderDetailPage /> },

  // Contract & SLA
  { path: "crm-sales/contracts", element: <ContractListPage /> },
  { path: "crm-sales/contracts/slas", element: <SlaListPage /> },
  { path: "crm-sales/contracts/renewals", element: <RenewalListPage /> },
  { path: "crm-sales/contracts/renewals/:id", element: <RenewalDetailPage /> },
  { path: "crm-sales/contracts/:id", element: <ContractDetailPage /> },
  { path: "crm-sales/contracts/:id/slas", element: <ContractSlaPage /> },

  // Master Data
  { path: "crm-sales/packages", element: <PromoPackageListPage /> },
  { path: "crm-sales/products", element: <ProductListPage /> },
];
