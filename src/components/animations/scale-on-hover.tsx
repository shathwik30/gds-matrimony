"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScaleOnHoverProps {
  children: ReactNode;
  className?: string;
  scale?: number;
}

/**
 * Wrapper that scales its children on hover using framer-motion spring physics.
 *
 * @example
 * <ScaleOnHover scale={1.1}>
 *   <Card>Hover me</Card>
 * </ScaleOnHover>
 */
export function ScaleOnHover({ children, className, scale = 1.05 }: ScaleOnHoverProps) {
  return (
    <motion.div
      className={cn(className)}
      whileHover={{ scale, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Interactive card wrapper with hover lift effect using framer-motion.
 *
 * @example
 * <InteractiveCard>
 *   <Card>Content</Card>
 * </InteractiveCard>
 */
export function InteractiveCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={cn("cursor-pointer", className)}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
      whileTap={{ y: 0, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Button-like wrapper with press effect using framer-motion.
 *
 * @example
 * <PressEffect>
 *   <div>Click me</div>
 * </PressEffect>
 */
export function PressEffect({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={cn("cursor-pointer select-none", className)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}
