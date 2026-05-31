"use server";

import bcrypt from "bcryptjs";
import { revalidateTag, unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_SECTIONS = ["dashboard", "stock", "sales"] as const;

export type ShareVisibility = "everyone" | "invite_only";

function assertVisibility(
  visibility: string,
): asserts visibility is ShareVisibility {
  if (visibility !== "everyone" && visibility !== "invite_only")
    throw new Error(`Invalid visibility: ${visibility}`);
}

function assertSections(sections: unknown): asserts sections is string[] {
  if (!Array.isArray(sections) || sections.length === 0)
    throw new Error("At least one section is required");
  for (const s of sections) {
    if (!(ALLOWED_SECTIONS as readonly string[]).includes(s))
      throw new Error(`Invalid section: ${s}`);
  }
}

export async function getMyShareLink(visibility: ShareVisibility = "everyone") {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data } = await supabase
    .from("ShareLink")
    .select(
      "id, userId, token, sections, expiresAt, isActive, createdAt, visibility, passwordHash",
    )
    .eq("userId", userId)
    .eq("visibility", visibility)
    .maybeSingle();

  if (!data) return null;
  const { passwordHash, ...rest } = data;
  return { ...rest, hasPassword: !!passwordHash };
}

/** Convenience for the share modal, which manages both links at once. */
export async function getMyShareLinks() {
  const [everyone, inviteOnly] = await Promise.all([
    getMyShareLink("everyone"),
    getMyShareLink("invite_only"),
  ]);
  return { everyone, inviteOnly };
}

export async function updateSharePassword(password: string | null) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  let passwordHash: string | null = null;
  if (password?.trim()) {
    passwordHash = await bcrypt.hash(password.trim(), 10);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ShareLink")
    .update({ passwordHash })
    .eq("userId", userId)
    .eq("visibility", "everyone");

  if (error) throw new Error(error.message);
  revalidateTag("share-link", "max");
}

export async function createShareLink({
  sections,
  password,
  expiresAt,
  visibility = "everyone",
}: {
  sections: string[];
  password?: string;
  expiresAt?: Date | null;
  visibility?: ShareVisibility;
}) {
  assertVisibility(visibility);
  assertSections(sections);

  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const token = crypto.randomUUID().replace(/-/g, "");

  // Invite-only links are gated by invite acceptance + login, never a password.
  let passwordHash: string | null = null;
  if (visibility === "everyone" && password?.trim()) {
    passwordHash = await bcrypt.hash(password.trim(), 10);
  }

  const supabase = await createClient();

  const { error } = await supabase.from("ShareLink").upsert(
    {
      userId,
      visibility,
      token,
      sections,
      passwordHash,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    { onConflict: "userId,visibility" },
  );

  if (error) throw new Error(error.message);
  revalidateTag("share-link", "max");
}

/**
 * Update which sections an existing link exposes without rotating its token,
 * so invitees' bookmarked/clicked links keep working.
 */
export async function updateShareSections(
  sections: string[],
  visibility: ShareVisibility = "everyone",
) {
  assertVisibility(visibility);
  assertSections(sections);

  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase
    .from("ShareLink")
    .update({ sections })
    .eq("userId", userId)
    .eq("visibility", visibility);

  if (error) throw new Error(error.message);
  revalidateTag("share-link", "max");
}

export async function disableShareLink(
  visibility: ShareVisibility = "everyone",
) {
  assertVisibility(visibility);

  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase
    .from("ShareLink")
    .update({ isActive: false })
    .eq("userId", userId)
    .eq("visibility", visibility);

  if (error) throw new Error(error.message);
  revalidateTag("share-link", "max");
}

async function fetchPublicShareLink(token: string) {
  if (!token || typeof token !== "string") return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("ShareLink")
    .select(
      "id, userId, token, sections, expiresAt, isActive, createdAt, visibility, passwordHash",
    )
    .eq("token", token)
    .eq("isActive", true)
    .maybeSingle();

  if (!data) return null;
  if (data.expiresAt && new Date(data.expiresAt) < new Date()) return null;

  const { passwordHash, ...rest } = data;
  return { ...rest, hasPassword: !!passwordHash };
}

export const getPublicShareLink = unstable_cache(
  fetchPublicShareLink,
  ["share-link"],
  { revalidate: 60, tags: ["share-link"] },
);

export async function verifySharePassword(token: string, password: string) {
  if (!token || !password) return { error: "Invalid request" };

  await enforceRateLimit(
    `share:pw:${token}`,
    RATE_LIMITS.sharePassword,
    "password attempt",
  );

  const supabase = await createClient();
  const { data: link } = await supabase
    .from("ShareLink")
    .select("token, passwordHash, expiresAt, isActive")
    .eq("token", token)
    .eq("isActive", true)
    .maybeSingle();

  if (!link) return { error: "Link not found or inactive" };
  if (link.expiresAt && new Date(link.expiresAt) < new Date())
    return { error: "Link expired" };
  if (!link.passwordHash) return { error: "Link is not password protected" };

  const valid = await bcrypt.compare(password, link.passwordHash);
  if (!valid) return { error: "Invalid password" };

  const cookieStore = await cookies();
  cookieStore.set(`share_session_${token}`, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: `/share/${token}`,
    maxAge: 60 * 60 * 24,
  });

  redirect(`/share/${token}`);
}
