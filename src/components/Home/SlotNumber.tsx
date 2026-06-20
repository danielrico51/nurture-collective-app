"use client";

import { useEffect, useRef, useState } from "react";

export type SlotNumberVariant = "sage" | "lilac";

interface SlotNumberProps {
  target: number;
  animate: boolean;
  prefix?: string;
  suffix?: string;
  variant?: SlotNumberVariant;
}

const SHUFFLE_MS = 40;
const TOTAL_MS = 3800;
const FAST_MS = 2600;

function targetString(target: number): string {
  return String(target);
}

function placeholderDigits(targetStr: string): string {
  return targetStr.replace(/\d/g, "0");
}

function randomFromTemplate(template: string): string {
  return template.replace(/\d/g, () => String(Math.floor(Math.random() * 10)));
}

function runSlotAnimation(
  target: number,
  setDisplay: (value: string) => void,
  onComplete: () => void,
) {
  const targetStr = targetString(target);
  const shuffleTemplate = placeholderDigits(targetStr);
  let elapsed = 0;

  const timer = window.setInterval(() => {
    elapsed += SHUFFLE_MS;

    if (elapsed < FAST_MS) {
      setDisplay(randomFromTemplate(shuffleTemplate));
    } else if (elapsed < TOTAL_MS) {
      const progress = (elapsed - FAST_MS) / (TOTAL_MS - FAST_MS);
      setDisplay(
        Math.random() < progress * 0.55 + 0.25
          ? targetStr
          : randomFromTemplate(shuffleTemplate),
      );
    } else {
      setDisplay(targetStr);
      window.clearInterval(timer);
      onComplete();
    }
  }, SHUFFLE_MS);

  return () => window.clearInterval(timer);
}

const SlotNumber = ({
  target,
  animate,
  prefix = "",
  suffix = "",
  variant = "sage",
}: SlotNumberProps) => {
  const targetStr = targetString(target);
  const placeholder = placeholderDigits(targetStr);
  const [display, setDisplay] = useState(placeholder);
  const hasRun = useRef(false);
  const fullLength = prefix.length + targetStr.length + suffix.length;

  useEffect(() => {
    if (!animate || hasRun.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setDisplay(targetStr);
      hasRun.current = true;
      return;
    }

    hasRun.current = true;
    return runSlotAnimation(target, setDisplay, () => undefined);
  }, [animate, target, targetStr]);

  return (
    <span
      className={`slot-number slot-number--${variant}`}
      data-target={target}
      style={{ minWidth: `${fullLength + 0.35}ch` }}
    >
      {prefix}
      {display}
      {suffix}
    </span>
  );
};

export default SlotNumber;
