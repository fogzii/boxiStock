"use client";

import { Button } from "@box-ds";
import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import {
  EMAIL_TEMPLATE_META,
  type EmailTemplateKind,
  PREVIEW_VARS,
  renderEmailTemplate,
  renderSupabaseEmailTemplate,
} from "@/lib/email-templates";

const KINDS = Object.keys(EMAIL_TEMPLATE_META) as EmailTemplateKind[];

export function EmailPreviewClient() {
  const [kind, setKind] = useState<EmailTemplateKind>("confirm-signup");
  const [copied, setCopied] = useState<"html" | "subject" | null>(null);

  const previewHtml = useMemo(() => {
    const siteUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : PREVIEW_VARS.siteUrl;
    return renderEmailTemplate(kind, { ...PREVIEW_VARS, siteUrl });
  }, [kind]);
  const supabaseHtml = useMemo(() => renderSupabaseEmailTemplate(kind), [kind]);
  const meta = EMAIL_TEMPLATE_META[kind];

  const copy = async (what: "html" | "subject") => {
    const text = what === "html" ? supabaseHtml : meta.subject;
    await navigator.clipboard.writeText(text);
    setCopied(what);
    window.setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-canvas-soft text-ink">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-2">
          <p className="text-caption text-mute uppercase tracking-wide">
            Dev only
          </p>
          <h1 className="font-display text-display-xs text-ink-deep">
            Auth email preview
          </h1>
          <p className="max-w-2xl text-body-sm text-body">
            Light inbox templates with the box-ds primary accent. Copy the
            Supabase HTML into{" "}
            <span className="text-ink">Authentication → Email Templates</span>{" "}
            (tab: <span className="text-ink">{meta.supabaseTab}</span>), then
            paste the subject below.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => {
            const active = k === kind;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`cursor-pointer rounded-xl px-4 py-2 text-body-sm-strong transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-canvas text-body hover:bg-primary-pale hover:text-ink"
                }`}
              >
                {EMAIL_TEMPLATE_META[k].label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => void copy("html")}
            className="gap-2"
          >
            {copied === "html" ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied === "html" ? "Copied HTML" : "Copy Supabase HTML"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => void copy("subject")}
            className="gap-2"
          >
            {copied === "subject" ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied === "subject" ? "Copied subject" : "Copy subject"}
          </Button>
        </div>

        <p className="text-caption text-mute">
          Subject: <span className="text-body">{meta.subject}</span>
        </p>

        <div className="overflow-hidden rounded-xl border border-border bg-canvas">
          <iframe
            title={`${meta.label} email preview`}
            srcDoc={previewHtml}
            className="h-[720px] w-full border-0 bg-canvas-soft"
          />
        </div>
      </div>
    </div>
  );
}
