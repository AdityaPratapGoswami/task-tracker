'use client';

import React, { useMemo } from 'react';
import styles from './ImportantUrgentMatrix.module.css';

interface ITask {
    _id: string;
    points?: 1 | 2 | 3;
    isImportant?: boolean;
    isUrgent?: boolean;
    isCompleted: boolean;
    completedDates?: string[];
    // We need logic to determine if a task is 'completed' in the context of the analytics view.
    // Usually analytics passes fetched tasks.
    // Assuming for analytics we just care if it WAS completed in the selected range, 
    // BUT the task object might only have global state.
    // Let's rely on how AnalyticsDashboard processes "completed" (checking completedDates for regular, isCompleted for spontaneous).
}

interface ImportantUrgentMatrixProps {
    // tasks prop removed as we use processedTasks
    processedTasks: {
        id: string;
        title: string;
        isImportant: boolean;
        isUrgent: boolean;
        points: number;
        isCompleted: boolean; // Computed by parent for the selected range
    }[];
    onQuadrantSelect: (quadrant: string | null) => void;
    selectedQuadrant: string | null;
}

export default function ImportantUrgentMatrix({ processedTasks, onQuadrantSelect, selectedQuadrant }: ImportantUrgentMatrixProps) {

    const stats = useMemo(() => {
        const quadrants = {
            important_urgent: { total: 0, completed: 0, rate: 0, count: 0 },
            important_not_urgent: { total: 0, completed: 0, rate: 0, count: 0 },
            not_important_urgent: { total: 0, completed: 0, rate: 0, count: 0 },
            not_important_not_urgent: { total: 0, completed: 0, rate: 0, count: 0 },
        };

        processedTasks.forEach(task => {
            let key = '';
            if (task.isImportant && task.isUrgent) key = 'important_urgent';
            else if (task.isImportant && !task.isUrgent) key = 'important_not_urgent';
            else if (!task.isImportant && task.isUrgent) key = 'not_important_urgent';
            else key = 'not_important_not_urgent';

            const q = quadrants[key as keyof typeof quadrants];
            q.total += task.points;
            q.count += 1;
            if (task.isCompleted) {
                q.completed += task.points;
            }
        });

        // Calculate rates
        Object.keys(quadrants).forEach(k => {
            const key = k as keyof typeof quadrants;
            const q = quadrants[key];
            q.rate = q.total > 0 ? Math.round((q.completed / q.total) * 100) : 0;
        });

        return quadrants;
    }, [processedTasks]);

    const handleClick = (quadrant: string) => {
        if (selectedQuadrant === quadrant) {
            onQuadrantSelect(null);
        } else {
            onQuadrantSelect(quadrant);
        }
    };

    return (
        <div className={styles.matrixContainer}>
            <h3 className={styles.title}>Eisenhower Matrix (Completion Rate)</h3>
            <div className={styles.grid}>
                {/* Quadrant 1: Important & Urgent */}
                <div
                    className={`${styles.quadrant} ${selectedQuadrant === 'important_urgent' ? styles.selected : ''}`}
                    onClick={() => handleClick('important_urgent')}
                >
                    <div className={styles.quadrantTitle}>Important & Urgent</div>
                    <div className={styles.percentage}>{stats.important_urgent.rate}%</div>
                    <div className={styles.stats}>
                        {stats.important_urgent.completed}/{stats.important_urgent.total} pts ({stats.important_urgent.count} tasks)
                    </div>
                </div>

                {/* Quadrant 2: Important & Not Urgent */}
                <div
                    className={`${styles.quadrant} ${selectedQuadrant === 'important_not_urgent' ? styles.selected : ''}`}
                    onClick={() => handleClick('important_not_urgent')}
                >
                    <div className={styles.quadrantTitle}>Important & Not Urgent</div>
                    <div className={styles.percentage}>{stats.important_not_urgent.rate}%</div>
                    <div className={styles.stats}>
                        {stats.important_not_urgent.completed}/{stats.important_not_urgent.total} pts ({stats.important_not_urgent.count} tasks)
                    </div>
                </div>

                {/* Quadrant 3: Not Important & Urgent */}
                <div
                    className={`${styles.quadrant} ${selectedQuadrant === 'not_important_urgent' ? styles.selected : ''}`}
                    onClick={() => handleClick('not_important_urgent')}
                >
                    <div className={styles.quadrantTitle}>Not Important & Urgent</div>
                    <div className={styles.percentage}>{stats.not_important_urgent.rate}%</div>
                    <div className={styles.stats}>
                        {stats.not_important_urgent.completed}/{stats.not_important_urgent.total} pts ({stats.not_important_urgent.count} tasks)
                    </div>
                </div>

                {/* Quadrant 4: Not Important & Not Urgent */}
                <div
                    className={`${styles.quadrant} ${selectedQuadrant === 'not_important_not_urgent' ? styles.selected : ''}`}
                    onClick={() => handleClick('not_important_not_urgent')}
                >
                    <div className={styles.quadrantTitle}>Not Important & Not Urgent</div>
                    <div className={styles.percentage}>{stats.not_important_not_urgent.rate}%</div>
                    <div className={styles.stats}>
                        {stats.not_important_not_urgent.completed}/{stats.not_important_not_urgent.total} pts ({stats.not_important_not_urgent.count} tasks)
                    </div>
                </div>
            </div>
        </div>
    );
}
