"use client";

import { Button, FormField, Input } from "@box-ds";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setFormError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        window.location.origin +
        "/auth/confirm?next=/reset-password&type=recovery",
    });
    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/boxistock-logo-ondark.svg"
            alt="BoxiStock"
            width={48}
            height={48}
            className="h-12 w-12"
          />
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
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div className="flex flex-col gap-1.5">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  Check your inbox
                </h1>
                <p className="text-sm text-muted-foreground">
                  We sent a reset link to{" "}
                  <span className="font-semibold text-foreground">{email}</span>
                </p>
              </div>
              <Link
                href="/sign-in"
                className="mt-2 text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  Reset password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email to receive a reset link
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
                  label="Email"
                  htmlFor="forgot-email"
                  error={emailError}
                >
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={!!emailError}
                    disabled={submitting}
                    autoComplete="email"
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
                      Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        <Link
          href="/sign-in"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
