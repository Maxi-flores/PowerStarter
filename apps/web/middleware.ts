import { NextRequest, NextResponse } from "next/server";

/**
 * Routes under /api/instances require a valid bearer token so that only
 * authorized callers can write to the Powerstarter database.
 *
 * Authorization header format:
 *   Authorization: Bearer <POWERSTARTER_API_SECRET>
 */

/** Paths that require authentication (write operations only). */
const PROTECTED_PREFIXES = ["/api/instances"];

/** HTTP methods considered "write" operations. */
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function unauthorized(message: string): NextResponse {
  return NextResponse.json(
    { error: "Unauthorized", message },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Bearer realm="powerstarter-api"',
      },
    }
  );
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  const isProtected =
    WRITE_METHODS.has(method) &&
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  const apiSecret = process.env.POWERSTARTER_API_SECRET;
  if (!apiSecret) {
    console.error(
      "[middleware] POWERSTARTER_API_SECRET is not set – all write requests are blocked."
    );
    return unauthorized("Server is not configured for authenticated writes.");
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return unauthorized("Missing or malformed Authorization header.");
  }

  if (token !== apiSecret) {
    return unauthorized("Invalid API token.");
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Run the middleware only for API routes that may write to the database.
   * Static files, Next.js internals, and read-only routes are excluded.
   */
  matcher: ["/api/instances/:path*"],
};
