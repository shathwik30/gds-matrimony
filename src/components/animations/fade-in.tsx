"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number; // delay in seconds
  duration?: number; // duration in seconds
  direction?: "up" | "down" | "left" | "right" | "none";
  triggerOnce?: boolean;
}

const directionOffset = {
  up: { y: 20, x: 0 },
  down: { y: -20, x: 0 },
  left: { y: 0, x: 20 },
  right: { y: 0, x: -20 },
  none: { y: 0, x: 0 },
};

/**
 * Component that fades in its children with optional directional slide.
 * Uses framer-motion with IntersectionObserver (viewport trigger).
 *
 * @example
 * <FadeIn direction="up" delay={0.1}>
 *   <Card>Content</Card>
 * </FadeIn>
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.3,
  direction = "up",
  triggerOnce = true,
}: FadeInProps) {
  const offset = directionOffset[direction];

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: triggerOnce, margin: "50px" }}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Simpler fade-in that triggers on mount (not scroll position).
 *
 * @example
 * <FadeInSimple delay={0.2}>
 *   <div>Content</div>
 * </FadeInSimple>
 */
export function FadeInSimple({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
