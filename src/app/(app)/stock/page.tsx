import { Suspense } from "react";
import { getInventoryPaginated } from "@/actions/stock/inventory";
import { getInventoryValueByStatus } from "@/actions/stock/metrics";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { surfaceOnHeader } from "@/components/layout/pageContainer";
import { StockBandControls } from "@/components/stock/StockBandControls";
import { StockControlsProvider } from "@/components/stock/StockControlsContext";
import { StockPageControls } from "@/components/stock/StockPageControls";
import { StockSearchInput } from "@/components/stock/StockSearchInput";
import { FullScreenLoading } from "@/components/ui/fullScreenLoading";
import { formatCurrency } from "@/lib/formatting";

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
    // The provider spans header and body so the band's filters, search, and
    // the body's table share one navigation transition.
    <StockControlsProvider>
      {/* The header's total streams separately from the inventory rows so
          neither query holds up the other. */}
      <Suspense
        fallback={
          <StockHeader
            sort={sortParam}
            status={statusParam}
            totalStockValue={null}
          />
        }
      >
        <StockHeaderWithValue sort={sortParam} status={statusParam} />
      </Suspense>

      <PageBody overlap>
        {/* Data-dependent content streams in behind Suspense so the page chrome
            paints immediately instead of blocking on the inventory RPCs. The
            boundary is deliberately NOT keyed on the search params: param-change
            navigations run inside the shared StockControls transition, which
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
      </PageBody>
    </StockControlsProvider>
  );
}

async function StockHeaderWithValue({
  sort,
  status,
}: {
  sort?: string;
  status?: string;
}) {
  const totalStockValue = await getInventoryValueByStatus(status);
  return (
    <StockHeader
      sort={sort}
      status={status}
      totalStockValue={totalStockValue}
    />
  );
}

function StockHeader({
  sort,
  status,
  totalStockValue,
}: {
  sort?: string;
  status?: string;
  totalStockValue: number | null;
}) {
  return (
    <PageHeader
      title="Stock Inventory"
      overlap
      statsAlign="start"
      actions={
        <StockSearchInput
          placeholder="Search products or lots..."
          containerClassName="w-full sm:max-w-[320px]"
        />
      }
      bandActions={
        <StockBandControls currentSort={sort} currentStatus={status} />
      }
      {...(totalStockValue === null
        ? { statsLoading: 1 }
        : {
            stats: [
              {
                label: "Total Stock Value",
                value: formatCurrency(totalStockValue),
              },
            ],
          })}
    />
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
  const { products, totalCount, totalPages } = await getInventoryPaginated(
    currentPage,
    pageSize,
    search,
    sort,
    status,
  );

  return (
    <StockPageControls
      products={products}
      currentPage={currentPage}
      pageSize={pageSize}
      totalCount={totalCount}
      totalPages={totalPages}
      tableClassName={surfaceOnHeader}
    />
  );
}
