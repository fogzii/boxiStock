import { Suspense } from "react";
import { getIncomingInvites, getOutgoingInvites } from "@/actions/sharing";
import { FullScreenLoading } from "@/components/ui/fullScreenLoading";
import { SharingClient } from "./SharingClient";

export default function SharingPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 sm:pt-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-display-md text-foreground">
          Sharing
        </h1>
      </div>

      {/* Invite data streams in behind Suspense so the heading paints
          immediately instead of blocking on the invite + auth-admin lookups. */}
      <Suspense
        fallback={
          <div className="relative min-h-[65vh]">
            <FullScreenLoading contained />
          </div>
        }
      >
        <SharingContent />
      </Suspense>
    </div>
  );
}

async function SharingContent() {
  const [incoming, outgoing] = await Promise.all([
    getIncomingInvites(),
    getOutgoingInvites(),
  ]);

  return (
    <SharingClient
      pending={incoming.pending}
      shared={incoming.shared}
      outgoing={outgoing}
    />
  );
}
