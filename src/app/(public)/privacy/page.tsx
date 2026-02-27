import { Metadata } from "next";
import { SITE_CONFIG } from "@/constants";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getPublicSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how GDS Marriage Links collects, uses, and protects your personal information. Your privacy is our top priority.",
  alternates: {
    canonical: "/privacy",
  },
};

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const settings = await getPublicSiteSettings();
  const privacyUpdatedAt = settings.privacyUpdatedAt || "January 2025";
  return (
    <div className="min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Privacy Policy", href: "/privacy" },
        ]}
      />
      <section className="bg-brand-light py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {privacyUpdatedAt}</p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <div className="prose prose-slate mx-auto max-w-3xl">
            <h2>1. Introduction</h2>
            <p>
              GDS Marriage Links (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed
              to protecting your privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our matrimonial services.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>2.1 Personal Information</h3>
            <p>When you register on our platform, we collect:</p>
            <ul>
              <li>Name, email address, and phone number</li>
              <li>Date of birth and gender</li>
              <li>Profile photographs</li>
              <li>Religious and community information</li>
              <li>Educational and professional details</li>
              <li>Family background information</li>
              <li>Partner preferences</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <p>We automatically collect certain information when you use our services:</p>
            <ul>
              <li>Device information (type, operating system)</li>
              <li>IP address and browser type</li>
              <li>Usage data and interaction patterns</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul>
              <li>Create and manage your account</li>
              <li>Provide matchmaking services</li>
              <li>Display your profile to potential matches</li>
              <li>Send notifications about interests and messages</li>
              <li>Process payments for premium services</li>
              <li>Improve our services and user experience</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>4. Information Sharing</h2>
            <h3>4.1 With Other Users</h3>
            <p>
              Your profile information is visible to other registered members based on your privacy
              settings. You control what information is displayed on your profile.
            </p>

            <h3>4.2 With Service Providers</h3>
            <p>
              We may share information with trusted third-party service providers who assist us in
              operating our platform, such as:
            </p>
            <ul>
              <li>Payment processors</li>
              <li>Email service providers</li>
              <li>Cloud hosting services</li>
              <li>Analytics providers</li>
            </ul>

            <h3>4.3 Legal Requirements</h3>
            <p>
              We may disclose information if required by law or in response to valid legal requests
              from public authorities.
            </p>

            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your
              personal information, including:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Employee training on data protection</li>
            </ul>

            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Object to certain processing</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2>7. Cookies</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, remember your
              preferences, and analyze platform usage. You can manage cookie preferences through
              your browser settings.
            </p>

            <h2>8. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed
              to provide services. Upon account deletion, we will delete or anonymize your data
              within 30 days, except where retention is required by law.
            </p>

            <h2>9. Children&apos;s Privacy</h2>
            <p>
              Our services are intended for users aged 18 and above. We do not knowingly collect
              information from children under 18. If you believe we have collected such information,
              please contact us immediately.
            </p>

            <h2>10. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place for such transfers.
            </p>

            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              material changes by posting the new policy on this page and updating the &quot;Last
              updated&quot; date.
            </p>

            <h2>12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact
              us at:
            </p>
            <ul>
              <li>Email: {SITE_CONFIG.privacyEmail}</li>
              <li>Phone: {SITE_CONFIG.phone}</li>
              <li>Address: {SITE_CONFIG.address}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
