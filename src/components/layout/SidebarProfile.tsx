"use client";

import { useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface SidebarProfileProps {
  isCollapsed: boolean;
}

export function SidebarProfile({ isCollapsed }: SidebarProfileProps) {
  const { user } = useUser();
  const containerRef = useRef<HTMLDivElement>(null);

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const displayName =
    user?.username ??
    user?.fullName ??
    user?.firstName ??
    email.split("@")[0] ??
    "User";

  const handleContainerClick = (e: React.MouseEvent) => {
    // If the click originated from within the UserButton, let it be handled natively
    const target = e.target as HTMLElement;
    const isClerkButton = target.closest('.cl-userButtonBox') || target.closest('.cl-userButtonTrigger');
    
    if (!isClerkButton && containerRef.current) {
      // Find the inner clerk button and programmatically click it
      const clerkTrigger = containerRef.current.querySelector('button');
      if (clerkTrigger) {
        clerkTrigger.click();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer",
        isCollapsed && "md:justify-center md:p-2",
      )}
    >
      {/* Clerk UserButton (avatar + dropdown with sign-out, account management) */}
      <UserButton
        appearance={{
          variables: {
            colorBackground: "#0f0f12",
            colorText: "#ffffff",
            colorTextSecondary: "#d4d4d8",
            colorInputBackground: "#18181b",
            colorInputText: "#ffffff",
            colorPrimary: "#9180a8",
            colorNeutral: "#ffffff",
          },
          elements: {
            avatarBox: "w-9 h-9 ring-2 ring-primary/20",
            userButtonPopoverCard: {
              transform: "translate(-14px, -16px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
            },
            userButtonPopoverActionButtonIcon: "text-zinc-400",
            userPreviewMainIdentifier: { color: "#ffffff" },
            userPreviewSecondaryIdentifier: { color: "#d4d4d8" },
            userButtonPopoverActionButtonText: { color: "#ffffff" },
          },
        }}
      />

      {/* Name & email */}
      <div
        className={cn(
          "flex flex-col min-w-0 flex-1 transition-all duration-300",
          isCollapsed ? "md:hidden" : "",
        )}
      >
        <span className="text-sm font-semibold text-foreground truncate leading-tight">
          {displayName}
        </span>
        <span className="text-xs text-muted-foreground truncate leading-tight">
          {email}
        </span>
      </div>
    </div>
  );
}
