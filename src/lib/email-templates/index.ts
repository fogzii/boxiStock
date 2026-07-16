import { emailTokens as t } from "./tokens";

export type EmailTemplateKind =
  | "confirm-signup"
  | "reset-password"
  | "change-email";

export type EmailTemplateVars = {
  confirmationUrl: string;
  email?: string;
  newEmail?: string;
  siteUrl?: string;
};

export type EmailTemplateMeta = {
  kind: EmailTemplateKind;
  /** Label shown in the preview UI */
  label: string;
  /** Default Supabase dashboard subject */
  subject: string;
  /** Supabase Auth → Email Templates tab name */
  supabaseTab: string;
};

export const EMAIL_TEMPLATE_META: Record<EmailTemplateKind, EmailTemplateMeta> =
  {
    "confirm-signup": {
      kind: "confirm-signup",
      label: "Confirm signup",
      subject: "Confirm your BoxiStock email",
      supabaseTab: "Confirm signup",
    },
    "reset-password": {
      kind: "reset-password",
      label: "Reset password",
      subject: "Reset your BoxiStock password",
      supabaseTab: "Reset password",
    },
    "change-email": {
      kind: "change-email",
      label: "Change email address",
      subject: "Confirm your new BoxiStock email",
      supabaseTab: "Change email address",
    },
  };

/** Sample values for the local preview page. */
export const PREVIEW_VARS: EmailTemplateVars = {
  confirmationUrl:
    "https://boxistock.au/auth/confirm?token_hash=preview&type=email",
  email: "you@example.com",
  newEmail: "new@example.com",
  siteUrl: "https://boxistock.au",
};

/** Go-template placeholders for pasting into the Supabase dashboard. */
export const SUPABASE_VARS: EmailTemplateVars = {
  confirmationUrl: "{{ .ConfirmationURL }}",
  email: "{{ .Email }}",
  newEmail: "{{ .NewEmail }}",
  siteUrl: "{{ .SiteURL }}",
};

type ShellContent = {
  preheader: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  confirmationUrl: string;
  siteUrl: string;
  footnoteHtml?: string;
};

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Shared light email chrome (inbox-friendly; differs from dark box-ds UI).
 * Uses table layout + inline styles for client compatibility.
 */
export function renderEmailShell(content: ShellContent): string {
  const href = escapeAttr(content.confirmationUrl);
  // PNG — most email clients block SVG in <img>. Hosted under public/ at Site URL.
  const logoSrc = escapeAttr(`${content.siteUrl}/boxistock-logo-email.png`);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>BoxiStock</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet" />
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    a { color: ${t.primary}; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${t.canvasSoft};color:${t.ink};font-family:${t.fontFamily};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${content.preheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${t.canvasSoft};width:100%;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background-color:${t.canvas};border:1px solid ${t.border};border-radius:${t.radiusXl};overflow:hidden;">
          <tr>
            <td style="padding:32px 28px 8px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width:40px;height:40px;">
                    <img src="${logoSrc}" width="40" height="40" alt="BoxiStock" style="display:block;width:40px;height:40px;" />
                  </td>
                  <td style="padding-left:12px;font-size:18px;font-weight:600;color:${t.inkDeep};letter-spacing:-0.02em;">
                    BoxiStock
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px 28px;">
              <h1 style="margin:0;font-size:24px;font-weight:600;line-height:31px;letter-spacing:-0.48px;color:${t.inkDeep};">
                ${content.heading}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 8px 28px;font-size:16px;font-weight:400;line-height:24px;color:${t.body};">
              ${content.bodyHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 28px 8px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:${t.primary};border-radius:${t.radiusXl};">
                    <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;line-height:24px;color:${t.onPrimary};text-decoration:none;border-radius:${t.radiusXl};">
                      ${content.ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 8px 28px;font-size:12px;line-height:16px;color:${t.mute};word-break:break-all;">
              Or copy and paste this link into your browser:<br />
              <a href="${href}" style="color:${t.primary};text-decoration:underline;">${href}</a>
            </td>
          </tr>
          ${
            content.footnoteHtml
              ? `<tr>
            <td style="padding:16px 28px 8px 28px;font-size:14px;line-height:20px;color:${t.body};">
              ${content.footnoteHtml}
            </td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding:28px 28px 32px 28px;border-top:1px solid ${t.border};margin-top:16px;">
              <p style="margin:0;font-size:12px;line-height:16px;color:${t.mute};">
                You’re receiving this because of an account action on BoxiStock.
                If you didn’t request this, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderConfirmSignupEmail(vars: EmailTemplateVars): string {
  const emailLine = vars.email
    ? ` We sent this to <strong style="color:${t.ink};">${vars.email}</strong>.`
    : "";

  return renderEmailShell({
    preheader: "Confirm your email to finish setting up BoxiStock.",
    heading: "Confirm your email",
    bodyHtml: `Thanks for signing up for BoxiStock.${emailLine} Click the button below to verify your address and get started.`,
    ctaLabel: "Confirm email",
    confirmationUrl: vars.confirmationUrl,
    siteUrl: vars.siteUrl ?? "https://boxistock.au",
    footnoteHtml:
      "This link expires after a short time. Request a new one from the sign-in page if you need it.",
  });
}

export function renderResetPasswordEmail(vars: EmailTemplateVars): string {
  const emailLine = vars.email
    ? ` for <strong style="color:${t.ink};">${vars.email}</strong>`
    : "";

  return renderEmailShell({
    preheader: "Reset your BoxiStock password.",
    heading: "Reset your password",
    bodyHtml: `We received a request to reset the password${emailLine}. Click below to choose a new one.`,
    ctaLabel: "Reset password",
    confirmationUrl: vars.confirmationUrl,
    siteUrl: vars.siteUrl ?? "https://boxistock.au",
    footnoteHtml:
      "If you didn’t ask to reset your password, you can safely ignore this email — your password won’t change.",
  });
}

export function renderChangeEmailEmail(vars: EmailTemplateVars): string {
  const toLine = vars.newEmail
    ? ` to <strong style="color:${t.ink};">${vars.newEmail}</strong>`
    : "";

  return renderEmailShell({
    preheader: "Confirm your new BoxiStock email address.",
    heading: "Confirm your new email",
    bodyHtml: `You asked to update the email on your BoxiStock account${toLine}. Confirm the change with the button below.`,
    ctaLabel: "Confirm new email",
    confirmationUrl: vars.confirmationUrl,
    siteUrl: vars.siteUrl ?? "https://boxistock.au",
    footnoteHtml:
      "If you didn’t request an email change, ignore this message and keep using your current address.",
  });
}

export type ShareInviteEmailVars = {
  inviterName: string;
  siteUrl: string;
};

export function renderShareInviteEmail(vars: ShareInviteEmailVars): string {
  const name = escapeAttr(vars.inviterName || "Someone");

  return renderEmailShell({
    preheader: `${name} shared their boxiStock portfolio with you.`,
    heading: "You've been shared a portfolio",
    bodyHtml: `<strong style="color:${t.ink};">${name}</strong> has shared their boxiStock inventory with you. Click below to check it out.`,
    ctaLabel: "View portfolio",
    confirmationUrl: `${vars.siteUrl}/sharing`,
    siteUrl: vars.siteUrl,
    footnoteHtml:
      "If you don’t recognize this, you can safely ignore this email.",
  });
}

export function renderEmailTemplate(
  kind: EmailTemplateKind,
  vars: EmailTemplateVars,
): string {
  switch (kind) {
    case "confirm-signup":
      return renderConfirmSignupEmail(vars);
    case "reset-password":
      return renderResetPasswordEmail(vars);
    case "change-email":
      return renderChangeEmailEmail(vars);
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function renderSupabaseEmailTemplate(kind: EmailTemplateKind): string {
  return renderEmailTemplate(kind, SUPABASE_VARS);
}
