interface UrgentFlagProps {
  active?: boolean;
  className?: string;
}

const UrgentFlag = ({ active = false, className = "h-4 w-4" }: UrgentFlagProps) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={`${className} ${active ? "text-red-600" : "text-nurture-charcoal/35"}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 22V4" />
    <path
      d="M4 4h13l-3 4 3 4H4z"
      fill={active ? "currentColor" : "none"}
      stroke={active ? "none" : "currentColor"}
    />
  </svg>
);

export default UrgentFlag;
