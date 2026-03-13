import { getInventory, seedMockData } from "@/actions/stock";
import { StockTable } from "@/components/stock/stockTable";
import { Button } from "@/components/ui/button";
import { DatabaseZap } from "lucide-react";

export default async function StockPage() {
  const inventory = await getInventory();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-8 pt-6 sm:pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Stock Inventory
        </h1>
        <div className="flex items-center gap-3">
          {inventory.length === 0 && (
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
      <div className="mb-8">
        <StockTable products={inventory} />
      </div>
    </div>
  );
}
