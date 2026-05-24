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
      <h2 className="font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-lg text-nurture-charcoal/70">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;
