"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Layout, BarChart2, User } from 'lucide-react';
import Logo from './Logo';
import styles from './NavBar.module.css';

export default function NavBar() {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const links = [
        { href: '/', label: 'Week View', icon: Calendar },
        { href: '/day', label: 'Day View', icon: Layout },
        { href: '/analytics', label: 'Analytics', icon: BarChart2 },
        { href: '/profile', label: 'Profile', icon: User },
    ];

    return (
        <nav className={`${styles.navContainer} ${isScrolled ? styles.scrolled : ''}`}>
            <div className={styles.logoSection}>
                <Logo />
            </div>

            <div className={styles.linksSection}>
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                            title={link.label}
                        >
                            <Icon size={18} />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
