interface OptionCardProps {
  label: string;
  description?: string;
  selected?: boolean;
  onClick: () => void;
  type?: "single" | "multi";
}

const OptionCard = ({
  label,
  description,
  selected = false,
  onClick,
  type = "single",
}: OptionCardProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`group w-full rounded-2xl border px-5 py-4 text-left transition-all duration-200 ${
      selected
        ? "border-nurture-sage bg-nurture-sage/10 shadow-sm ring-1 ring-nurture-sage/30"
        : "border-nurture-sage/20 bg-white hover:border-nurture-sage/40 hover:bg-nurture-cream/60"
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-medium text-nurture-charcoal">{label}</p>
        {description ? (
          <p className="mt-1 text-sm text-nurture-charcoal/60">{description}</p>
        ) : null}
      </div>
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected
            ? "border-nurture-sage bg-nurture-sage text-white"
            : "border-nurture-sage/30 bg-white group-hover:border-nurture-sage/50"
        }`}
        aria-hidden
      >
        {selected ? (
          type === "multi" ? (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="h-2 w-2 rounded-full bg-white" />
          )
        ) : null}
      </span>
    </div>
  </button>
);

export default OptionCard;
