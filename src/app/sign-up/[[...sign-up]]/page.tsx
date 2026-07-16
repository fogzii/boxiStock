"use client";

import { Button, FormField, Input } from "@box-ds";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FullScreenLoading } from "@/components/ui/fullScreenLoading";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);

  const handleGoogleSignUp = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleGoToSignIn = () => {
    setLoading(true);
    router.push("/sign-in");
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setFormError("");

    let hasError = false;
    if (!email.trim()) {
      setEmailError("Email is required.");
      hasError = true;
    }
    if (!password) {
      setPasswordError("Password is required.");
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      hasError = true;
    }
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      hasError = true;
    } else if (password && password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      hasError = true;
    }
    if (hasError) return;

    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard&type=signup`,
      },
    });
    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
    } else {
      setCheckInbox(true);
    }
  };

  return (
    <>
      {loading && <FullScreenLoading />}
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
          <div className="flex items-center gap-3">
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
            {checkInbox ? (
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
                    We sent a confirmation link to{" "}
                    <span className="font-semibold text-foreground">
                      {email}
                    </span>
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
                    Get started
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Create your BoxiStock account
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={loading || submitting}
                  className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-background text-sm font-semibold text-foreground transition-colors hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form
                  onSubmit={handleEmailSignUp}
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
                    htmlFor="signup-email"
                    error={emailError}
                  >
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={!!emailError}
                      disabled={submitting}
                      autoComplete="email"
                    />
                  </FormField>

                  <FormField
                    label="Password"
                    htmlFor="signup-password"
                    error={passwordError}
                  >
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={!!passwordError}
                      disabled={submitting}
                      autoComplete="new-password"
                    />
                  </FormField>

                  <FormField
                    label="Confirm password"
                    htmlFor="signup-confirm-password"
                    error={confirmPasswordError}
                  >
                    <Input
                      id="signup-confirm-password"
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
                        Creating account…
                      </>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>

          {!checkInbox && (
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={handleGoToSignIn}
                className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
