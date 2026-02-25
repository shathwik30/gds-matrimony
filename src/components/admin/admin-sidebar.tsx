"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Shield,
  AlertTriangle,
  Mail,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/actions/auth";

const sidebarItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/create-user", label: "Create User", icon: UserPlus },
  { href: "/admin/verifications", label: "Verifications", icon: Shield },
  { href: "/admin/reports", label: "Reports", icon: AlertTriangle },
  { href: "/admin/contact-submissions", label: "Contact Submissions", icon: Mail },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="bg-brand flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white">
            G
          </div>
          <span className="font-semibold">Admin Panel</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-700 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
