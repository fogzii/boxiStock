import { Suspense } from "react";
import { getIncomingInvites, getOutgoingInvites } from "@/actions/sharing";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { FullScreenLoading } from "@/components/ui/fullScreenLoading";
import { SharingClient } from "./SharingClient";

export default function SharingPage() {
  return (
    <>
      <PageHeader title="Sharing" />

      <PageBody>
        {/* Invite data streams in behind Suspense so the route shell paints
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
      </PageBody>
    </>
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
