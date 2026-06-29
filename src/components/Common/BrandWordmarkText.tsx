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
      ? "font-wordmark text-[clamp(0.983rem,2vw+0.483rem,1.458rem)] font-semibold leading-tight tracking-tight"
      : "font-wordmark text-[0.958rem] font-semibold tracking-tight sm:text-[1.083rem]";

  return (
    <span className={`min-w-0 whitespace-nowrap leading-tight ${textClass} ${className}`.trim()}>
      <span className="text-nurture-charcoal">The </span>
      <span className="text-nurture-sage-dark">Nesting</span>
      <span className="text-nurture-charcoal"> Place</span>
    </span>
  );
};

export default BrandWordmarkText;
