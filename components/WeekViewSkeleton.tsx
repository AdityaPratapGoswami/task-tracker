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

                <div className={styles.calendarGrid} style={{ marginTop: '2rem' }}>
                    {/* Render 3 Columns for Masonry Effect Mimicry or just a simple grid */}
                    {/* Since we don't have the masonry logic here easily, we'll just render the grid 
              If the CSS handles columns, we just dump items.
              However, WeekView uses a manual column split. 
              Let's mimic the 3-column structure visually.
          */}
                    {[0, 1, 2].map((colIndex) => (
                        <div key={colIndex} className={styles.masonryColumn}>
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
