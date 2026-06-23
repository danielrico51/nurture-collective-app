"use client";

import BrandBabyMark from "@/components/Common/BrandBabyMark";
import SectionWaveEdges, {
  FOOTER_WAVE_OVERLAP_CLASS,
} from "@/components/Common/SectionWaveEdges";
import { SocialIcon } from "@/components/Common/SocialIcon";
import { MARKETING_FOOTER, MARKETING_OAK_SURFACE } from "@/config/marketingDesign";
import { PUBLIC_SIGNUP_ENABLED } from "@/config/publicAccess";
import { legalPaths } from "@/content/legal";
import { brands, socialLinks } from "@/content/site";
import Link from "next/link";

const footerLinkClass =
  "text-nurture-cream/90 transition-colors hover:text-nurture-gold";

const footerHeadingClass = "text-nurture-lilac";

const Footer = () => (
  <footer className={`site-footer w-full ${FOOTER_WAVE_OVERLAP_CLASS}`}>
    <SectionWaveEdges
      footerTop
      footerFill={MARKETING_FOOTER}
      footerTransitionFrom={MARKETING_OAK_SURFACE}
    />
    <div className="site-footer__body w-full">
      <div className="relative z-[2] mx-auto max-w-screen-xl px-4 pb-6 pt-10 sm:px-6 sm:pb-8 sm:pt-12 md:pt-14 lg:px-8">
        <Link
          href="/"
          aria-label={brands.nestingPlace.name}
          className="group inline-flex"
        >
          <BrandBabyMark size="footer" />
        </Link>

        <div className="mt-4 flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
          <div className="max-w-lg">
            <p className={`font-serif text-xl font-semibold sm:text-2xl ${footerHeadingClass}`}>
              {brands.nestingPlace.byline}
            </p>
            <p className="mt-2 text-sm text-nurture-cream/90">
              {brands.nestingPlace.description}
            </p>
            <p className="mt-1.5 text-xs text-nurture-cream/75">
              {brands.nestingPlace.operatorLine}
            </p>
            <p className="mt-1.5 text-xs text-nurture-cream/75">
              {brands.nestingPlace.serviceArea}
            </p>
            <p className="mt-2 text-xs text-nurture-cream/70">
              Questions?{" "}
              <Link href="/contact" className={footerLinkClass}>
                Contact our team
              </Link>
            </p>
          </div>

          <div className="grid shrink-0 gap-8 sm:grid-cols-2 sm:gap-12 md:pt-0.5">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-wide ${footerHeadingClass}`}>
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
              <p className={`text-sm font-semibold uppercase tracking-wide ${footerHeadingClass}`}>
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
              className="rounded-lg p-2 text-nurture-cream transition hover:bg-nurture-cream/10 hover:text-nurture-gold"
            >
              <SocialIcon network={link.id} className="h-6 w-6" />
            </a>
          ))}
        </div>
        <p className="mt-3 border-t border-nurture-cream/15 pt-3 text-center text-xs text-nurture-cream/65">
          {brands.nestingPlace.name} provides maternal wellness and support
          services — not medical advice. Always consult your healthcare provider
          for clinical concerns. © {new Date().getFullYear()}{" "}
          {brands.nestingPlace.name}.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
