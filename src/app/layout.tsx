import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SkipToContent } from "@/components/accessibility/skip-to-content";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://gdsmarriagelinks.com"),
  title: {
    default: "GDS Marriage Links - India's Trusted Premium Matrimonial Platform",
    template: "%s | GDS Marriage Links",
  },
  description:
    "Find your perfect life partner on GDS Marriage Links. India's trusted premium matrimonial platform with verified profiles, smart matching, strong privacy, and family-friendly matchmaking for all communities.",
  keywords: [
    "matrimony",
    "marriage",
    "Indian matrimonial",
    "shaadi",
    "life partner",
    "verified profiles",
    "premium matrimonial",
    "Hindu matrimony",
    "Muslim matrimony",
    "Christian matrimony",
    "Sikh matrimony",
    "Jain matrimony",
    "matrimonial site India",
    "marriage bureau Mumbai",
    "matchmaking India",
    "bride groom search",
    "NRI matrimony",
    "free matrimonial registration",
    "trusted matrimony site",
    "family matchmaking",
    "Indian wedding",
    "marriage partner search",
    "online matrimony India",
    "verified matrimonial profiles",
    "GDS Marriage Links",
    "privacy first matrimony",
  ],
  authors: [{ name: "GDS Marriage Links" }],
  creator: "GDS Marriage Links",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://gdsmarriagelinks.com",
    siteName: "GDS Marriage Links",
    title: "GDS Marriage Links - India's Trusted Premium Matrimonial Platform",
    description:
      "Find your perfect life partner on GDS Marriage Links. Verified profiles, smart matching, strong privacy, and family-friendly matchmaking for all Indian communities.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "GDS Marriage Links - India's Trusted Premium Matrimonial Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GDS Marriage Links - India's Trusted Premium Matrimonial Platform",
    description:
      "Find your perfect life partner on GDS Marriage Links. Verified profiles, smart matching, strong privacy, and family-friendly matchmaking.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  manifest: "/manifest.json",
  icons: {
    icon: { url: "/images/logo1.svg", type: "image/svg+xml" },
    apple: "/images/logo1.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#C00F0C" },
    { media: "(prefers-color-scheme: dark)", color: "#C00F0C" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfairDisplay.variable} font-sans antialiased`}>
        <GoogleAnalytics gaId="G-X95W9F1N6B" />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <SkipToContent />
        <Providers>
          {children}
          <BottomNavigation />
        </Providers>
      </body>
    </html>
  );
}
