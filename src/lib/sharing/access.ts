import { createClient } from "@/lib/supabase/server";

/**
 * Whether `viewerId` may view `ownerId`'s invite-only portfolio.
 *
 * This is a plain server-side helper (NOT a server action) so it can't be
 * invoked from the client to probe arbitrary invite relationships.
 */
export async function isAcceptedInvitee(
  ownerId: string,
  viewerId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ShareInvite")
    .select("id")
    .eq("ownerId", ownerId)
    .eq("inviteeId", viewerId)
    .eq("status", "accepted")
    .maybeSingle();
  return !!data;
}
