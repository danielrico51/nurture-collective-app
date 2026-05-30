export interface NavLink {
  href: string;
  label: string;
}

/** Primary site navigation. Provider onboarding lives at /for-providers (footer and in-page links). */
export const primaryNavLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/events-and-classes", label: "Events & Classes" },
  { href: "/blog", label: "Blog" },
  { href: "/benefits-and-insurance", label: "Benefits" },
  { href: "/gift-cards", label: "Gift Cards" },
  { href: "/contact", label: "Contact" },
];
