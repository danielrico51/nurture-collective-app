import BotanicalAccent from "@/components/Art/BotanicalAccent";

interface SiteArtworkBackgroundProps {
  children: React.ReactNode;
  /** Stronger accents for hero-style pages; default is subtle. */
  intensity?: "subtle" | "medium";
}

const SiteArtworkBackground = ({
  children,
  intensity = "subtle",
}: SiteArtworkBackgroundProps) => {
  const isMedium = intensity === "medium";
  const blobOpacity = isMedium ? "opacity-35" : "opacity-20";
  const clusterSize = isMedium ? "lg" : "md";
  const clusterOpacity = isMedium ? "opacity-55" : "opacity-40";

  return (
    <div className="relative isolate min-h-full overflow-x-clip bg-nurture-cream">
      <div
        aria-hidden
        className={`pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-nurture-rose-light blur-3xl ${blobOpacity}`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-nurture-blush blur-3xl ${blobOpacity}`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute bottom-1/4 left-1/3 h-72 w-72 rounded-full bg-nurture-sage-light blur-3xl ${blobOpacity}`}
      />
      {isMedium ? (
        <div
          aria-hidden
          className="pointer-events-none absolute right-1/4 top-[28%] h-56 w-56 rounded-full bg-nurture-blush/80 blur-3xl opacity-25"
        />
      ) : null}
      <BotanicalAccent
        position="bottom-left"
        variant="lavender-cluster"
        size={clusterSize}
        className={`opacity-0 sm:opacity-100 ${clusterOpacity}`}
      />
      <BotanicalAccent
        position="bottom-right"
        variant="sage-cluster"
        size={clusterSize}
        className={`opacity-0 sm:opacity-100 ${clusterOpacity}`}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default SiteArtworkBackground;
