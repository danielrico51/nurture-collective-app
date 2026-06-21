interface BrandWordmarkTextProps {
  size?: "header" | "compact";
  className?: string;
}

const BrandWordmarkText = ({
  size = "header",
  className = "",
}: BrandWordmarkTextProps) => {
  const textClass =
    size === "header"
      ? "font-wordmark text-[clamp(0.9rem,2vw+0.4rem,1.375rem)] font-semibold leading-tight tracking-tight"
      : "font-wordmark text-sm font-semibold tracking-tight sm:text-base";

  return (
    <span className={`min-w-0 leading-tight ${textClass} ${className}`.trim()}>
      <span className="text-nurture-charcoal">The </span>
      <span className="text-nurture-sage-dark">Nesting</span>
      <span className="text-nurture-charcoal"> Place</span>
    </span>
  );
};

export default BrandWordmarkText;
