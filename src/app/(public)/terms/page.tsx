import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

const EFFECTIVE_DATE = "May 3, 2026";

export default function TermsPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-8 py-12 max-w-3xl mx-auto">
      <h1 className="font-display text-display-md text-foreground mb-2">
        Terms of Service
      </h1>
      <p className="text-body-sm text-body mb-10">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <div className="prose-content space-y-8 text-body-sm text-foreground/90">
        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using BoxiStock ("the Service"), you agree to be
            bound by these Terms of Service ("Terms"). If you do not agree to
            these Terms, do not use the Service. These Terms apply to all
            visitors, users, and others who access or use the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            2. Description of Service
          </h2>
          <p>
            BoxiStock is an inventory and profit-tracking application designed
            for resellers. It provides FIFO (first-in, first-out) cost tracking,
            sales recording, and AI-assisted data import tools to help you
            manage and understand your reselling business. The Service is
            provided on an "as is" basis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            3. User Accounts
          </h2>
          <p>
            You must create an account to use BoxiStock. You are responsible for
            maintaining the confidentiality of your account credentials and for
            all activity that occurs under your account. You agree to notify us
            immediately at{" "}
            <a
              href="mailto:boxistock@gmail.com"
              className="text-primary hover:underline"
            >
              boxistock@gmail.com
            </a>{" "}
            of any unauthorized use of your account.
          </p>
          <p>
            You must be at least 18 years old to use the Service. By creating an
            account, you represent that you meet this requirement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            4. Acceptable Use
          </h2>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 text-foreground/80 ml-2">
            <li>
              Use the Service for any unlawful purpose or in violation of any
              regulations.
            </li>
            <li>
              Attempt to gain unauthorized access to any part of the Service or
              its infrastructure.
            </li>
            <li>
              Upload or transmit any malicious code, viruses, or harmful
              content.
            </li>
            <li>
              Use automated tools (bots, scrapers) to access the Service without
              our prior written consent.
            </li>
            <li>
              Reverse-engineer, decompile, or disassemble any portion of the
              Service.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            5. Your Data
          </h2>
          <p>
            You retain full ownership of all inventory, sales, and financial
            data you enter into BoxiStock. We do not claim any intellectual
            property rights over your data. You grant us a limited license to
            store and process your data solely for the purpose of providing the
            Service to you.
          </p>
          <p>
            You are responsible for the accuracy of data you input and for
            complying with any legal or tax obligations relating to your
            reselling activities.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            6. Share Links
          </h2>
          <p>
            BoxiStock allows you to generate publicly accessible share links
            that expose selected inventory and sales data to anyone who holds
            the link. You are solely responsible for the data you choose to
            share and for distributing share links only to intended recipients.
          </p>
          <p>
            Optional password protection is provided as a convenience measure
            and does not constitute a guarantee of security. We are not
            responsible for unauthorized access resulting from a share link or
            password being disclosed to unintended parties.
          </p>
          <p>
            If your account is terminated or you revoke a share link, that link
            will no longer be accessible. We are not liable for any prior
            exposure of data that occurred while the link was active.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            7. AI-Assisted Features
          </h2>
          <p>
            BoxiStock includes AI-powered features (such as AI-assisted import)
            powered by third-party AI models. These features are provided as
            convenience tools. AI-generated output may contain errors and should
            always be reviewed before being saved. We are not responsible for
            inaccuracies in AI-generated suggestions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            8. Disclaimer of Warranties
          </h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
            WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
            LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE
            WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT DATA WILL NOT BE LOST.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            9. Limitation of Liability
          </h2>
          <p>
            TO THE FULLEST EXTENT PERMITTED BY LAW, BOXISTOCK AND ITS OPERATORS
            SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA,
            OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE
            SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            10. Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate your access to the
            Service at any time, with or without cause, and with or without
            notice. You may delete your account at any time by contacting us.
            Upon termination, your account data will be deleted in accordance
            with our Privacy Policy. Any active share links associated with your
            account will be deactivated immediately upon termination.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            11. Changes to Terms
          </h2>
          <p>
            We may modify these Terms at any time. If we make material changes,
            we will update the effective date above. Your continued use of the
            Service after any changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            12. Governing Law
          </h2>
          <p>
            These Terms are governed by and construed in accordance with
            applicable law. Any disputes arising under these Terms shall be
            resolved through good-faith negotiation, or if necessary, binding
            arbitration.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-xs text-foreground">
            13. Contact
          </h2>
          <p>
            For questions about these Terms, please contact us at{" "}
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
