'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Minimal stale-while-revalidate cache for GET JSON endpoints.
 *
 * The boards used to hold their data in local state initialised to empty, so
 * every mount rendered a definitive empty state ("Nothing scheduled") before
 * the fetch resolved, and switching away and back refetched from scratch.
 * Caching at module scope means a screen you've already visited paints from
 * memory immediately and only refreshes in the background.
 *
 * Keyed by URL so it stays honest: a different date or week is a different
 * key, and therefore never shows another day's numbers under a new heading.
 * Deliberately not a dependency — the whole surface is one hook plus three
 * cache helpers, and SWR/react-query would be a lot of bytes for that.
 */

const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

/** Seeds a value without overwriting anything already fetched. */
export function primeCache<T>(url: string, value: T) {
    if (!cache.has(url)) cache.set(url, value);
}

export function writeCache<T>(url: string, value: T) {
    cache.set(url, value);
}

/** Drops matching entries so the next read refetches — use after mutations. */
export function invalidateCache(match: (url: string) => boolean) {
    for (const key of [...cache.keys()]) {
        if (match(key)) cache.delete(key);
    }
}

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} for ${url}`);
    return (await res.json()) as T;
}

export interface CachedResource<T> {
    data: T | undefined;
    /** True only when there is nothing to show yet — gate skeletons on this. */
    isLoading: boolean;
    /** Writes straight to the cache, for optimistic updates. */
    mutate: (next: T) => void;
    refresh: () => Promise<void>;
}

export function useCachedJson<T>(url: string | null, initial?: T): CachedResource<T> {
    // Seeding here rather than in an effect means server-rendered data is
    // available on the very first paint. It's idempotent, so the repeat render
    // under StrictMode is harmless.
    if (url && initial !== undefined) primeCache(url, initial);

    const [, bump] = useState(0);
    const rerender = useCallback(() => bump((n) => n + 1), []);

    useEffect(() => {
        if (!url) return;
        let cancelled = false;

        // Deduped: two components asking for the same URL in the same tick
        // share one request.
        let pending = inflight.get(url) as Promise<T> | undefined;
        if (!pending) {
            pending = fetchJson<T>(url)
                .then((value) => {
                    cache.set(url, value);
                    return value;
                })
                .finally(() => { inflight.delete(url); });
            inflight.set(url, pending);
        }

        pending
            .then(() => { if (!cancelled) rerender(); })
            // A failed refresh keeps whatever was already cached rather than
            // blanking the screen.
            .catch(() => { });

        return () => { cancelled = true; };
    }, [url, rerender]);

    const data = url ? (cache.get(url) as T | undefined) : undefined;

    const mutate = useCallback((next: T) => {
        if (!url) return;
        cache.set(url, next);
        rerender();
    }, [url, rerender]);

    const refresh = useCallback(async () => {
        if (!url) return;
        try {
            cache.set(url, await fetchJson<T>(url));
            rerender();
        } catch {
            // Keep the previous value.
        }
    }, [url, rerender]);

    return {
        data,
        isLoading: data === undefined,
        mutate,
        refresh,
    };
}
