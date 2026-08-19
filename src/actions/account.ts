"use server";

import { revalidateStockData } from "@/actions/stock/_helpers";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient, deleteAuthUser } from "@/lib/supabase/server";

export type DeleteAccountResult = { ok: true } | { ok: false; error: string };

export async function deleteAccount(): Promise<DeleteAccountResult> {
  try {
    const {
      data: { user },
    } = await getAuthUser();
    if (!user) throw new Error("Unauthorized");
    const userId = user.id;

    await enforceRateLimit(
      `settings:destructive:${userId}`,
      RATE_LIMITS.destructive,
      "destructive action",
    );

    const supabase = await createClient();

    // Collect any data-delete failure and abort BEFORE deleting the auth user,
    // so a partial failure never leaves orphaned rows behind a deleted account.
    const fail = (step: string, message: string): never => {
      throw new Error(
        `Account deletion failed while removing ${step}: ${message}`,
      );
    };

    // Delete all user app data first
    const { data: products, error: productsError } = await supabase
      .from("Product")
      .select("id")
      .eq("userId", userId);
    if (productsError) fail("products", productsError.message);

    if (products && products.length > 0) {
      const productIds = products.map((p) => p.id);
      const { error: saleError } = await supabase
        .from("Sale")
        .delete()
        .in("productId", productIds);
      if (saleError) fail("sales", saleError.message);
      const { error: lotError } = await supabase
        .from("StockLot")
        .delete()
        .in("productId", productIds);
      if (lotError) fail("stock lots", lotError.message);
      const { error: productError } = await supabase
        .from("Product")
        .delete()
        .in("id", productIds);
      if (productError) fail("products", productError.message);
    }

    // Bundles are keyed by userId directly (not via Product).
    const { data: bundles, error: bundlesError } = await supabase
      .from("Bundle")
      .select("id")
      .eq("userId", userId);
    if (bundlesError) fail("bundles", bundlesError.message);
    const bundleIds = (bundles ?? []).map((b) => b.id);
    if (bundleIds.length > 0) {
      const { error: bundleItemError } = await supabase
        .from("BundleItem")
        .delete()
        .in("bundleId", bundleIds);
      if (bundleItemError) fail("bundle items", bundleItemError.message);
    }
    const { error: bundleError } = await supabase
      .from("Bundle")
      .delete()
      .eq("userId", userId);
    if (bundleError) fail("bundles", bundleError.message);

    // Sharing data: the user's own links, and any invite relationship on either side.
    const { error: shareLinkError } = await supabase
      .from("ShareLink")
      .delete()
      .eq("userId", userId);
    if (shareLinkError) fail("share links", shareLinkError.message);
    const { error: ownedInviteError } = await supabase
      .from("ShareInvite")
      .delete()
      .eq("ownerId", userId);
    if (ownedInviteError) fail("share invites", ownedInviteError.message);
    const { error: receivedInviteError } = await supabase
      .from("ShareInvite")
      .delete()
      .eq("inviteeId", userId);
    if (receivedInviteError) fail("share invites", receivedInviteError.message);

    // Delete the auth user via admin API (client without accessToken).
    const { error } = await deleteAuthUser(userId);
    if (error) throw new Error(error.message);

    revalidateStockData(userId);
    return { ok: true };
  } catch (error) {
    console.error("deleteAccount failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}
