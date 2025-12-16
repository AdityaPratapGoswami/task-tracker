"use client";

import { usePathname } from 'next/navigation';
import NavBar from './NavBar';
import { useAuth } from '@/context/AuthContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, loading } = useAuth();

    // Auth pages where we never want to show the NavBar
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    // Also likely don't want to show it if we are loading the user state (to avoid flash)
    // BUT user wanted NavBar to persist, so we should be careful.
    // However, if we are not logged in, we shouldn't show it.
    // If we rely on AuthContext, we might get a flash if user is null initially.
    // Let's stick to pathname logic mainly, avoiding complex auth state flashes for now unless strictly needed.
    // The previous NavBar implementation didn't seem to check for user existence explicitly before rendering, 
    // it was just included in pages that required auth.

    return (
        <>
            {!isAuthPage && <NavBar />}
            <main style={{ minHeight: '100vh' }}>
                {children}
            </main>
        </>
    );
}
