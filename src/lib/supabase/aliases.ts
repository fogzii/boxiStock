// Friendly aliases for generated Supabase table, insert, update, and RPC types.
// Keep this thin so database.types.ts remains the single generated source.
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./database.types";

export type ProductRow = Tables<"Product">;
export type ProductInsert = TablesInsert<"Product">;
export type ProductUpdate = TablesUpdate<"Product">;

export type StockLotRow = Tables<"StockLot">;
export type StockLotInsert = TablesInsert<"StockLot">;
export type StockLotUpdate = TablesUpdate<"StockLot">;

export type SaleRow = Tables<"Sale">;
export type SaleInsert = TablesInsert<"Sale">;
export type SaleUpdate = TablesUpdate<"Sale">;

export type BundleRow = Tables<"Bundle">;
export type BundleInsert = TablesInsert<"Bundle">;
export type BundleUpdate = TablesUpdate<"Bundle">;

export type BundleItemRow = Tables<"BundleItem">;
export type BundleItemInsert = TablesInsert<"BundleItem">;
export type BundleItemUpdate = TablesUpdate<"BundleItem">;

export type ShareLinkRow = Tables<"ShareLink">;
export type ShareLinkInsert = TablesInsert<"ShareLink">;
export type ShareLinkUpdate = TablesUpdate<"ShareLink">;

export type SalesByMonthRow =
  Database["public"]["Functions"]["get_sales_by_month"]["Returns"][number];
