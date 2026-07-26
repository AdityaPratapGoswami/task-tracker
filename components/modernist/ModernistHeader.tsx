'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { format, getISOWeek } from 'date-fns';
import Logo from './Logo';

// The clock never pushes updates, so there's nothing to subscribe to — this
// only exists to give useSyncExternalStore a snapshot that's null on the
// server and the real stamp on the client, without a setState-in-effect
// round trip (which was the previous implementation and cost an extra render
// on every page load).
function subscribe() {
    return () => { };
}

function getSnapshot() {
    const now = new Date();
    return `Week ${getISOWeek(now)} · ${format(now, 'yyyy')}`;
}

function getServerSnapshot() {
    return '';
}

const LINKS = [
    { href: '/', label: 'Week' },
    { href: '/day', label: 'Day' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/profile', label: 'Profile' },
];

export default function ModernistHeader() {
    const pathname = usePathname();
    // Empty on the server, the real stamp once mounted on the client.
    const stamp = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    return (
        <header className="m-header">
            <div className="m-brandwrap">
                <Logo variant="mark" size={22} />
                <span className="m-brand">BALANCE</span>
                <span className="m-kicker">{stamp}</span>
            </div>
            <nav className="m-nav">
                {LINKS.map((link) => (
                    <Link key={link.href} href={link.href} className="m-tab">
                        {link.label}
                        {pathname === link.href && <span className="m-tab-mark" />}
                    </Link>
                ))}
            </nav>
        </header>
    );
}
