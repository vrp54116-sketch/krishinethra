"use client";

import * as React from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Liquid glass card entrance stagger variants:
 * Container staggerChildren: 0.05s (50ms)
 * Child: opacity 0→1, y 20px→0
 * Exit: reverse animation when navigating away
 */
export const liquidStaggerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

export const liquidStaggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    transition: {
      duration: 0.22,
      ease: [0.4, 0, 1, 1],
    },
  },
};

export interface LiquidStaggerContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export function LiquidStaggerContainer({
  children,
  className,
  ...props
}: LiquidStaggerContainerProps) {
  return (
    <motion.div
      variants={liquidStaggerContainerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn("w-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export interface LiquidStaggerItemProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export function LiquidStaggerItem({
  children,
  className,
  ...props
}: LiquidStaggerItemProps) {
  return (
    <motion.div
      variants={liquidStaggerItemVariants}
      className={cn("w-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
