"use client";

import {
  SCROLL_REVEAL_VARIANTS,
  type ScrollRevealVariant,
} from "@/lib/motion/scrollReveal";
import type { ElementType, ReactNode } from "react";
import { useEffect, useRef } from "react";

export type ScrollRevealHeadingTag = "h1" | "h2" | "h3";

export interface ScrollRevealHeadingProps {
  children: ReactNode;
  className?: string;
  as?: ScrollRevealHeadingTag;
  variant?: ScrollRevealVariant;
}

export function ScrollRevealHeading({
  children,
  className = "",
  as: Tag = "h2",
  variant = "default",
}: ScrollRevealHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      el.classList.remove("invisible");
      return;
    }

    let tween: { kill: () => void; scrollTrigger?: { kill: () => void } } | null =
      null;
    let split: InstanceType<typeof import("split-type").default> | null = null;
    let cancelled = false;

    const run = async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: SplitType }] =
        await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
          import("split-type"),
        ]);

      if (cancelled || !ref.current) return;

      gsap.registerPlugin(ScrollTrigger);

      split = new SplitType(el, { types: "words" });
      const words = split.words;

      el.classList.remove("invisible");

      if (!words?.length) {
        split.revert();
        split = null;
        return;
      }

      const config = SCROLL_REVEAL_VARIANTS[variant];

      tween = gsap.from(words, {
        scrollTrigger: {
          trigger: el,
          start: config.start,
          end: config.end,
          toggleActions: "play none none reverse",
        },
        opacity: config.opacity,
        y: config.y,
        duration: config.duration,
        stagger: config.stagger,
        ease: config.ease,
      });
    };

    run().catch(() => {
      el.classList.remove("invisible");
    });

    return () => {
      cancelled = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
      split?.revert();
    };
  }, [children, variant]);

  const Heading = Tag as ElementType;

  return (
    <Heading
      ref={ref}
      className={`invisible [&_.word]:inline-block [&_.word]:overflow-hidden [&_.word]:align-bottom ${className}`.trim()}
    >
      {children}
    </Heading>
  );
}
