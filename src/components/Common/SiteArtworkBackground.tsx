import BotanicalAccent from "@/components/Art/BotanicalAccent";

interface SiteArtworkBackgroundProps {
  children: React.ReactNode;
  /** Slightly more visible on hero-style pages; default is minimal. */
  intensity?: "subtle" | "light";
}

const LIGHT_LEAVES = [
  {
    variant: "leaf" as const,
    placementClassName: "left-0 top-[14%] rotate-[-22deg] sm:left-[1%]",
    size: "sm" as const,
    className: "opacity-[0.18] sm:opacity-[0.22]",
  },
  {
    variant: "sprig" as const,
    placementClassName: "right-0 top-[36%] rotate-[14deg] sm:right-[1%]",
    size: "sm" as const,
    className: "opacity-[0.16] sm:opacity-[0.2]",
  },
] as const;

const SUBTLE_LEAVES = [
  {
    variant: "leaf" as const,
    placementClassName: "right-0 top-[22%] rotate-[-18deg] sm:right-[1%]",
    size: "sm" as const,
    className: "opacity-[0.14] sm:opacity-[0.18]",
  },
] as const;

const SiteArtworkBackground = ({
  children,
  intensity = "subtle",
}: SiteArtworkBackgroundProps) => {
  const isLight = intensity === "light";
  const blobOpacity = isLight ? "opacity-[0.14]" : "opacity-[0.1]";
  const scatteredLeaves = isLight ? LIGHT_LEAVES : SUBTLE_LEAVES;

  const botanicalOverlay = (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[15] overflow-hidden"
    >
      {scatteredLeaves.map((leaf, index) => (
        <BotanicalAccent
          key={`scattered-leaf-${index}`}
          variant={leaf.variant}
          vivid
          placementClassName={leaf.placementClassName}
          size={leaf.size}
          className={leaf.className}
        />
      ))}
    </div>
  );

  return (
    <>
      {botanicalOverlay}
      <div className="relative isolate min-h-full overflow-x-clip bg-nurture-cream">
        <div
          aria-hidden
          className={`pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-nurture-rose-light blur-3xl ${blobOpacity}`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-nurture-blush blur-3xl ${blobOpacity}`}
        />
        <div className="relative z-10">{children}</div>
      </div>
    </>
  );
};

export default SiteArtworkBackground;
