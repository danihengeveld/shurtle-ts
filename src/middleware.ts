import { getAuth, withClerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "./env.mjs";

// Set the paths that require the user to be signed in
const privatePaths = ["/dashboard"];

const isPrivate = (path: string) => {
  return privatePaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace("*$", "($|/)")))
  );
};

export default withClerkMiddleware((req: NextRequest) => {
  if (!isPrivate(req.nextUrl.pathname)) {
    return NextResponse.next();
  }
  const { userId } = getAuth(req);

  if (!userId) {
    const signInUrl = new URL(env.NEXT_PUBLIC_CLERK_SIGNIN_URL);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next
     * - static (static files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!static|.*\\..*|_next|favicon.ico).*)",
    "/",
  ],
};
