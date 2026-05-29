import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const EFFECTIVE_DATE = "May 24, 2026";

export default function PrivacyPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-8 py-12 max-w-3xl mx-auto">
      <h1 className="font-display text-display-md text-foreground mb-2">
        Privacy Policy
      </h1>
      <p className="text-body-sm text-body mb-10">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <div className="space-y-8 text-body-sm text-foreground/90">
        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            1. Introduction
          </h2>
          <p>
            BoxiStock ("we", "us", or "our") is committed to protecting your
            privacy. This Privacy Policy explains what information we collect,
            how we use it, and what rights you have in relation to it. By using
            BoxiStock, you agree to the collection and use of information in
            accordance with this policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            2. Information We Collect
          </h2>
          <p>
            <strong className="text-foreground">Account information:</strong>{" "}
            When you sign up, we collect your name, email address, and
            authentication credentials via Google OAuth. We do not store
            passwords directly.
          </p>
          <p>
            <strong className="text-foreground">
              Inventory and sales data:
            </strong>{" "}
            All stock lots, product names, quantities, prices, individual and
            bundle sale records, and related data you enter are stored in our
            database (Supabase) and are associated with your user account.
          </p>
          <p>
            <strong className="text-foreground">Usage data:</strong> We collect
            usage information such as page visits and feature interactions via
            PostHog to help us understand how the Service is used and improve
            it. This data is associated with a pseudonymous identifier and is
            not sold to third parties.
          </p>
          <p>
            <strong className="text-foreground">Contact messages:</strong> If
            you contact us via the contact form, we collect your name, email
            address, and message content to respond to your inquiry.
          </p>
          <p>
            <strong className="text-foreground">Share link access:</strong> When
            a third party views a share link you have created, basic access
            information (such as request timestamps) may be logged for security
            and abuse-prevention purposes. We do not collect personal
            information about share link viewers beyond what is described here.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc list-inside space-y-1 text-foreground/80 ml-2">
            <li>To provide, operate, and maintain the Service.</li>
            <li>To authenticate you and secure your account.</li>
            <li>
              To process and display your inventory and sales data as requested.
            </li>
            <li>To respond to your support inquiries and messages.</li>
            <li>
              To improve and develop the Service based on aggregated usage
              patterns.
            </li>
            <li>
              To comply with legal obligations and enforce our Terms of Service.
            </li>
          </ul>
          <p>
            We do not sell, rent, or trade your personal information to third
            parties for marketing purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            4. Share Links and Public Data Exposure
          </h2>
          <p>
            BoxiStock allows you to create share links that make selected
            inventory and sales data publicly accessible to anyone with the
            link. When you activate a share link, the data included in that
            share (product names, quantities, prices, and related figures) is
            accessible without authentication, subject to any password you have
            set.
          </p>
          <p>
            You control what data is shared and may revoke a share link at any
            time. Once revoked, the link will no longer display your data.
            However, we are not responsible for any copies or screenshots taken
            by third parties while the link was active. Do not include
            information in a share link that you are not comfortable making
            publicly available.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            5. Third-Party Services
          </h2>
          <p>BoxiStock uses the following third-party services to operate:</p>
          <ul className="list-disc list-inside space-y-1 text-foreground/80 ml-2">
            <li>
              <strong className="text-foreground">Supabase</strong> —
              Authentication, database storage for your inventory and sales
              data, hosted on secure cloud infrastructure.
            </li>
            <li>
              <strong className="text-foreground">Vercel</strong> — Hosting and
              edge network infrastructure. All HTTP requests to BoxiStock pass
              through Vercel's servers. Vercel may log request metadata (IP
              addresses, timestamps) for operational purposes in accordance with
              their{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong className="text-foreground">PostHog</strong> — Product
              analytics platform used to collect usage data (page views, feature
              interactions). PostHog processes this data in accordance with
              their{" "}
              <a
                href="https://posthog.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong className="text-foreground">Anthropic</strong> — AI model
              provider (Claude) used to power AI-assisted import features. When
              you use AI features, the text you submit is sent to Anthropic's
              API for processing. Do not include sensitive personal data in AI
              import prompts.
            </li>
            <li>
              <strong className="text-foreground">Upstash</strong> — Rate
              limiting infrastructure. No personally identifiable information is
              stored by Upstash beyond anonymized request identifiers.
            </li>
            <li>
              <strong className="text-foreground">Resend</strong> — Email
              delivery service used to process contact form submissions.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            6. Data Retention
          </h2>
          <p>
            We retain your account and inventory data for as long as your
            account is active. If you delete your account, we will delete your
            data from our active systems within a reasonable period, subject to
            any legal retention requirements. All share links associated with
            your account are deactivated upon deletion. Some residual data may
            remain in backups for a limited time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            7. Data Security
          </h2>
          <p>
            We take reasonable technical and organizational measures to protect
            your data against unauthorized access, loss, or disclosure. Data is
            stored using industry-standard encrypted infrastructure. However, no
            method of transmission over the internet or electronic storage is
            100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            8. Your Rights
          </h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside space-y-1 text-foreground/80 ml-2">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>
              Request deletion of your data (subject to legal obligations).
            </li>
            <li>Object to or restrict certain processing of your data.</li>
            <li>Withdraw consent where processing is based on consent.</li>
          </ul>
          <p>
            To exercise these rights, contact us at{" "}
            <a
              href="mailto:boxistock@gmail.com"
              className="text-primary hover:underline"
            >
              boxistock@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            9. Children&apos;s Privacy
          </h2>
          <p>
            The Service is not directed to individuals under the age of 18. We
            do not knowingly collect personal information from children. If you
            believe a child has provided us with personal information, please
            contact us and we will take steps to delete it.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            10. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we
            will update the effective date above. Continued use of the Service
            after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            11. Contact
          </h2>
          <p>
            For privacy-related questions or requests, please contact us at{" "}
            <a
              href="mailto:boxistock@gmail.com"
              className="text-primary hover:underline"
            >
              boxistock@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
