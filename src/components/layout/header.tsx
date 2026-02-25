"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Heart,
  MessageSquare,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logoutUser } from "@/lib/actions/auth";
import { getInitials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/matches", label: "Matches", icon: Users },
  { href: "/interests", label: "Interests", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

const publicNavItems = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <header
      className={`transition-smooth sticky top-0 z-50 w-full border-b ${
        scrolled
          ? "bg-background/90 shadow-premium-md backdrop-blur-xl"
          : "bg-background/95 shadow-premium-sm backdrop-blur-lg"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="container-wide flex h-16 items-center justify-between md:h-20">
        <Link href="/" className="group flex shrink-0 items-center gap-2 md:gap-3">
          <Image
            src="/images/logo.svg"
            alt="GDS Marriage Links"
            width={120}
            height={77}
            unoptimized
            className="h-10 w-auto transition-transform group-hover:scale-110 md:h-14"
          />
          <span className="group-hover:text-primary hidden text-lg font-semibold transition-colors sm:inline-block md:text-xl">
            GDS Marriage Links
          </span>
        </Link>

        {status === "authenticated" && session?.user ? (
          <nav className="hidden items-center gap-1 md:flex lg:gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group text-muted-foreground hover:text-foreground hover:bg-muted/50 relative flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors lg:px-3"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        ) : (
          <nav className="hidden items-center gap-6 md:flex">
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 md:gap-4">
          {status === "loading" ? (
            <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
          ) : status === "authenticated" && session?.user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hover:ring-primary/20 relative h-9 w-9 rounded-full ring-2 ring-transparent transition-all md:h-12 md:w-12"
                  >
                    <Avatar className="h-9 w-9 md:h-12 md:w-12">
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold md:text-sm">
                        {getInitials(
                          session.user.name?.split(" ")[0],
                          session.user.name?.split(" ")[1]
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="shadow-premium-lg w-64" align="end">
                  <div className="flex items-center justify-start gap-3 p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {getInitials(
                          session.user.name?.split(" ")[0],
                          session.user.name?.split(" ")[1]
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none">
                      {session.user.name && <p className="font-semibold">{session.user.name}</p>}
                      <p className="text-muted-foreground w-[180px] truncate text-xs">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="shadow-premium-sm hover:shadow-premium-md text-sm"
              >
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {mobileMenuOpen && status !== "authenticated" && (
        <div className="bg-background/95 animate-fade-in border-t backdrop-blur-xl md:hidden">
          <nav className="flex flex-col space-y-1 p-4">
            {publicNavItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`hover:bg-muted transition-smooth flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium stagger-${index + 1} animate-slide-in-right`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
