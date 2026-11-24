import type { RouteObject } from "react-router-dom";
import { FinanceDashboardPage } from "./pages/FinanceDashboardPage";
import { AccountListPage } from "./pages/AccountListPage";
import { CostCenterListPage } from "./pages/CostCenterListPage";
import { ArInvoiceListPage } from "./pages/ArInvoiceListPage";
import { ArInvoiceFormPage } from "./pages/ArInvoiceFormPage";
import { ArPaymentListPage } from "./pages/ArPaymentListPage";
import { ArAgingReportPage } from "./pages/ArAgingReportPage";
import { ArCustomerListPage } from "./pages/ArCustomerListPage";
import { ArCustomerDetailPage } from "./pages/ArCustomerDetailPage";
import { ApBillListPage } from "./pages/ApBillListPage";
import { ApBillFormPage } from "./pages/ApBillFormPage";
import { ApPaymentListPage } from "./pages/ApPaymentListPage";
import { ApAgingReportPage } from "./pages/ApAgingReportPage";
import { ApVendorListPage } from "./pages/ApVendorListPage";
import { ApVendorDetailPage } from "./pages/ApVendorDetailPage";
import { CbAccountListPage } from "./pages/CbAccountListPage";
import { CbAccountDetailPage } from "./pages/CbAccountDetailPage";
import { CbMutationListPage } from "./pages/CbMutationListPage";
import { CbCashFlowPage } from "./pages/CbCashFlowPage";
import { BillingContractListPage } from "./pages/BillingContractListPage";
import { BillingContractDetailPage } from "./pages/BillingContractDetailPage";
import { ApIntegrationPage } from "./pages/ApIntegrationPage";
import { ArIntegrationPage } from "./pages/ArIntegrationPage";
import { HrIntegrationPage } from "./pages/HrIntegrationPage";
import { FixedAssetListPage } from "./pages/FixedAssetListPage";
import { FixedAssetDetailPage } from "./pages/FixedAssetDetailPage";
import { BudgetListPage } from "./pages/BudgetListPage";
import { BudgetVsActualPage } from "./pages/BudgetVsActualPage";
import { CostCenterReportPage } from "./pages/CostCenterReportPage";
import { ProfitCenterListPage } from "./pages/ProfitCenterListPage";
import { ProfitCenterComparisonPage } from "./pages/ProfitCenterComparisonPage";
import { ProfitCenterReportPage } from "./pages/ProfitCenterReportPage";
import { TaxTypeListPage } from "./pages/TaxTypeListPage";
import { TaxProfileListPage } from "./pages/TaxProfileListPage";
import { TaxEFakturListPage } from "./pages/TaxEFakturListPage";
import { TaxWithholdingListPage } from "./pages/TaxWithholdingListPage";
import { TaxReportPage } from "./pages/TaxReportPage";
import { PeriodListPage } from "./pages/PeriodListPage";
import { FinancialReportsHubPage } from "./pages/FinancialReportsHubPage";
import { BalanceSheetPage } from "./pages/BalanceSheetPage";
import { ProfitLossPage } from "./pages/ProfitLossPage";
import { JournalListPage } from "./pages/JournalListPage";
import { JournalDetailPage } from "./pages/JournalDetailPage";
import { ClosingEntriesPage } from "./pages/ClosingEntriesPage";
import { TrialBalancePage } from "./pages/TrialBalancePage";
import { AccountLedgerPage } from "./pages/AccountLedgerPage";
import { ArHubPage } from "./pages/ArHubPage";
import { ApHubPage } from "./pages/ApHubPage";
import { CbHubPage } from "./pages/CbHubPage";
import { FixedAssetRegisterPage } from "./pages/FixedAssetRegisterPage";
import { DepreciationSchedulePage } from "./pages/DepreciationSchedulePage";
import { CustomerLedgerPage } from "./pages/CustomerLedgerPage";
import { VendorLedgerPage } from "./pages/VendorLedgerPage";
import { CashBookPage } from "./pages/CashBookPage";
import { ExecutiveSummaryPage } from "./pages/ExecutiveSummaryPage";
import { AuditLogPage } from "./pages/AuditLogPage";

// PATH RELATIF (tanpa "/" di depan) - lihat catatan sama di
// modules/crm-sales/routes.tsx soal kenapa ini wajib relatif.
//
// CATATAN: tidak ada route "finance/gl/journals/new" - jurnal manual
// dibuat lewat POPUP (JournalFormModal, dipicu dari JournalListPage),
// bukan halaman terpisah - pola sama dipakai AR/AP Payment (Modal) dan
// Credit Limit/Payment Term (modal inline di List Page masing-masing).
export const financeAccountingRoutes: RouteObject[] = [
  { path: "finance", element: <FinanceDashboardPage /> },
  { path: "finance/dashboard", element: <FinanceDashboardPage /> },
  { path: "finance/ar-hub", element: <ArHubPage /> },
  { path: "finance/ap-hub", element: <ApHubPage /> },
  { path: "finance/cb-hub", element: <CbHubPage /> },
  { path: "finance/accounts", element: <AccountListPage /> },
  { path: "finance/cost-centers", element: <CostCenterListPage /> },
  { path: "finance/cost-centers/:costCenterId/report", element: <CostCenterReportPage /> },
  { path: "finance/ar-invoices", element: <ArInvoiceListPage /> },
  { path: "finance/ar-invoices/new", element: <ArInvoiceFormPage /> },
  { path: "finance/ar/payments", element: <ArPaymentListPage /> },
  { path: "finance/ar/aging", element: <ArAgingReportPage /> },
  { path: "finance/ar/customers", element: <ArCustomerListPage /> },
  { path: "finance/ar/customers/:customerId", element: <ArCustomerDetailPage /> },
  { path: "finance/ap-bills", element: <ApBillListPage /> },
  { path: "finance/ap-bills/new", element: <ApBillFormPage /> },
  { path: "finance/ap/payments", element: <ApPaymentListPage /> },
  { path: "finance/ap/aging", element: <ApAgingReportPage /> },
  { path: "finance/ap/vendors", element: <ApVendorListPage /> },
  { path: "finance/ap/vendors/:vendorId", element: <ApVendorDetailPage /> },
  { path: "finance/cb/accounts", element: <CbAccountListPage /> },
  { path: "finance/cb/accounts/:accountId", element: <CbAccountDetailPage /> },
  { path: "finance/cb/mutations", element: <CbMutationListPage /> },
  { path: "finance/cb/cash-flow", element: <CbCashFlowPage /> },
  { path: "finance/billing/contracts", element: <BillingContractListPage /> },
  { path: "finance/billing/contracts/:contractId", element: <BillingContractDetailPage /> },
  { path: "finance/integration/ap", element: <ApIntegrationPage /> },
  { path: "finance/integration/ar", element: <ArIntegrationPage /> },
  { path: "finance/integration/hr", element: <HrIntegrationPage /> },
  { path: "finance/assets", element: <FixedAssetListPage /> },
  { path: "finance/assets/:assetId", element: <FixedAssetDetailPage /> },
  { path: "finance/budgets", element: <BudgetListPage /> },
  { path: "finance/budgets/vs-actual", element: <BudgetVsActualPage /> },
  { path: "finance/profit-centers", element: <ProfitCenterListPage /> },
  { path: "finance/profit-centers/comparison", element: <ProfitCenterComparisonPage /> },
  { path: "finance/profit-centers/:profitCenterId/report", element: <ProfitCenterReportPage /> },
  { path: "finance/tax/types", element: <TaxTypeListPage /> },
  { path: "finance/tax/profiles", element: <TaxProfileListPage /> },
  { path: "finance/tax/efaktur", element: <TaxEFakturListPage /> },
  { path: "finance/tax/withholding", element: <TaxWithholdingListPage /> },
  { path: "finance/tax/reports", element: <TaxReportPage /> },
  { path: "finance/reports", element: <FinancialReportsHubPage /> },
  { path: "finance/reports/balance-sheet", element: <BalanceSheetPage /> },
  { path: "finance/reports/profit-loss", element: <ProfitLossPage /> },
  { path: "finance/gl/journals", element: <JournalListPage /> },
  { path: "finance/gl/periods", element: <PeriodListPage /> },
  { path: "finance/gl/closing-entries", element: <ClosingEntriesPage /> },
  { path: "finance/gl/journals/:journalNumber", element: <JournalDetailPage /> },
  { path: "finance/gl/trial-balance", element: <TrialBalancePage /> },
  { path: "finance/gl/ledger/:accountId", element: <AccountLedgerPage /> },
  { path: "finance/reports/fixed-assets/register", element: <FixedAssetRegisterPage /> },
  { path: "finance/reports/depreciation-schedule", element: <DepreciationSchedulePage /> },
  { path: "finance/reports/customer-ledger", element: <CustomerLedgerPage /> },
  { path: "finance/reports/vendor-ledger", element: <VendorLedgerPage /> },
  { path: "finance/reports/cash-book", element: <CashBookPage /> },
  { path: "finance/reports/executive-summary", element: <ExecutiveSummaryPage /> },
  { path: "finance/reports/audit-log", element: <AuditLogPage /> },
];
