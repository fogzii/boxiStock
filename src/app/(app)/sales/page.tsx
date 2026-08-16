import { Suspense } from "react";
import { getSalesMetrics } from "@/actions/stock/metrics";
import { getCombinedSalesGrouped } from "@/actions/stock/sales";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { surfaceOnHeader } from "@/components/layout/pageContainer";
import { SalesTable } from "@/components/sales/salesTable";
import { UrlSearchInput } from "@/components/ui/UrlSearchInput";
import { formatCurrency } from "@/lib/formatting";

const searchField = (
  <UrlSearchInput
    placeholder="Search sales..."
    containerClassName="w-full sm:max-w-[320px]"
  />
);

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string }>;
}) {
  const unresolvedParams = await searchParams;
  const currentPage = Number(unresolvedParams?.page) || 1;
  const searchParamStr = unresolvedParams?.search;
  const sortParam = unresolvedParams?.sort ?? "date_desc";
  const pageSize = 10;

  return (
    <>
      <Suspense
        fallback={
          <PageHeader
            title="Sales History"
            overlap
            actions={searchField}
            statsLoading={3}
          />
        }
      >
        <SalesHeader />
      </Suspense>

      <PageBody overlap>
        <Suspense
          fallback={
            <SalesTable
              className={surfaceOnHeader}
              items={[]}
              total={0}
              totalPages={1}
              currentPage={currentPage}
              pageSize={pageSize}
              sort={sortParam}
              isExternalPending
            />
          }
        >
          <SalesContent
            currentPage={currentPage}
            pageSize={pageSize}
            search={searchParamStr}
            sort={sortParam}
          />
        </Suspense>
      </PageBody>
    </>
  );
}

async function SalesHeader() {
  const metrics = await getSalesMetrics();

  return (
    <PageHeader
      title="Sales History"
      overlap
      actions={searchField}
      stats={[
        {
          label: "Total Sales Today",
          value: formatCurrency(metrics.totalSalesToday),
        },
        {
          label: "Net Profit (Week)",
          value: formatCurrency(metrics.netProfitWeek),
        },
        {
          label: "Net Profit (Lifetime)",
          value: formatCurrency(metrics.netProfitLifetime),
        },
      ]}
    />
  );
}

async function SalesContent({
  currentPage,
  pageSize,
  search,
  sort,
}: {
  currentPage: number;
  pageSize: number;
  search?: string;
  sort: string;
}) {
  const combined = await getCombinedSalesGrouped(
    currentPage,
    pageSize,
    search,
    sort,
  );

  return (
    <SalesTable
      className={surfaceOnHeader}
      items={combined.items}
      total={combined.total}
      totalPages={combined.totalPages}
      currentPage={currentPage}
      pageSize={pageSize}
      sort={sort}
    />
  );
}
