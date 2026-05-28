import NestingPlaceLogo from "@/components/Common/NestingPlaceLogo";
import Link from "next/link";
import { brands } from "@/content/site";
import { PUBLIC_SIGNUP_ENABLED } from "@/config/publicAccess";

const Footer = () => {
  return (
    <footer className="border-t border-nurture-sage/20 bg-white">
      <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <NestingPlaceLogo variant="footer" linked={false} className="max-h-[88px]" />
              <div>
                <p className="font-serif text-lg font-semibold text-nurture-sage-dark">
                  {brands.nestingPlace.name}
                </p>
                <p className="mt-1 text-sm font-medium text-nurture-charcoal/65">
                  {brands.nestingPlace.byline}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-nurture-charcoal/70">
              {brands.nestingPlace.description}
            </p>
            <p className="mt-2 text-xs text-nurture-charcoal/55">
              {brands.nestingPlace.serviceArea}
            </p>
            <p className="mt-3 text-xs text-nurture-charcoal/50">
              Expanding region by region ·{" "}
              <Link href="/for-moms#coverage" className="hover:text-nurture-sage-dark">
                View coverage
              </Link>
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Explore
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/for-moms" className="hover:text-nurture-sage-dark">
                  For moms
                </Link>
              </li>
              <li>
                <Link href="/for-providers" className="hover:text-nurture-sage-dark">
                  For providers
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-nurture-sage-dark">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-nurture-sage-dark">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-nurture-sage-dark">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Account
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/signin" className="hover:text-nurture-sage-dark">
                  Sign in
                </Link>
              </li>
              {PUBLIC_SIGNUP_ENABLED ? (
                <>
                  <li>
                    <Link href="/signup/mom" className="hover:text-nurture-sage-dark">
                      Mom signup
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup/provider" className="hover:text-nurture-sage-dark">
                      Provider signup
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link href="/contact?audience=provider" className="hover:text-nurture-sage-dark">
                    Apply as provider
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-nurture-sage/10 pt-6 text-center text-xs text-nurture-charcoal/50">
          {brands.nestingPlace.name} provides wellness and support services — not
          medical advice. Always consult your healthcare provider for clinical
          concerns. © {new Date().getFullYear()} {brands.nurtureCollective.name}.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
