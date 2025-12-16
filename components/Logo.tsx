import { Zap } from 'lucide-react';
import styles from './Logo.module.css';

interface LogoProps {
    size?: 'small' | 'medium' | 'large';
    showText?: boolean;
    className?: string; // Allow extending classes
}

export default function Logo({ size = 'medium', showText = true, className = '' }: LogoProps) {
    const iconSize = size === 'small' ? 18 : size === 'large' ? 24 : 20;

    return (
        <div className={`${styles.logo} ${styles[size]} ${className}`}>
            <div className={styles.iconWrapper}>
                <Zap size={iconSize} fill="currentColor" />
            </div>
            {showText && <span className={`${styles.text} text-title`}>Balance</span>}
        </div>
    );
}
