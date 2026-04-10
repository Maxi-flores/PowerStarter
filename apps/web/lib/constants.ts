/**
 * App-wide constants.
 *
 * Import from here rather than inlining literals so there is a single place
 * to update values that are referenced across multiple files.
 */

/** Canonical origin of the Powerstarter web app. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://therockettree.com";
