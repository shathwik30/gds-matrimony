import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Shield,
  Heart,
  Users,
  Lock,
  CheckCircle,
  Star,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { getPublicStats } from "@/lib/actions/admin";

function formatStatNumber(num: number): string {
  if (num >= 1000) {
    const k = num / 1000;
    return k % 1 === 0 ? `${k}K+` : `${k.toFixed(1)}K+`;
  }
  return `${num}+`;
}

const features = [
  {
    icon: Shield,
    title: "Verified Profiles",
    description:
      "Every profile goes through a verification process ensuring authentic and genuine users.",
  },
  {
    icon: Lock,
    title: "Strong Privacy",
    description:
      "Control who sees your information with advanced privacy settings and photo protection.",
  },
  {
    icon: Users,
    title: "Family Friendly",
    description:
      "Create profiles for yourself or family members with dedicated registration options.",
  },
  {
    icon: Heart,
    title: "Smart Matching",
    description:
      "Our compatibility algorithm finds matches based on your preferences and values.",
  },
];

const testimonials = [
  {
    name: "Priya & Rahul",
    location: "Mumbai",
    image: "/images/1.jpg",
    text: "We found each other on GDS Marriage Links and knew it was meant to be. The platform made it easy to connect with verified profiles.",
  },
  {
    name: "Anita & Vikram",
    location: "Delhi",
    image: "/images/2.jpg",
    text: "The family-friendly approach of GDS Marriage Links helped our parents feel comfortable throughout the process.",
  },
  {
    name: "Meera & Arun",
    location: "Bangalore",
    image: "/images/3.jpg",
    text: "Privacy was our top concern, and GDS Marriage Links delivered exactly what we needed. Thank you for helping us find love!",
  },
];

export default async function HomePage() {
  let statsData = null;
  try {
    const statsResult = await getPublicStats();
    statsData = statsResult.success && statsResult.data ? statsResult.data : null;
  } catch {
    // Continue with fallback values if stats fetch fails
  }

  const stats = [
    { value: statsData ? formatStatNumber(statsData.totalUsers) : "0+", label: "Registered Users" },
    { value: statsData ? formatStatNumber(statsData.verifiedProfiles) : "0+", label: "Verified Profiles" },
    { value: statsData ? formatStatNumber(statsData.happyCouples) : "0+", label: "Happy Couples" },
    { value: "98%", label: "Satisfaction Rate" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-light via-white to-brand-light/50 min-h-[80vh] md:min-h-[90vh]">
          {/* Background image collage grid */}
          <div className="absolute inset-0 z-0 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 auto-rows-fr gap-1">
            {[
              "/images/1.jpg",
              "/images/2.jpg",
              "/images/slider1.jpg",
              "/images/3.jpg",
              "/images/about2.jpg",
              "/images/4.jpg",
              "/images/5.jpg",
              "/images/6.jpg",
              "/images/slider4.jpg",
              "/images/7.jpg",
              "/images/9.jpg",
              "/images/about1.jpg",
              "/images/1.jpg",
              "/images/3.jpg",
              "/images/2.jpg",
            ].map((src, i) => (
              <div key={i} className="relative overflow-hidden">
                <Image src={src} alt="" fill className="object-cover" sizes="20vw" />
              </div>
            ))}
          </div>
          {/* Overlay to make content readable */}
          <div className="absolute inset-0 z-[1] bg-white/85" />

          <div className="container-wide py-12 sm:py-20 md:py-28 lg:py-36 relative z-[2]">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-5 sm:space-y-8 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm shadow-premium-md hover:shadow-premium-lg transition-smooth">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />
                  <span className="font-semibold">India&apos;s Trusted Matrimonial Platform</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
                  Find Your Perfect{" "}
                  <span className="text-brand block mt-2">Life Partner</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                  Join thousands of verified profiles seeking serious marriage relationships.
                  Experience privacy-first matchmaking designed for Indian families.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="xl" asChild className="shadow-premium-lg hover:shadow-premium-xl group">
                    <Link href="/register">
                      Register Free
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild className="hover:border-primary">
                    <Link href="/login">Already a Member? Login</Link>
                  </Button>
                </div>
                <div className="flex items-center gap-4 sm:gap-6 pt-2">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-9 w-9 sm:h-12 sm:w-12 rounded-full border-3 border-white bg-muted overflow-hidden shadow-premium-sm hover:scale-110 transition-transform"
                      >
                        <Image
                          src={`/images/${i}.jpg`}
                          alt="User"
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-base">
                    <span className="font-bold text-lg">10,000+</span>{" "}
                    <span className="text-muted-foreground">happy members</span>
                  </div>
                </div>
              </div>
              <div className="relative hidden lg:block animate-fade-in stagger-2">
                <div className="relative aspect-square max-w-lg ml-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-3xl" />
                  <Image
                    src="/images/about1.jpg"
                    alt="Happy couple"
                    fill
                    className="object-cover rounded-2xl shadow-premium-2xl relative z-10"
                    priority
                  />
                  <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-premium-xl p-5 z-20 animate-bounce-subtle">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center">
                        <CheckCircle className="h-7 w-7 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">100% Verified</p>
                        <p className="text-sm text-muted-foreground">All profiles verified</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
          <div className="container-wide py-10 md:py-16 relative">
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8 md:grid-cols-4">
              {stats.map((stat, index) => (
                <div key={stat.label} className={`text-center group animate-fade-in-up stagger-${index + 1}`}>
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-brand group-hover:scale-110 transition-transform">
                    {stat.value}
                  </div>
                  <div className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base font-medium text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 md:py-28">
          <div className="container-wide">
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 tracking-tight">
                Why Choose GDS Marriage Links?
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                We understand the importance of finding the right life partner.
                Our platform is designed with your needs in mind.
              </p>
            </div>
            <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card key={feature.title} variant="elevated" className={`group animate-fade-in-up stagger-${index + 1}`}>
                  <CardContent className="p-4 sm:p-5 md:p-7">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-3 sm:mb-5 group-hover:scale-110 transition-transform shadow-premium-sm">
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-2 sm:mb-3">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12 sm:py-16 md:py-28 bg-gradient-to-b from-muted/30 to-muted/60">
          <div className="container-wide">
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 tracking-tight">How It Works</h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                Finding your life partner is simple with our easy 4-step process.
              </p>
            </div>
            <div className="grid gap-6 sm:gap-8 md:gap-10 grid-cols-2 md:grid-cols-4 relative">
              {/* Connection line - desktop only */}
              <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

              {[
                { step: 1, title: "Register", desc: "Create your free account in minutes" },
                { step: 2, title: "Build Profile", desc: "Add details and upload photos" },
                { step: 3, title: "Find Matches", desc: "Browse verified profiles" },
                { step: 4, title: "Connect", desc: "Send interests and start chatting" },
              ].map((item, index) => (
                <div key={item.step} className={`text-center relative animate-fade-in-up stagger-${index + 1}`}>
                  <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white text-xl sm:text-2xl md:text-3xl font-bold flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-premium-lg hover:scale-110 transition-transform relative z-10">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-lg mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-12 sm:py-16 md:py-28">
          <div className="container-wide">
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 tracking-tight">Success Stories</h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                Hear from couples who found their perfect match on GDS Marriage Links.
              </p>
            </div>
            <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card key={testimonial.name} variant="elevated" className={`group animate-fade-in-up stagger-${index + 1}`}>
                  <CardContent className="p-4 sm:p-5 md:p-7">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full overflow-hidden ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all shrink-0">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {testimonial.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed italic">
                      &ldquo;{testimonial.text}&rdquo;
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-14 sm:py-20 md:py-32 bg-gradient-to-br from-primary via-primary to-primary/90 text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>

          <div className="container-wide text-center relative z-10">
            <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6 tracking-tight leading-tight">
                Ready to Find Your Life Partner?
              </h2>
              <p className="text-base sm:text-lg md:text-xl opacity-95 max-w-3xl mx-auto leading-relaxed">
                Join thousands of verified members and start your journey towards
                a happy married life today.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4">
                <Button size="xl" variant="secondary" asChild className="shadow-premium-xl hover:shadow-premium-2xl group bg-white text-primary hover:bg-white/95">
                  <Link href="/register">
                    Create Free Profile
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-primary transition-smooth backdrop-blur-sm"
                  asChild
                >
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
