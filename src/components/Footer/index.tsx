import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-nurture-sage/20 bg-white">
      <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-serif text-lg font-semibold text-nurture-sage-dark">
              The Nurture Collective
            </p>
            <p className="mt-2 text-sm text-nurture-charcoal/70">
              Pre- and postpartum concierge support for mothers — practical help,
              emotional care, and guidance through every stage.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Explore
            </p>
            <ul className="mt-3 space-y-2 text-sm">
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
              Members
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/signin" className="hover:text-nurture-sage-dark">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-nurture-sage-dark">
                  Create account
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-nurture-sage/10 pt-6 text-center text-xs text-nurture-charcoal/50">
          The Nurture Collective provides concierge and wellness support — not
          medical advice. Always consult your healthcare provider for clinical
          concerns. © {new Date().getFullYear()} The Nurture Collective.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
