'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'balance-theme';

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

// The inline script in the root layout already sets the attribute before
// hydration, so this only has to read what's on the DOM, not decide it.
function getSnapshot(): Theme {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function getServerSnapshot(): Theme {
    return 'light';
}

export function useTheme() {
    const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const setTheme = useCallback((next: Theme) => {
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(STORAGE_KEY, next);
        listeners.forEach((l) => l());
    }, []);

    return { theme, setTheme };
}

/**
 * Inlined as the first child of <body> so the theme is set before anything
 * paints — a useEffect-driven toggle would flash light mode first on every
 * load for users who picked dark.
 */
export const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem('${STORAGE_KEY}')==='dark'){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`;
