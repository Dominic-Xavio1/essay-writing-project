"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

const variantStyles = {
  accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_10px_22px_-12px_rgba(249,115,22,0.8)]",
  green: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_10px_22px_-12px_rgba(22,163,74,0.8)]",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
  outline: "border-2 border-border bg-card hover:border-primary/40 hover:text-primary",
  ghost: "hover:bg-secondary hover:text-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
};

const sizeStyles = {
  sm: "h-8 px-3 text-xs font-bold rounded-xl",
  md: "h-10 px-5 py-2 text-sm font-extrabold rounded-2xl",
  lg: "h-12 px-7 text-base font-extrabold rounded-2xl",
  icon: "h-10 w-10 p-2 justify-center rounded-2xl",
};

export default function Button({
  children,
  className = "",
  variant = "accent",
  size = "md",
  href,
  onClick,
  type = "button",
  disabled = false,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none";

  const computedClassName = cn(
    baseClasses,
    variantStyles[variant] || variantStyles.accent,
    sizeStyles[size] || sizeStyles.md,
    className
  );

  const motionProps = {
    whileHover: disabled ? {} : { scale: 1.05, rotate: 1.5, x: 2 },
    whileTap: disabled ? {} : { scale: 0.95, rotate: -1.5, x: -2 },
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
    },
  };

  if (href) {
    return (
      <motion.div {...motionProps} className="inline-block">
        <Link href={href} className={computedClassName} {...props}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={computedClassName}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export { Button };
