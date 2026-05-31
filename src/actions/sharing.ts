"use server";

import { revalidatePath } from "next/cache";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export type InviteStatus = "pending" | "accepted" | "declined";

export type OutgoingInvite = {
  id: string;
  inviteeEmail: string;
  inviteeName: string | null;
  status: InviteStatus;
  createdAt: string;
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

const ALL_SECTIONS = ["dashboard", "stock", "sales"];

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

/** Look up the owner's active, unexpired invite-only link token (or null). */
async function getActiveInviteOnlyToken(
  supabase: SupabaseServerClient,
  ownerId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("ShareLink")
    .select("token, expiresAt")
    .eq("userId", ownerId)
    .eq("visibility", "invite_only")
    .eq("isActive", true)
    .maybeSingle();

  if (!data) return null;
  if (data.expiresAt && new Date(data.expiresAt) < new Date()) return null;
  return data.token;
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
    sections: ALL_SECTIONS,
    passwordHash: null,
    expiresAt: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function sendInvite(email: string) {
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
      .update({ status: "pending", respondedAt: null, inviteeEmail: cleaned })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("ShareInvite").insert({
      ownerId: userId,
      inviteeId,
      inviteeEmail: cleaned,
      status: "pending",
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/sharing");
  return { ok: true, alreadyAccepted: false, inviteeEmail: cleaned };
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
    .select("id, inviteeId, inviteeEmail, status, createdAt")
    .eq("ownerId", userId)
    .order("createdAt", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data) return [];

  return Promise.all(
    data.map(async (row) => {
      const { name } = await resolveUser(supabase, row.inviteeId);
      return {
        id: row.id,
        inviteeEmail: row.inviteeEmail,
        inviteeName: name,
        status: row.status as InviteStatus,
        createdAt: row.createdAt,
      };
    }),
  );
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

  const pending: IncomingPendingInvite[] = [];
  const shared: SharedWithMe[] = [];

  await Promise.all(
    data.map(async (row) => {
      const { name, email } = await resolveUser(supabase, row.ownerId);
      if (row.status === "pending") {
        pending.push({
          id: row.id,
          ownerName: name,
          ownerEmail: email,
          createdAt: row.createdAt,
        });
      } else {
        const token = await getActiveInviteOnlyToken(supabase, row.ownerId);
        shared.push({
          id: row.id,
          ownerName: name,
          ownerEmail: email,
          token,
        });
      }
    }),
  );

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
