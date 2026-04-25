import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const EFFECTIVE_DATE = "April 25, 2025";

export default function PrivacyPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-8 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <div className="space-y-8 text-sm text-foreground/90 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
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
          <h2 className="text-lg font-semibold text-foreground">
            2. Information We Collect
          </h2>
          <p>
            <strong className="text-foreground">Account information:</strong>{" "}
            When you sign up, we collect your name, email address, and
            authentication credentials via our identity provider, Clerk. We do
            not store passwords directly.
          </p>
          <p>
            <strong className="text-foreground">
              Inventory and sales data:
            </strong>{" "}
            All stock lots, product names, quantities, prices, sale records, and
            related data you enter are stored in our database (Supabase) and are
            associated with your user account.
          </p>
          <p>
            <strong className="text-foreground">Usage data:</strong> We may
            collect basic usage information such as page visits and feature
            interactions to help us improve the Service. This data is not linked
            to personally identifiable information.
          </p>
          <p>
            <strong className="text-foreground">Contact messages:</strong> If
            you contact us via the contact form, we collect your name, email
            address, and message content to respond to your inquiry.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
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
          <h2 className="text-lg font-semibold text-foreground">
            4. Third-Party Services
          </h2>
          <p>BoxiStock uses the following third-party services to operate:</p>
          <ul className="list-disc list-inside space-y-1 text-foreground/80 ml-2">
            <li>
              <strong className="text-foreground">Clerk</strong> —
              Authentication and user account management. Your login credentials
              and profile data are processed by Clerk in accordance with their{" "}
              <a
                href="https://clerk.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong className="text-foreground">Supabase</strong> — Database
              storage for your inventory and sales data, hosted on secure cloud
              infrastructure.
            </li>
            <li>
              <strong className="text-foreground">Anthropic</strong> — AI model
              provider used to power AI-assisted import features. When you use
              AI features, the text you submit is sent to Anthropic's API for
              processing. Do not include sensitive personal data in AI import
              prompts.
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
          <h2 className="text-lg font-semibold text-foreground">
            5. Data Retention
          </h2>
          <p>
            We retain your account and inventory data for as long as your
            account is active. If you delete your account, we will delete your
            data from our active systems within a reasonable period, subject to
            any legal retention requirements. Some residual data may remain in
            backups for a limited time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            6. Data Security
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
          <h2 className="text-lg font-semibold text-foreground">
            7. Your Rights
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
          <h2 className="text-lg font-semibold text-foreground">
            8. Children's Privacy
          </h2>
          <p>
            The Service is not directed to individuals under the age of 18. We
            do not knowingly collect personal information from children. If you
            believe a child has provided us with personal information, please
            contact us and we will take steps to delete it.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            9. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we
            will update the effective date above. Continued use of the Service
            after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
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
