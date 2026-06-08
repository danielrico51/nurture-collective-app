interface BotanicalAccentProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
  variant?: "leaf" | "sprig";
}

const positionClasses: Record<
  NonNullable<BotanicalAccentProps["position"]>,
  string
> = {
  "top-left": "-left-8 -top-8 rotate-[-18deg]",
  "top-right": "-right-10 -top-6 rotate-[24deg]",
  "bottom-left": "-left-12 bottom-0 rotate-[12deg]",
  "bottom-right": "-right-14 bottom-0 rotate-[-30deg]",
};

const LeafSvg = ({ variant }: { variant: "leaf" | "sprig" }) =>
  variant === "sprig" ? (
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
  ) : (
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

const BotanicalAccent = ({
  position = "bottom-right",
  className = "",
  variant = "leaf",
}: BotanicalAccentProps) => (
  <div
    aria-hidden
    className={`pointer-events-none absolute ${positionClasses[position]} ${className}`}
  >
    <div className="h-28 w-20 opacity-80 sm:h-36 sm:w-24">
      <LeafSvg variant={variant} />
    </div>
  </div>
);

export default BotanicalAccent;
