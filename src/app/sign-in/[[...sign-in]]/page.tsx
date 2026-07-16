"use client";

import { Button, FormField, Input } from "@box-ds";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FullScreenLoading } from "@/components/ui/fullScreenLoading";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleGoToSignUp = () => {
    setLoading(true);
    router.push("/sign-up");
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setFormError("");

    let hasError = false;
    if (!email.trim()) {
      setEmailError("Email is required.");
      hasError = true;
    }
    if (!password) {
      setPasswordError("Password is required.");
      hasError = true;
    }
    if (hasError) return;

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setSubmitting(false);

    if (error) {
      if (error.message === "Invalid login credentials") {
        setFormError("Invalid email or password.");
      } else {
        setFormError(error.message);
      }
      return;
    }

    router.push("/dashboard");
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
            <div className="flex flex-col gap-1.5">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to your BoxiStock account
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
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
              onSubmit={handleEmailSignIn}
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
                htmlFor="signin-email"
                error={emailError}
              >
                <Input
                  id="signin-email"
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
                htmlFor="signin-password"
                error={passwordError}
              >
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!passwordError}
                  disabled={submitting}
                  autoComplete="current-password"
                />
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </Link>
                </div>
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
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </div>

          <p className="text-sm text-muted-foreground">
            New to BoxiStock?{" "}
            <button
              type="button"
              onClick={handleGoToSignUp}
              className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Create an account
            </button>
          </p>
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
