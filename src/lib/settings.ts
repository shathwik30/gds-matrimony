import "server-only";

import { cache } from "react";
import { db, siteSettings } from "@/lib/db";
import { SITE_CONFIG } from "@/constants";

/**
 * Fetch all public site settings from the database.
 * Cached per-request via React's `cache()` to deduplicate DB queries.
 */
export const getPublicSiteSettings = cache(async () => {
  try {
    const settings = await db.select().from(siteSettings);
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    return settingsMap;
  } catch (error) {
    console.error("Failed to fetch public site settings:", error);
    return {};
  }
});

/**
 * Get contact-related settings with SITE_CONFIG fallbacks.
 */
export async function getContactSettings() {
  const settings = await getPublicSiteSettings();
  const phone = settings.supportPhone || SITE_CONFIG.phone;
  return {
    supportEmail: settings.supportEmail || SITE_CONFIG.supportEmail,
    phone,
    phoneHref: settings.supportPhone
      ? `tel:${settings.supportPhone.replace(/[\s-]/g, "")}`
      : SITE_CONFIG.phoneHref,
    address: settings.address || SITE_CONFIG.address,
    workingHours: settings.workingHours || SITE_CONFIG.workingHours,
    siteName: settings.siteName || SITE_CONFIG.name,
    siteUrl: settings.siteUrl || SITE_CONFIG.url,
  };
}
