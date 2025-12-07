'use client';

import { useEffect, useState } from 'react';
import styles from './AnalyticsDashboard.module.css';

interface DailyStat {
    _id: string; // Date YYYY-MM-DD
    total: number;
    completed: number;
}

export default function AnalyticsDashboard() {
    const [stats, setStats] = useState<DailyStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className={styles.loading}>Loading analytics...</div>;

    const totalTasks = stats.reduce((acc, curr) => acc + curr.total, 0);
    const totalCompleted = stats.reduce((acc, curr) => acc + curr.completed, 0);
    const overallRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Performance Analytics</h2>

            <div className={styles.summary}>
                <div className={styles.card}>
                    <span className={styles.label}>Total Tasks</span>
                    <span className={styles.value}>{totalTasks}</span>
                </div>
                <div className={styles.card}>
                    <span className={styles.label}>Completed</span>
                    <span className={styles.value}>{totalCompleted}</span>
                </div>
                <div className={styles.card}>
                    <span className={styles.label}>Completion Rate</span>
                    <span className={styles.value}>{overallRate}%</span>
                </div>
            </div>

            <h3 className={styles.subtitle}>Daily Progress</h3>
            <div className={styles.chart}>
                {stats.map(stat => {
                    const rate = stat.total > 0 ? (stat.completed / stat.total) * 100 : 0;
                    return (
                        <div key={stat._id} className={styles.barContainer}>
                            <div className={styles.barWrapper}>
                                <div className={styles.bar} style={{ height: `${rate}%` }}></div>
                            </div>
                            <span className={styles.dateLabel}>{stat._id.slice(5)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
