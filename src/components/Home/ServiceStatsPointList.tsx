"use client";

import { useEffect, useRef, useState } from "react";
import SlotNumber, { type SlotNumberVariant } from "@/components/Home/SlotNumber";
import {
  isSlotStatPoint,
  type SlotStatPoint,
} from "@/content/serviceStats";

interface ServiceStatsPointListProps {
  slug: string;
  points: readonly (string | SlotStatPoint)[];
}

const SLOT_VARIANT_BY_SLUG: Record<string, SlotNumberVariant> = {
  "birth-doula": "sage",
  "overnight-newborn": "lilac",
  "postpartum-care": "sage",
};

const ServiceStatsPointList = ({ slug, points }: ServiceStatsPointListProps) => {
  const listRef = useRef<HTMLUListElement>(null);
  const [animateSlots, setAnimateSlots] = useState(false);
  const hasSlotPoints = points.some(isSlotStatPoint);
  const slotVariant = SLOT_VARIANT_BY_SLUG[slug] ?? "sage";

  useEffect(() => {
    if (!hasSlotPoints) return;

    const list = listRef.current;
    if (!list) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimateSlots(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(list);
    return () => observer.disconnect();
  }, [hasSlotPoints]);

  return (
    <ul
      ref={listRef}
      className="space-y-3 rounded-2xl border border-nurture-sage/10 bg-white p-5 shadow-sm sm:p-6"
    >
      {points.map((point) => (
        <li
          key={`${slug}-${isSlotStatPoint(point) ? point.label : point}`}
          className="flex gap-3 text-base leading-relaxed text-nurture-charcoal/80"
        >
          <span
            aria-hidden
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nurture-sage"
          />
          <span>
            {isSlotStatPoint(point) ? (
              <>
                <SlotNumber
                  target={point.value}
                  animate={animateSlots}
                  prefix={point.prefix}
                  suffix={point.suffix}
                  variant={slotVariant}
                />
                {" "}
                {point.label}
              </>
            ) : (
              point
            )}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default ServiceStatsPointList;
