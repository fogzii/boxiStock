"use client";

import { Button, FormField, Input, Modal } from "@box-ds";
import type { User } from "@supabase/supabase-js";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteAccount } from "@/actions/account";
import { createClient } from "@/lib/supabase/client";

type Message = { type: "success" | "error"; text: string };

export function AccountSettings() {
  const [user, setUser] = useState<User | null>(null);

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<Message | null>(null);

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState<Message | null>(null);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<Message | null>(null);

  // Sign out
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Delete account
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<Message | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u) {
        setDisplayName(
          (u.user_metadata?.full_name as string | undefined) ??
            (u.user_metadata?.name as string | undefined) ??
            "",
        );
      }
    });
  }, []);

  const isEmailUser =
    user?.identities?.some((i) => i.provider === "email") ?? false;

  const handleSaveName = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setNameMessage({ type: "error", text: "Display name cannot be empty." });
      return;
    }
    try {
      setIsSavingName(true);
      setNameMessage(null);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });
      if (error) throw error;
      // Re-fetch user so sidebar picks up the new name
      const {
        data: { user: updated },
      } = await supabase.auth.getUser();
      setUser(updated);
      setNameMessage({ type: "success", text: "Name updated." });
    } catch (err) {
      setNameMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update name.",
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleUpdateEmail = async () => {
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      setEmailMessage({ type: "error", text: "Email cannot be empty." });
      return;
    }
    try {
      setIsSavingEmail(true);
      setEmailMessage(null);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: trimmedEmail });
      if (error) throw error;
      setEmailMessage({
        type: "success",
        text: `A confirmation link was sent to ${trimmedEmail}.`,
      });
      setNewEmail("");
    } catch (err) {
      setEmailMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update email.",
      });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 8 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    try {
      setIsSavingPassword(true);
      setPasswordMessage(null);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setPasswordMessage({ type: "success", text: "Password updated." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update password.",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/sign-in";
    } catch {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      setDeleteMessage(null);
      await deleteAccount();
      window.location.href = "/sign-in";
    } catch (err) {
      setDeleteMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete account.",
      });
      setIsDeletingAccount(false);
    }
  };

  return (
    <>
      <div className="bg-card w-full rounded-2xl border border-border shadow-sm p-6 flex flex-col h-full relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10 flex flex-col h-full gap-0">
          {/* Card header */}
          <div className="pb-5">
            <h2 className="font-display text-display-xs">Account</h2>
            <p className="text-muted-foreground text-body-sm mt-1">
              Manage your profile, security, and account settings.
            </p>
          </div>

          {/* Section 1 — Profile */}
          <div className="border-t border-border/50 py-5">
            <div className="flex flex-col gap-2 max-w-lg">
              <label
                htmlFor="display-name"
                className="text-body-md-strong text-foreground"
              >
                Display name
              </label>
              <div className="flex gap-3 items-center">
                <Input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="shrink-0 cursor-pointer"
                >
                  {isSavingName ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  {isSavingName ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
            {nameMessage && (
              <div
                className={`mt-3 p-4 rounded-xl text-body-sm ${nameMessage.type === "error" ? "bg-negative-surface text-negative border border-negative/20" : "bg-positive-surface text-positive border border-positive/20"}`}
              >
                {nameMessage.text}
              </div>
            )}
          </div>

          {/* Section 2 — Security (email users only) */}
          {isEmailUser && (
            <div className="border-t border-border/50 py-5">
              <div className="mb-4">
                <p className="text-body-md-strong text-foreground">Security</p>
                <p className="text-muted-foreground text-body-sm mt-0.5">
                  Update your email address or password.
                </p>
              </div>

              <div className="flex flex-col gap-6 max-w-lg">
                {/* Change email */}
                <div className="flex flex-col gap-3">
                  <p className="text-body-sm-strong text-foreground">
                    Change email
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <FormField
                      label="New email address"
                      htmlFor="new-email"
                      className="flex-1 min-w-0"
                    >
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder={user?.email ?? "your@email.com"}
                      />
                    </FormField>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleUpdateEmail}
                      disabled={isSavingEmail}
                      className="shrink-0 cursor-pointer"
                    >
                      {isSavingEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      {isSavingEmail ? "Sending…" : "Update email"}
                    </Button>
                  </div>
                  {emailMessage && (
                    <div
                      className={`p-4 rounded-xl text-body-sm ${emailMessage.type === "error" ? "bg-negative-surface text-negative border border-negative/20" : "bg-positive-surface text-positive border border-positive/20"}`}
                    >
                      {emailMessage.text}
                    </div>
                  )}
                </div>

                {/* Change password */}
                <div className="flex flex-col gap-3">
                  <p className="text-body-sm-strong text-foreground">
                    Change password
                  </p>
                  <FormField label="New password" htmlFor="new-password">
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      minLength={8}
                    />
                  </FormField>
                  <FormField
                    label="Confirm password"
                    htmlFor="confirm-password"
                  >
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                    />
                  </FormField>
                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleUpdatePassword}
                      disabled={isSavingPassword}
                      className="cursor-pointer"
                    >
                      {isSavingPassword ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      {isSavingPassword ? "Updating…" : "Update password"}
                    </Button>
                  </div>
                  {passwordMessage && (
                    <div
                      className={`p-4 rounded-xl text-body-sm ${passwordMessage.type === "error" ? "bg-negative-surface text-negative border border-negative/20" : "bg-positive-surface text-positive border border-positive/20"}`}
                    >
                      {passwordMessage.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section 3 — Session */}
          <div className="border-t border-border/50 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-body-md-strong text-foreground">Session</p>
                <p className="text-muted-foreground text-body-sm mt-0.5">
                  Sign out of BoxiStock on this device.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="shrink-0 cursor-pointer"
              >
                {isSigningOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {isSigningOut ? "Signing out…" : "Sign out"}
              </Button>
            </div>
          </div>

          {/* Section 4 — Danger Zone */}
          <div className="border-t border-border/50 pt-5">
            <div className="rounded-xl border border-negative/20 bg-negative-bg/30 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-negative" />
                    <p className="text-body-md-strong text-negative">
                      Danger zone
                    </p>
                  </div>
                  <p className="text-muted-foreground text-body-sm">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive-outline"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="shrink-0 cursor-pointer"
                >
                  Delete account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (isDeletingAccount) return;
          setIsDeleteModalOpen(false);
          setDeleteConfirmText("");
        }}
        title="Delete account?"
      >
        <div className="flex items-center gap-2 text-negative mb-4">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-body-sm-strong">This cannot be undone.</p>
        </div>

        <p className="text-muted-foreground text-body-sm mb-4">
          This will permanently delete your account and{" "}
          <strong className="text-foreground">
            ALL inventory data, sales history, and products
          </strong>
          . Your account will be removed immediately and you will be signed out.
        </p>

        <div className="mb-6">
          <label
            htmlFor="delete-confirm"
            className="text-body-sm text-muted-foreground block mb-2"
          >
            Type <strong className="text-foreground">delete</strong> to confirm
          </label>
          <Input
            id="delete-confirm"
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="delete"
            disabled={isDeletingAccount}
          />
        </div>

        {deleteMessage && (
          <div className="mb-4 p-4 rounded-xl text-body-sm bg-negative-surface text-negative border border-negative/20">
            {deleteMessage.text}
          </div>
        )}

        <div className="flex gap-4 w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setDeleteConfirmText("");
            }}
            disabled={isDeletingAccount}
            className="flex-1 h-12 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount || deleteConfirmText !== "delete"}
            className="flex-1 h-12 cursor-pointer"
          >
            {isDeletingAccount ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            {isDeletingAccount ? "Deleting…" : "Delete account"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
