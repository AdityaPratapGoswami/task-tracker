import React from 'react';
import SkeletonCard from './SkeletonCard';
import styles from './WeekView.module.css'; // Reusing WeekView grid styles

export default function WeekViewSkeleton() {
    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                <div className={styles.header} style={{ marginTop: '0', marginBottom: '1rem', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                    {/* Title and Add Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Title "Week View" */}
                        <div style={{ width: '200px', height: '40px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}></div>
                        {/* Circular Add Button */}
                        <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.5)', borderRadius: '50%' }}></div>
                    </div>
                </div>

                {/* Controls Skeleton */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    {/* Glass Control Mimic */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.5)' }}>
                        {/* Prev Button */}
                        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></div>
                        {/* Date Text */}
                        <div style={{ width: '140px', height: '1.5rem', background: 'rgba(255,255,255,0.3)', borderRadius: '4px' }}></div>
                        {/* Next Button */}
                        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></div>
                    </div>
                </div>

                <div className={styles.desktopGrid} style={{ marginTop: '1rem' }}>
                    {[0, 1, 2].map((colIndex) => (
                        <div key={colIndex} className={styles.masonryColumn}>
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    ))}
                </div>

                <div className={styles.mobileGrid} style={{ marginTop: '1rem' }}>
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
