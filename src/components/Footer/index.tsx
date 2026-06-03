import { SocialIcon } from "@/components/Common/SocialIcon";
import Image from "next/image";
import Link from "next/link";
import { brands, socialLinks } from "@/content/site";
import { legalPaths } from "@/content/legal";
import { PUBLIC_SIGNUP_ENABLED } from "@/config/publicAccess";

const Footer = () => {
  return (
    <footer className="border-t border-nurture-sage/20 bg-nurture-cream">
      <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex transition hover:opacity-90">
              <Image
                src={brands.nestingPlace.markSrc}
                alt={brands.nestingPlace.name}
                width={128}
                height={128}
                className="h-[6.3rem] w-[6.3rem] object-contain sm:h-28 sm:w-28"
              />
            </Link>
            <p className="mt-3 font-serif text-base font-semibold text-nurture-sage-dark">
              {brands.nestingPlace.byline}
            </p>
            <p className="mt-3 max-w-lg text-sm text-nurture-charcoal/70">
              {brands.nestingPlace.description}
            </p>
            <p className="mt-2 text-xs text-nurture-charcoal/55">
              {brands.nestingPlace.operatorLine}
            </p>
            <p className="mt-2 text-xs text-nurture-charcoal/55">
              {brands.nestingPlace.serviceArea}
            </p>
            <p className="mt-3 text-xs text-nurture-charcoal/50">
              Questions?{" "}
              <Link href="/contact" className="hover:text-nurture-sage-dark">
                Contact our team
              </Link>
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Legal
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href={legalPaths.privacyPolicy} className="hover:text-nurture-sage-dark">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href={legalPaths.termsOfUse} className="hover:text-nurture-sage-dark">
                  Terms of Use
                </Link>
              </li>
            </ul>
            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-nurture-charcoal/60">
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
        <div className="mt-10 flex items-center justify-center gap-5">
          {socialLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              {...(link.id === "sms"
                ? {}
                : { target: "_blank", rel: "noopener noreferrer" })}
              aria-label={link.label}
              className="rounded-full p-2 text-nurture-charcoal/70 transition hover:bg-nurture-sage/10 hover:text-nurture-sage-dark"
            >
              <SocialIcon network={link.id} className="h-6 w-6" />
            </a>
          ))}
        </div>
        <p className="mt-6 border-t border-nurture-sage/10 pt-6 text-center text-xs text-nurture-charcoal/50">
          {brands.nestingPlace.name} provides maternal wellness and support
          services — not medical advice. Always consult your healthcare provider
          for clinical concerns. © {new Date().getFullYear()}{" "}
          {brands.nurtureCollective.name}.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
