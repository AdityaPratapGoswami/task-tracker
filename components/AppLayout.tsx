"use client";

import { usePathname } from 'next/navigation';
import ModernistHeader from './modernist/ModernistHeader';
import NarrowScreenNotice from './modernist/NarrowScreenNotice';
import AppLoader from './AppLoader';
import useIsDesktop from '@/lib/useIsDesktop';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDesktop = useIsDesktop();

    // Login and signup are full-bleed and carry no navigation.
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    // Static legal/info pages need to render on the server and on any device
    // — Google's OAuth branding verification fetches these without running
    // client JS, and a "laptop-only" gate would show it nothing.
    if (pathname === '/privacy' || pathname === '/about') return <>{children}</>;

    // Null while server-rendering and hydrating; matchMedia resolves
    // synchronously on the client, so this doesn't flash on navigation.
    if (isDesktop === null) return <AppLoader />;

    // The app is laptop-only by design, so narrow viewports get told that
    // rather than a squeezed version of a seven-column grid.
    if (!isDesktop) return <NarrowScreenNotice />;

    return (
        <>
            {!isAuthPage && <ModernistHeader />}
            <main className={isAuthPage ? undefined : 'm-page'} style={{ minHeight: '100vh' }}>
                {children}
            </main>
        </>
    );
}
