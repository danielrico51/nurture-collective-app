"use client";

import BrandBabyMark from "@/components/Common/BrandBabyMark";
import { SocialIcon } from "@/components/Common/SocialIcon";
import SectionWaveEdges from "@/components/Common/SectionWaveEdges";
import {
  MARKETING_CREAM,
  MARKETING_FOOTER,
  MARKETING_WHITE,
} from "@/config/marketingDesign";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { brands, socialLinks } from "@/content/site";
import { legalPaths } from "@/content/legal";
import { PUBLIC_SIGNUP_ENABLED } from "@/config/publicAccess";

const footerLinkClass =
  "text-white/90 transition-colors hover:text-nurture-sage";

/** Pages whose last section background is white (not cream). */
const FOOTER_WAVE_WHITE_PATHS = new Set([
  "/",
  "/services",
  "/benefits-and-insurance",
]);

const Footer = () => {
  const pathname = usePathname();
  const waveTopFill = FOOTER_WAVE_WHITE_PATHS.has(pathname)
    ? MARKETING_WHITE
    : MARKETING_CREAM;

  return (
    <footer className="site-footer">
      <SectionWaveEdges
        topOnly
        smoothTopFade
        topFill={waveTopFill}
        fadeThroughColor={MARKETING_FOOTER}
      />
      <div className="relative z-[2] mx-auto max-w-screen-xl px-4 pb-6 pt-16 sm:px-6 sm:pb-8 sm:pt-24 md:pt-28 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3 md:gap-x-8">
          <div className="md:col-span-2">
            <Link
              href="/"
              aria-label={brands.nestingPlace.name}
              className="group inline-flex"
            >
              <BrandBabyMark size="footer" />
            </Link>
          </div>

          <div className="hidden md:block" aria-hidden />

          <div className="md:col-span-2">
            <p className="font-serif text-base font-semibold text-nurture-sage-dark">
              {brands.nestingPlace.byline}
            </p>
            <p className="mt-2 max-w-lg text-sm text-white/90">
              {brands.nestingPlace.description}
            </p>
            <p className="mt-1.5 text-xs text-white/75">
              {brands.nestingPlace.operatorLine}
            </p>
            <p className="mt-1.5 text-xs text-white/75">
              {brands.nestingPlace.serviceArea}
            </p>
            <p className="mt-2 text-xs text-white/70">
              Questions?{" "}
              <Link href="/contact" className={footerLinkClass}>
                Contact our team
              </Link>
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 md:col-span-1 md:row-start-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-nurture-sage-dark">
                Legal
              </p>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li>
                  <Link href={legalPaths.privacyPolicy} className={footerLinkClass}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href={legalPaths.termsOfUse} className={footerLinkClass}>
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/sources" className={footerLinkClass}>
                    Sources
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-nurture-sage-dark">
                Account
              </p>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li>
                  <Link href="/signin" className={footerLinkClass}>
                    Sign in
                  </Link>
                </li>
                {PUBLIC_SIGNUP_ENABLED ? (
                  <>
                    <li>
                      <Link href="/signup/mom" className={footerLinkClass}>
                        Mom signup
                      </Link>
                    </li>
                    <li>
                      <Link href="/signup/provider" className={footerLinkClass}>
                        Provider signup
                      </Link>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link href="/contact?audience=provider" className={footerLinkClass}>
                      Apply as provider
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-center gap-4">
          {socialLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              {...(link.id === "sms" || link.id === "phone"
                ? {}
                : { target: "_blank", rel: "noopener noreferrer" })}
              aria-label={link.label}
              className="rounded-full p-2 text-white transition hover:bg-white/10 hover:text-white"
            >
              <SocialIcon network={link.id} className="h-6 w-6" />
            </a>
          ))}
        </div>
        <p className="mt-3 border-t border-white/15 pt-3 text-center text-xs text-white/65">
          {brands.nestingPlace.name} provides maternal wellness and support
          services — not medical advice. Always consult your healthcare provider
          for clinical concerns. © {new Date().getFullYear()}{" "}
          {brands.nestingPlace.name}.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
