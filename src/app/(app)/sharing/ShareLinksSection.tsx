"use client";

import { Button, Input, Label, Skeleton } from "@box-ds";
import { Check, Copy, Eye, EyeOff, Lock, Share2 } from "lucide-react";
import * as React from "react";
import Calendar from "react-calendar";
import { toast } from "sonner";
import {
  createShareLink,
  disableShareLink,
  getMyShareLink,
  updateSharePassword,
  updateShareSections,
} from "@/actions/share";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "stock", label: "Stock Inventory" },
  { key: "sales", label: "Sales History" },
] as const;

type ExpiryValue = number | null | "custom";

const EXPIRY_OPTIONS: { label: string; value: ExpiryValue }[] = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "Never", value: null },
  { label: "Custom", value: "custom" },
];

type ShareLink = NonNullable<Awaited<ReturnType<typeof getMyShareLink>>>;

function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return "Never";
  return new Date(expiresAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sameSections(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((s, i) => s === sb[i]);
}

function shareUrl(token: string) {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/share/${token}`;
}

function sectionLabel(key: string) {
  return SECTIONS.find((s) => s.key === key)?.label ?? key;
}

interface PublicPanelProps {
  link: ShareLink | null | undefined;
  onChange: (link: ShareLink | null) => void;
  reload: () => Promise<void>;
}

function PublicLinkPanel({ link, onChange, reload }: PublicPanelProps) {
  const [isCreating, setIsCreating] = React.useState(false);
  const [isDisabling, setIsDisabling] = React.useState(false);
  const [disableConfirm, setDisableConfirm] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const [showPasswordChange, setShowPasswordChange] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [showNewPasswordText, setShowNewPasswordText] = React.useState(false);
  const [isSavingPassword, setIsSavingPassword] = React.useState(false);

  const [selectedSections, setSelectedSections] = React.useState<string[]>([
    "dashboard",
    "stock",
    "sales",
  ]);
  const [showPasswordField, setShowPasswordField] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [showPasswordText, setShowPasswordText] = React.useState(false);
  const [expiryDays, setExpiryDays] = React.useState<ExpiryValue>(30);
  const [customExpiryDate, setCustomExpiryDate] = React.useState<Date | null>(
    null,
  );
  const [showCalendar, setShowCalendar] = React.useState(false);

  const now = new Date();
  const isExpired = link?.expiresAt != null && new Date(link.expiresAt) < now;
  const activeLink = link?.isActive && !isExpired ? link : null;

  const publicUrl = activeLink ? shareUrl(activeLink.token) : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const toggleSection = (key: string) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    );
  };

  const handleCreate = async () => {
    if (selectedSections.length === 0) {
      toast.error("Select at least one section.");
      return;
    }
    if (expiryDays === "custom" && !customExpiryDate) {
      toast.error("Select a custom expiry date.");
      return;
    }
    setIsCreating(true);
    try {
      const expiresAt =
        expiryDays === "custom"
          ? customExpiryDate
          : expiryDays != null
            ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
            : null;
      await createShareLink({
        sections: selectedSections,
        password:
          showPasswordField && password.trim() ? password.trim() : undefined,
        expiresAt,
      });
      await reload();
      setPassword("");
      setShowPasswordField(false);
      toast.success("Share link created!");
    } catch {
      toast.error("Failed to create link.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSavePassword = async () => {
    setIsSavingPassword(true);
    try {
      await updateSharePassword(newPassword.trim() || null);
      onChange(
        link ? { ...link, hasPassword: !!newPassword.trim() } : (link ?? null),
      );
      setShowPasswordChange(false);
      setNewPassword("");
      toast.success(
        newPassword.trim() ? "Password updated." : "Password removed.",
      );
    } catch {
      toast.error("Failed to update password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDisable = async () => {
    setIsDisabling(true);
    try {
      await disableShareLink();
      onChange(link ? { ...link, isActive: false } : (link ?? null));
      setDisableConfirm(false);
      toast.success("Share link disabled.");
    } catch {
      toast.error("Failed to disable link.");
    } finally {
      setIsDisabling(false);
    }
  };

  const pillClass = (active: boolean) =>
    cn(
      "px-3 py-1.5 rounded-md border text-body-sm-strong transition-all cursor-pointer",
      active
        ? "bg-primary/20 border-primary/40 text-primary"
        : "bg-background/50 border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground",
    );

  return (
    <div className="flex flex-col gap-3">
      {activeLink ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label>Your share link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={publicUrl}
                className="text-body-sm flex-1 cursor-text select-all"
                onFocus={(e) => e.target.select()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="h-11 px-3 border-primary/20 shrink-0 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-positive" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-body-sm text-muted-foreground bg-primary/5 border border-primary/10 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Share2 className="w-4 h-4 shrink-0 mt-0.5 text-primary/60" />
              <span>{activeLink.sections.map(sectionLabel).join(", ")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-primary/60" />
              <span>
                {activeLink.expiresAt
                  ? `Expires ${formatExpiry(activeLink.expiresAt)}`
                  : "Never expires"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-primary/60" />
              <span>
                {activeLink.hasPassword ? "Password protected" : "No password"}
              </span>
            </div>
          </div>

          {showPasswordChange ? (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Input
                  type={showNewPasswordText ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={
                    activeLink.hasPassword
                      ? "New password (leave blank to remove)"
                      : "Set a password…"
                  }
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPasswordText((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showNewPasswordText ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setNewPassword("");
                  }}
                  disabled={isSavingPassword}
                  className="flex-1 h-11 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSavePassword}
                  disabled={isSavingPassword}
                  className="flex-1 h-11 cursor-pointer"
                >
                  {isSavingPassword ? "Saving…" : "Save Password"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordChange(true)}
              className="w-full h-11 border-primary/20 cursor-pointer"
            >
              <Lock className="w-4 h-4 mr-2" />
              {activeLink.hasPassword ? "Change Password" : "Add Password"}
            </Button>
          )}

          {disableConfirm ? (
            <div className="flex flex-col gap-3">
              <p className="text-body-sm text-negative/90 bg-negative/10 border border-negative/20 rounded-lg px-4 py-3">
                This will immediately invalidate the link for anyone using it.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDisableConfirm(false)}
                  disabled={isDisabling}
                  className="flex-1 h-11 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDisable}
                  disabled={isDisabling}
                  className="flex-1 h-11 cursor-pointer"
                >
                  {isDisabling ? "Disabling…" : "Confirm Disable"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="destructive-outline"
              onClick={() => setDisableConfirm(true)}
              className="h-11 w-full cursor-pointer"
            >
              Disable Link
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label>Sections to share</Label>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSection(key)}
                  className={pillClass(selectedSections.includes(key))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setShowPasswordField((v) => !v);
                setPassword("");
              }}
              className={cn(
                "flex items-center gap-2 self-start px-3 py-1.5 rounded-md border text-body-sm-strong transition-all cursor-pointer",
                showPasswordField
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-background/50 border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <Lock className="w-3.5 h-3.5" />
              {showPasswordField
                ? "Password protection on"
                : "Protect with password"}
            </button>
            {showPasswordField && (
              <div className="relative">
                <Input
                  type={showPasswordText ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a password…"
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPasswordText ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Link expiry</Label>
            <div className="flex flex-wrap gap-2">
              {EXPIRY_OPTIONS.map(({ label, value }) => {
                if (value === "custom") {
                  const customLabel =
                    expiryDays === "custom" && customExpiryDate
                      ? customExpiryDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      : "Custom";
                  return (
                    <div key="custom" className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setExpiryDays("custom");
                          setShowCalendar((v) => !v);
                        }}
                        className={pillClass(expiryDays === "custom")}
                      >
                        {customLabel}
                      </button>
                      {expiryDays === "custom" && showCalendar && (
                        <div className="absolute left-0 top-full z-50 mt-1">
                          <Calendar
                            value={customExpiryDate}
                            onChange={(v) => {
                              setCustomExpiryDate(v as Date);
                              setShowCalendar(false);
                            }}
                            minDate={new Date()}
                          />
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setExpiryDays(value);
                      setShowCalendar(false);
                    }}
                    className={pillClass(expiryDays === value)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || selectedSections.length === 0}
            className="h-12 shadow-glow-primary cursor-pointer"
          >
            {isCreating ? (
              <>Creating…</>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Create Link
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

const ALL_SECTIONS = SECTIONS.map((s) => s.key);

export function InviteSectionsPanel() {
  const [sections, setSections] = React.useState<string[]>(ALL_SECTIONS);
  const [savedSections, setSavedSections] =
    React.useState<string[]>(ALL_SECTIONS);
  const [linkActive, setLinkActive] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    getMyShareLink("invite_only")
      .then((link) => {
        const s = link?.sections?.length ? link.sections : ALL_SECTIONS;
        setSections(s);
        setSavedSections(s);
        setLinkActive(!!link?.isActive);
      })
      .catch(() => {
        toast.error("Failed to load sharing settings.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const isDirty = !sameSections(sections, savedSections);

  const toggleSection = (key: string) =>
    setSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    );

  const handleSave = async () => {
    if (sections.length === 0) {
      toast.error("Select at least one section.");
      return;
    }
    setIsSaving(true);
    try {
      if (linkActive) {
        await updateShareSections(sections, "invite_only");
      } else {
        await createShareLink({ sections, visibility: "invite_only" });
        setLinkActive(true);
      }
      setSavedSections(sections);
      toast.success("Sections updated.");
    } catch {
      toast.error("Failed to save sections.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-16 w-full" />;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-body-md-strong text-foreground">
          Sections shared with invitees
        </h3>
        <p className="text-body-sm text-muted-foreground">
          Choose which sections accepted invitees can view.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(({ key, label }) => {
          const active = sections.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleSection(key)}
              className={cn(
                "px-3 py-1.5 rounded-md border text-body-sm-strong transition-all cursor-pointer",
                active
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-background/50 border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      {isDirty && (
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || sections.length === 0}
          className="h-10 w-fit cursor-pointer"
        >
          {isSaving ? "Saving…" : "Save sections"}
        </Button>
      )}
    </section>
  );
}

export function PublicLinkSection() {
  const [link, setLink] = React.useState<ShareLink | null | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    const data = await getMyShareLink("everyone");
    setLink(data);
  }, []);

  React.useEffect(() => {
    load()
      .catch(() => setLink(null))
      .finally(() => setIsLoading(false));
  }, [load]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    );
  }

  return <PublicLinkPanel link={link} onChange={setLink} reload={load} />;
}
