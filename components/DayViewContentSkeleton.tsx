import React from 'react';
import skeletonStyles from './Skeleton.module.css'; // Reusing Skeleton animation styles

export default function DayViewContentSkeleton() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>

            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Progress Card Skeleton */}
                <div className={skeletonStyles.skeletonCard} style={{ height: '150px' }}>
                    <div className={`${skeletonStyles.header} ${skeletonStyles.shimmer}`} style={{ width: '40%' }}></div>
                    <div className={`${skeletonStyles.line} ${skeletonStyles.shimmer}`} style={{ width: '100%', height: '10px', marginTop: 'auto' }}></div>
                </div>

                {/* Tasks Skeleton (DayColumn) */}
                <div className={skeletonStyles.skeletonCard} style={{ height: '400px' }}>
                    <div className={`${skeletonStyles.header} ${skeletonStyles.shimmer}`} style={{ width: '30%' }}></div>
                    <div className={skeletonStyles.content}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                <div className={skeletonStyles.shimmer} style={{ width: '24px', height: '24px', borderRadius: '50%' }}></div>
                                <div className={`${skeletonStyles.line} ${skeletonStyles.shimmer}`} style={{ flex: 1 }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Gratitude Skeleton */}
            <div className={skeletonStyles.skeletonCard} style={{ height: 'auto', minHeight: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div className={`${skeletonStyles.header} ${skeletonStyles.shimmer}`} style={{ width: '40%' }}></div>
                    <div className={`${skeletonStyles.lineShort} ${skeletonStyles.shimmer}`} style={{ width: '80px', height: '36px' }}></div>
                </div>
                <div className={`${skeletonStyles.line} ${skeletonStyles.shimmer}`} style={{ height: '100%', flex: 1, borderRadius: '8px' }}></div>
            </div>

            {/* Journal Section Skeleton (Merged into grid or separate? In Page it was separate below grid, but layout-wise it's okay to be part of content skeleton if we wrap it) */}
            {/* Wait, the original page has Journal below the grid. The standard DayView has <div grid> then <div journal>. */}
            {/* So this component should probably return a Fragment or a Wrapper div containing both grid and journal */}
        </div>
    );
}

export function DayViewJournalSkeleton() {
    return (
        <div className={skeletonStyles.skeletonCard} style={{ marginTop: '2rem', height: '250px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div className={`${skeletonStyles.header} ${skeletonStyles.shimmer}`} style={{ width: '30%' }}></div>
                <div className={`${skeletonStyles.lineShort} ${skeletonStyles.shimmer}`} style={{ width: '80px', height: '36px' }}></div>
            </div>
            <div className={`${skeletonStyles.line} ${skeletonStyles.shimmer}`} style={{ height: '100%', flex: 1, borderRadius: '8px' }}></div>
        </div>
    );
}
