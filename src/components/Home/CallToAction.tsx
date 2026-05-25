import ContactOptions from "@/components/Common/ContactOptions";
import Link from "next/link";
import { PUBLIC_SIGNUP_ENABLED } from "@/config/publicAccess";

const CallToAction = () => {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-nurture-sage px-8 py-16 text-center text-white sm:px-16">
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
            You don&apos;t have to do this alone
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/90">
            {PUBLIC_SIGNUP_ENABLED
              ? "Join mothers who are choosing calm, supported transitions into and through motherhood."
              : "Our team is here to support your transition with calm, practical care."}
          </p>
          {PUBLIC_SIGNUP_ENABLED ? (
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-cream"
            >
              Create your free account
            </Link>
          ) : (
            <Link
              href="/contact"
              className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-cream"
            >
              Contact us
            </Link>
          )}
        </div>

        <div className="mt-12">
          <ContactOptions formHref="/contact#contact-form" />
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
