import React from 'react';
import styles from './Skeleton.module.css';

export default function SkeletonCard() {
    return (
        <div className={styles.skeletonCard}>
            {/* Header mimics Day header */}
            <div className={`${styles.header} ${styles.shimmer}`} />

            {/* Content mimics tasks */}
            <div className={styles.content}>
                <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '80%' }} />
                <div className={`${styles.lineShort} ${styles.shimmer}`} />
                <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '90%' }} />
            </div>

            {/* More tasks lower down */}
            <div className={styles.content} style={{ marginTop: '1rem' }}>
                <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '70%' }} />
                <div className={`${styles.lineShort} ${styles.shimmer}`} />
            </div>
        </div>
    );
}
