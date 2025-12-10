import React from 'react';
import SkeletonCard from './SkeletonCard';
import styles from './WeekView.module.css'; // Reusing WeekView grid styles

export default function WeekViewSkeleton() {
    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                <div className={styles.header}>
                    {/* Mimic Header Title */}
                    <div style={{ width: '200px', height: '40px', background: '#f1f5f9', borderRadius: '8px' }}></div>
                    <div className={styles.actions}>
                        <div style={{ width: '100px', height: '40px', background: '#f1f5f9', borderRadius: '8px' }}></div>
                        <div style={{ width: '100px', height: '40px', background: '#f1f5f9', borderRadius: '8px' }}></div>
                        <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '50%' }}></div>
                    </div>
                </div>

                <div className={styles.desktopGrid} style={{ marginTop: '2rem' }}>
                    {[0, 1, 2].map((colIndex) => (
                        <div key={colIndex} className={styles.masonryColumn}>
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    ))}
                </div>

                <div className={styles.mobileGrid} style={{ marginTop: '2rem' }}>
                    {[0, 1, 2, 3].map((index) => (
                        <div key={index} style={{ marginBottom: '1.5rem' }}>
                            <SkeletonCard />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
