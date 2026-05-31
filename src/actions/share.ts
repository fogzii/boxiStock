"use server";

import bcrypt from "bcryptjs";
import { revalidateTag, unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_SECTIONS = ["dashboard", "stock", "sales"] as const;

export async function getMyShareLink() {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data } = await supabase
    .from("ShareLink")
    .select(
      "id, userId, token, sections, expiresAt, isActive, createdAt, passwordHash",
    )
    .eq("userId", userId)
    .maybeSingle();

  if (!data) return null;
  const { passwordHash, ...rest } = data;
  return { ...rest, hasPassword: !!passwordHash };
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
    .eq("userId", userId);

  if (error) throw new Error(error.message);
  revalidateTag("share-link");
}

export async function createShareLink({
  sections,
  password,
  expiresAt,
}: {
  sections: string[];
  password?: string;
  expiresAt?: Date | null;
}) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  if (!Array.isArray(sections) || sections.length === 0)
    throw new Error("At least one section is required");

  for (const s of sections) {
    if (!(ALLOWED_SECTIONS as readonly string[]).includes(s))
      throw new Error(`Invalid section: ${s}`);
  }

  const token = crypto.randomUUID().replace(/-/g, "");

  let passwordHash: string | null = null;
  if (password?.trim()) {
    passwordHash = await bcrypt.hash(password.trim(), 10);
  }

  const supabase = await createClient();

  const { error } = await supabase.from("ShareLink").upsert(
    {
      userId,
      token,
      sections,
      passwordHash,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    { onConflict: "userId" },
  );

  if (error) throw new Error(error.message);
  revalidateTag("share-link");
}

export async function disableShareLink() {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase
    .from("ShareLink")
    .update({ isActive: false })
    .eq("userId", userId);

  if (error) throw new Error(error.message);
  revalidateTag("share-link");
}

async function fetchPublicShareLink(token: string) {
  if (!token || typeof token !== "string") return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("ShareLink")
    .select(
      "id, userId, token, sections, expiresAt, isActive, createdAt, passwordHash",
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
