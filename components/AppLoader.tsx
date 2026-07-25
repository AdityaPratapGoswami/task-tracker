'use client';

import { Zap } from 'lucide-react';

/**
 * Shared loading state for every route.
 *
 * This has to work before the client knows whether it's rendering the
 * Modernist desktop boards or the legacy mobile UI (useIsDesktop hasn't
 * resolved yet, so no header/chrome exists either) — so it's a single
 * minimal, theme-agnostic mark rather than a skeleton shaped like either
 * screen.
 */
export default function AppLoader() {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                // `--m-bg` is a :root token, so it's already defined even before
                // hydration decides whether this is the desktop or mobile UI —
                // an explicit opaque fill here is what stops the legacy page
                // background (the mobile gradient) from showing through behind
                // the mark during that undecided window.
                background: 'var(--m-bg, #f3f2f2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
            }}
        >
            <div
                style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    background: '#1a1a1a',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'app-loader-pulse 1.1s ease-in-out infinite',
                }}
            >
                <Zap size={34} fill="currentColor" />
            </div>
            <style>{`
                @keyframes app-loader-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(0.82); opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
