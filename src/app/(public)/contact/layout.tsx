import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with GDS Marriage Links. Contact our support team for help with your matrimonial profile, membership plans, billing, or technical support. Available Mon-Sat, 9 AM - 6 PM IST.",
  keywords: [
    "contact GDS Marriage Links",
    "matrimonial support",
    "customer service",
    "matrimony help",
    "Mumbai matrimonial office",
  ],
  alternates: {
    canonical: "/contact",
  },
};

const contactFAQs = [
  {
    question: "How do I verify my profile?",
    answer:
      "You can verify your profile by uploading government-issued ID proof in the Settings section. Our team will review and verify within 24-48 hours.",
  },
  {
    question: "How can I upgrade my membership?",
    answer:
      "Go to the Membership section in your dashboard and choose from our Silver, Gold, or Platinum plans. Payment is secure and instant.",
  },
  {
    question: "Can I hide my profile temporarily?",
    answer:
      "Yes, you can hide your profile from the Privacy Settings. Your profile won't appear in search results while hidden.",
  },
  {
    question: "How do I report a suspicious profile?",
    answer:
      "Click the Report button on any profile page or contact our support team. We take all reports seriously and investigate promptly.",
  },
];

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FAQJsonLd questions={contactFAQs} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Contact Us", href: "/contact" },
        ]}
      />
      {children}
    </>
  );
}
