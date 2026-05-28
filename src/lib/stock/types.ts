// Stock domain types used by server actions, readers, and UI components.
// These derive from generated Supabase rows instead of hand-written DB shapes.
import type {
  BundleItemRow,
  BundleRow,
  ProductRow,
  SaleRow,
  SalesByMonthRow,
  StockLotRow,
} from "@/lib/supabase/aliases";

export type RecentProductRow = Pick<ProductRow, "id" | "name">;

export type ProductHeaderRow = Pick<
  ProductRow,
  | "id"
  | "name"
  | "totalRevenue"
  | "totalProfit"
  | "totalUnitsSold"
  | "saleCount"
> & {
  lastSoldAt: string;
};

export type ProductGroupHeaderRow = Pick<ProductRow, "id" | "name"> & {
  lastSoldAt: string;
};

export type SaleListRow = Pick<
  SaleRow,
  | "id"
  | "dateSold"
  | "createdAt"
  | "quantitySold"
  | "totalSalePrice"
  | "totalProfit"
  | "notes"
  | "productId"
>;

export type SaleWithProductName = Pick<
  SaleRow,
  | "id"
  | "dateSold"
  | "createdAt"
  | "quantitySold"
  | "totalSalePrice"
  | "totalProfit"
  | "notes"
> & {
  Product?: Pick<ProductRow, "name"> | null;
};

export type BundleHeaderRow = Pick<
  BundleRow,
  | "id"
  | "name"
  | "totalSellPrice"
  | "totalBuyCost"
  | "totalProfit"
  | "dateSold"
  | "createdAt"
>;

export type BundleItemListRow = Pick<
  BundleItemRow,
  | "id"
  | "bundleId"
  | "productId"
  | "productName"
  | "quantityConsumed"
  | "buyPricePerUnit"
  | "totalBuyCost"
  | "lotId"
>;

export type BundleItemRestoreRow = Pick<
  BundleItemRow,
  "lotId" | "quantityConsumed"
>;

export type InventoryLot = Pick<
  StockLotRow,
  "id" | "initialQuantity" | "remainingQuantity" | "buyPrice" | "isStocked"
> & {
  dateAcquired: Date;
  lotIdentity?: StockLotRow["lotIdentity"];
  notes?: StockLotRow["notes"];
};

export type BundleInventoryLot = Pick<
  InventoryLot,
  "id" | "remainingQuantity" | "buyPrice" | "dateAcquired" | "lotIdentity"
>;

export type ProductWithLots = Pick<ProductRow, "id" | "name"> & {
  lots: InventoryLot[];
};

export type PaginatedInventoryProduct = ProductWithLots;

export type ProductSaleGroup = {
  productId: ProductRow["id"];
  productName: ProductRow["name"];
  latestDate: string;
  totalQuantity: number;
  totalSalePrice: number;
  totalProfit: number;
  sales: SaleWithProductName[];
};

export type BundleProductDisplay = {
  productId: BundleItemRow["productId"];
  productName: BundleItemRow["productName"];
  totalQuantity: number;
  totalBuyCost: number;
  weightedAvgBuyPrice: number;
  allocatedProfit: number;
  hasRestorable: boolean;
};

export type BundleGroup = {
  bundleId: BundleRow["id"];
  bundleName: BundleRow["name"];
  dateSold: BundleRow["dateSold"];
  createdAt: BundleRow["createdAt"];
  totalSellPrice: BundleRow["totalSellPrice"];
  totalBuyCost: BundleRow["totalBuyCost"];
  totalProfit: BundleRow["totalProfit"];
  products: BundleProductDisplay[];
};

export type CombinedSalesRow =
  | { kind: "product"; data: ProductSaleGroup }
  | { kind: "bundle"; data: BundleGroup };

export type StockLotSaleMatch = Pick<
  StockLotRow,
  "id" | "remainingQuantity" | "buyPrice" | "createdAt"
>;

export type ProductSaleMatch = Pick<ProductRow, "id"> & {
  lots: StockLotSaleMatch[] | null;
};

export type InventoryCsvRow = Pick<
  StockLotRow,
  | "initialQuantity"
  | "remainingQuantity"
  | "buyPrice"
  | "isStocked"
  | "dateAcquired"
  | "lotIdentity"
> & {
  productName: ProductRow["name"];
};

export type SalesCsvRow = Pick<
  SaleRow,
  "quantitySold" | "totalSalePrice" | "totalProfit" | "createdAt"
> & {
  productName: ProductRow["name"];
};

export type DashboardMetricsRow = {
  totalLifetimeProfit: number;
  currentInventoryValue: number;
  totalSoldCost: number;
};

export type SalesByMonth = SalesByMonthRow;
