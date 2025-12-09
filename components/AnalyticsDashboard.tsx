'use client';

import styles from './AnalyticsDashboard.module.css';

export default function AnalyticsDashboard() {
    return (
        <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <h1 style={{ fontSize: '2rem', color: 'var(--color-primary-600)', marginBottom: '1rem' }}>Analytics Dashboard</h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)' }}>Coming soon</p>
        </div>
    );
}
