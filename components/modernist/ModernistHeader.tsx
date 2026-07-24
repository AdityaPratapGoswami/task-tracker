'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format, getISOWeek } from 'date-fns';

const LINKS = [
    { href: '/', label: 'Week' },
    { href: '/day', label: 'Day' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/profile', label: 'Profile' },
];

export default function ModernistHeader() {
    const pathname = usePathname();
    // Rendered after mount only, so the server never has to guess the date.
    const [stamp, setStamp] = useState('');

    useEffect(() => {
        const now = new Date();
        setStamp(`Week ${getISOWeek(now)} · ${format(now, 'yyyy')}`);
    }, []);

    return (
        <header className="m-header">
            <div className="m-brandwrap">
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
