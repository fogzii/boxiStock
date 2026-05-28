import { Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicShareLink } from "@/actions/share";
import { createClient } from "@/lib/supabase/server";

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
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.admin.getUserById(link.userId);
      const fullName = user?.user_metadata?.full_name as string | undefined;
      username = fullName?.split(" ")[0] ?? null;
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
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Package className="w-5 h-5" />
            </div>
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
