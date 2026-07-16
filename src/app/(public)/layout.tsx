import Image from "next/image";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getAuthUser } from "@/lib/supabase/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    data: { user },
  } = await getAuthUser();

  if (user) {
    return <DashboardShell user={user}>{children}</DashboardShell>;
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4">
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
      </header>

      <main className="flex-1 overflow-y-auto relative">{children}</main>

      <footer className="border-t border-border px-6 py-6 text-body-sm text-body flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>
          © {new Date().getFullYear()} BoxiStock. All rights reserved.
        </span>
        <nav className="flex items-center gap-4">
          <Link
            href="/terms"
            className="hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/contact"
            className="hover:text-foreground transition-colors"
          >
            Contact Us
          </Link>
        </nav>
      </footer>
    </div>
  );
}
