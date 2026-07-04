import { LinkIcon, Lock } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { getPublicShareLink } from "@/actions/share";
import { getInviteAccess } from "@/lib/sharing/access";
import { ALLOWED_SECTIONS } from "@/lib/sharing/config";
import { sanitizeStockAmounts } from "@/lib/sharing/sanitize";
import {
  getCombinedSalesGroupedForUser,
  getDashboardMetricsForUser,
  getInventoryPaginatedForUser,
  getProfitChartDataForUser,
  getSalesMetricsForUser,
} from "@/lib/stock/readers";
import { getAuthUser } from "@/lib/supabase/auth";
import { ShareContent } from "./ShareContent";
import { SharePasswordGate } from "./SharePasswordGate";

function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <LinkIcon className="w-7 h-7 text-primary/60" />
      </div>
      <h1 className="font-display text-display-xs text-foreground">
        Link not found
      </h1>
      <p className="text-body-md text-body max-w-sm">
        This share link is invalid, has expired, or has been disabled by its
        owner.
      </p>
    </div>
  );
}

function InviteOnlyGate() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Lock className="w-7 h-7 text-primary/60" />
      </div>
      <h1 className="font-display text-display-xs text-foreground">
        Invite-only portfolio
      </h1>
      <p className="text-body-md text-body max-w-sm">
        This portfolio is shared with invited members only. Sign in with the
        account that was invited to view it.
      </p>
      <Link
        href="/sign-in"
        className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-primary hover:bg-primary-active text-primary-foreground text-body-sm-strong transition-colors cursor-pointer"
      >
        Sign in
      </Link>
    </div>
  );
}

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const stockPage = Math.max(1, parseInt(String(sp.stockPage ?? "1"), 10) || 1);
  const salesPage = Math.max(1, parseInt(String(sp.salesPage ?? "1"), 10) || 1);
  const stockSearch =
    typeof sp.stockSearch === "string" ? sp.stockSearch : undefined;
  const stockSort = typeof sp.stockSort === "string" ? sp.stockSort : undefined;
  const stockStatus =
    typeof sp.stockStatus === "string" ? sp.stockStatus : undefined;
  const salesSearch =
    typeof sp.salesSearch === "string" ? sp.salesSearch : undefined;
  const salesSort =
    typeof sp.salesSort === "string" ? sp.salesSort : "date_desc";

  const link = await getPublicShareLink(token);

  if (!link) {
    return <NotFoundState />;
  }

  // Effective config: what this viewer may see. Public links carry it on the
  // link row; invite-only viewers get their per-person ShareInvite config.
  let sections = link.sections;
  let showStockAmounts = link.showStockAmounts;

  // Invite-only links require login + an accepted invite (or being the owner).
  if (link.visibility === "invite_only") {
    const {
      data: { user },
    } = await getAuthUser();

    if (!user) {
      return <InviteOnlyGate />;
    }
    if (user.id === link.userId) {
      // Owner previewing their own link sees everything.
      sections = [...ALLOWED_SECTIONS];
      showStockAmounts = true;
    } else {
      const access = await getInviteAccess(link.userId, user.id);
      if (!access) {
        // Don't reveal that the link exists to non-invitees.
        return <NotFoundState />;
      }
      sections = access.sections;
      showStockAmounts = access.showStockAmounts;
    }
    // Authorized invitee — no password gate.
  } else if (link.hasPassword) {
    // Public link password gate.
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(`share_session_${token}`);
    if (!sessionCookie) {
      return <SharePasswordGate token={token} />;
    }
  }

  const uid = link.userId;
  const has = (s: string) => sections.includes(s);
  const hideStockAmounts = !showStockAmounts;

  // Value sorts leak relative stock worth — ignore them when amounts are
  // hidden, matching the sort options removed from the UI.
  const effectiveStockSort =
    hideStockAmounts &&
    (stockSort === "value_asc" || stockSort === "value_desc")
      ? undefined
      : stockSort;

  const [
    dashboardMetrics,
    chartData,
    inventoryData,
    salesMetrics,
    salesCombined,
  ] = await Promise.all([
    has("dashboard") ? getDashboardMetricsForUser(uid) : null,
    has("dashboard") ? getProfitChartDataForUser(uid) : null,
    has("stock")
      ? getInventoryPaginatedForUser(
          uid,
          stockPage,
          10,
          stockSearch,
          effectiveStockSort,
          stockStatus,
        )
      : null,
    has("sales") ? getSalesMetricsForUser(uid) : null,
    has("sales")
      ? getCombinedSalesGroupedForUser(
          uid,
          salesPage,
          10,
          salesSearch,
          salesSort,
        )
      : null,
  ]);

  const inventoryProducts = inventoryData?.products ?? [];

  return (
    <ShareContent
      token={token}
      sections={sections}
      dashboardMetrics={dashboardMetrics}
      chartData={chartData}
      inventoryProducts={
        hideStockAmounts
          ? sanitizeStockAmounts(inventoryProducts)
          : inventoryProducts
      }
      inventoryCount={inventoryData?.totalCount ?? 0}
      stockCurrentPage={stockPage}
      stockTotalPages={inventoryData?.totalPages ?? 1}
      stockSort={effectiveStockSort}
      stockStatus={stockStatus}
      salesMetrics={salesMetrics}
      salesItems={salesCombined?.items ?? []}
      salesTotal={salesCombined?.total ?? 0}
      salesCurrentPage={salesPage}
      salesTotalPages={salesCombined?.totalPages ?? 1}
      salesSort={salesSort}
      hideStockAmounts={hideStockAmounts}
    />
  );
}
