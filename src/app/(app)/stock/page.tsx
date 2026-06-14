import { Suspense } from "react";
import { getInventoryPaginated } from "@/actions/stock/inventory";
import { getInventoryValueByStatus } from "@/actions/stock/metrics";
import { StockPageControls } from "@/components/stock/StockPageControls";
import { FullScreenLoading } from "@/components/ui/fullScreenLoading";
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
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams?.page) || 1;
  const searchParamStr = resolvedParams?.search;
  const sortParam = resolvedParams?.sort;
  const statusParam = resolvedParams?.status;
  const pageSize = 10;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 sm:pt-8">
      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-display text-display-md text-foreground">
          Stock Inventory
        </h1>
        <SearchInput placeholder="Search products or lots..." />
      </div>

      {/* Data-dependent content streams in behind Suspense so the page chrome
          paints immediately instead of blocking on the inventory RPCs. The
          boundary is deliberately NOT keyed on the search params: param-change
          navigations run inside useTransition (StockTable / SearchInput), which
          keeps the current content visible and shows the table-scoped pending
          skeleton instead of re-flashing this full fallback. */}
      <Suspense
        fallback={
          <div className="relative min-h-[65vh]">
            <FullScreenLoading contained />
          </div>
        }
      >
        <StockContent
          currentPage={currentPage}
          pageSize={pageSize}
          search={searchParamStr}
          sort={sortParam}
          status={statusParam}
        />
      </Suspense>
    </div>
  );
}

async function StockContent({
  currentPage,
  pageSize,
  search,
  sort,
  status,
}: {
  currentPage: number;
  pageSize: number;
  search?: string;
  sort?: string;
  status?: string;
}) {
  const [{ products, totalCount, totalPages }, totalStockValue] =
    await Promise.all([
      getInventoryPaginated(currentPage, pageSize, search, sort, status),
      getInventoryValueByStatus(status),
    ]);

  return (
    <>
      <div className="mb-4" />

      <StockPageControls
        currentSort={sort}
        currentStatus={status}
        totalStockValue={totalStockValue}
        products={products}
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </>
  );
}
