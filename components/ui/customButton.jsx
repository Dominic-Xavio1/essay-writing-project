"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

const variantStyles = {
  accent: "bg-accent text-primary-foreground hover:bg-accent/90 shadow-sm",
  green: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
};

const sizeStyles = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-5 py-2 text-sm font-semibold rounded-lg",
  lg: "h-12 px-7 text-base font-bold rounded-xl",
  icon: "h-10 w-10 p-2 justify-center rounded-lg",
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