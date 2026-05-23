import { colors, rounded, shadows, spacing, typography } from "@box-ds";
import { PageHeader } from "../ComponentFrame";

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <div
        className="size-10 shrink-0 rounded-md border border-ink/10"
        style={{ background: value }}
      />
      <div>
        <div className="text-body-sm-strong text-ink">{name}</div>
        <div className="font-mono text-caption text-mute">{value}</div>
      </div>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 text-caption font-semibold uppercase tracking-[0.08em] text-mute">
        {title}
      </div>
      {children}
    </div>
  );
}

function TokenSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-canvas p-6 shadow-level1">
      <div className="mb-6">
        <h2 className="m-0 font-display text-display-xs text-ink">{title}</h2>
        <p className="m-0 mt-2 max-w-3xl text-body-sm text-body">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function RadiusSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <div
        className="size-10 shrink-0 border border-primary bg-primary-pale"
        style={{ borderRadius: value === "9999px" ? "9999px" : value }}
      />
      <div>
        <div className="text-body-sm-strong text-ink">{name}</div>
        <div className="font-mono text-caption text-mute">{value}</div>
      </div>
    </div>
  );
}

function SpacingSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <div
        className="h-4 shrink-0 rounded-sm bg-primary"
        style={{ width: value, minWidth: "4px" }}
      />
      <div>
        <span className="text-body-sm-strong text-ink">{name}</span>
        <span className="ml-2 font-mono text-caption text-mute">{value}</span>
      </div>
    </div>
  );
}

function ShadowSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="mb-3 flex items-center gap-4">
      <div
        className="size-12 shrink-0 rounded-md bg-canvas"
        style={{ boxShadow: value === "none" ? undefined : value }}
      />
      <div>
        <div className="text-body-sm-strong text-ink">{name}</div>
        <div className="max-w-[340px] font-mono text-caption leading-relaxed text-mute">
          {value}
        </div>
      </div>
    </div>
  );
}

function tokenClassName(name: string) {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function fontLabel(fontFamily: string) {
  if (fontFamily.includes("--font-manrope")) return "Manrope";
  return fontFamily;
}

function TypographySwatch({
  name,
  value,
}: {
  name: string;
  value: {
    fontFamily: string;
    fontSize: string;
    fontWeight: number;
    lineHeight: string;
    letterSpacing?: string;
  };
}) {
  const className = `text-${tokenClassName(name)}`;

  return (
    <div className="mb-4 rounded-lg border border-border bg-canvas-soft p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-body-sm-strong text-ink">{name}</div>
          <code className="font-mono text-caption text-mute">{className}</code>
        </div>
        <div className="font-mono text-caption text-mute">
          {value.fontSize} / {value.lineHeight} · {value.fontWeight}
        </div>
      </div>
      <div
        className="truncate text-ink"
        style={{
          fontFamily: value.fontFamily,
          fontSize: value.fontSize,
          fontWeight: value.fontWeight,
          lineHeight: value.lineHeight,
          letterSpacing: value.letterSpacing,
        }}
      >
        The quick brown fox
      </div>
      <div className="mt-2 text-caption text-body">
        {fontLabel(value.fontFamily)}
        {value.letterSpacing ? ` · ${value.letterSpacing} tracking` : ""}
      </div>
    </div>
  );
}

export function TokensPage() {
  return (
    <div>
      <PageHeader
        title="Design tokens"
        description="The primitive values that drive the entire design system."
      />

      <div className="space-y-10">
        <TokenSection
          title="Color"
          description="Brand, surface, text, semantic, and decorative color tokens."
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8">
            <Group title="Brand">
              <Swatch name="primary" value={colors.primary} />
              <Swatch name="primaryActive" value={colors.primaryActive} />
              <Swatch name="primaryNeutral" value={colors.primaryNeutral} />
              <Swatch name="primaryPale" value={colors.primaryPale} />
            </Group>

            <Group title="Surface">
              <Swatch name="canvas" value={colors.canvas} />
              <Swatch name="canvasSoft" value={colors.canvasSoft} />
            </Group>

            <Group title="Text">
              <Swatch name="ink" value={colors.ink} />
              <Swatch name="inkDeep" value={colors.inkDeep} />
              <Swatch name="body" value={colors.body} />
              <Swatch name="mute" value={colors.mute} />
            </Group>

            <Group title="Positive">
              <Swatch name="positive" value={colors.positive} />
              <Swatch name="positiveDeep" value={colors.positiveDeep} />
              <Swatch name="positiveSurface" value={colors.positiveSurface} />
            </Group>

            <Group title="Warning">
              <Swatch name="warning" value={colors.warning} />
              <Swatch name="warningDeep" value={colors.warningDeep} />
              <Swatch name="warningContent" value={colors.warningContent} />
              <Swatch name="warningSurface" value={colors.warningSurface} />
            </Group>

            <Group title="Negative">
              <Swatch name="negative" value={colors.negative} />
              <Swatch name="negativeDeep" value={colors.negativeDeep} />
              <Swatch name="negativeDarkest" value={colors.negativeDarkest} />
              <Swatch name="negativeBg" value={colors.negativeBg} />
            </Group>

            <Group title="Accent">
              <Swatch name="accentOrange" value={colors.accentOrange} />
              <Swatch name="accentCyan" value={colors.accentCyan} />
            </Group>
          </div>
        </TokenSection>

        <TokenSection
          title="Typography"
          description="Text styles exposed as Tailwind text utilities and TypeScript tokens."
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
            {Object.entries(typography).map(([name, value]) => (
              <TypographySwatch key={name} name={name} value={value} />
            ))}
          </div>
        </TokenSection>

        <TokenSection
          title="Spacing"
          description="The 4px-based spacing scale used for layout, gaps, and component padding."
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            {Object.entries(spacing).map(([name, value]) => (
              <SpacingSwatch key={name} name={name} value={value} />
            ))}
          </div>
        </TokenSection>

        <TokenSection
          title="Border Radius"
          description="Shape tokens for inputs, cards, buttons, pills, and circular controls."
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            {Object.entries(rounded).map(([name, value]) => (
              <RadiusSwatch key={name} name={name} value={value} />
            ))}
          </div>
        </TokenSection>

        <TokenSection
          title="Elevation"
          description="Purple-glow shadow tokens layered on top of surface contrast."
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
            {Object.entries(shadows).map(([name, value]) => (
              <ShadowSwatch key={name} name={name} value={value} />
            ))}
          </div>
        </TokenSection>
      </div>
    </div>
  );
}
