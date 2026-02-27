import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { SITE_CONFIG } from "@/constants";
import { getContactSettings } from "@/lib/settings";

const footerLinks = {
  company: [
    { label: "About Us", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact Us", href: "/contact" },
  ],
  legal: [
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: SITE_CONFIG.social.facebook, label: "Facebook" },
  { icon: Instagram, href: SITE_CONFIG.social.instagram, label: "Instagram" },
  { icon: Twitter, href: SITE_CONFIG.social.twitter, label: "Twitter" },
  { icon: Linkedin, href: SITE_CONFIG.social.linkedin, label: "LinkedIn" },
].filter((link) => link.href);

export async function Footer() {
  const contact = await getContactSettings();

  return (
    <footer className="from-muted/20 to-muted/40 border-t bg-gradient-to-b">
      <div className="container-wide py-10 sm:py-14 md:py-20">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Link href="/" className="group mb-4 flex w-fit items-center gap-2 sm:mb-6 sm:gap-3">
              <Image
                src="/images/logo.svg"
                alt={contact.siteName}
                width={120}
                height={77}
                unoptimized
                className="h-10 w-auto transition-transform group-hover:scale-110 sm:h-14"
              />
              <span className="group-hover:text-primary text-base font-semibold transition-colors sm:text-xl">
                {contact.siteName}
              </span>
            </Link>
            <p className="text-muted-foreground mb-5 max-w-md text-sm leading-relaxed sm:mb-8 sm:text-base">
              A premium matrimonial platform designed for Indians seeking serious marriage
              relationships. Verified profiles, strong privacy, and family-friendly matchmaking.
            </p>
            <div className="space-y-3 text-sm">
              <div className="group flex items-center gap-3">
                <div className="bg-primary/10 group-hover:bg-primary/20 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                  <Mail className="text-primary h-4 w-4" />
                </div>
                <a
                  href={`mailto:${contact.supportEmail}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {contact.supportEmail}
                </a>
              </div>
              <div className="group flex items-center gap-3">
                <div className="bg-primary/10 group-hover:bg-primary/20 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                  <Phone className="text-primary h-4 w-4" />
                </div>
                <a
                  href={contact.phoneHref}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {contact.phone}
                </a>
              </div>
              <div className="group flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <MapPin className="text-primary h-4 w-4" />
                </div>
                <span className="text-muted-foreground">{contact.address}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-base font-semibold sm:mb-6 sm:text-lg">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group text-muted-foreground hover:text-primary relative inline-flex items-center text-sm transition-colors"
                  >
                    <span className="relative">
                      {link.label}
                      <span className="bg-primary absolute -bottom-0.5 left-0 h-px w-0 transition-all group-hover:w-full" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-base font-semibold sm:mb-6 sm:text-lg">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group text-muted-foreground hover:text-primary relative inline-flex items-center text-sm transition-colors"
                  >
                    <span className="relative">
                      {link.label}
                      <span className="bg-primary absolute -bottom-0.5 left-0 h-px w-0 transition-all group-hover:w-full" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="from-primary via-primary to-primary/90 bg-gradient-to-r text-white">
        <div className="container-wide flex flex-col items-center justify-between gap-4 py-4 sm:flex-row sm:py-6">
          <p className="text-center text-xs font-medium sm:text-left sm:text-sm">
            &copy; {new Date().getFullYear()} {contact.siteName}. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-all hover:scale-110 hover:bg-white/20"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
