import { Button } from "@box-ds";
import { DatabaseZap } from "lucide-react";
import {
  getInventoryPaginated,
  getInventoryValueByStatus,
  seedMockData,
} from "@/actions/stock";
import { BundleSaleButton } from "@/components/modals/bundleSaleModal";
import { StockPageControls } from "@/components/stock/StockPageControls";
import { SearchInput } from "@/components/ui/SearchInput";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    status?: string;
  }>;
}) {
  const isProduction = process.env.NODE_ENV === "production";
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams?.page) || 1;
  const searchParamStr = resolvedParams?.search;
  const sortParam = resolvedParams?.sort;
  const statusParam = resolvedParams?.status;
  const pageSize = 10;

  const [{ products, totalCount, totalPages }, totalStockValue] =
    await Promise.all([
      getInventoryPaginated(
        currentPage,
        pageSize,
        searchParamStr,
        undefined,
        sortParam,
        statusParam,
      ),
      getInventoryValueByStatus(statusParam),
    ]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-8 pt-6 sm:pt-8">
      {/* Header */}
      <h1 className="mb-5 font-display text-display-md text-foreground">
        Stock Inventory
      </h1>
      <div className="flex items-center gap-3 mb-3">
        <SearchInput
          placeholder="Search products or lots..."
          className="flex-1 max-w-lg"
        />
        <BundleSaleButton />
      </div>
      <div className="mb-4">
        {!isProduction && totalCount === 0 && !searchParamStr && (
          <form
            action={async () => {
              "use server";
              await seedMockData();
            }}
            className="mb-3"
          >
            <Button type="submit" size="sm" variant="outline" className="group">
              <DatabaseZap className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Generate Mock Data
            </Button>
          </form>
        )}
      </div>

      <StockPageControls
        currentSort={sortParam}
        currentStatus={statusParam}
        totalStockValue={totalStockValue}
        products={products}
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </div>
  );
}
