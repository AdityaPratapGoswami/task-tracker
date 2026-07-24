"use client";

import { usePathname } from 'next/navigation';
import NavBar from './NavBar';
import ModernistHeader from './modernist/ModernistHeader';
import useIsDesktop from '@/lib/useIsDesktop';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDesktop = useIsDesktop();

    // Auth pages where we never want to show the NavBar
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    // `isDesktop` is null until the client mounts. Rendering no chrome for that
    // first paint is better than rendering the wrong one and swapping it.
    const chrome = isAuthPage || isDesktop === null
        ? null
        : isDesktop ? <ModernistHeader /> : <NavBar />;

    return (
        <>
            {chrome}
            {/* `m-page` both applies the Modernist surface and is the hook the
                stylesheet uses to switch the body off the legacy gradient. */}
            <main className={isDesktop && !isAuthPage ? 'm-page' : undefined} style={{ minHeight: '100vh' }}>
                {children}
            </main>
        </>
    );
}
