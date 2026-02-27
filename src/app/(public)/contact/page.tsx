import { getContactSettings } from "@/lib/settings";
import ContactPageClient from "./contact-page-client";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const contact = await getContactSettings();

  return <ContactPageClient contact={contact} />;
}
