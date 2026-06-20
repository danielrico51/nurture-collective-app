"use client";

import NestingPlaceLogo from "@/components/Common/NestingPlaceLogo";
import {
  buildGuestAccountSigninHref,
  buildGuestAccountSignupHref,
  isIntakeChatPath,
} from "@/config/intakeAccess";
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
    `text-sm font-medium transition-colors hover:text-nurture-sage-dark ${
      isActive(href) ? "text-nurture-sage-dark" : "text-nurture-charcoal/85"
    }`;

  const cardShadow = scrolled
    ? "shadow-lg shadow-stone-900/10"
    : "shadow-md shadow-stone-900/5";

  return (
    <header
      className="pointer-events-none fixed inset-x-0 top-4 z-50 px-4 sm:top-6 sm:px-6"
      data-scrolled={scrolled ? "true" : "false"}
    >
      <div
        className={`pointer-events-auto mx-auto max-w-7xl overflow-hidden rounded-lg bg-white transition-shadow duration-300 ${cardShadow}`}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-1 sm:px-6 sm:py-1.5">
          <span className="inline-flex shrink-0 sm:hidden">
            <NestingPlaceLogo variant="wordmark" compact priority />
          </span>
          <span className="hidden min-w-0 sm:inline-flex shrink-0">
            <NestingPlaceLogo variant="wordmark" priority />
          </span>

          <nav className="hidden items-center gap-3 lg:gap-4 xl:flex">
            {primaryNavLinks.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:gap-3 lg:flex">
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
                <Link
                  href={signupHref}
                  className="btn-nav-secondary"
                >
                  Sign up
                </Link>
                <Link
                  href="/care/start"
                  className="btn-nav-primary"
                >
                  Request support
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-md p-1 text-nurture-charcoal transition-colors hover:bg-stone-100 lg:hidden"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="block h-0.5 w-6 bg-nurture-charcoal" />
            <span className="mt-1.5 block h-0.5 w-6 bg-nurture-charcoal" />
            <span className="mt-1.5 block h-0.5 w-6 bg-nurture-charcoal" />
          </button>
        </div>

        {menuOpen ? (
          <div className="border-t border-stone-100 bg-white px-4 py-4 lg:hidden">
            <nav className="flex flex-col">
              {primaryNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md py-2.5 text-sm font-medium transition-colors hover:text-nurture-sage-dark ${
                    isActive(link.href)
                      ? "text-nurture-sage-dark"
                      : "text-nurture-charcoal/85"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/apps"
                    className="rounded-md py-2 text-sm font-medium text-nurture-charcoal/85"
                    onClick={() => setMenuOpen(false)}
                  >
                    My apps
                  </Link>
                  <Link
                    href="/account/profile"
                    className="rounded-md py-2 text-sm font-medium text-nurture-charcoal/85"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {canAccessAdmin ? (
                    <Link
                      href="/admin"
                      className="rounded-md py-2 text-sm font-medium text-nurture-charcoal/85"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-md py-2 text-left text-sm font-medium text-nurture-charcoal/85"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/care/start"
                    className="btn-primary w-full py-2.5 text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    Request support
                  </Link>
                  <Link
                    href={signinHref}
                    className="rounded-md py-2 text-sm font-medium text-nurture-charcoal/85"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href={signupHref}
                    className="rounded-md py-2 text-sm font-medium text-nurture-charcoal/85"
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
