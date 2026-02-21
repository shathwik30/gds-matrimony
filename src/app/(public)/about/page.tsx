import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Shield, Users, Award, CheckCircle } from "lucide-react";
import { getPublicStats } from "@/lib/actions/admin";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

function formatStatNumber(num: number): string {
  if (num >= 1000) {
    const k = num / 1000;
    return k % 1 === 0 ? `${k}K+` : `${k.toFixed(1)}K+`;
  }
  return `${num}+`;
}

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about GDS Marriage Links — India's trusted premium matrimonial platform with 15+ years of experience helping families find perfect life partners. Verified profiles, smart matching, and dedicated support for all Indian communities.",
  keywords: [
    "about GDS Marriage Links",
    "Indian matrimonial platform",
    "trusted matrimony service",
    "marriage bureau India",
    "family matchmaking",
    "verified matrimonial profiles",
  ],
  alternates: {
    canonical: "/about",
  },
};

const values = [
  {
    icon: Heart,
    title: "Family First",
    description: "We believe in the sanctity of marriage and prioritize family values in our matchmaking process.",
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description: "Your privacy is our top priority. We ensure complete confidentiality of your personal information.",
  },
  {
    icon: Users,
    title: "Personalized Matching",
    description: "Our smart algorithms help you find matches based on your preferences and compatibility.",
  },
  {
    icon: Award,
    title: "Quality Profiles",
    description: "Every profile is verified to ensure you connect with genuine, serious individuals.",
  },
];

export default async function AboutPage() {
  let statsData = null;
  try {
    const statsResult = await getPublicStats();
    statsData = statsResult.success && statsResult.data ? statsResult.data : null;
  } catch {
    // Continue with fallback values if stats fetch fails
  }

  const stats = [
    { value: statsData ? formatStatNumber(statsData.totalUsers) : "0+", label: "Registered Members" },
    { value: statsData ? formatStatNumber(statsData.happyCouples) : "0+", label: "Successful Marriages" },
    { value: "15+", label: "Years of Trust" },
    { value: statsData ? formatStatNumber(statsData.verifiedProfiles) : "0+", label: "Verified Profiles" },
  ];

  return (
    <div className="min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "About Us", href: "/about" },
        ]}
      />
      {/* Hero Section */}
      <section className="bg-brand-light py-10 sm:py-16 md:py-24">
        <div className="container-wide px-4 sm:px-6 md:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 tracking-tight">
              About GDS Marriage Links
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
              For over 15 years, we have been helping families find perfect matches
              through our trusted platform. Our commitment to quality, privacy, and
              personalized service has made us one of India&apos;s most trusted
              matrimonial services.
            </p>
            <Button size="lg" asChild className="shadow-premium-sm hover:shadow-premium-md">
              <Link href="/register">Join Our Community</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12 border-b">
        <div className="container-wide px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className={`text-center animate-fade-in-up stagger-${index + 1}`}>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand">{stat.value}</p>
                <p className="text-muted-foreground mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-10 sm:py-16 md:py-24">
        <div className="container-wide px-4 sm:px-6 md:px-8">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  GDS Marriage Links was founded with a simple yet powerful vision:
                  to help Indian families find suitable life partners for their loved
                  ones through a trusted, modern platform.
                </p>
                <p>
                  What started as a community initiative has grown into one of
                  India&apos;s most respected matrimonial services. Our journey has been
                  guided by the traditional values of trust, respect, and family
                  while embracing modern technology to make the matchmaking process
                  more efficient and effective.
                </p>
                <p>
                  Today, we serve families across India and the global Indian
                  diaspora, helping them find matches that align with their values,
                  traditions, and aspirations.
                </p>
              </div>
            </div>
            <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden">
              <Image
                src="/images/about2.jpg"
                alt="Indian couple celebrating their marriage found through GDS Marriage Links"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-10 sm:py-16 md:py-24 bg-muted/50">
        <div className="container-wide px-4 sm:px-6 md:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These core values guide everything we do at GDS Marriage Links
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {values.map((value, index) => (
              <Card key={index} variant="elevated" className={`group animate-fade-in-up stagger-${index + 1}`}>
                <CardContent className="pt-6 text-center">
                  <div className="h-14 w-14 rounded-xl bg-brand-light flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-premium-sm">
                    <value.icon className="h-7 w-7 text-brand" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-10 sm:py-16 md:py-24">
        <div className="container-wide px-4 sm:px-6 md:px-8">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            <div className="order-2 md:order-1 relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden">
              <Image
                src="/images/about1.jpg"
                alt="Why choose GDS Marriage Links for matrimonial matchmaking"
                fill
                className="object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">Why Choose Us?</h2>
              <ul className="space-y-4">
                {[
                  "Verified profiles with identity checks",
                  "Smart matching based on preferences",
                  "Privacy controls you can trust",
                  "Dedicated customer support",
                  "Mobile-friendly experience",
                  "Affordable premium plans",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8" asChild>
                <Link href="/register">Get Started Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 sm:py-16 md:py-24 bg-brand text-white">
        <div className="container-wide text-center px-4 sm:px-6 md:px-8">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-3 sm:mb-4">
            Ready to Find Your Perfect Match?
          </h2>
          <p className="text-base sm:text-lg text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of families who have found their perfect match through
            GDS Marriage Links.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">Register Free Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
