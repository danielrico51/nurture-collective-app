import Link from "next/link";

const CallToAction = () => {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-nurture-sage px-8 py-16 text-center text-white sm:px-16">
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
            You don&apos;t have to do this alone
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/90">
            Join mothers who are choosing calm, supported transitions into and
            through motherhood.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-cream"
          >
            Create your free account
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
