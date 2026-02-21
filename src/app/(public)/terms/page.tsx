import { Metadata } from "next";
import { SITE_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: "Terms of Service - GDS Marriage Links",
  description: "Read the terms and conditions for using GDS Marriage Links matrimonial services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-brand-light py-12 md:py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto prose prose-slate">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using GDS Marriage Links (&quot;the Service&quot;), you agree
              to be bound by these Terms of Service. If you do not agree to these
              terms, please do not use our services.
            </p>

            <h2>2. Eligibility</h2>
            <p>To use our services, you must:</p>
            <ul>
              <li>Be at least 18 years of age</li>
              <li>Be legally permitted to marry under applicable laws</li>
              <li>Not be currently married (unless legally separated)</li>
              <li>Create only one account for yourself</li>
              <li>Provide accurate and truthful information</li>
            </ul>

            <h2>3. Account Registration</h2>
            <h3>3.1 Account Creation</h3>
            <p>
              You must register for an account to access our matchmaking services.
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities under your account.
            </p>

            <h3>3.2 Profile Information</h3>
            <p>
              You agree to provide accurate, current, and complete information
              during registration and to update such information to keep it
              accurate. Misrepresentation of identity or information may result
              in account termination.
            </p>

            <h2>4. User Conduct</h2>
            <p>You agree NOT to:</p>
            <ul>
              <li>Use the service for any illegal purpose</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Upload offensive, obscene, or inappropriate material</li>
              <li>Attempt to access other users&apos; accounts</li>
              <li>Use automated tools to access the service</li>
              <li>Collect user information for commercial purposes</li>
              <li>Transmit viruses or malicious code</li>
              <li>Circumvent security measures</li>
            </ul>

            <h2>5. Content Guidelines</h2>
            <h3>5.1 Your Content</h3>
            <p>
              You retain ownership of content you upload. By posting content, you
              grant us a non-exclusive, worldwide license to use, display, and
              distribute your content for operating the service.
            </p>

            <h3>5.2 Prohibited Content</h3>
            <p>The following content is prohibited:</p>
            <ul>
              <li>Explicit or adult content</li>
              <li>Copyrighted material without authorization</li>
              <li>Content promoting discrimination or hate</li>
              <li>Spam or commercial solicitations</li>
              <li>False or misleading information</li>
            </ul>

            <h2>6. Subscription and Payments</h2>
            <h3>6.1 Premium Services</h3>
            <p>
              We offer premium subscription plans with enhanced features. Payment
              is required upfront for the subscription period chosen.
            </p>

            <h3>6.2 Refund Policy</h3>
            <p>
              Refunds are provided only in cases of technical issues preventing
              service access. Refund requests must be made within 7 days of
              purchase. No refunds are provided for change of mind or unused
              features.
            </p>

            <h3>6.3 Auto-Renewal</h3>
            <p>
              Subscriptions do not auto-renew unless explicitly enabled. You will
              receive a reminder before your subscription expires.
            </p>

            <h2>7. Privacy and Data Protection</h2>
            <p>
              Your use of the service is also governed by our Privacy Policy. By
              using our services, you consent to the collection and use of your
              information as described in our Privacy Policy.
            </p>

            <h2>8. Intellectual Property</h2>
            <p>
              The service and its original content (excluding user content),
              features, and functionality are owned by GDS Marriage Links and are
              protected by copyright, trademark, and other intellectual property
              laws.
            </p>

            <h2>9. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND.
              We do not guarantee:
            </p>
            <ul>
              <li>That you will find a suitable match</li>
              <li>The accuracy of user profiles</li>
              <li>Uninterrupted or error-free service</li>
              <li>The behavior or intentions of other users</li>
            </ul>

            <h2>10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, GDS Marriage Links shall not
              be liable for any indirect, incidental, special, or consequential
              damages arising from your use of the service.
            </p>

            <h2>11. User Verification</h2>
            <p>
              While we encourage profile verification, we cannot guarantee the
              identity or background of all users. You are responsible for your
              own safety when interacting with other users.
            </p>

            <h2>12. Termination</h2>
            <p>
              We may terminate or suspend your account at our discretion for
              violations of these terms. You may also delete your account at any
              time through the settings page.
            </p>

            <h2>13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Material
              changes will be notified via email or prominent notice on the
              platform. Continued use after changes constitutes acceptance.
            </p>

            <h2>14. Governing Law</h2>
            <p>
              These terms shall be governed by the laws of India. Any disputes
              shall be subject to the exclusive jurisdiction of the courts in
              Mumbai, Maharashtra.
            </p>

            <h2>15. Contact Information</h2>
            <p>For questions about these Terms, please contact us at:</p>
            <ul>
              <li>Email: {SITE_CONFIG.legalEmail}</li>
              <li>Phone: {SITE_CONFIG.phone}</li>
              <li>Address: {SITE_CONFIG.address}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
