import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublicShareLink } from "@/actions/share";
import { isAcceptedInvitee } from "@/lib/sharing/access";
import { getAuthUser } from "@/lib/supabase/auth";
import { createAuthAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Shared Stats | BoxiStock",
  robots: { index: false, follow: false },
};

function possessive(name: string) {
  return name.endsWith("s") ? `${name}' portfolio` : `${name}'s portfolio`;
}

export default async function ShareLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let username: string | null = null;
  try {
    const link = await getPublicShareLink(token);
    if (link?.userId) {
      // For invite-only links, only reveal the owner's name to authorized
      // viewers so a guessed token can't leak who it belongs to.
      let mayReveal = link.visibility !== "invite_only";
      if (!mayReveal) {
        const {
          data: { user },
        } = await getAuthUser();
        mayReveal =
          !!user &&
          (user.id === link.userId ||
            (await isAcceptedInvitee(link.userId, user.id)));
      }

      if (mayReveal) {
        const admin = await createAuthAdminClient();
        const {
          data: { user },
        } = await admin.auth.admin.getUserById(link.userId);
        const fullName = user?.user_metadata?.full_name as string | undefined;
        username = fullName?.split(" ")[0] ?? null;
      }
    }
  } catch {
    // username is optional decoration
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-foreground hover:opacity-80 transition-opacity"
          >
            <Image
              src="/boxistock-logo-ondark.svg"
              alt="BoxiStock"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="font-display text-body-lg">BoxiStock</span>
          </Link>
          {username && (
            <>
              <span className="text-border text-body-lg select-none">|</span>
              <span className="text-body text-body-sm-strong">
                {possessive(username)}
              </span>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">{children}</main>

      <footer className="border-t border-border px-6 py-4 text-caption text-body text-center shrink-0">
        Powered by{" "}
        <Link
          href="/"
          className="hover:text-foreground transition-colors text-body-sm-strong"
        >
          BoxiStock
        </Link>
      </footer>
    </div>
  );
}
