import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SkipToContent } from "@/components/accessibility/skip-to-content";

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
    default: "GDS Marriage Links - Premium Matrimonial Platform",
    template: "%s | GDS Marriage Links",
  },
  description:
    "Find your perfect life partner on GDS Marriage Links. A premium matrimonial platform designed for Indians seeking serious marriage relationships with verified profiles and strong privacy.",
  keywords: [
    "matrimony",
    "marriage",
    "Indian matrimonial",
    "shaadi",
    "life partner",
    "verified profiles",
    "premium matrimonial",
  ],
  authors: [{ name: "GDS Marriage Links" }],
  creator: "GDS Marriage Links",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://gdsmarriagelinks.com",
    siteName: "GDS Marriage Links",
    title: "GDS Marriage Links - Premium Matrimonial Platform",
    description:
      "Find your perfect life partner on GDS Marriage Links. Verified profiles, strong privacy, and family-friendly matchmaking.",
    images: [
      {
        url: "/images/logo.png",
        width: 94,
        height: 60,
        alt: "GDS Marriage Links",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "GDS Marriage Links - Premium Matrimonial Platform",
    description:
      "Find your perfect life partner on GDS Marriage Links. Verified profiles, strong privacy, and family-friendly matchmaking.",
    images: ["/images/logo.png"],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfairDisplay.variable} font-sans antialiased`}>
        <SkipToContent />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
