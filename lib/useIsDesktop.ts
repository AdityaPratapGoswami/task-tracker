'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(min-width: 1024px)';

function subscribe(callback: () => void) {
    const mql = window.matchMedia(QUERY);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
}

function getSnapshot() {
    return window.matchMedia(QUERY).matches;
}

// The server has no viewport, so it always reports `null`. Callers render a
// skeleton for that first pass and pick a tree once the client takes over.
// This keeps only one of the two layouts mounted, so the hidden one never
// fetches or hydrates.
function getServerSnapshot(): boolean | null {
    return null;
}

export default function useIsDesktop(): boolean | null {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
