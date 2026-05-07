import { DatabaseZap } from "lucide-react";
import { getInventoryPaginated, seedMockData } from "@/actions/stock";
import { BundleSaleButton } from "@/components/stock/bundleSaleModal";
import { StockFilters } from "@/components/stock/StockFilters";
import { StockTable } from "@/components/stock/stockTable";
import { Button } from "@/components/ui/button";
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

  const { products, totalCount, totalPages } = await getInventoryPaginated(
    currentPage,
    pageSize,
    searchParamStr,
    undefined,
    sortParam,
    statusParam,
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-8 pt-6 sm:pt-8">
      {/* Header */}
      <h1 className="mb-5 text-3xl font-bold tracking-tight text-foreground">
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
        <StockFilters currentSort={sortParam} currentStatus={statusParam} />
        {!isProduction && totalCount === 0 && !searchParamStr && (
          <form
            action={async () => {
              "use server";
              await seedMockData();
            }}
          >
            <Button type="submit" size="sm" variant="outline" className="group">
              <DatabaseZap className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Generate Mock Data
            </Button>
          </form>
        )}
      </div>

      {/* Expandable Product Rows */}
      <div className="mb-4 pb-8">
        <StockTable
          products={products}
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
