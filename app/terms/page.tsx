import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Terms of Service - Claws supply",
  description:
    "Terms and conditions for using Claws supply's OpenClaw template marketplace.",
};

const sections = [
  {
    title: "Acceptance of Terms",
    content: (
      <p>
        By accessing or using Claws supply (&quot;the Service&quot;), operated by
        Productized Inc. (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you
        agree to be bound by these Terms of Service. If you do not agree, do
        not use the Service.
      </p>
    ),
  },
  {
    title: "Description of Service",
    content: (
      <p>
        Claws supply is a marketplace where users can discover, purchase, and
        publish OpenClaw agent templates. We provide listing, payment, payout,
        and download infrastructure to support template transactions.
      </p>
    ),
  },
  {
    title: "Account Registration",
    content: (
      <>
        <p>To use certain features, you must create an account. You agree to:</p>
        <ul className="mt-2 list-disc space-y-2 pl-6">
          <li>Provide accurate and complete registration information.</li>
          <li>Maintain the confidentiality of your account credentials.</li>
          <li>Accept responsibility for all activity under your account.</li>
          <li>
            Use linked accounts (including X) only if you have authority to do
            so.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "User Conduct",
    content: (
      <>
        <p>You agree not to:</p>
        <ul className="mt-2 list-disc space-y-2 pl-6">
          <li>Use the Service for unlawful or fraudulent activity.</li>
          <li>Attempt unauthorized access to systems or other accounts.</li>
          <li>Upload malicious files, malware, or deceptive listings.</li>
          <li>Interfere with platform operation or security controls.</li>
          <li>Impersonate any person or misrepresent affiliations.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Seller Obligations",
    content: (
      <>
        <p>If you publish templates, you represent and warrant that:</p>
        <ul className="mt-2 list-disc space-y-2 pl-6">
          <li>
            You have the rights necessary to upload and monetize template
            content.
          </li>
          <li>
            Your templates do not infringe third-party rights or violate
            applicable laws.
          </li>
          <li>
            Your listings are accurate and do not intentionally mislead buyers.
          </li>
          <li>
            You comply with Stripe Connect onboarding and payout requirements.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Buyer Purchases and License Scope",
    content: (
      <>
        <p>
          When you purchase a template, you receive access to download and use
          that template for your own lawful use, subject to any seller-provided
          terms included in the listing.
        </p>
        <p className="mt-4">
          A purchase does not transfer ownership of the seller&apos;s underlying
          intellectual property unless explicitly stated.
        </p>
      </>
    ),
  },
  {
    title: "Payments, Billing, and Payouts",
    content: (
      <>
        <p>
          Purchases are processed through Stripe. We do not store full payment
          card details on our servers.
        </p>
        <p className="mt-4">
          Seller payouts are handled through Stripe Connect. Platform commissions
          apply according to marketplace rules, including separate rates for
          direct and marketplace-driven sales where configured. Refund or dispute
          handling may be managed through Stripe processes.
        </p>
      </>
    ),
  },
  {
    title: "Intellectual Property",
    content: (
      <>
        <p>
          The Service, including the Claws supply name, logo, and platform
          design, is owned by Productized Inc. and protected by applicable
          intellectual property laws.
        </p>
        <p className="mt-4">
          Sellers retain ownership of their submitted templates, subject to the
          limited rights needed for us to host, process, and deliver content to
          buyers through the Service.
        </p>
      </>
    ),
  },
  {
    title: "Privacy",
    content: (
      <p>
        Your use of the Service is also governed by our{" "}
        <Link className="underline underline-offset-4" href="/policy">
          Privacy Policy
        </Link>
        .
      </p>
    ),
  },
  {
    title: "Service Availability",
    content: (
      <p>
        We strive to keep the Service available but do not guarantee uninterrupted
        or error-free access. We may modify, suspend, or discontinue features at
        any time.
      </p>
    ),
  },
  {
    title: "Limitation of Liability",
    content: (
      <>
        <p>
          To the maximum extent permitted by law, Productized Inc. is not liable
          for indirect, incidental, special, consequential, or punitive damages
          arising from your use of the Service.
        </p>
        <p className="mt-4">
          Our aggregate liability for claims related to the Service is limited to
          amounts you paid to us in the twelve (12) months before the claim.
        </p>
      </>
    ),
  },
  {
    title: "Disclaimer of Warranties",
    content: (
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available&quot;
        without warranties of any kind, express or implied.
      </p>
    ),
  },
  {
    title: "Termination",
    content: (
      <p>
        We may suspend or terminate access to the Service at any time, with or
        without notice, including for violations of these Terms or legal
        requirements.
      </p>
    ),
  },
  {
    title: "Governing Law and Jurisdiction",
    content: (
      <p>
        These Terms are governed by the laws of the State of Delaware, United
        States, without regard to conflict of law rules. Disputes will be
        subject to the exclusive jurisdiction of courts located in Delaware,
        United States.
      </p>
    ),
  },
  {
    title: "Severability, Entire Agreement, and Changes",
    content: (
      <>
        <p>
          If any provision of these Terms is held invalid, the remaining
          provisions remain in effect. These Terms and our Privacy Policy are the
          entire agreement between you and Productized Inc. regarding the
          Service.
        </p>
        <p className="mt-4">
          We may update these Terms from time to time. Material updates will be
          posted on this page with a revised effective date.
        </p>
      </>
    ),
  },
  {
    title: "Contact Us",
    content: (
      <>
        <p>If you have questions about these Terms, contact us:</p>
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

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      effectiveDate="February 27, 2026"
      sections={sections}
    />
  );
}
