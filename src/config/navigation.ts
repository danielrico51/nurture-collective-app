export interface NavLink {
  href: string;
  label: string;
}

/** Primary navigation — parent-focused; providers are linked separately in the header CTA. */
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

export const providerNavLink: NavLink = {
  href: "/for-providers",
  label: "For providers",
};
