import { getInventoryPaginated, seedMockData } from "@/actions/stock";
import { StockTable } from "@/components/stock/stockTable";
import { Button } from "@/components/ui/button";
import { DatabaseZap, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams?.page) || 1;
  const pageSize = 10;

  const { products, totalCount, totalPages } = await getInventoryPaginated(currentPage, pageSize);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-8 pt-6 sm:pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Stock Inventory
        </h1>
        <div className="flex items-center gap-3">
          {totalCount === 0 && (
            <form
              action={async () => {
                "use server";
                await seedMockData();
              }}
            >
              <Button
                type="submit"
                size="sm"
                variant="outline"
                className="group"
              >
                <DatabaseZap className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Generate Mock Data
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-muted-foreground mb-8">
        Monitor levels and manage individual lot transitions.
      </p>

      {/* Expandable Product Rows */}
      <div className="mb-4">
        <StockTable products={products} />
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-row items-center justify-between mb-8 px-1">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium text-foreground">{totalCount}</span> products
          </div>
          <div className="flex flex-row gap-2">
            {currentPage > 1 ? (
              <Link
                href={`/stock?page=${currentPage - 1}`}
                className="inline-flex items-center justify-center h-7 px-2.5 text-[0.8rem] font-medium rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center h-7 px-2.5 text-[0.8rem] font-medium rounded-lg border border-border bg-card opacity-50 pointer-events-none">
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </span>
            )}

            {currentPage < totalPages ? (
              <Link
                href={`/stock?page=${currentPage + 1}`}
                className="inline-flex items-center justify-center h-7 px-2.5 text-[0.8rem] font-medium rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center h-7 px-2.5 text-[0.8rem] font-medium rounded-lg border border-border bg-card opacity-50 pointer-events-none">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
