interface BreadcrumbProps {
  pageName: string;
}

const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  return (
    <section className="bg-nurture-sage/10 py-12">
      <div className="mx-auto max-w-screen-xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl">
          {pageName}
        </h1>
      </div>
    </section>
  );
};

export default Breadcrumb;
