interface BreadcrumbProps {
  pageName: string;
}

const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  return (
    <section className="relative border-b border-nurture-sage/10 bg-gradient-to-b from-nurture-rose-light/40 to-transparent py-12">
      <div className="mx-auto max-w-screen-xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nurture-sage-dark">
          The Nesting Place
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl">
          {pageName}
        </h1>
      </div>
    </section>
  );
};

export default Breadcrumb;
