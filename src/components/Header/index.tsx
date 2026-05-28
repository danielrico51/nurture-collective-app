"use client";

import NestingPlaceLogo from "@/components/Common/NestingPlaceLogo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { PUBLIC_SIGNUP_ENABLED } from "@/config/publicAccess";
import { useUserGroups } from "@/hooks/useUserGroups";

interface HeaderProps {
  isAuthenticated: boolean;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/for-moms", label: "For moms" },
  { href: "/for-providers", label: "For providers" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

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
        sticky ? "bg-white/95 shadow-sm backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <NestingPlaceLogo
          variant="header"
          priority
          compact
          nameClassName="text-sm sm:text-base lg:text-lg"
        />

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
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
                href="/signin"
                className="text-sm font-medium text-nurture-charcoal/80 hover:text-nurture-sage-dark"
              >
                Sign in
              </Link>
              {PUBLIC_SIGNUP_ENABLED ? (
                <Link
                  href="/signup/mom"
                  className="rounded-full border border-nurture-sage px-4 py-2 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
                >
                  Join
                </Link>
              ) : (
                <Link
                  href="/for-providers"
                  className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-medium text-white hover:bg-nurture-sage-dark"
                >
                  Apply as provider
                </Link>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          className="lg:hidden"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="block h-0.5 w-6 bg-nurture-charcoal" />
          <span className="mt-1.5 block h-0.5 w-6 bg-nurture-charcoal" />
          <span className="mt-1.5 block h-0.5 w-6 bg-nurture-charcoal" />
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-nurture-sage/20 bg-white px-4 py-4 lg:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium"
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
                <Link href="/signin" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
                <Link href="/for-moms" onClick={() => setMenuOpen(false)}>
                  For moms
                </Link>
                <Link href="/for-providers" onClick={() => setMenuOpen(false)}>
                  For providers
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
