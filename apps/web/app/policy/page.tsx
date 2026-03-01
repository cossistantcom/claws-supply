import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Privacy Policy - Claws supply",
  description:
    "Learn how Claws supply collects, uses, and protects your personal information.",
  path: "/policy",
});

const sections = [
  {
    title: "Introduction",
    content: (
      <p>
        Productized Inc. (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
        operates Claws supply, a marketplace for OpenClaw agent templates. This
        Privacy Policy explains how we collect, use, and protect your personal
        information when you use our platform.
      </p>
    ),
  },
  {
    title: "Information We Collect",
    content: (
      <>
        <p>We collect the following types of information:</p>
        <ul className="mt-2 list-disc space-y-2 pl-6">
          <li>
            <strong>Account Information:</strong> Name, email address, and
            profile data required for account creation and marketplace identity.
          </li>
          <li>
            <strong>Authentication Data:</strong> Session cookies and security
            logs used for account authentication and abuse prevention.
          </li>
          <li>
            <strong>X Account Link Data:</strong> If you link X, we store your
            X account identifier, username, and link timestamp.
          </li>
          <li>
            <strong>Stripe Seller Data:</strong> If you sell templates, we store
            Stripe Connect account metadata and verification status needed for
            payouts.
          </li>
          <li>
            <strong>Marketplace Activity:</strong> Template listings, purchases,
            download records, referral attribution, and reviews.
          </li>
          <li>
            <strong>Uploaded Content:</strong> Template files, cover assets, and
            listing text you upload to publish templates.
          </li>
          <li>
            <strong>Advertising Campaign Data:</strong> If you run ads, we store
            campaign creative (logo, name, URL, description), placement choices,
            campaign moderation actions, and subscription billing state.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Information We Do Not Collect",
    content: (
      <p>
        We do not store full payment card details on our servers. Payment
        processing is handled by Stripe. We also do not request sensitive
        categories of personal data unless strictly required by law.
      </p>
    ),
  },
  {
    title: "Legal Basis for Processing (GDPR)",
    content: (
      <>
        <p>We process personal data under the following legal bases:</p>
        <ul className="mt-2 list-disc space-y-2 pl-6">
          <li>
            <strong>Contract Performance:</strong> To provide account access,
            marketplace transactions, and seller payouts.
          </li>
          <li>
            <strong>Legitimate Interests:</strong> To secure, maintain, and
            improve platform performance and fraud prevention.
          </li>
          <li>
            <strong>Consent:</strong> For optional actions such as linking
            third-party accounts where consent is required.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Data Storage and Security",
    content: (
      <>
        <p>
          Data is primarily processed and stored in the United States. We apply
          industry-standard protections, including:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-6">
          <li>Encryption in transit (HTTPS/TLS)</li>
          <li>Encryption at rest where supported by providers</li>
          <li>Role-based access controls</li>
          <li>Operational monitoring and periodic security review</li>
        </ul>
      </>
    ),
  },
  {
    title: "Third-Party Services",
    content: (
      <p>
        We use vetted third-party providers to operate the service, including
        Stripe (payments and seller onboarding), X (account linking), and
        S3-compatible infrastructure (file storage). Those services may process
        data according to their own privacy terms.
      </p>
    ),
  },
  {
    title: "Data Retention",
    content: (
      <p>
        We retain account and transaction data for as long as your account is
        active and as needed for legal, tax, security, and fraud-prevention
        purposes. When deletion is requested and legally permitted, we delete or
        anonymize personal data within a reasonable period.
      </p>
    ),
  },
  {
    title: "Your Rights",
    content: (
      <>
        <p>
          Depending on your location, you may have rights to access, correct,
          delete, restrict, object to, or export your personal data. You may
          also have the right to lodge a complaint with your local supervisory
          authority.
        </p>
        <p className="mt-4">
          To exercise these rights, contact us at{" "}
          <a className="underline underline-offset-4" href="mailto:support@claws.supply">
            support@claws.supply
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "Cookies",
    content: (
      <p>
        We use essential cookies and similar storage mechanisms required for
        authentication, account security, and basic platform operation.
      </p>
    ),
  },
  {
    title: "Children&apos;s Privacy",
    content: (
      <p>
        The service is not directed to children under 16, and we do not
        knowingly collect personal information from children.
      </p>
    ),
  },
  {
    title: "Changes to This Policy",
    content: (
      <p>
        We may update this Privacy Policy periodically. We will post the updated
        version on this page and revise the effective date when changes are
        material.
      </p>
    ),
  },
  {
    title: "Contact Us",
    content: (
      <>
        <p>If you have questions about this Privacy Policy, contact us:</p>
        <ul className="mt-2 space-y-1">
          <li>
            <strong>Email:</strong>{" "}
            <a className="underline underline-offset-4" href="mailto:support@claws.supply">
              support@claws.supply
            </a>
          </li>
          <li>
            <strong>Address:</strong> 1007 N Orange St., 4th Floor, Wilmington,
            DE 19801, USA
          </li>
        </ul>
      </>
    ),
  },
];

export default function PolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      effectiveDate="February 28, 2026"
      sections={sections}
    />
  );
}
