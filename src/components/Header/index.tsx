"use client";

import NestingPlaceLogo from "@/components/Common/NestingPlaceLogo";
import { buildBookingPageHref } from "@/config/bookings";
import {
  buildGuestAccountSigninHref,
  buildGuestAccountSignupHref,
  isIntakeChatPath,
} from "@/config/intakeAccess";
import { buildSmsHref } from "@/config/integrations";
import { primaryNavLinks } from "@/config/navigation";
import { useUserGroups } from "@/hooks/useUserGroups";
import { signOut } from "aws-amplify/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface HeaderProps {
  isAuthenticated: boolean;
}

const Header = ({ isAuthenticated }: HeaderProps) => {
  const pathname = usePathname();
  const onIntakeChat = isIntakeChatPath(pathname);
  const signinHref = onIntakeChat
    ? buildGuestAccountSigninHref()
    : "/signin";
  const signupHref = onIntakeChat
    ? buildGuestAccountSignupHref()
    : "/signup/mom";
  const { canAccessAdmin } = useUserGroups(isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY >= 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const navLinkClass = (href: string) =>
    `whitespace-nowrap rounded-md px-2 py-1 text-[0.958rem] font-medium transition-colors ${
      isActive(href)
        ? "bg-nurture-lilac/25 text-nurture-grape"
        : "text-nurture-charcoal hover:bg-nurture-lilac/15 hover:text-nurture-grape"
    }`;

  const cardShadow = scrolled ? "shadow-nav" : "shadow-sm";

  return (
    <header
      className="pointer-events-none fixed inset-x-0 top-4 z-50 px-2 sm:top-6 sm:px-3"
      data-scrolled={scrolled ? "true" : "false"}
    >
      <div
        className={`pointer-events-auto mx-auto w-full max-w-[96rem] overflow-hidden rounded-lg border border-nurture-oak/50 bg-nurture-cream transition-shadow duration-300 ${cardShadow}`}
      >
        <div className="flex flex-nowrap items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-5 sm:py-2.5">
          <span className="inline-flex shrink-0 sm:hidden">
            <NestingPlaceLogo variant="wordmark" compact priority />
          </span>
          <span className="hidden min-w-0 shrink-0 sm:inline-flex">
            <NestingPlaceLogo variant="wordmark" priority />
          </span>

          <nav className="hidden min-w-0 flex-nowrap items-center gap-1 xl:flex xl:gap-1.5">
            {primaryNavLinks.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 flex-nowrap items-center gap-2 sm:gap-2.5 lg:flex">
            {isAuthenticated ? (
              <>
                <Link href="/apps" className={navLinkClass("/apps")}>
                  My apps
                </Link>
                <Link href="/account/profile" className={navLinkClass("/account/profile")}>
                  Profile
                </Link>
                {canAccessAdmin ? (
                  <Link href="/admin" className={navLinkClass("/admin")}>
                    Admin
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn-nav-secondary"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href={signinHref} className={navLinkClass(signinHref)}>
                  Sign in
                </Link>
                <a href={buildSmsHref()} className="btn-nav-secondary whitespace-nowrap">
                  Call or Text
                </a>
                <Link href={buildBookingPageHref()} className="btn-nav-primary whitespace-nowrap">
                  Book Online
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-md p-[0.275rem] text-nurture-charcoal transition-colors hover:bg-nurture-lilac/15 lg:hidden"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="block h-0.5 w-[1.65rem] bg-nurture-charcoal" />
            <span className="mt-[0.4125rem] block h-0.5 w-[1.65rem] bg-nurture-charcoal" />
            <span className="mt-[0.4125rem] block h-0.5 w-[1.65rem] bg-nurture-charcoal" />
          </button>
        </div>

        {menuOpen ? (
          <div className="border-t border-nurture-oak/25 bg-nurture-cream px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-0.5">
              {primaryNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-2 py-2.5 text-[0.958rem] font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-nurture-lilac/25 text-nurture-grape"
                      : "text-nurture-charcoal hover:bg-nurture-lilac/15 hover:text-nurture-grape"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-nurture-oak/25 pt-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/apps"
                    className="rounded-md px-2 py-2 text-[0.958rem] font-medium text-nurture-charcoal hover:bg-nurture-lilac/15"
                    onClick={() => setMenuOpen(false)}
                  >
                    My apps
                  </Link>
                  <Link
                    href="/account/profile"
                    className="rounded-md px-2 py-2 text-[0.958rem] font-medium text-nurture-charcoal hover:bg-nurture-lilac/15"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {canAccessAdmin ? (
                    <Link
                      href="/admin"
                      className="rounded-md px-2 py-2 text-[0.958rem] font-medium text-nurture-charcoal hover:bg-nurture-lilac/15"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-md px-2 py-2 text-left text-[0.958rem] font-medium text-nurture-charcoal hover:bg-nurture-lilac/15"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <a
                    href={buildSmsHref()}
                    className="btn-nav-secondary w-full py-2.5 text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    Call or Text
                  </a>
                  <Link
                    href={buildBookingPageHref()}
                    className="btn-nav-primary w-full py-2.5 text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    Book Online
                  </Link>
                  <Link
                    href={signinHref}
                    className="rounded-md px-2 py-2 text-[0.958rem] font-medium text-nurture-charcoal hover:bg-nurture-lilac/15"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href={signupHref}
                    className="rounded-md px-2 py-2 text-[0.958rem] font-medium text-nurture-charcoal hover:bg-nurture-lilac/15"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
