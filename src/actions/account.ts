"use server";

import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export async function deleteAccount() {
  const {
    data: { user },
  } = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createClient();

  // Delete all user app data first
  const { data: products } = await supabase
    .from("Product")
    .select("id")
    .eq("userId", user.id);

  if (products && products.length > 0) {
    const productIds = products.map((p) => p.id);
    await supabase.from("Sale").delete().in("productId", productIds);
    await supabase.from("StockLot").delete().in("productId", productIds);
    await supabase.from("Product").delete().in("id", productIds);
  }

  // Sharing data: the user's own links, and any invite relationship on either side.
  await supabase.from("ShareLink").delete().eq("userId", user.id);
  await supabase.from("ShareInvite").delete().eq("ownerId", user.id);
  await supabase.from("ShareInvite").delete().eq("inviteeId", user.id);

  // Delete the auth user via admin API (requires service role key)
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) throw new Error(error.message);

  return { success: true };
}
