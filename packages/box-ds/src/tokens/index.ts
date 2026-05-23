export const colors = {
  primary: "#9180a8",
  onPrimary: "#ffffff",
  primaryActive: "#b0a3c4",
  primaryNeutral: "#8b7aa3",
  primaryPale: "#2d2636",
  ink: "#f8f8f8",
  inkDeep: "#ffffff",
  body: "#a1a1aa",
  mute: "#52525b",
  canvas: "#1a1a1a",
  canvasSoft: "#121212",
  positive: "#4ade80",
  positiveDeep: "#166534",
  positiveSurface: "#052e16",
  warning: "#fbbf24",
  warningDeep: "#b45309",
  warningContent: "#fef3c7",
  warningSurface: "#431407",
  negative: "#f87171",
  negativeDeep: "#b91c1c",
  negativeDarkest: "#991b1b",
  negativeBg: "#320707",
  accentOrange: "#ffc091",
  accentCyan: "#38c8ff",
} as const;

export const spacing = {
  xxs: "2px",
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
  "3xl": "48px",
} as const;

export const rounded = {
  none: "0px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  pill: "9999px",
  full: "9999px",
} as const;

export const typography = {
  displayMega: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "126px",
    fontWeight: 800,
    lineHeight: "107px",
  },
  displayXxl: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "96px",
    fontWeight: 800,
    lineHeight: "82px",
  },
  displayXl: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "64px",
    fontWeight: 800,
    lineHeight: "55px",
  },
  displayLg: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "47px",
    fontWeight: 400,
    lineHeight: "71px",
    letterSpacing: "-0.1px",
  },
  displayMd: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "40px",
    fontWeight: 800,
    lineHeight: "34px",
  },
  displaySm: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "32px",
    fontWeight: 600,
    lineHeight: "38px",
    letterSpacing: "-0.96px",
  },
  displayXs: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "24px",
    fontWeight: 600,
    lineHeight: "31px",
    letterSpacing: "-0.48px",
  },
  bodyLg: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "20px",
    fontWeight: 400,
    lineHeight: "30px",
  },
  bodyMd: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "16px",
    fontWeight: 400,
    lineHeight: "24px",
  },
  bodyMdStrong: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "16px",
    fontWeight: 600,
    lineHeight: "24px",
  },
  bodySm: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: "20px",
  },
  bodySmStrong: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: "20px",
  },
  caption: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "12px",
    fontWeight: 400,
    lineHeight: "16px",
  },
  badge: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "10px",
    fontWeight: 500,
    lineHeight: "16px",
  },
  buttonMd: {
    fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif",
    fontSize: "16px",
    fontWeight: 600,
    lineHeight: "24px",
  },
} as const;

export const shadows = {
  level0: "none",
  level1: "0 0 0 1px rgba(145,128,168,0.15)",
  level2: "0 0 0 1px rgba(145,128,168,0.12), 0 2px 8px rgba(0,0,0,0.4)",
  level3: "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(145,128,168,0.10)",
  level4:
    "0 10px 40px -10px rgba(145,128,168,0.4), 0 25px 50px -12px rgba(0,0,0,0.4)",
} as const;
