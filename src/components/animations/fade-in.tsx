"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
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
