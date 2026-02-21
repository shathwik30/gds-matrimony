import { SITE_CONFIG, SUBSCRIPTION_PLANS, GST_RATE } from "@/constants";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gdsmarriagelinks.com";

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  const socialLinks = [
    SITE_CONFIG.social.facebook,
    SITE_CONFIG.social.instagram,
    SITE_CONFIG.social.twitter,
    SITE_CONFIG.social.linkedin,
  ].filter(Boolean);

  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "GDS Marriage Links",
        url: SITE_URL,
        logo: `${SITE_URL}/images/logo.png`,
        description:
          "India's trusted premium matrimonial platform helping families find perfect life partners with verified profiles, strong privacy, and smart matching.",
        contactPoint: {
          "@type": "ContactPoint",
          telephone: SITE_CONFIG.phone,
          contactType: "customer service",
          email: SITE_CONFIG.supportEmail,
          areaServed: "IN",
          availableLanguage: ["English", "Hindi"],
        },
        ...(socialLinks.length > 0 && { sameAs: socialLinks }),
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "GDS Marriage Links",
        url: SITE_URL,
        description:
          "Premium Indian matrimonial platform with verified profiles, smart matching, and privacy-first approach for serious marriage seekers.",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/dashboard/matches?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

export function LocalBusinessJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": `${SITE_URL}/#business`,
        name: "GDS Marriage Links",
        image: `${SITE_URL}/images/logo.png`,
        url: SITE_URL,
        telephone: SITE_CONFIG.phone,
        email: SITE_CONFIG.supportEmail,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Mumbai",
          addressRegion: "Maharashtra",
          addressCountry: "IN",
        },
        openingHours: "Mo-Sa 09:00-18:00",
        priceRange: "$$",
        description:
          "Premium matrimonial services for Indian families. Verified profiles, smart matchmaking, and dedicated support for finding your perfect life partner.",
      }}
    />
  );
}

export function MatrimonialServiceJsonLd() {
  const offers = SUBSCRIPTION_PLANS.map((plan) => ({
    "@type": "Offer",
    name: `${plan.name} Plan`,
    price: Math.round(plan.price * (1 + GST_RATE)),
    priceCurrency: "INR",
    description: `${plan.duration} month${plan.duration > 1 ? "s" : ""} membership — ${
      plan.features.interestsPerDay >= 9999 ? "unlimited" : plan.features.interestsPerDay
    } interests/day, ${
      plan.features.contactViews >= 9999 ? "unlimited" : plan.features.contactViews
    } contact views`,
    availability: "https://schema.org/InStock",
  }));

  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name: "GDS Marriage Links Matrimonial Service",
        provider: {
          "@type": "Organization",
          name: "GDS Marriage Links",
        },
        serviceType: "Matrimonial Service",
        areaServed: {
          "@type": "Country",
          name: "India",
        },
        description:
          "Premium Indian matrimonial platform offering verified profiles, AI-powered smart matching, real-time messaging, and privacy-first approach. Serving Hindu, Muslim, Christian, Sikh, Jain, and other communities across all Indian states.",
        offers,
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${SITE_URL}${item.href}`,
        })),
      }}
    />
  );
}

export function FAQJsonLd({
  questions,
}: {
  questions: { question: string; answer: string }[];
}) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: q.answer,
          },
        })),
      }}
    />
  );
}
