import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { locales, defaultLocale } from "./lib/i18n";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

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

  // 3. User onboarding & session routing control
  const { userId } = await auth();
  if (userId) {
    // Extract locale and subpath
    const match = pathname.match(/^\/([a-z]{2})(?:\/(.*))?$/);
    const locale = match ? match[1] : null;
    const subpath = match ? match[2] || "" : "";
    const isAuthRoute = subpath.startsWith("sign-in") || subpath.startsWith("sign-up");

    if (locale && locales.includes(locale as any) && !isAuthRoute) {
      try {
        const userRecord = await db.query.users.findFirst({
          where: eq(users.clerkId, userId),
        });
        const completed = userRecord?.completedOnboarding ?? false;

        if (completed) {
          // Redirect from landing or onboarding to dashboard
          if (subpath === "" || subpath.startsWith("onboarding")) {
            return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
          }
        } else {
          // Redirect from landing or dashboard/practice pages to onboarding
          const dashboardPaths = ["dashboard", "vocabulary", "reading", "writing", "speaking", "listening", "settings"];
          const isDashboardPath = dashboardPaths.some(p => subpath === p || subpath.startsWith(p + "/"));
          if (subpath === "" || isDashboardPath) {
            return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url));
          }
        }
      } catch (err) {
        console.error("Middleware DB fetch error:", err);
      }
    }
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
