"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Heart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const ALLOWED_PATHS = ["/settings"];

export function MarriedGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isMarried = session?.user?.isMarried;
  const isAllowedPath = ALLOWED_PATHS.some((p) => pathname.startsWith(p));

  if (!isMarried || isAllowedPath) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="mx-auto max-w-lg text-center">
        <div className="bg-brand/10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <Heart className="text-brand h-10 w-10 fill-current" />
        </div>
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Congratulations on Your Marriage!</h1>
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
          Your profile is currently suspended because you marked yourself as married. While married,
          your profile is hidden from other members and browsing is disabled.
        </p>
        <p className="text-muted-foreground mb-8 text-sm">
          If your circumstances have changed, you can reactivate your profile from Settings.
        </p>
        <Button asChild>
          <Link href="/settings?tab=account">
            <Settings className="mr-2 h-4 w-4" />
            Go to Settings
          </Link>
        </Button>
      </div>
    </div>
  );
}
