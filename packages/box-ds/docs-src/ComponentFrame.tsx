import type * as React from "react";

interface SectionProps {
  title: string;
  description?: string;
  render: () => React.ReactNode;
}

/**
 * Component preview frame. Surfaces are built from design tokens:
 *   - Outer card: `bg-canvas` (`#1a1a1a`) on `bg-canvas-soft` page
 *   - Frame interior: `bg-canvas-soft` to mirror the live app's nested
 *     surfaces (canvas-soft → canvas → primary-pale)
 *   - Typography: `text-caption` for eyebrows, `text-body-sm-strong` for
 *     section titles, `font-display` for nothing here (kept for page header)
 */
export function Section({ title, description, render }: SectionProps) {
  return (
    <section className="mb-12">
      <h2 className="m-0 mb-1 text-body-md-strong text-ink tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="m-0 mb-4 text-body-sm text-body">{description}</p>
      )}

      <div className="flex flex-wrap items-start gap-4">
        <PreviewFrame label="Desktop" className="flex-1 min-w-[280px]">
          {render()}
        </PreviewFrame>
        <PreviewFrame label="Mobile · 390px" widthClass="w-[390px] shrink-0">
          {render()}
        </PreviewFrame>
      </div>
    </section>
  );
}

function PreviewFrame({
  label,
  children,
  className,
  widthClass,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  widthClass?: string;
}) {
  return (
    <div className={widthClass ?? className}>
      <div className="mb-2 text-caption font-semibold uppercase tracking-[0.08em] text-mute">
        {label}
      </div>
      <div className="rounded-xl border border-mute/30 bg-canvas-soft p-6 shadow-level1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-10">
      <h1 className="m-0 mb-2 font-display text-display-md text-ink tracking-tight">
        {title}
      </h1>
      <p className="m-0 text-body-md text-body max-w-2xl">{description}</p>
    </div>
  );
}
