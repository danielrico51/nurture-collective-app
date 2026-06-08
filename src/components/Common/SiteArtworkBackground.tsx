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
  const blobOpacity = intensity === "medium" ? "opacity-30" : "opacity-20";

  return (
    <div className="relative isolate min-h-full overflow-x-clip">
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
        className={`pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-nurture-sage-light blur-3xl ${blobOpacity}`}
      />
      <BotanicalAccent
        position="bottom-left"
        variant="sprig"
        className="hidden opacity-50 lg:block"
      />
      <BotanicalAccent
        position="bottom-right"
        variant="leaf"
        className="hidden opacity-45 lg:block"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default SiteArtworkBackground;
