"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function SkipToContent({ targetId = "main-content" }: { targetId?: string }) {
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute("tabindex", "-1");
      target.focus();
      target.addEventListener(
        "blur",
        () => {
          target.removeAttribute("tabindex");
        },
        { once: true }
      );
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleSkip}
      className={cn(
        "sr-only focus:not-sr-only",
        "fixed top-4 left-4 z-[100]",
        "bg-primary text-primary-foreground",
        "rounded-lg px-6 py-3",
        "shadow-premium-xl font-semibold",
        "focus-visible:ring-primary/50 focus:outline-none focus-visible:ring-4",
        "transition-smooth"
      )}
    >
      Skip to main content
    </a>
  );
}

export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

export function VisuallyHiddenHeading({
  children,
  level = 2,
}: {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}) {
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  return <Tag className="sr-only">{children}</Tag>;
}
