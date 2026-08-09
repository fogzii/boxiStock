import type { ShareConfig } from "@/lib/sharing/config";
import { createClient } from "@/lib/supabase/server";

/**
 * What `viewerId` may see of `ownerId`'s invite-only portfolio, or null if
 * they have no accepted invite.
 *
 * This is a plain server-side helper (NOT a server action) so it can't be
 * invoked from the client to probe arbitrary invite relationships.
 */
export async function getInviteAccess(
  ownerId: string,
  viewerId: string,
): Promise<ShareConfig | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ShareInvite")
    .select("sections, showStockAmounts, showSellPrice, showProjectedProfit")
    .eq("ownerId", ownerId)
    .eq("inviteeId", viewerId)
    .eq("status", "accepted")
    .maybeSingle();

  if (!data) return null;
  return {
    sections: data.sections,
    showStockAmounts: data.showStockAmounts,
    showSellPrice: data.showSellPrice,
    showProjectedProfit: data.showProjectedProfit,
  };
}

/** Whether `viewerId` may view `ownerId`'s invite-only portfolio. */
export async function isAcceptedInvitee(
  ownerId: string,
  viewerId: string,
): Promise<boolean> {
  return (await getInviteAccess(ownerId, viewerId)) !== null;
}
