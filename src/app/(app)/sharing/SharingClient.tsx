"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  Tabs,
} from "@box-ds";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Mail,
  Pencil,
  Plus,
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
  updateInviteConfig,
} from "@/actions/sharing";
import { EditInviteConfigModal } from "./EditInviteConfigModal";
import {
  ConfigSummary,
  DEFAULT_SHARE_CONFIG,
  ShareConfigFields,
  type ShareConfigValue,
} from "./ShareConfigFields";
import { PublicLinksSection } from "./ShareLinksSection";

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

// "People I've invited" can grow without bound, so the list is paginated
// client-side to keep the section compact.
const OUTGOING_PAGE_SIZE = 5;

const STATUS_META: Record<
  InviteStatus,
  { label: string; variant: "warning" | "positive" | "negative" }
> = {
  pending: { label: "Pending", variant: "warning" },
  accepted: { label: "Accepted", variant: "positive" },
  declined: { label: "Declined", variant: "negative" },
};

interface InviteCreateFormProps {
  onSent: () => void;
  onCancel: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InviteCreateForm({ onSent, onCancel }: InviteCreateFormProps) {
  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [config, setConfig] =
    React.useState<ShareConfigValue>(DEFAULT_SHARE_CONFIG);
  const [isSending, setIsSending] = React.useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    const cleaned = email.trim();
    if (!cleaned) {
      setEmailError("Email is required.");
      return;
    }
    if (!EMAIL_PATTERN.test(cleaned)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    if (config.sections.length === 0) {
      toast.error("Select at least one section.");
      return;
    }
    setIsSending(true);
    try {
      const res = await sendInvite(cleaned, config);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.alreadyAccepted
          ? "Already accepted"
          : `Invite sent to ${res.inviteeEmail}'s account.`,
      );
      onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSend}
      noValidate
      className="flex flex-col gap-6 rounded-xl border border-primary/10 bg-primary/5 p-4"
    >
      <FormField label="Email" htmlFor="invite-email" error={emailError}>
        <Input
          id="invite-email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!emailError}
          disabled={isSending}
        />
      </FormField>

      <ShareConfigFields
        value={config}
        onChange={setConfig}
        disabled={isSending}
      />

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSending}
          className="flex-1 h-12 cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSending || config.sections.length === 0}
          className="flex-1 h-12 shadow-glow-primary cursor-pointer"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Send invite
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function SharingClient({
  pending,
  shared,
  outgoing,
}: SharingClientProps) {
  const router = useRouter();
  const [, startTransition] = React.useTransition();
  const [activeTab, setActiveTab] = React.useState<SharingTab>("invite");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [showCreateInvite, setShowCreateInvite] = React.useState(false);
  const [outgoingPage, setOutgoingPage] = React.useState(1);
  const [editingInviteId, setEditingInviteId] = React.useState<string | null>(
    null,
  );

  const editingInvite = outgoing.find((i) => i.id === editingInviteId) ?? null;

  const outgoingTotalPages = Math.max(
    1,
    Math.ceil(outgoing.length / OUTGOING_PAGE_SIZE),
  );
  // Clamp on render so removing the last row on the final page (or the list
  // shrinking after a refresh) never strands us on an empty page.
  const currentOutgoingPage = Math.min(outgoingPage, outgoingTotalPages);
  const outgoingStart = (currentOutgoingPage - 1) * OUTGOING_PAGE_SIZE;
  const visibleOutgoing = outgoing.slice(
    outgoingStart,
    outgoingStart + OUTGOING_PAGE_SIZE,
  );

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
      const res = await respondToInvite(id, accept);
      if (!res.ok) {
        toast.error(res.error);
        throw new Error(res.error);
      }
      toast.success(accept ? "Invite accepted." : "Invite declined.");
    });

  const handleRemove = (id: string) =>
    runAction(id, async () => {
      const res = await removeInvite(id);
      if (!res.ok) {
        toast.error(res.error);
        throw new Error(res.error);
      }
      toast.success("Removed.");
    });

  const rowBase =
    "flex items-center justify-between gap-3 rounded-xl border border-primary/10 bg-primary/5 px-4 py-3";

  return (
    <div className="flex flex-col gap-8">
      <Tabs
        tabs={TABS}
        value={activeTab}
        onChange={(v) => setActiveTab(v as SharingTab)}
      />

      {activeTab === "public" ? (
        <PublicLinksSection />
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

          {/* People I've invited */}
          <section className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 font-display text-display-xs text-foreground">
              <UserPlus className="h-5 w-5 text-primary" />
              People I&apos;ve invited
            </h2>

            {showCreateInvite ? (
              <InviteCreateForm
                onSent={() => {
                  setShowCreateInvite(false);
                  startTransition(() => router.refresh());
                }}
                onCancel={() => setShowCreateInvite(false)}
              />
            ) : (
              <Button
                type="button"
                onClick={() => setShowCreateInvite(true)}
                className="h-11 w-full cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create invite
              </Button>
            )}

            {outgoing.length === 0 && (
              <div className="rounded-2xl border border-primary/10 bg-primary/5 py-12 text-center">
                <UserPlus className="mx-auto mb-3 h-10 w-10 text-primary/40" />
                <p className="mx-auto max-w-md text-body-sm text-muted-foreground">
                  You haven&apos;t invited anyone yet. Create an invite to share
                  your portfolio with someone.
                </p>
              </div>
            )}

            {outgoing.length > 0 && (
              <div className="flex flex-col gap-3">
                {visibleOutgoing.map((invite) => {
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
                        <ConfigSummary
                          sections={invite.sections}
                          showStockAmounts={invite.showStockAmounts}
                          className="truncate text-caption text-muted-foreground"
                        />
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={rowBusy}
                          onClick={() => setEditingInviteId(invite.id)}
                          aria-label="Edit access"
                          className="cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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

            {outgoingTotalPages > 1 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-caption text-muted-foreground">
                  {outgoingStart + 1}–{outgoingStart + visibleOutgoing.length}{" "}
                  of {outgoing.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentOutgoingPage <= 1}
                    onClick={() => setOutgoingPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <span className="text-caption text-muted-foreground tabular-nums">
                    {currentOutgoingPage} / {outgoingTotalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentOutgoingPage >= outgoingTotalPages}
                    onClick={() =>
                      setOutgoingPage((p) =>
                        Math.min(outgoingTotalPages, p + 1),
                      )
                    }
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
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

          {editingInvite && (
            <EditInviteConfigModal
              isOpen
              onClose={() => setEditingInviteId(null)}
              title={`Access for ${editingInvite.inviteeName ?? editingInvite.inviteeEmail}`}
              initialValue={{
                sections: editingInvite.sections,
                showStockAmounts: editingInvite.showStockAmounts,
              }}
              onSave={async (value) => {
                const res = await updateInviteConfig(editingInvite.id, value);
                if (!res.ok) {
                  toast.error(res.error);
                  throw new Error(res.error);
                }
                toast.success("Access updated.");
                startTransition(() => router.refresh());
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
