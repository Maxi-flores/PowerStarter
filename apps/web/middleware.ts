import { NextRequest, NextResponse } from "next/server";

/**
 * Routes under /api/instances require a valid bearer token so that only
 * authorized callers can write to the Powerstarter database.
 *
 * Authorization header format:
 *   Authorization: Bearer <POWERSTARTER_API_SECRET>
 *
 * The secret is read once at module load time.  If it is not set the
 * middleware refuses ALL write requests immediately, so the misconfiguration
 * is surfaced on the first request rather than silently passing through.
 */

/** Paths that require authentication (write operations only). */
const PROTECTED_PREFIXES = ["/api/instances"];

/** HTTP methods considered "write" operations. */
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Read the secret once at module initialisation.
 * `undefined` means the server was started without the variable set;
 * all write requests will be blocked until it is provided.
 */
const API_SECRET: string | undefined = process.env.POWERSTARTER_API_SECRET;

if (!API_SECRET) {
  console.error(
    "[middleware] POWERSTARTER_API_SECRET is not set. " +
      "All write requests to /api/instances will be rejected until this " +
      "environment variable is configured."
  );
}

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

  if (!API_SECRET) {
    return unauthorized("Server is not configured for authenticated writes.");
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return unauthorized("Missing or malformed Authorization header.");
  }

  if (token !== API_SECRET) {
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
