"use server";

import bcrypt from "bcryptjs";
import { revalidateTag, unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  MAX_PUBLIC_LINKS,
  normalizeConfig,
  type ShareConfig,
} from "@/lib/sharing/config";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export type PublicShareLinkSummary = {
  id: string;
  token: string;
  label: string | null;
  sections: string[];
  showStockAmounts: boolean;
  hasPassword: boolean;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

function isExpired(expiresAt: string | null) {
  return expiresAt != null && new Date(expiresAt) < new Date();
}

async function requireUserId(): Promise<string> {
  const {
    data: { user },
  } = await getAuthUser();
  if (!user?.id) throw new Error("Unauthorized");
  return user.id;
}

/** The caller's public ("everyone") share links, oldest first. */
export async function getMyPublicLinks(): Promise<PublicShareLinkSummary[]> {
  const userId = await requireUserId();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ShareLink")
    .select(
      "id, token, label, sections, showStockAmounts, passwordHash, expiresAt, isActive, createdAt",
    )
    .eq("userId", userId)
    .eq("visibility", "everyone")
    .eq("isActive", true)
    .order("createdAt", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map(({ passwordHash, ...rest }) => ({
    ...rest,
    hasPassword: !!passwordHash,
  }));
}

export type ShareLinkActionResult = { ok: true } | { ok: false; error: string };

export async function createPublicLink({
  label,
  sections,
  showStockAmounts,
  password,
  expiresAt,
}: ShareConfig & {
  label?: string | null;
  password?: string | null;
  expiresAt?: string | null;
}): Promise<ShareLinkActionResult> {
  try {
    const config = normalizeConfig({ sections, showStockAmounts });
    const userId = await requireUserId();

    const supabase = await createClient();

    // Cap counts active AND unexpired links; expired ones free up a slot.
    const { data: existing, error: countError } = await supabase
      .from("ShareLink")
      .select("id, expiresAt")
      .eq("userId", userId)
      .eq("visibility", "everyone")
      .eq("isActive", true);
    if (countError) throw new Error(countError.message);
    const activeCount = (existing ?? []).filter(
      (l) => !isExpired(l.expiresAt),
    ).length;
    if (activeCount >= MAX_PUBLIC_LINKS)
      throw new Error(
        `You can have at most ${MAX_PUBLIC_LINKS} active public links.`,
      );

    let passwordHash: string | null = null;
    if (password?.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const { error } = await supabase.from("ShareLink").insert({
      userId,
      visibility: "everyone",
      token: crypto.randomUUID().replace(/-/g, ""),
      label: label?.trim() || null,
      sections: config.sections,
      showStockAmounts: config.showStockAmounts,
      passwordHash,
      expiresAt: expiresAt ?? null,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    if (error) throw new Error(error.message);
    revalidateTag("share-link", "max");
    return { ok: true };
  } catch (error) {
    console.error("createPublicLink failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

/**
 * Update a public link's label/config/expiry without rotating its token, so
 * links already handed out keep working.
 */
export async function updatePublicLink(
  linkId: string,
  patch: {
    label?: string | null;
    sections?: string[];
    showStockAmounts?: boolean;
    expiresAt?: string | null;
  },
): Promise<ShareLinkActionResult> {
  try {
    const userId = await requireUserId();

    const update: {
      label?: string | null;
      sections?: string[];
      showStockAmounts?: boolean;
      expiresAt?: string | null;
    } = {};
    if (patch.label !== undefined) update.label = patch.label?.trim() || null;
    if (patch.sections !== undefined) {
      const config = normalizeConfig({
        sections: patch.sections,
        showStockAmounts: patch.showStockAmounts ?? true,
      });
      update.sections = config.sections;
      update.showStockAmounts = config.showStockAmounts;
    }
    if (patch.expiresAt !== undefined) update.expiresAt = patch.expiresAt;
    if (Object.keys(update).length === 0) return { ok: true };

    const supabase = await createClient();
    const { error } = await supabase
      .from("ShareLink")
      .update(update)
      .eq("id", linkId)
      .eq("userId", userId)
      .eq("visibility", "everyone");

    if (error) throw new Error(error.message);
    revalidateTag("share-link", "max");
    return { ok: true };
  } catch (error) {
    console.error("updatePublicLink failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

/** Set (non-empty string) or remove (null) a public link's password. */
export async function updatePublicLinkPassword(
  linkId: string,
  password: string | null,
): Promise<ShareLinkActionResult> {
  try {
    const userId = await requireUserId();

    let passwordHash: string | null = null;
    if (password?.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("ShareLink")
      .update({ passwordHash })
      .eq("id", linkId)
      .eq("userId", userId)
      .eq("visibility", "everyone");

    if (error) throw new Error(error.message);
    revalidateTag("share-link", "max");
    return { ok: true };
  } catch (error) {
    console.error("updatePublicLinkPassword failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

/** Permanently delete a public link for everyone using it. */
export async function deletePublicLink(
  linkId: string,
): Promise<ShareLinkActionResult> {
  try {
    const userId = await requireUserId();

    const supabase = await createClient();
    const { error } = await supabase
      .from("ShareLink")
      .delete()
      .eq("id", linkId)
      .eq("userId", userId)
      .eq("visibility", "everyone");

    if (error) throw new Error(error.message);
    revalidateTag("share-link", "max");
    return { ok: true };
  } catch (error) {
    console.error("deletePublicLink failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

async function fetchPublicShareLink(token: string) {
  if (!token || typeof token !== "string") return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("ShareLink")
    .select(
      "id, userId, token, label, sections, showStockAmounts, expiresAt, isActive, createdAt, visibility, passwordHash",
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

  // enforceRateLimit throws — caught and returned here (rather than left to
  // propagate) so it flows through the same { error } path as every other
  // failure in this function. The caller's catch block only expects to see
  // redirect()'s internal throw below; letting any other exception through
  // would get silently swallowed as if it were that redirect.
  try {
    await enforceRateLimit(
      `share:pw:${token}`,
      RATE_LIMITS.sharePassword,
      "password attempt",
    );
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Too many attempts. Please wait and try again.",
    };
  }

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
