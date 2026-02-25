import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Shield, Heart, Users, Lock, CheckCircle, Star, ArrowRight, MapPin } from "lucide-react";
import { getPublicStats } from "@/lib/actions/admin";
import {
  LocalBusinessJsonLd,
  MatrimonialServiceJsonLd,
  BreadcrumbJsonLd,
} from "@/components/seo/json-ld";
import { formatStatNumber } from "@/lib/utils";

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
    description: "Our compatibility algorithm finds matches based on your preferences and values.",
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
    {
      value: statsData ? formatStatNumber(statsData.verifiedProfiles) : "0+",
      label: "Verified Profiles",
    },
    { value: statsData ? formatStatNumber(statsData.happyCouples) : "0+", label: "Happy Couples" },
    { value: "98%", label: "Satisfaction Rate" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <LocalBusinessJsonLd />
      <MatrimonialServiceJsonLd />
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }]} />
      <Header />

      <main className="flex-1">
        <section className="from-brand-light to-brand-light/50 relative min-h-[80vh] overflow-hidden bg-gradient-to-br via-white md:min-h-[90vh]">
          <div className="absolute inset-0 z-0 grid auto-rows-fr grid-cols-3 gap-1 md:grid-cols-4 lg:grid-cols-5">
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
          <div className="bg-background/85 absolute inset-0 z-[1]" />

          <div className="container-wide relative z-[2] py-12 sm:py-20 md:py-28 lg:py-36">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div className="animate-fade-in-up space-y-5 sm:space-y-8">
                <div className="bg-card shadow-premium-md hover:shadow-premium-lg transition-smooth inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm">
                  <Star className="h-4 w-4 animate-pulse fill-amber-500 text-amber-500" />
                  <span className="font-semibold">India&apos;s Trusted Matrimonial Platform</span>
                </div>
                <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  Find Your Perfect <span className="text-brand mt-2 block">Life Partner</span>
                </h1>
                <p className="text-muted-foreground max-w-lg text-base leading-relaxed sm:text-lg md:text-xl">
                  Join thousands of verified profiles seeking serious marriage relationships.
                  Experience privacy-first matchmaking designed for Indian families.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button
                    size="xl"
                    asChild
                    className="shadow-premium-lg hover:shadow-premium-xl group"
                  >
                    <Link href="/register">
                      Register Free
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild className="hover:border-primary">
                    <Link href="/login">Already a Member? Login</Link>
                  </Button>
                </div>
                <div className="flex items-center gap-4 pt-2 sm:gap-6">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-muted shadow-premium-sm h-9 w-9 overflow-hidden rounded-full border-3 border-white transition-transform hover:scale-110 sm:h-12 sm:w-12"
                      >
                        <Image
                          src={`/images/${i}.jpg`}
                          alt="GDS Marriage Links member"
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-base">
                    <span className="text-lg font-bold">10,000+</span>{" "}
                    <span className="text-muted-foreground">happy members</span>
                  </div>
                </div>
              </div>
              <div className="animate-fade-in stagger-2 relative hidden lg:block">
                <div className="relative ml-auto aspect-square max-w-lg">
                  <div className="from-primary/20 absolute inset-0 rounded-2xl bg-gradient-to-br to-transparent blur-3xl" />
                  <Image
                    src="/images/about1.jpg"
                    alt="Happy Indian couple who found their match on GDS Marriage Links matrimonial platform"
                    fill
                    className="shadow-premium-2xl relative z-10 rounded-2xl object-cover"
                    priority
                  />
                  <div className="bg-card shadow-premium-xl animate-bounce-subtle absolute -bottom-6 -left-6 z-20 rounded-2xl p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                        <CheckCircle className="h-7 w-7 text-green-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold">100% Verified</p>
                        <p className="text-muted-foreground text-sm">All profiles verified</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card relative overflow-hidden border-y">
          <div className="from-primary/5 to-primary/5 absolute inset-0 bg-gradient-to-r via-transparent" />
          <div className="container-wide relative py-10 md:py-16">
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 md:gap-8">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`group animate-fade-in-up text-center stagger-${index + 1}`}
                >
                  <div className="text-brand text-2xl font-bold transition-transform group-hover:scale-110 sm:text-3xl md:text-4xl lg:text-5xl">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs font-medium sm:mt-2 sm:text-sm md:text-base">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 md:py-28">
          <div className="container-wide">
            <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12 md:mb-16">
              <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl">
                Why Choose GDS Marriage Links?
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed sm:text-base md:text-lg">
                We understand the importance of finding the right life partner. Our platform is
                designed with your needs in mind.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card
                  key={feature.title}
                  variant="elevated"
                  className={`group animate-fade-in-up stagger-${index + 1}`}
                >
                  <CardContent className="p-4 sm:p-5 md:p-7">
                    <div className="from-primary/20 to-primary/10 shadow-premium-sm mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br transition-transform group-hover:scale-110 sm:mb-5 sm:h-12 sm:w-12 md:h-14 md:w-14">
                      <feature.icon className="text-primary h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                    </div>
                    <h3 className="mb-2 text-sm font-semibold sm:mb-3 sm:text-base md:text-lg">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="from-muted/30 to-muted/60 bg-gradient-to-b py-12 sm:py-16 md:py-28">
          <div className="container-wide">
            <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12 md:mb-16">
              <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl">
                How It Works
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed sm:text-base md:text-lg">
                Finding your life partner is simple with our easy 4-step process.
              </p>
            </div>
            <div className="relative grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4 md:gap-10">
              <div className="from-primary/20 via-primary to-primary/20 absolute top-8 right-0 left-0 hidden h-0.5 bg-gradient-to-r md:block" />

              {[
                { step: 1, title: "Register", desc: "Create your free account in minutes" },
                { step: 2, title: "Build Profile", desc: "Add details and upload photos" },
                { step: 3, title: "Find Matches", desc: "Browse verified profiles" },
                { step: 4, title: "Connect", desc: "Send interests and start chatting" },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className={`animate-fade-in-up relative text-center stagger-${index + 1}`}
                >
                  <div className="from-primary to-primary/80 shadow-premium-lg relative z-10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-xl font-bold text-white transition-transform hover:scale-110 sm:h-16 sm:w-16 sm:text-2xl md:mb-6 md:h-20 md:w-20 md:text-3xl">
                    {item.step}
                  </div>
                  <h3 className="mb-3 text-lg font-bold">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 md:py-28">
          <div className="container-wide">
            <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12 md:mb-16">
              <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl">
                Success Stories
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed sm:text-base md:text-lg">
                Hear from couples who found their perfect match on GDS Marriage Links.
              </p>
            </div>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-3 md:gap-8">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={testimonial.name}
                  variant="elevated"
                  className={`group animate-fade-in-up stagger-${index + 1}`}
                >
                  <CardContent className="p-4 sm:p-5 md:p-7">
                    <div className="mb-4 flex items-center gap-3 sm:mb-6 sm:gap-4">
                      <div className="ring-primary/10 group-hover:ring-primary/30 h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 transition-all sm:h-16 sm:w-16">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-lg font-bold">{testimonial.name}</p>
                        <p className="text-muted-foreground flex items-center gap-1 text-sm">
                          <MapPin className="h-3.5 w-3.5" />
                          {testimonial.location}
                        </p>
                      </div>
                    </div>
                    <div className="mb-4 flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-amber-500 text-amber-500" />
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

        <section className="from-primary via-primary to-primary/90 relative overflow-hidden bg-gradient-to-br py-14 text-white sm:py-20 md:py-32">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-white blur-3xl" />
            <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-white blur-3xl" />
          </div>

          <div className="container-wide relative z-10 text-center">
            <div className="mx-auto max-w-4xl space-y-5 sm:space-y-8">
              <h2 className="mb-4 text-2xl leading-tight font-bold tracking-tight sm:text-3xl md:mb-6 md:text-4xl lg:text-6xl">
                Ready to Find Your Life Partner?
              </h2>
              <p className="mx-auto max-w-3xl text-base leading-relaxed opacity-95 sm:text-lg md:text-xl">
                Join thousands of verified members and start your journey towards a happy married
                life today.
              </p>
              <div className="flex flex-col justify-center gap-5 pt-4 sm:flex-row">
                <Button
                  size="xl"
                  variant="secondary"
                  asChild
                  className="shadow-premium-xl hover:shadow-premium-2xl group text-primary bg-white hover:bg-white/95"
                >
                  <Link href="/register">
                    Create Free Profile
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="hover:text-primary transition-smooth border-2 border-white bg-transparent text-white backdrop-blur-sm hover:bg-white"
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
