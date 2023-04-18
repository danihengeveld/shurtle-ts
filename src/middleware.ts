import { getAuth, withClerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "./env.mjs";
import { Client } from "@planetscale/database";
import { type Shurtle } from "@prisma/client";

// Set the paths that require the user to be signed in
const privatePaths = ["/dashboard", "/preview"];

const isPrivate = (path: string) => {
  return privatePaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace("*$", "($|/)")))
  );
};

const isApi = (path: string) => {
  return path.startsWith("/api");
};

export default withClerkMiddleware(async (req: NextRequest) => {
  if (
    !isPrivate(req.nextUrl.pathname) &&
    !isApi(req.nextUrl.pathname) &&
    req.nextUrl.pathname !== "/"
  ) {
    const client = new Client({
      url: env.DATABASE_URL,
    });
    const conn = client.connection();

    const queryResult = await conn.execute(
      "select * from Shurtle where slug = :slug",
      { slug: req.nextUrl.pathname.replace("/", "") },
      { as: "object" }
    );

    if (queryResult.size < 1) {
      return NextResponse.redirect(
        req.nextUrl.href.replace(req.nextUrl.pathname, "/")
      );
    }

    const shurtle = queryResult.rows[0] as Shurtle;

    await conn.execute(
      "update Shurtle set hits = hits + 1 where slug = :slug",
      { slug: shurtle.slug }
    );

    return NextResponse.redirect(shurtle.url);
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
    "/(.*?trpc.*?|(?!static|.*\\..*|_next|favicon.ico).*)",
    "/",
  ],
};
