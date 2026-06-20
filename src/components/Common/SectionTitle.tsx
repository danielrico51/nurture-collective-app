interface SectionTitleProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

const SectionTitle = ({
  title,
  subtitle,
  centered = true,
}: SectionTitleProps) => {
  return (
    <div className={centered ? "text-center" : ""}>
      <h2 className="font-serif text-[clamp(1.75rem,3.5vw+0.5rem,2.25rem)] font-semibold text-nurture-charcoal sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-2xl text-base text-nurture-charcoal/70 sm:mt-4 sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;
