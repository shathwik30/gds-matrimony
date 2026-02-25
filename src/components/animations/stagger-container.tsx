"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  animation?: "fade-in" | "fade-in-up" | "slide-in-right" | "slide-in-left" | "scale-in";
}

const animationVariants = {
  hidden: (animation: string) => {
    switch (animation) {
      case "fade-in-up":
        return { opacity: 0, y: 20 };
      case "slide-in-right":
        return { opacity: 0, x: 20 };
      case "slide-in-left":
        return { opacity: 0, x: -20 };
      case "scale-in":
        return { opacity: 0, scale: 0.95 };
      default:
        return { opacity: 0 };
    }
  },
  visible: { opacity: 1, y: 0, x: 0, scale: 1 },
};

const containerVariants = (staggerDelay: number) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.05,
  animation = "fade-in-up",
}: StaggerContainerProps) {
  return (
    <motion.div
      className={cn("grid gap-6", className)}
      variants={containerVariants(staggerDelay)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "50px" }}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: animationVariants.hidden(animation),
                visible: animationVariants.visible,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}
