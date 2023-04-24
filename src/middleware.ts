import { getAuth, withClerkMiddleware } from "@clerk/nextjs/server";
import { Kysely } from "kysely";
import { PlanetScaleDialect } from "kysely-planetscale";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "./env.mjs";
import { type ShurtleDatabase } from "./lib/shurtle-kysely-types.js";

// Set the paths that do not result to redirection
const reservedPaths = ["/dashboard", "/preview"];

const isReserved = (path: string) => {
  return reservedPaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace("*$", "($|/)")))
  );
};

const isApi = (path: string) => {
  return path.startsWith("/api");
};

export default withClerkMiddleware(async (req: NextRequest) => {
  if (
    !isReserved(req.nextUrl.pathname) &&
    !isApi(req.nextUrl.pathname) &&
    req.nextUrl.pathname !== "/"
  ) {
    const db = new Kysely<ShurtleDatabase>({
      dialect: new PlanetScaleDialect({
        url: env.DATABASE_URL,
      }),
    });

    const shurtle = await db
      .selectFrom("Shurtle")
      .select(["slug", "url"])
      .where("slug", "=", req.nextUrl.pathname.replace("/", ""))
      .executeTakeFirst();

    if (!shurtle) {
      return NextResponse.redirect(
        req.nextUrl.href.replace(req.nextUrl.pathname, "/")
      );
    }

    await db
      .updateTable("Shurtle")
      .set(({ bxp }) => ({
        hits: bxp("hits", "+", 1),
      }))
      .where("slug", "=", shurtle.slug)
      .executeTakeFirst();

    return NextResponse.redirect(shurtle.url);
  }

  if (req.nextUrl.pathname !== "/") {
    const { userId } = getAuth(req);

    if (!userId) {
      const signInUrl = new URL(env.NEXT_PUBLIC_CLERK_SIGNIN_URL);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
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
