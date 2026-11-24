import type { RouteObject } from "react-router-dom";
import { ProcurementDashboardPage } from "./pages/ProcurementDashboardPage";
import { VendorListPage } from "./pages/VendorListPage";
import { PrListPage } from "./pages/PrListPage";
import { VendorQuotationPage } from "./pages/VendorQuotationPage";
import { PoListPage } from "./pages/PoListPage";
import { PaymentRequestListPage } from "./pages/PaymentRequestListPage";
import { PoHistoryPage } from "./pages/PoHistoryPage";
import { GrnListPage } from "./pages/GrnListPage";
import { GoodsHandoverListPage } from "./pages/GoodsHandoverListPage";
import { WarrantyClaimListPage } from "./pages/WarrantyClaimListPage";
import { ItemLoanListPage } from "./pages/ItemLoanListPage";
import { DamagedItemReturnListPage } from "./pages/DamagedItemReturnListPage";
import { ItemListPage } from "./pages/ItemListPage";
import { StockMovementListPage } from "./pages/StockMovementListPage";
import { WarehouseListPage } from "./pages/WarehouseListPage";
import { ServiceLogPage } from "./pages/ServiceLogPage";
import { AssetMaintenanceListPage } from "./pages/AssetMaintenanceListPage";
import { SuratProcurementPage } from "./pages/SuratProcurementPage";

export const procurementInventoryRoutes: RouteObject[] = [
  { path: "procurement-inventory/dashboard", element: <ProcurementDashboardPage /> },
  { path: "procurement-inventory/vendors", element: <VendorListPage /> },
  { path: "procurement-inventory/purchase-requests", element: <PrListPage /> },
  { path: "procurement-inventory/vendor-quotations", element: <VendorQuotationPage /> },
  { path: "procurement-inventory/purchase-orders", element: <PoListPage /> },
  { path: "procurement-inventory/payment-requests", element: <PaymentRequestListPage /> },
  { path: "procurement-inventory/po-history", element: <PoHistoryPage /> },
  { path: "procurement-inventory/goods-receipts", element: <GrnListPage /> },
  { path: "procurement-inventory/goods-handovers", element: <GoodsHandoverListPage /> },
  { path: "procurement-inventory/goods-handover", element: <GoodsHandoverListPage /> },
  { path: "procurement-inventory/warranty-claims", element: <WarrantyClaimListPage /> },
  { path: "procurement-inventory/item-loans", element: <ItemLoanListPage /> },
  { path: "procurement-inventory/damaged-item-returns", element: <DamagedItemReturnListPage /> },
  { path: "procurement-inventory/items", element: <ItemListPage /> },
  { path: "procurement-inventory/stock-movements", element: <StockMovementListPage /> },
  { path: "procurement-inventory/warehouses", element: <WarehouseListPage /> },
  { path: "procurement-inventory/service-log", element: <ServiceLogPage /> },
  { path: "procurement-inventory/maintenance", element: <AssetMaintenanceListPage /> },
  { path: "procurement-inventory/assets", element: <AssetMaintenanceListPage /> },
  { path: "procurement-inventory/asset-maintenance", element: <AssetMaintenanceListPage /> },
  { path: "procurement-inventory/surat", element: <SuratProcurementPage /> },
];
