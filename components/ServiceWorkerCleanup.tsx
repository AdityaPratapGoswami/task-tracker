'use client';

import { useEffect } from 'react';

/**
 * Removes the service worker that next-pwa used to install.
 *
 * public/sw.js self-destructs, but that only runs once the browser decides to
 * check for a worker update, which it may defer for up to a day. This does the
 * same job immediately on first load so an affected device recovers without
 * anyone opening DevTools.
 *
 * It's a no-op once there's nothing left to clean up, so it's safe to leave
 * mounted. Remove it (and public/sw.js) once no client is plausibly still
 * running the old worker.
 */
export default function ServiceWorkerCleanup() {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        (async () => {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map((r) => r.unregister()));

                if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((key) => caches.delete(key)));
                }
            } catch {
                // Cleanup is best-effort; never let it break rendering.
            }
        })();
    }, []);

    return null;
}
