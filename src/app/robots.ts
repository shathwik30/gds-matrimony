import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gdsmarriagelinks.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/pricing", "/contact", "/privacy", "/terms"],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "anthropic-ai",
          "Claude-Web",
          "PerplexityBot",
          "Google-Extended",
        ],
        allow: [
          "/",
          "/about",
          "/pricing",
          "/contact",
          "/privacy",
          "/terms",
          "/llms.txt",
          "/llms-full.txt",
        ],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
