import { getIncomingInvites, getOutgoingInvites } from "@/actions/sharing";
import { SharingClient } from "./SharingClient";

export default async function SharingPage() {
  const [incoming, outgoing] = await Promise.all([
    getIncomingInvites(),
    getOutgoingInvites(),
  ]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 sm:pt-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-display-md text-foreground">
          Sharing
        </h1>
      </div>

      <SharingClient
        pending={incoming.pending}
        shared={incoming.shared}
        outgoing={outgoing}
      />
    </div>
  );
}
