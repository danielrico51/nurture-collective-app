const EVENT_ORGANIC_RADIUS = [
  "rounded-2xl md:rounded-[63%_37%_54%_46%/55%_48%_52%_45%]",
  "rounded-2xl md:rounded-[58%_42%_48%_52%/52%_44%_56%_48%]",
] as const;

interface EventsJumpNavProps {
  showClasses: boolean;
  showEvents: boolean;
}

const EventsJumpNav = ({ showClasses, showEvents }: EventsJumpNavProps) => {
  if (!showClasses && !showEvents) return null;

  const links = [
    showClasses ? { href: "#classes", label: "Classes" } : null,
    showEvents ? { href: "#events", label: "Events" } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <nav
      aria-label="Jump to listings"
      className="rounded-2xl border border-nurture-sage/15 bg-white p-4 text-center shadow-sm sm:p-5"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-nurture-sage-dark">
        Browse by type
      </p>
      <p className="mt-1 text-sm text-nurture-charcoal/65">
        Jump to childbirth classes or community events below.
      </p>
      <ul className="mt-3.5 flex flex-wrap justify-center gap-2">
        {links.map((link, index) => (
          <li key={link.href} className="min-w-[8.5rem] flex-1 sm:flex-none">
            <a
              href={link.href}
              className={`inline-flex w-full items-center justify-center border border-nurture-sage/20 bg-[#F0EBE4] px-4 py-2 text-sm font-medium text-nurture-charcoal shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors hover:border-nurture-sage/35 hover:bg-[#E8E2D9] hover:text-nurture-sage-dark ${
                EVENT_ORGANIC_RADIUS[index % EVENT_ORGANIC_RADIUS.length]
              }`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default EventsJumpNav;
