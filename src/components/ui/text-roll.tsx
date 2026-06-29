"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const STAGGER = 0.035;

interface TextRollProps {
  children?: React.ReactNode;
  text?: string;
  className?: string;
  center?: boolean;
  hovered?: boolean;
}

const TextRoll: React.FC<TextRollProps> = ({
  children,
  text: textProp,
  className,
  center = false,
  hovered = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const text = textProp || (typeof children === "string" ? children : "");

  if (!text) {
    return <span className={className}>{children}</span>;
  }

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <motion.span
      initial="initial"
      animate={hovered ? "hovered" : "initial"}
      className={cn("relative block overflow-hidden", className)}
      style={{ lineHeight: 0.85 }}
    >
      {/* Top text — slides up on hover */}
      <div>
        {text.split("").map((l, i) => {
          const delay = center
            ? STAGGER * Math.abs(i - (text.length - 1) / 2)
            : STAGGER * i;

          return (
            <motion.span
              key={`top-${i}`}
              className="inline-block"
              variants={{
                initial: { y: 0 },
                hovered: { y: "-100%" },
              }}
              transition={{ ease: "easeInOut", delay }}
            >
              {l === " " ? "\u00A0" : l}
            </motion.span>
          );
        })}
      </div>

      {/* Bottom text — slides in from below on hover */}
      <div className="absolute inset-0">
        {text.split("").map((l, i) => {
          const delay = center
            ? STAGGER * Math.abs(i - (text.length - 1) / 2)
            : STAGGER * i;

          return (
            <motion.span
              key={`bot-${i}`}
              className="inline-block"
              variants={{
                initial: { y: "100%" },
                hovered: { y: 0 },
              }}
              transition={{ ease: "easeInOut", delay }}
            >
              {l === " " ? "\u00A0" : l}
            </motion.span>
          );
        })}
      </div>
    </motion.span>
  );
};

export { TextRoll };