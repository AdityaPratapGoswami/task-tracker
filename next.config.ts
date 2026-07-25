import type { NextConfig } from "next";

/*
 * next-pwa was removed deliberately.
 *
 * Its service worker cached App Router RSC payloads ("pages-rsc",
 * "pages-rsc-prefetch") and documents with NetworkFirst. After every deploy
 * that served stale payloads referencing build chunks which no longer
 * existed, so client-side tab switches to /day and /analytics either hung on
 * the 10s network timeout or failed outright.
 *
 * The previous config also passed `runtimeCaching` and `buildExcludes` at the
 * top level, which @ducanh2912/next-pwa v10 does not accept (they belong under
 * `workboxOptions`) — so none of that config ever applied and the plugin's far
 * more aggressive defaults were what actually shipped.
 *
 * Every screen in this app needs the network and a valid session to render
 * anything, so there was no offline benefit to trade away. public/sw.js is now
 * a hand-written kill-switch that unregisters the old worker; see that file.
 */
const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
