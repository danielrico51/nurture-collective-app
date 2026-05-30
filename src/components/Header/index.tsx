"use client";

import NestingPlaceLogo from "@/components/Common/NestingPlaceLogo";
import { primaryNavLinks, providerNavLink } from "@/config/navigation";
import { PUBLIC_SIGNUP_ENABLED } from "@/config/publicAccess";
import { useUserGroups } from "@/hooks/useUserGroups";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface HeaderProps {
  isAuthenticated: boolean;
}

const Header = ({ isAuthenticated }: HeaderProps) => {
  const pathname = usePathname();
  const { signOut } = useAuthenticator((context) => [context.signOut]);
  const { canAccessAdmin } = useUserGroups(isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY >= 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`fixed left-0 top-0 z-50 w-full transition-all ${
        sticky
          ? "border-b border-nurture-sage/10 bg-nurture-cream/95 shadow-sm backdrop-blur"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <span className="sm:hidden">
          <NestingPlaceLogo variant="wordmark" compact priority />
        </span>
        <span className="hidden min-w-0 sm:inline-flex">
          <NestingPlaceLogo variant="wordmark" priority />
        </span>

        <nav className="hidden items-center gap-4 xl:flex">
          {primaryNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition hover:text-nurture-sage-dark ${
                isActive(link.href)
                  ? "text-nurture-sage-dark"
                  : "text-nurture-charcoal/80"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-nurture-charcoal/80 hover:text-nurture-sage-dark"
              >
                Dashboard
              </Link>
              <Link
                href="/account/profile"
                className="text-sm font-medium text-nurture-charcoal/80 hover:text-nurture-sage-dark"
              >
                Profile
              </Link>
              {canAccessAdmin ? (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-nurture-charcoal/80 hover:text-nurture-sage-dark"
                >
                  Admin
                </Link>
              ) : null}
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full border border-nurture-sage px-4 py-2 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href={providerNavLink.href}
                className="hidden text-sm font-medium text-nurture-charcoal/70 hover:text-nurture-sage-dark lg:inline"
              >
                {providerNavLink.label}
              </Link>
              <Link
                href="/signin"
                className="text-sm font-medium text-nurture-charcoal/80 hover:text-nurture-sage-dark"
              >
                Sign in
              </Link>
              <Link
                href="/care/start"
                className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-medium text-white hover:bg-nurture-sage-dark"
              >
                Request support
              </Link>
              {PUBLIC_SIGNUP_ENABLED ? (
                <Link
                  href="/signup/mom"
                  className="rounded-full border border-nurture-sage px-4 py-2 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
                >
                  Join
                </Link>
              ) : null}
            </>
          )}
        </div>

        <button
          type="button"
          className="xl:hidden"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="block h-0.5 w-6 bg-nurture-charcoal" />
          <span className="mt-1.5 block h-0.5 w-6 bg-nurture-charcoal" />
          <span className="mt-1.5 block h-0.5 w-6 bg-nurture-charcoal" />
        </button>
      </div>

      {menuOpen && (
        <div className="max-h-[85vh] overflow-y-auto border-t border-nurture-sage/20 bg-nurture-cream px-4 py-4 xl:hidden">
          {primaryNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block py-2 text-sm font-medium ${
                isActive(link.href) ? "text-nurture-sage-dark" : ""
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2 border-t border-nurture-sage/20 pt-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/account/profile" onClick={() => setMenuOpen(false)}>
                  Profile
                </Link>
                {canAccessAdmin ? (
                  <Link href="/admin" onClick={() => setMenuOpen(false)}>
                    Admin
                  </Link>
                ) : null}
                <button type="button" onClick={handleSignOut}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/care/start" onClick={() => setMenuOpen(false)}>
                  Request support
                </Link>
                <Link href="/signin" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
                <Link
                  href={providerNavLink.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-nurture-charcoal/70"
                >
                  {providerNavLink.label}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
