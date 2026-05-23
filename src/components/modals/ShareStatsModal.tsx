"use client";

import { Button, Input, Label, Modal, Skeleton } from "@box-ds";
import { Check, Copy, Eye, EyeOff, Link2, Lock, Share2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
  createShareLink,
  disableShareLink,
  getMyShareLink,
  updateSharePassword,
} from "@/actions/share";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "stock", label: "Stock Manager" },
  { key: "sales", label: "Sales History" },
] as const;

const SECTION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  stock: "Stock Manager",
  sales: "Sales History",
};

const EXPIRY_OPTIONS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "Never", days: null },
] as const;

type ShareLink = NonNullable<Awaited<ReturnType<typeof getMyShareLink>>>;

interface ShareStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return "Never";
  return new Date(expiresAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ShareStatsModal({ isOpen, onClose }: ShareStatsModalProps) {
  const [link, setLink] = React.useState<ShareLink | null | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [isDisabling, setIsDisabling] = React.useState(false);
  const [disableConfirm, setDisableConfirm] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Password change state (active link view)
  const [showPasswordChange, setShowPasswordChange] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [showNewPasswordText, setShowNewPasswordText] = React.useState(false);
  const [isSavingPassword, setIsSavingPassword] = React.useState(false);

  // Create-form state
  const [selectedSections, setSelectedSections] = React.useState<string[]>([
    "dashboard",
    "stock",
    "sales",
  ]);
  const [showPasswordField, setShowPasswordField] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [showPasswordText, setShowPasswordText] = React.useState(false);
  const [expiryDays, setExpiryDays] = React.useState<number | null>(30);

  React.useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setDisableConfirm(false);
    setShowPasswordChange(false);
    setNewPassword("");
    getMyShareLink()
      .then(setLink)
      .catch(() => setLink(null))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  const now = new Date();
  const isExpired = link?.expiresAt != null && new Date(link.expiresAt) < now;
  const activeLink = link?.isActive && !isExpired ? link : null;

  const publicUrl = activeLink
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${activeLink.token}`
    : "";

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
    setIsCreating(true);
    try {
      const expiresAt =
        expiryDays != null
          ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
          : null;
      await createShareLink({
        sections: selectedSections,
        password:
          showPasswordField && password.trim() ? password.trim() : undefined,
        expiresAt,
      });
      const updated = await getMyShareLink();
      setLink(updated);
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
      setLink((prev) =>
        prev ? { ...prev, hasPassword: !!newPassword.trim() } : prev,
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
      setLink((prev) => (prev ? { ...prev, isActive: false } : prev));
      setDisableConfirm(false);
      toast.success("Share link disabled.");
    } catch {
      toast.error("Failed to disable link.");
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Stats">
      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      ) : activeLink ? (
        /* ── Active link view ── */
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
                className="h-11 px-3 border-primary/20 shrink-0"
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
              <Link2 className="w-4 h-4 shrink-0 mt-0.5 text-primary/60" />
              <span>
                {activeLink.sections
                  .map((s) => SECTION_LABELS[s] ?? s)
                  .join(", ")}
              </span>
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

          {/* Password change section */}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSavePassword}
                  disabled={isSavingPassword}
                  className="flex-1 h-11"
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
              className="w-full h-11 border-primary/20"
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
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDisable}
                  disabled={isDisabling}
                  className="flex-1 h-11"
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
              className="h-11 w-full"
            >
              Disable Link
            </Button>
          )}
        </div>
      ) : (
        /* ── Create link view ── */
        <div className="flex flex-col gap-6">
          {/* Section pills */}
          <div className="flex flex-col gap-2">
            <Label>Sections to share</Label>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map(({ key, label }) => {
                const active = selectedSections.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSection(key)}
                    className={cn(
                      "px-3 py-1.5 rounded-md border text-body-sm-strong transition-all",
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
          </div>

          {/* Password protection */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setShowPasswordField((v) => !v);
                setPassword("");
              }}
              className={cn(
                "flex items-center gap-2 self-start px-3 py-1.5 rounded-md border text-body-sm-strong transition-all",
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

          {/* Expiry */}
          <div className="flex flex-col gap-2">
            <Label>Link expiry</Label>
            <div className="flex flex-wrap gap-2">
              {EXPIRY_OPTIONS.map(({ label, days }) => {
                const active = expiryDays === days;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setExpiryDays(days)}
                    className={cn(
                      "px-3 py-1.5 rounded-md border text-body-sm-strong transition-all",
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
          </div>

          <Button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || selectedSections.length === 0}
            className="h-12 shadow-glow-primary"
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
    </Modal>
  );
}
