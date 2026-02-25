"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Users, Heart, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/matches", label: "Matches", icon: Users },
  { href: "/interests", label: "Interests", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const { status } = useSession();

  if (status !== "authenticated" || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      className="bg-background/80 fixed right-0 bottom-0 left-0 z-50 border-t backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-center justify-around px-1">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex h-full min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 transition-transform active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon
                className={cn("h-5 w-5 transition-transform", isActive && "scale-110")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[11px] leading-tight",
                  isActive ? "font-semibold" : "font-medium"
                )}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="bg-primary absolute bottom-[calc(env(safe-area-inset-bottom)+2px)] h-1 w-1 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
