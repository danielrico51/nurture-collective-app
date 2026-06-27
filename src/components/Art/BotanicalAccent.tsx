interface BotanicalAccentProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Overrides corner `position` with arbitrary absolute placement classes. */
  placementClassName?: string;
  className?: string;
  variant?: "leaf" | "sprig" | "lavender-cluster" | "sage-cluster";
  size?: "sm" | "md" | "lg";
  /** Use full-strength SVG fills (site background accents). */
  vivid?: boolean;
}

const positionClasses: Record<
  NonNullable<BotanicalAccentProps["position"]>,
  string
> = {
  "top-left": "-left-8 -top-8 rotate-[-18deg]",
  "top-right": "-right-10 -top-6 rotate-[24deg]",
  "bottom-left": "-left-16 bottom-0 rotate-[8deg] sm:-left-20",
  "bottom-right": "-right-12 bottom-0 rotate-[-12deg] sm:-right-16",
};

const sizeClasses: Record<NonNullable<BotanicalAccentProps["size"]>, string> = {
  sm: "h-32 w-28 sm:h-36 sm:w-32",
  md: "h-44 w-36 sm:h-52 sm:w-44",
  lg: "h-52 w-44 sm:h-64 sm:w-56 lg:h-72 lg:w-64",
};

const LeafSvg = ({
  variant,
}: {
  variant: NonNullable<BotanicalAccentProps["variant"]>;
}) => {
  if (variant === "lavender-cluster") {
    return (
      <svg viewBox="0 0 200 280" className="h-full w-full" aria-hidden>
        <path
          d="M95 280V70"
          stroke="#8B7BA8"
          strokeWidth="2.5"
          opacity="0.28"
        />
        <path
          d="M110 280V95"
          stroke="#A67F91"
          strokeWidth="2"
          opacity="0.22"
        />
        <ellipse
          cx="58"
          cy="130"
          rx="30"
          ry="14"
          fill="#E8D8F0"
          opacity="0.62"
          transform="rotate(-32 58 130)"
        />
        <ellipse
          cx="42"
          cy="185"
          rx="34"
          ry="16"
          fill="#D4C0E0"
          opacity="0.55"
          transform="rotate(-22 42 185)"
        />
        <ellipse
          cx="68"
          cy="230"
          rx="28"
          ry="13"
          fill="#C4A4B5"
          opacity="0.48"
          transform="rotate(-38 68 230)"
        />
        <ellipse
          cx="132"
          cy="115"
          rx="32"
          ry="15"
          fill="#F0E0E8"
          opacity="0.58"
          transform="rotate(28 132 115)"
        />
        <ellipse
          cx="148"
          cy="165"
          rx="30"
          ry="14"
          fill="#E8D8F0"
          opacity="0.52"
          transform="rotate(34 148 165)"
        />
        <ellipse
          cx="118"
          cy="210"
          rx="26"
          ry="12"
          fill="#D4C0E0"
          opacity="0.5"
          transform="rotate(20 118 210)"
        />
        <ellipse
          cx="88"
          cy="58"
          rx="24"
          ry="11"
          fill="#F0E0E8"
          opacity="0.6"
          transform="rotate(-12 88 58)"
        />
        <ellipse
          cx="118"
          cy="48"
          rx="22"
          ry="10"
          fill="#E8D8F0"
          opacity="0.55"
          transform="rotate(18 118 48)"
        />
      </svg>
    );
  }

  if (variant === "sage-cluster") {
    return (
      <svg viewBox="0 0 200 280" className="h-full w-full" aria-hidden>
        <path
          d="M105 280V65"
          stroke="#7A9A6E"
          strokeWidth="2.5"
          opacity="0.3"
        />
        <path
          d="M88 280V88"
          stroke="#8B7BA8"
          strokeWidth="2"
          opacity="0.2"
        />
        <ellipse
          cx="62"
          cy="118"
          rx="32"
          ry="15"
          fill="#B8C9B0"
          opacity="0.58"
          transform="rotate(-35 62 118)"
        />
        <ellipse
          cx="48"
          cy="172"
          rx="36"
          ry="17"
          fill="#9BB5A0"
          opacity="0.52"
          transform="rotate(-26 48 172)"
        />
        <ellipse
          cx="72"
          cy="222"
          rx="30"
          ry="14"
          fill="#C5D4BE"
          opacity="0.55"
          transform="rotate(-40 72 222)"
        />
        <ellipse
          cx="138"
          cy="98"
          rx="34"
          ry="16"
          fill="#A8C4A0"
          opacity="0.56"
          transform="rotate(32 138 98)"
        />
        <ellipse
          cx="155"
          cy="148"
          rx="32"
          ry="15"
          fill="#B8C9B0"
          opacity="0.5"
          transform="rotate(36 155 148)"
        />
        <ellipse
          cx="128"
          cy="198"
          rx="38"
          ry="18"
          fill="#9BB5A0"
          opacity="0.54"
          transform="rotate(24 128 198)"
        />
        <ellipse
          cx="92"
          cy="52"
          rx="26"
          ry="12"
          fill="#D4E5D0"
          opacity="0.62"
          transform="rotate(-16 92 52)"
        />
        <ellipse
          cx="122"
          cy="42"
          rx="24"
          ry="11"
          fill="#B8C9B0"
          opacity="0.55"
          transform="rotate(22 122 42)"
        />
        <ellipse
          cx="108"
          cy="250"
          rx="28"
          ry="13"
          fill="#A8C4A0"
          opacity="0.45"
          transform="rotate(8 108 250)"
        />
      </svg>
    );
  }

  if (variant === "sprig") {
    return (
      <svg viewBox="0 0 120 160" className="h-full w-full" aria-hidden>
        <path
          d="M60 150C42 118 18 92 22 58C26 28 48 12 60 8C72 12 94 28 98 58C102 92 78 118 60 150Z"
          fill="#B8C9B0"
          opacity="0.55"
        />
        <path
          d="M60 8V150"
          stroke="#8B7BA8"
          strokeWidth="2"
          opacity="0.35"
        />
        <ellipse cx="38" cy="72" rx="18" ry="10" fill="#D4E5D0" opacity="0.7" />
        <ellipse cx="82" cy="88" rx="16" ry="9" fill="#E8D8F0" opacity="0.65" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 140" className="h-full w-full" aria-hidden>
      <path
        d="M50 130C30 98 8 74 14 42C18 18 34 6 50 4C66 6 82 18 86 42C92 74 70 98 50 130Z"
        fill="#C4A4B5"
        opacity="0.4"
      />
      <path
        d="M50 4C62 28 68 58 50 130"
        stroke="#8B7BA8"
        strokeWidth="1.5"
        opacity="0.3"
      />
    </svg>
  );
};

const BotanicalAccent = ({
  position = "bottom-right",
  placementClassName,
  className = "",
  variant = "leaf",
  size = "md",
  vivid = false,
}: BotanicalAccentProps) => (
  <div
    aria-hidden
    className={`pointer-events-none absolute ${
      placementClassName ?? positionClasses[position]
    } ${className}`}
  >
    <div className={`${sizeClasses[size]} ${vivid ? "" : "opacity-80"}`}>
      <LeafSvg variant={variant} />
    </div>
  </div>
);

export default BotanicalAccent;
