"use client";

import {
  Badge,
  Button,
  Input,
  Label,
  Modal,
  ModalActions,
  Skeleton,
  ToggleSwitch,
} from "@box-ds";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Link2,
  Lock,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import * as React from "react";
import Calendar from "react-calendar";
import { toast } from "sonner";
import {
  createPublicLink,
  deletePublicLink,
  getMyPublicLinks,
  type PublicShareLinkSummary,
  updatePublicLink,
  updatePublicLinkPassword,
} from "@/actions/share";
import { MAX_PUBLIC_LINKS } from "@/lib/sharing/config";
import { cn } from "@/lib/utils";
import {
  ConfigSummary,
  DEFAULT_SHARE_CONFIG,
  pillClass,
  ShareConfigFields,
  type ShareConfigValue,
} from "./ShareConfigFields";

type ExpiryValue = number | null | "custom";

const EXPIRY_OPTIONS: { label: string; value: ExpiryValue }[] = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "Never", value: null },
  { label: "Custom", value: "custom" },
];

export type PublicLink = PublicShareLinkSummary;

function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return "Never";
  return new Date(expiresAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shareUrl(token: string) {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/share/${token}`;
}

function isLinkExpired(link: PublicLink) {
  return link.expiresAt != null && new Date(link.expiresAt) < new Date();
}

function resolveExpiresAt(
  expiryDays: ExpiryValue,
  customExpiryDate: Date | null,
): string | null {
  if (expiryDays === "custom") return customExpiryDate?.toISOString() ?? null;
  if (expiryDays == null) return null;
  return new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
}

interface ExpiryPickerProps {
  expiryDays: ExpiryValue;
  customExpiryDate: Date | null;
  onChange: (expiryDays: ExpiryValue, customExpiryDate: Date | null) => void;
  disabled?: boolean;
}

function ExpiryPicker({
  expiryDays,
  customExpiryDate,
  onChange,
  disabled,
}: ExpiryPickerProps) {
  const [showCalendar, setShowCalendar] = React.useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Label className="font-bold">Link expiry</Label>
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
                  disabled={disabled}
                  onClick={() => {
                    onChange("custom", customExpiryDate);
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
                        onChange("custom", v as Date);
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
              disabled={disabled}
              onClick={() => {
                onChange(value, null);
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
  );
}

interface PublicLinkCardProps {
  link: PublicLink;
  fallbackName: string;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

function PublicLinkCard({
  link,
  fallbackName,
  onEdit,
  onDelete,
}: PublicLinkCardProps) {
  const [copied, setCopied] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const expired = isLinkExpired(link);
  const url = shareUrl(link.token);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-primary/10 bg-primary/5 p-4",
        expired && "opacity-70",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link2 className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-body-md-strong text-foreground">
            {link.label || fallbackName}
          </span>
          {expired && <Badge variant="negative">Expired</Badge>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onEdit}
            aria-label="Edit link"
            className="cursor-pointer"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="destructive-ghost"
            onClick={() => setDeleteConfirm(true)}
            aria-label="Delete link"
            className="cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          readOnly
          value={url}
          className="text-body-sm flex-1 cursor-text select-all"
          onFocus={(e) => e.target.select()}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
          className="h-11 px-3 border-primary/20 shrink-0 cursor-pointer"
          aria-label="Copy link"
        >
          {copied ? (
            <Check className="w-4 h-4 text-positive" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="flex flex-col gap-1.5 text-body-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <Share2 className="w-4 h-4 shrink-0 mt-0.5 text-primary/60" />
          <ConfigSummary
            sections={link.sections}
            showStockAmounts={link.showStockAmounts}
          />
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0 text-primary/60" />
          <span>
            {link.expiresAt
              ? `${expired ? "Expired" : "Expires"} ${formatExpiry(link.expiresAt)}`
              : "Never expires"}
            {" · "}
            {link.hasPassword ? "Password protected" : "No password"}
          </span>
        </div>
      </div>

      {deleteConfirm && (
        <div className="flex flex-col gap-3">
          <p className="text-body-sm text-negative/90 bg-negative/10 border border-negative/20 rounded-lg px-4 py-3">
            This will permanently delete the link for anyone using it.
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteConfirm(false)}
              className="flex-1 h-11 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await onDelete();
                } finally {
                  setIsDeleting(false);
                }
              }}
              className="flex-1 h-11 cursor-pointer"
            >
              {isDeleting ? "Deleting…" : "Confirm Delete"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface PublicLinkCreateFormProps {
  onCreate: () => Promise<void>;
  onCancel: () => void;
}

function PublicLinkCreateForm({
  onCreate,
  onCancel,
}: PublicLinkCreateFormProps) {
  const [label, setLabel] = React.useState("");
  const [config, setConfig] =
    React.useState<ShareConfigValue>(DEFAULT_SHARE_CONFIG);
  const [showPasswordField, setShowPasswordField] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [showPasswordText, setShowPasswordText] = React.useState(false);
  const [expiryDays, setExpiryDays] = React.useState<ExpiryValue>(30);
  const [customExpiryDate, setCustomExpiryDate] = React.useState<Date | null>(
    null,
  );
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreate = async () => {
    if (config.sections.length === 0) {
      toast.error("Select at least one section.");
      return;
    }
    if (expiryDays === "custom" && !customExpiryDate) {
      toast.error("Select a custom expiry date.");
      return;
    }
    setIsCreating(true);
    try {
      await createPublicLink({
        label: label.trim() || null,
        sections: config.sections,
        showStockAmounts: config.showStockAmounts,
        password: showPasswordField ? password : null,
        expiresAt: resolveExpiresAt(expiryDays, customExpiryDate),
      });
      await onCreate();
      toast.success("Share link created!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create link.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-primary/10 bg-primary/5 p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="public-link-label" className="font-bold">
          Link name
        </Label>
        <Input
          id="public-link-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Friends, Suppliers…"
          maxLength={40}
        />
      </div>

      <ShareConfigFields
        value={config}
        onChange={setConfig}
        advanced={
          <>
            <ToggleSwitch
              label="Protect with password"
              checked={showPasswordField}
              onCheckedChange={(checked) => {
                setShowPasswordField(checked);
                setPassword("");
              }}
            />
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
          </>
        }
      />

      <ExpiryPicker
        expiryDays={expiryDays}
        customExpiryDate={customExpiryDate}
        onChange={(d, c) => {
          setExpiryDays(d);
          setCustomExpiryDate(c);
        }}
      />

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isCreating}
          className="flex-1 h-12 cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || config.sections.length === 0}
          className="flex-1 h-12 shadow-glow-primary cursor-pointer"
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
    </div>
  );
}

interface EditPublicLinkModalProps {
  link: PublicLink;
  onSave: () => Promise<void>;
  onClose: () => void;
}

function EditPublicLinkModal({
  link,
  onSave,
  onClose,
}: EditPublicLinkModalProps) {
  const [label, setLabel] = React.useState(link.label ?? "");
  const [config, setConfig] = React.useState<ShareConfigValue>({
    sections: link.sections,
    showStockAmounts: link.showStockAmounts,
  });
  const [expiryDays, setExpiryDays] = React.useState<ExpiryValue>(
    link.expiresAt ? "custom" : null,
  );
  const [customExpiryDate, setCustomExpiryDate] = React.useState<Date | null>(
    link.expiresAt ? new Date(link.expiresAt) : null,
  );
  const [passwordEnabled, setPasswordEnabled] = React.useState(
    link.hasPassword,
  );
  const [password, setPassword] = React.useState("");
  const [showPasswordText, setShowPasswordText] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (config.sections.length === 0) {
      toast.error("Select at least one section.");
      return;
    }
    if (expiryDays === "custom" && !customExpiryDate) {
      toast.error("Select a custom expiry date.");
      return;
    }
    setIsSaving(true);
    try {
      await updatePublicLink(link.id, {
        label: label.trim() || null,
        sections: config.sections,
        showStockAmounts: config.showStockAmounts,
        expiresAt: resolveExpiresAt(expiryDays, customExpiryDate),
      });
      if (passwordEnabled && password.trim()) {
        // Set or replace the password.
        await updatePublicLinkPassword(link.id, password);
      } else if (!passwordEnabled && link.hasPassword) {
        // Toggled off — remove the existing password.
        await updatePublicLinkPassword(link.id, null);
      }
      await onSave();
      toast.success("Link updated.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save link.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit link">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-link-label" className="font-bold">
            Link name
          </Label>
          <Input
            id="edit-link-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Friends, Suppliers…"
            maxLength={40}
          />
        </div>

        <ShareConfigFields
          value={config}
          onChange={setConfig}
          disabled={isSaving}
          advanced={
            <>
              <ToggleSwitch
                label="Protect with password"
                checked={passwordEnabled}
                disabled={isSaving}
                onCheckedChange={(checked) => {
                  setPasswordEnabled(checked);
                  setPassword("");
                }}
              />
              {passwordEnabled && (
                <div className="relative">
                  <Input
                    type={showPasswordText ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      link.hasPassword
                        ? "New password (leave blank to keep current)"
                        : "Set a password…"
                    }
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
            </>
          }
        />

        <ExpiryPicker
          expiryDays={expiryDays}
          customExpiryDate={customExpiryDate}
          onChange={(d, c) => {
            setExpiryDays(d);
            setCustomExpiryDate(c);
          }}
          disabled={isSaving}
        />

        <ModalActions
          submitLabel="Save"
          loadingLabel="Saving…"
          isLoading={isSaving}
          disabled={config.sections.length === 0}
          onCancel={onClose}
        />
      </form>
    </Modal>
  );
}

export function PublicLinksSection() {
  // null = still loading.
  const [links, setLinks] = React.useState<PublicLink[] | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const reloadLinks = React.useCallback(async () => {
    setLinks(await getMyPublicLinks());
  }, []);

  React.useEffect(() => {
    reloadLinks().catch(() => {
      setLinks([]);
      toast.error("Failed to load share links.");
    });
  }, [reloadLinks]);

  const isLoading = links === null;
  const loadedLinks = links ?? [];
  const activeCount = loadedLinks.filter(
    (l) => l.isActive && !isLinkExpired(l),
  ).length;
  const atCap = activeCount >= MAX_PUBLIC_LINKS;
  const editingLink = loadedLinks.find((l) => l.id === editingId) ?? null;

  const handleDelete = async (id: string) => {
    try {
      await deletePublicLink(id);
      await reloadLinks();
      toast.success("Link deleted.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete link.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-body-md-strong text-foreground">Public links</h3>
          <p className="text-body-sm text-muted-foreground">
            Anyone with a link can view the sections you choose for it.
          </p>
        </div>
        <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
          {activeCount} of {MAX_PUBLIC_LINKS} active
        </span>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && loadedLinks.length === 0 && !showCreate && (
        <div className="rounded-2xl border border-primary/10 bg-primary/5 py-12 text-center">
          <Link2 className="mx-auto mb-3 h-10 w-10 text-primary/40" />
          <p className="mx-auto max-w-md text-body-sm text-muted-foreground">
            No public links yet. Create one to share your portfolio with anyone.
          </p>
        </div>
      )}

      {loadedLinks.map((link, i) => (
        <PublicLinkCard
          key={link.id}
          link={link}
          fallbackName={`Public link ${i + 1}`}
          onEdit={() => setEditingId(link.id)}
          onDelete={() => handleDelete(link.id)}
        />
      ))}

      {!isLoading &&
        (showCreate ? (
          <PublicLinkCreateForm
            onCreate={async () => {
              await reloadLinks();
              setShowCreate(false);
            }}
            onCancel={() => setShowCreate(false)}
          />
        ) : (
          <Button
            type="button"
            onClick={() => setShowCreate(true)}
            disabled={atCap}
            className="h-11 w-full cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            {atCap ? `Link limit reached (${MAX_PUBLIC_LINKS})` : "Create link"}
          </Button>
        ))}

      {editingLink && (
        <EditPublicLinkModal
          link={editingLink}
          onSave={reloadLinks}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
