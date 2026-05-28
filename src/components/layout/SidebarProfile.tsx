"use client";

import type { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SidebarProfileProps {
  isCollapsed: boolean;
}

export function SidebarProfile({ isCollapsed }: SidebarProfileProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const email = user?.email ?? "";
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    (email.split("@")[0] || "?");

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
      <div
        className={cn(
          "flex flex-col min-w-0 flex-1 transition-all duration-300",
          isCollapsed ? "md:hidden" : "",
        )}
      >
        <span className="text-body-sm-strong text-foreground truncate">
          {displayName}
        </span>
        <span className="text-caption text-body truncate">{email}</span>
      </div>

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
