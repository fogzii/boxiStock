/**
 * Inline email palette for auth mail.
 * Light surfaces are intentional for inbox readability (differs from dark box-ds UI).
 * Primary accent still matches box-ds / DESIGN.md.
 * Email clients ignore CSS variables, so values are hardcoded hex / font stacks.
 */
export const emailTokens = {
  primary: "#9180a8",
  onPrimary: "#ffffff",
  ink: "#18181b",
  inkDeep: "#09090b",
  body: "#52525b",
  mute: "#71717a",
  canvas: "#ffffff",
  canvasSoft: "#f4f4f5",
  border: "#e4e4e7",
  fontFamily:
    "Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  radiusXl: "24px",
  radiusMd: "12px",
} as const;
