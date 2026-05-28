"use client";

import { Button, Modal, Skeleton } from "@box-ds";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import {
  getProductGroupHeaders,
  mergeProductSales,
} from "@/actions/stock/sales";

const MERGE_SKELETON_KEYS = ["msk-0", "msk-1", "msk-2", "msk-3", "msk-4"];

interface SourceGroup {
  productId: string;
  productName: string;
  sales: { id: string }[];
}

interface GroupHeader {
  productId: string;
  productName: string;
  latestDate: string;
}

interface MergeSaleModalProps {
  sourceGroup: SourceGroup;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MergeSaleModal({
  sourceGroup,
  isOpen,
  onClose,
}: MergeSaleModalProps) {
  const router = useRouter();
  const [selectedTarget, setSelectedTarget] =
    React.useState<GroupHeader | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [targetGroups, setTargetGroups] = React.useState<GroupHeader[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [rawSearch, setRawSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isConfirming, setIsConfirming] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedTarget(null);
      setCurrentPage(1);
      setRawSearch("");
      setDebouncedSearch("");
      setIsSearchOpen(false);
      setTargetGroups([]);
      setTotalPages(1);
    }
  }, [isOpen]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(rawSearch);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  React.useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoading(true);
    getProductGroupHeaders(
      currentPage,
      5,
      debouncedSearch,
      sourceGroup.productId,
    )
      .then((result) => {
        if (!cancelled) {
          setTargetGroups(result.groups);
          setTotalPages(result.totalPages);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load products.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, currentPage, debouncedSearch, sourceGroup.productId]);

  const handleConfirm = async () => {
    if (!selectedTarget || isConfirming) return;
    setIsConfirming(true);
    try {
      await mergeProductSales(sourceGroup.productId, selectedTarget.productId);
      toast.success(
        `Merged "${sourceGroup.productName}" into "${selectedTarget.productName}".`,
      );
      onClose();
      router.refresh();
    } catch {
      toast.error("Failed to merge sales.");
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    if (isConfirming) return;
    onClose();
  };

  const saleCount = sourceGroup.sales.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Merge sales"
      className="max-w-xl"
    >
      <div className="flex flex-col gap-5">
        {/* Explanation */}
        <p className="text-body-sm text-foreground/80">
          Merging will move all{" "}
          <strong className="text-foreground">
            {saleCount} {saleCount === 1 ? "sale" : "sales"}
          </strong>{" "}
          from{" "}
          <strong className="text-foreground">
            &ldquo;{sourceGroup.productName}&rdquo;
          </strong>{" "}
          into the selected product group. The original group will no longer
          appear.{" "}
          <span className="text-destructive text-body-sm-strong">
            This cannot be undone.
          </span>
        </p>

        {/* Dynamic example */}
        <div className="rounded-xl border border-border/40 overflow-hidden">
          {/* Target card (Product A) — top */}
          <div
            className={`px-4 pt-4 pb-1 transition-colors ${
              selectedTarget ? "bg-primary/5" : "bg-muted/20"
            }`}
          >
            {selectedTarget ? (
              <>
                <p className="text-body-sm-strong text-foreground truncate mb-2">
                  {selectedTarget.productName}
                </p>
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-3/4" />
                </div>
              </>
            ) : (
              <p className="text-body-sm text-muted-foreground/60 italic">
                Select a product below
              </p>
            )}
          </div>

          <div className="border-t border-border/30 mx-4" />

          {/* Source card (Product B) — indented, merging under target */}
          <div className="flex items-start gap-2 px-4 pt-1 pb-4 bg-white/[0.03]">
            <div className="flex flex-col items-center self-stretch pt-1 ml-4 shrink-0">
              <div className="w-px flex-1 bg-border/40" />
              <div className="w-3 h-px bg-border/40" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm-strong text-foreground truncate mb-2">
                {sourceGroup.productName}
              </p>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            </div>
          </div>
        </div>

        {/* Mini table */}
        <div className="flex flex-col gap-2">
          <div className="rounded-xl border border-border/30 overflow-hidden">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-border/30 bg-white/[0.03]">
                  <th className="px-4 py-2.5 text-left text-caption text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-left text-caption text-muted-foreground uppercase tracking-wider">
                    Product
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  MERGE_SKELETON_KEYS.map((key) => (
                    <tr
                      key={key}
                      className="border-b border-border/20 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Skeleton className="h-3.5 w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-3.5 w-32" />
                      </td>
                    </tr>
                  ))
                ) : targetGroups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-8 text-center text-body-sm text-muted-foreground"
                    >
                      No products found.
                    </td>
                  </tr>
                ) : (
                  targetGroups.map((group) => {
                    const isSelected =
                      selectedTarget?.productId === group.productId;
                    return (
                      <tr
                        key={group.productId}
                        onClick={() =>
                          setSelectedTarget(isSelected ? null : group)
                        }
                        className={`border-b border-border/20 last:border-0 cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10" : "hover:bg-primary/5"
                        }`}
                      >
                        <td
                          className={`px-4 py-3 whitespace-nowrap ${
                            isSelected
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatDate(group.latestDate)}
                        </td>
                        <td
                          className={`px-4 py-3 text-body-sm-strong ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {group.productName}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination + search row */}
          <div className="flex items-center justify-end gap-2">
            {isSearchOpen && (
              <div className="flex items-center gap-1 mr-auto">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={rawSearch}
                  onChange={(e) => setRawSearch(e.target.value)}
                  placeholder="Search products..."
                  className="h-7 w-36 sm:w-48 rounded-lg bg-muted/40 border border-border/40 px-2.5 text-caption text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setRawSearch("");
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-1.5 rounded-lg transition-colors ${
                isSearchOpen || rawSearch
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Toggle search"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-caption">Previous</span>
            </button>

            <span className="text-caption text-muted-foreground tabular-nums">
              {currentPage} / {Math.max(totalPages, 1)}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <span className="hidden sm:inline text-caption">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/20">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedTarget || isConfirming}
          >
            {isConfirming ? "Merging..." : "Confirm"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
