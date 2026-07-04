"use server";

import { revalidatePath } from "next/cache";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  ALLOWED_SECTIONS,
  normalizeConfig,
  type ShareConfig,
} from "@/lib/sharing/config";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export type InviteStatus = "pending" | "accepted" | "declined";

export type OutgoingInvite = {
  id: string;
  inviteeEmail: string;
  inviteeName: string | null;
  status: InviteStatus;
  createdAt: string;
  sections: string[];
  showStockAmounts: boolean;
};

export type IncomingPendingInvite = {
  id: string;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: string;
};

export type SharedWithMe = {
  id: string; // invite id (used to remove yourself)
  ownerName: string | null;
  ownerEmail: string | null;
  /** Current active invite-only link token, or null if the owner disabled it. */
  token: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Resolve an auth user's display name + email for invite rows. */
async function resolveUser(
  supabase: SupabaseServerClient,
  id: string,
): Promise<{ name: string | null; email: string | null }> {
  const { data } = await supabase.auth.admin.getUserById(id);
  const u = data?.user;
  const fullName = (u?.user_metadata?.full_name as string | undefined) ?? null;
  return { name: fullName, email: u?.email ?? null };
}

/**
 * Resolve many auth users at once: deduped ids, one parallel batch of admin
 * lookups, results keyed by id. Avoids per-row sequential resolution in the
 * invite list endpoints.
 */
async function resolveUsers(
  supabase: SupabaseServerClient,
  ids: string[],
): Promise<Map<string, { name: string | null; email: string | null }>> {
  const unique = [...new Set(ids)];
  const resolved = await Promise.all(
    unique.map(async (id) => [id, await resolveUser(supabase, id)] as const),
  );
  return new Map(resolved);
}

/**
 * Active, unexpired invite-only link tokens for a set of owners, in a single
 * query. Owners without a usable link are absent from the map.
 */
async function getActiveInviteOnlyTokens(
  supabase: SupabaseServerClient,
  ownerIds: string[],
): Promise<Map<string, string>> {
  if (ownerIds.length === 0) return new Map();
  const { data } = await supabase
    .from("ShareLink")
    .select("userId, token, expiresAt")
    .in("userId", ownerIds)
    .eq("visibility", "invite_only")
    .eq("isActive", true);

  const now = new Date();
  const tokens = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.expiresAt && new Date(row.expiresAt) < now) continue;
    tokens.set(row.userId, row.token);
  }
  return tokens;
}

/** Auto-create the caller's invite-only link (all sections) if absent. */
async function ensureInviteOnlyLink(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from("ShareLink")
    .select("id")
    .eq("userId", userId)
    .eq("visibility", "invite_only")
    .maybeSingle();

  if (existing) return;

  const token = crypto.randomUUID().replace(/-/g, "");
  const { error } = await supabase.from("ShareLink").insert({
    userId,
    visibility: "invite_only",
    token,
    sections: [...ALLOWED_SECTIONS],
    passwordHash: null,
    expiresAt: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function sendInvite(email: string, config: ShareConfig) {
  const normalized = normalizeConfig(config);

  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  await enforceRateLimit(`invite:${userId}`, RATE_LIMITS.invite, "invite");

  const cleaned = (email ?? "").trim();
  if (!cleaned) throw new Error("Enter an email address.");

  const supabase = await createClient();

  const { data: inviteeId, error: lookupError } = await supabase.rpc(
    "find_user_id_by_email",
    { p_email: cleaned },
  );
  if (lookupError) throw new Error(lookupError.message);
  if (!inviteeId) throw new Error("No boxiStock user with that email.");
  if (inviteeId === userId) throw new Error("You can't invite yourself.");

  // Make sure there's something to grant access to.
  await ensureInviteOnlyLink(supabase, userId);

  const { data: existing } = await supabase
    .from("ShareInvite")
    .select("id, status")
    .eq("ownerId", userId)
    .eq("inviteeId", inviteeId)
    .maybeSingle();

  if (existing?.status === "accepted") {
    return { ok: true, alreadyAccepted: true, inviteeEmail: cleaned };
  }

  if (existing) {
    // Re-invite a pending/declined relationship — reset to pending.
    const { error } = await supabase
      .from("ShareInvite")
      .update({
        status: "pending",
        respondedAt: null,
        inviteeEmail: cleaned,
        sections: normalized.sections,
        showStockAmounts: normalized.showStockAmounts,
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("ShareInvite").insert({
      ownerId: userId,
      inviteeId,
      inviteeEmail: cleaned,
      status: "pending",
      sections: normalized.sections,
      showStockAmounts: normalized.showStockAmounts,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/sharing");
  return { ok: true, alreadyAccepted: false, inviteeEmail: cleaned };
}

/** Owner-only: change what an invited person can see. */
export async function updateInviteConfig(
  inviteId: string,
  config: ShareConfig,
) {
  const normalized = normalizeConfig(config);

  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ShareInvite")
    .update({
      sections: normalized.sections,
      showStockAmounts: normalized.showStockAmounts,
    })
    .eq("id", inviteId)
    .eq("ownerId", userId)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Invite not found.");

  // No cache tag needed: the share page reads the invite row per request.
  revalidatePath("/sharing");
  return { ok: true };
}

export async function respondToInvite(inviteId: string, accept: boolean) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("ShareInvite")
    .select("id, inviteeId, status")
    .eq("id", inviteId)
    .maybeSingle();

  if (!invite || invite.inviteeId !== userId)
    throw new Error("Invite not found.");
  if (invite.status !== "pending")
    throw new Error("This invite has already been answered.");

  const { error } = await supabase
    .from("ShareInvite")
    .update({
      status: accept ? "accepted" : "declined",
      respondedAt: new Date().toISOString(),
    })
    .eq("id", inviteId);
  if (error) throw new Error(error.message);

  revalidatePath("/sharing");
  return { ok: true };
}

/** Remove a relationship — allowed for either the owner or the invitee. */
export async function removeInvite(inviteId: string) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("ShareInvite")
    .select("id, ownerId, inviteeId")
    .eq("id", inviteId)
    .maybeSingle();

  if (!invite || (invite.ownerId !== userId && invite.inviteeId !== userId))
    throw new Error("Invite not found.");

  const { error } = await supabase
    .from("ShareInvite")
    .delete()
    .eq("id", inviteId);
  if (error) throw new Error(error.message);

  revalidatePath("/sharing");
  return { ok: true };
}

/** People the current user has invited to view their portfolio. */
export async function getOutgoingInvites(): Promise<OutgoingInvite[]> {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ShareInvite")
    .select(
      "id, inviteeId, inviteeEmail, status, createdAt, sections, showStockAmounts",
    )
    .eq("ownerId", userId)
    .order("createdAt", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data) return [];

  const users = await resolveUsers(
    supabase,
    data.map((row) => row.inviteeId),
  );

  return data.map((row) => ({
    id: row.id,
    inviteeEmail: row.inviteeEmail,
    inviteeName: users.get(row.inviteeId)?.name ?? null,
    status: row.status as InviteStatus,
    createdAt: row.createdAt,
    sections: row.sections,
    showStockAmounts: row.showStockAmounts,
  }));
}

/**
 * Invites addressed to the current user: pending ones (to accept/decline) and
 * accepted ones (portfolios they can open).
 */
export async function getIncomingInvites(): Promise<{
  pending: IncomingPendingInvite[];
  shared: SharedWithMe[];
}> {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ShareInvite")
    .select("id, ownerId, status, createdAt")
    .eq("inviteeId", userId)
    .in("status", ["pending", "accepted"])
    .order("createdAt", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data) return { pending: [], shared: [] };

  const acceptedOwnerIds = data
    .filter((row) => row.status === "accepted")
    .map((row) => row.ownerId);

  const [users, tokens] = await Promise.all([
    resolveUsers(
      supabase,
      data.map((row) => row.ownerId),
    ),
    getActiveInviteOnlyTokens(supabase, acceptedOwnerIds),
  ]);

  const pending: IncomingPendingInvite[] = [];
  const shared: SharedWithMe[] = [];

  // Build from the original createdAt-desc rows so ordering is stable.
  for (const row of data) {
    const owner = users.get(row.ownerId);
    if (row.status === "pending") {
      pending.push({
        id: row.id,
        ownerName: owner?.name ?? null,
        ownerEmail: owner?.email ?? null,
        createdAt: row.createdAt,
      });
    } else {
      shared.push({
        id: row.id,
        ownerName: owner?.name ?? null,
        ownerEmail: owner?.email ?? null,
        token: tokens.get(row.ownerId) ?? null,
      });
    }
  }

  return { pending, shared };
}

/** Count of pending invites addressed to the current user (for the nav badge). */
export async function getPendingInviteCount(): Promise<number> {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("ShareInvite")
    .select("id", { count: "exact", head: true })
    .eq("inviteeId", userId)
    .eq("status", "pending");

  return count ?? 0;
}
