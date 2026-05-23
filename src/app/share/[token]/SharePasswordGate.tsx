"use client";

import { Button, Input, Label } from "@box-ds";
import { Eye, EyeOff, Lock } from "lucide-react";
import * as React from "react";
import { verifySharePassword } from "@/actions/share";

export function SharePasswordGate({ token }: { token: string }) {
  const [password, setPassword] = React.useState("");
  const [showText, setShowText] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setError(null);
    setIsPending(true);
    try {
      const result = await verifySharePassword(token, password.trim());
      // verifySharePassword redirects on success; only reach here on error
      if (result?.error) setError(result.error);
    } catch {
      // redirect() throws — that's the success path; do nothing
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8 shadow-level2">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display text-display-xs text-foreground">
            Password required
          </h1>
          <p className="text-body-sm text-body text-center">
            This shared stats page is password-protected.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="share-password" className="text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Input
                id="share-password"
                type={showText ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter password…"
                autoFocus
                className="bg-background/50 border-primary/20 h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowText((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showText ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {error && <p className="text-caption text-destructive">{error}</p>}
          </div>

          <Button
            type="submit"
            disabled={isPending || !password.trim()}
            className="h-11"
          >
            {isPending ? "Verifying…" : "Unlock"}
          </Button>
        </form>
      </div>
    </div>
  );
}
