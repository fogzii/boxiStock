"use client";

import { Button, FormField, Input } from "@box-ds";
import { Loader2, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPasswordError("");
    setConfirmPasswordError("");
    setFormError("");

    let hasError = false;
    if (!newPassword) {
      setNewPasswordError("Password is required.");
      hasError = true;
    } else if (newPassword.length < 8) {
      setNewPasswordError("Password must be at least 8 characters.");
      hasError = true;
    }
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      hasError = true;
    } else if (newPassword && newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      hasError = true;
    }
    if (hasError) return;

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Package className="h-6 w-6" />
          </div>
          <span className="font-display text-xl font-semibold text-foreground">
            BoxiStock
          </span>
        </div>

        <div
          className="w-full rounded-xl bg-card p-8 flex flex-col gap-6"
          style={{
            boxShadow:
              "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(145,128,168,0.10)",
          }}
        >
          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Set new password
            </h1>
            <p className="text-sm text-muted-foreground">
              Choose a strong password for your account
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            noValidate
          >
            {formError && (
              <p className="rounded-lg bg-negative-bg px-3 py-2 text-sm text-negative">
                {formError}
              </p>
            )}

            <FormField
              label="New password"
              htmlFor="new-password"
              error={newPasswordError}
            >
              <Input
                id="new-password"
                type="password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={!!newPasswordError}
                disabled={submitting}
                autoComplete="new-password"
              />
            </FormField>

            <FormField
              label="Confirm new password"
              htmlFor="confirm-new-password"
              error={confirmPasswordError}
            >
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!confirmPasswordError}
                disabled={submitting}
                autoComplete="new-password"
              />
            </FormField>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving…
                </>
              ) : (
                "Set new password"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
