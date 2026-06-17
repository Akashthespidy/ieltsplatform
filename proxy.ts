import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { locales, defaultLocale } from "./lib/i18n";

// Helper to check if route matcher is public
const isPublicRoute = createRouteMatcher([
  "/",
  "/:lang",
  "/:lang/sign-in(.*)",
  "/:lang/sign-up(.*)",
  "/api/uploadthing(.*)",
]);

// Custom lightweight header language negotiator
function getLocale(request: any): string {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return defaultLocale;

  const parsedLocales = acceptLanguage
    .split(",")
    .map((lang: string) => {
      const parts = lang.split(";");
      const code = parts[0].trim().split("-")[0];
      return code.toLowerCase();
    });

  for (const locale of parsedLocales) {
    if (locales.includes(locale as any)) {
      return locale;
    }
  }

  return defaultLocale;
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // 0. Skip i18n redirect for API endpoints, but protect if private
  if (pathname.startsWith("/api")) {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
    return NextResponse.next();
  }

  // 1. Check if the pathname is missing any supported locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Determine user locale
    const locale = getLocale(request);
    // Redirect to locale prefixed path
    return NextResponse.redirect(
      new URL(`/${locale}${pathname === "/" ? "" : pathname}${request.nextUrl.search}`, request.url)
    );
  }

  // 2. Perform auth protection if not public
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  return NextResponse.next();
});

// Configure proxy matcher paths
export const config = {
  matcher: [
    // Skip static assets, but allow pages and API endpoints to be processed
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$).*)",
  ],
};
