/** Marketing pages get soft botanical background accents; app/admin surfaces do not. */
export const shouldShowSiteArtwork = (pathname: string): boolean => {
  if (
    pathname === "/about" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/apps") ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/oauth") ||
    pathname.startsWith("/invoice") ||
    pathname.startsWith("/care/start") ||
    pathname.startsWith("/intake")
  ) {
    return false;
  }
  return true;
};
