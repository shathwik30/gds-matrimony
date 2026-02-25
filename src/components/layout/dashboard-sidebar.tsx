"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Heart,
  MessageSquare,
  User,
  Bookmark,
  Crown,
  Settings,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import { logoutUser } from "@/lib/actions/auth";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/matches", label: "Matches", icon: Users },
  { href: "/interests", label: "Interests", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/shortlist", label: "Shortlist", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/membership", label: "Membership", icon: Crown },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <aside className="hidden w-[260px] shrink-0 lg:block">
      <div className="bg-background sticky top-20 flex h-[calc(100vh-5rem)] flex-col border-r">
        <div className="border-b p-6">
          <div className="flex items-center gap-3">
            <Avatar className="ring-primary/10 h-11 w-11 ring-2">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {getInitials(
                  session?.user?.name?.split(" ")[0],
                  session?.user?.name?.split(" ")[1]
                )}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{session?.user?.name || "User"}</p>
              <p className="text-muted-foreground truncate text-xs">{session?.user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <link.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
