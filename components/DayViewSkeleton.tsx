import React from 'react';
import styles from './WeekView.module.css'; // Reusing WeekView layout styles
import skeletonStyles from './Skeleton.module.css'; // Reusing Skeleton animation styles
import DayViewContentSkeleton, { DayViewJournalSkeleton } from './DayViewContentSkeleton';

export default function DayViewSkeleton() {
    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                {/* Header Skeleton */}
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Title */}
                        <div className={skeletonStyles.shimmer} style={{ width: '200px', height: '40px', borderRadius: '8px' }}></div>
                        {/* Add Button */}
                        <div className={skeletonStyles.shimmer} style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
                    </div>
                    {/* Action Buttons */}
                    <div className={styles.actions}>
                        <div className={skeletonStyles.shimmer} style={{ width: '100px', height: '40px', borderRadius: '8px' }}></div>
                        <div className={skeletonStyles.shimmer} style={{ width: '100px', height: '40px', borderRadius: '8px' }}></div>
                        <div className={skeletonStyles.shimmer} style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
                    </div>
                </div>

                {/* Content Skeletons */}
                <DayViewContentSkeleton />
                <DayViewJournalSkeleton />
            </div>
        </div>
    );
}
