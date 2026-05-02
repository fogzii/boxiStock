import type { ClerkProvider } from "@clerk/nextjs";

type ClerkAppearance = NonNullable<
  Parameters<typeof ClerkProvider>[0]["appearance"]
>;

export const clerkAppearance: ClerkAppearance = {
  variables: {
    colorBackground: "#1a1a1a",
    colorInputBackground: "#27272a",
    colorPrimary: "#9180a8",
    colorText: "#f8f8f8",
    colorTextSecondary: "#a1a1aa",
    colorNeutral: "#f8f8f8",
    colorDanger: "#f87171",
    colorSuccess: "#4ade80",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-manrope), sans-serif",
    fontFamilyButtons: "var(--font-manrope), sans-serif",
  },
  elements: {
    card: {
      backgroundColor: "#1a1a1a",
      borderColor: "#27272a",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      borderRadius: "0.75rem",
      overflow: "hidden",
    },
    cardBox: {
      borderRadius: "0.75rem",
      overflow: "hidden",
    },
    modalContent: {
      backgroundColor: "#1a1a1a",
      borderColor: "#27272a",
      borderRadius: "0.75rem",
      overflow: "hidden",
    },
    modalBackdrop: { backgroundColor: "rgba(0,0,0,0.7)" },
    modalCloseButton: {
      color: "#a1a1aa",
      "&:hover": { color: "#f8f8f8", backgroundColor: "#27272a" },
    },
    navbar: { backgroundColor: "#121212", borderColor: "#27272a" },
    navbarButton: { color: "#a1a1aa" },
    navbarButtonActive: { color: "#f8f8f8", backgroundColor: "#27272a" },
    pageScrollBox: { backgroundColor: "#1a1a1a" },
    profileSection: { borderColor: "#27272a" },
    profileSectionTitle: { color: "#f8f8f8" },
    profileSectionContent: { backgroundColor: "#1a1a1a", color: "#f8f8f8" },
    profileSectionItemList: { backgroundColor: "#1a1a1a" },
    profileSectionItem: {
      backgroundColor: "#1a1a1a",
      color: "#f8f8f8",
      borderColor: "#27272a",
    },
    accordionTriggerButton: {
      backgroundColor: "#1a1a1a",
      color: "#f8f8f8",
      borderColor: "#27272a",
    },
    accordionContent: { backgroundColor: "#1a1a1a", color: "#f8f8f8" },
    menuList: { backgroundColor: "#1a1a1a", borderColor: "#27272a" },
    menuItem: { color: "#f8f8f8" },
    formFieldInput: {
      backgroundColor: "#27272a",
      borderColor: "#3f3f46",
      color: "#f8f8f8",
    },
    formFieldLabel: { color: "#a1a1aa" },
    formButtonPrimary: {
      backgroundColor: "#9180a8",
      color: "#ffffff",
    },
    socialButtonsBlockButton: {
      backgroundColor: "#27272a",
      borderColor: "#3f3f46",
      color: "#f8f8f8",
    },
    dividerLine: { backgroundColor: "#27272a" },
    dividerText: { color: "#a1a1aa" },
    identityPreviewText: { color: "#f8f8f8" },
    identityPreviewEditButton: { color: "#9180a8" },
    headerTitle: { color: "#f8f8f8" },
    headerSubtitle: { color: "#a1a1aa" },
    footerActionText: { color: "#a1a1aa" },
    footerActionLink: { color: "#9180a8" },
    badge: { backgroundColor: "#2d2636", color: "#9180a8" },
    alertText: { color: "#f8f8f8" },
    userButtonPopoverCard: {
      backgroundColor: "#1a1a1a",
      borderColor: "#27272a",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    },
    userButtonPopoverActionButton: { color: "#f8f8f8" },
    userButtonPopoverActionButtonIcon: { color: "#a1a1aa" },
    userButtonPopoverFooter: {
      backgroundColor: "#121212",
      borderColor: "#27272a",
    },
    userPreviewMainIdentifier: { color: "#f8f8f8" },
    userPreviewSecondaryIdentifier: { color: "#a1a1aa" },
  },
};
