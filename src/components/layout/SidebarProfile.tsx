"use client";

import type { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavLoading } from "@/components/layout/NavLoadingContext";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SidebarProfileProps {
  isCollapsed: boolean;
  user: User;
}

export function SidebarProfile({ isCollapsed, user }: SidebarProfileProps) {
  const { startLoading } = useNavLoading();
  const pathname = usePathname();

  const email = user.email ?? "";
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    (email.split("@")[0] || email);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/sign-in";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-muted/30",
        isCollapsed && "md:justify-center md:p-2",
      )}
    >
      <Link
        href="/settings"
        onClick={() => {
          if (pathname !== "/settings") startLoading();
        }}
        className={cn(
          "flex flex-col min-w-0 flex-1 transition-all duration-300 cursor-pointer hover:opacity-80",
          isCollapsed ? "md:hidden" : "",
        )}
      >
        <span className="text-body-sm-strong text-foreground truncate">
          {displayName}
        </span>
        <span className="text-caption text-body truncate">{email}</span>
      </Link>

      {!isCollapsed && (
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sign out"
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
