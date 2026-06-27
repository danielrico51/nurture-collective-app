interface SiteArtworkBackgroundProps {
  children: React.ReactNode;
  /** Slightly more visible on hero-style pages; default is minimal. */
  intensity?: "subtle" | "light";
}

const SiteArtworkBackground = ({
  children,
  intensity = "subtle",
}: SiteArtworkBackgroundProps) => {
  const isLight = intensity === "light";
  const blobOpacity = isLight ? "opacity-[0.14]" : "opacity-[0.1]";

  return (
    <div className="relative isolate overflow-x-clip bg-nurture-cream">
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
  );
};

export default SiteArtworkBackground;
