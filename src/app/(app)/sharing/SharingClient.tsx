"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
} from "@box-ds";
import {
  Check,
  ExternalLink,
  Loader2,
  Mail,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import {
  type IncomingPendingInvite,
  type InviteStatus,
  type OutgoingInvite,
  removeInvite,
  respondToInvite,
  type SharedWithMe,
  sendInvite,
} from "@/actions/sharing";
import { InviteSectionsPanel, PublicLinkSection } from "./ShareLinksSection";

interface SharingClientProps {
  pending: IncomingPendingInvite[];
  shared: SharedWithMe[];
  outgoing: OutgoingInvite[];
}

const TABS = [
  { value: "invite", label: "Invite Only" },
  { value: "public", label: "Public" },
];

type SharingTab = "invite" | "public";

const STATUS_META: Record<
  InviteStatus,
  { label: string; variant: "warning" | "positive" | "negative" }
> = {
  pending: { label: "Pending", variant: "warning" },
  accepted: { label: "Accepted", variant: "positive" },
  declined: { label: "Declined", variant: "negative" },
};

export function SharingClient({
  pending,
  shared,
  outgoing,
}: SharingClientProps) {
  const router = useRouter();
  const [, startTransition] = React.useTransition();
  const [activeTab, setActiveTab] = React.useState<SharingTab>("invite");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    try {
      await action();
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  };

  const handleRespond = (id: string, accept: boolean) =>
    runAction(id, async () => {
      try {
        await respondToInvite(id, accept);
        toast.success(accept ? "Invite accepted." : "Invite declined.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong.",
        );
        throw err;
      }
    });

  const handleRemove = (id: string) =>
    runAction(id, async () => {
      try {
        await removeInvite(id);
        toast.success("Removed.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong.",
        );
        throw err;
      }
    });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim();
    if (!cleaned) {
      toast.error("Enter an email address.");
      return;
    }
    setIsSending(true);
    try {
      const res = await sendInvite(cleaned);
      toast.success(
        res.alreadyAccepted
          ? "Already accepted"
          : `Invite sent to ${res.inviteeEmail}'s account.`,
      );
      setEmail("");
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSending(false);
    }
  };

  const rowBase =
    "flex items-center justify-between gap-3 rounded-xl border border-primary/10 bg-primary/5 px-4 py-3";

  return (
    <div className="flex flex-col gap-8">
      <Tabs tabs={TABS} value={activeTab} onChange={setActiveTab} />

      {activeTab === "public" ? (
        <PublicLinkSection />
      ) : (
        <>
          {/* Pending invites */}
          {pending.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-display-xs">
                  <Mail className="h-5 w-5 text-primary" />
                  Pending invites
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {pending.map((invite) => {
                  const who =
                    invite.ownerName ?? invite.ownerEmail ?? "Someone";
                  const rowBusy = busyId === invite.id;
                  return (
                    <div key={invite.id} className={rowBase}>
                      <p className="min-w-0 text-body-sm text-foreground">
                        <span className="font-medium">{who}</span>{" "}
                        <span className="text-muted-foreground">
                          invited you to view their portfolio
                        </span>
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={rowBusy}
                          onClick={() => handleRespond(invite.id, true)}
                        >
                          {rowBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive-outline"
                          disabled={rowBusy}
                          onClick={() => handleRespond(invite.id, false)}
                        >
                          <X className="h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <InviteSectionsPanel />

          {/* People I've invited */}
          <section className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 font-display text-display-xs text-foreground">
              <UserPlus className="h-5 w-5 text-primary" />
              People I&apos;ve invited
            </h2>

            <form onSubmit={handleSend} className="flex items-center gap-3">
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSending}
                className="flex-1"
                aria-label="Invitee email"
              />
              <Button
                type="submit"
                size="lg"
                variant="default"
                disabled={isSending}
                className="h-12"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {isSending ? "Sending…" : "Send invite"}
              </Button>
            </form>

            {outgoing.length > 0 && (
              <div className="flex flex-col gap-3">
                {outgoing.map((invite) => {
                  const rowBusy = busyId === invite.id;
                  const meta = STATUS_META[invite.status];
                  return (
                    <div key={invite.id} className={rowBase}>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-body-sm font-medium text-foreground">
                          {invite.inviteeName ?? invite.inviteeEmail}
                        </span>
                        {invite.inviteeName && (
                          <span className="truncate text-caption text-muted-foreground">
                            {invite.inviteeEmail}
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <Button
                          size="icon-sm"
                          variant="destructive-ghost"
                          disabled={rowBusy}
                          onClick={() => handleRemove(invite.id)}
                          aria-label="Remove invite"
                        >
                          {rowBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Shared with me */}
          <section className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 font-display text-display-xs text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Shared with me
            </h2>
            {shared.length === 0 ? (
              <div className="rounded-2xl border border-primary/10 bg-primary/5 py-16 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-primary/40" />
                <h3 className="mb-2 font-display text-display-xs text-foreground">
                  No shared portfolios yet
                </h3>
                <p className="mx-auto max-w-md text-body-sm text-muted-foreground">
                  When someone shares their portfolio with you, it will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {shared.map((item) => {
                  const who = item.ownerName ?? item.ownerEmail ?? "Someone";
                  const rowBusy = busyId === item.id;
                  const removeBtn = (
                    <Button
                      size="icon-sm"
                      variant="destructive-ghost"
                      disabled={rowBusy}
                      onClick={() => handleRemove(item.id)}
                      aria-label="Remove portfolio"
                    >
                      {rowBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  );

                  if (item.token) {
                    return (
                      <div
                        key={item.id}
                        className={`${rowBase} transition-colors hover:bg-primary/10`}
                      >
                        <a
                          href={`/share/${item.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-body-sm text-foreground"
                        >
                          <span className="truncate font-medium">
                            {who}&apos;s portfolio
                          </span>
                          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </a>
                        <div className="shrink-0">{removeBtn}</div>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className={`${rowBase} opacity-70`}>
                      <div className="flex min-w-0 flex-1 items-center gap-2 text-body-sm text-muted-foreground">
                        <span className="truncate font-medium">
                          {who}&apos;s portfolio
                        </span>
                        <Badge variant="outline">Unavailable</Badge>
                      </div>
                      <div className="shrink-0">{removeBtn}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
