import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Maps each user's email to all possible Clerk user IDs that may exist in the
// database (dev and prod Clerk apps have different IDs for the same email).
const CLERK_IDS_BY_EMAIL: Record<string, string[]> = {
  "mailbowenxiao@gmail.com": [
    "user_3CmQvBEPIVXoMS1kNK0BzQC1uyE", // prod
    "user_3AeQaDbuFu7qceE8pdQ7O5Yciwq", // dev
  ],
  "shaohanyu2007@gmail.com": ["user_3D13I8xZfuG3eQSWsSg0Hany74Q"],
  "andrew.suhaili@gmail.com": ["user_3DehIOHwV22M3yuI8IUsrqCRiDY"],
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/sign-in`);
  }

  const response = NextResponse.redirect(`${origin}/dashboard`);

  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabaseAuth.auth.exchangeCodeForSession(code);

  if (!session?.user?.email) return response;

  const oldIds = CLERK_IDS_BY_EMAIL[session.user.email] ?? [];
  if (oldIds.length === 0) return response;

  const db = await createClient();

  for (const oldId of oldIds) {
    await Promise.all([
      db
        .from("Product")
        .update({ userId: session.user.id })
        .eq("userId", oldId),
      db.from("Bundle").update({ userId: session.user.id }).eq("userId", oldId),
      // Delete duplicate ShareLinks that would violate the unique constraint,
      // then migrate any remaining one.
      db
        .from("ShareLink")
        .select("id")
        .eq("userId", session.user.id)
        .maybeSingle()
        .then(({ data: existing }) =>
          existing
            ? db.from("ShareLink").delete().eq("userId", oldId)
            : db
                .from("ShareLink")
                .update({ userId: session.user.id })
                .eq("userId", oldId),
        ),
    ]);
  }

  return response;
}
