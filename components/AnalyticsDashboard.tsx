'use client';

import { useState, useEffect } from 'react';
import { startOfWeek, addDays, format, subDays, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import styles from './AnalyticsDashboard.module.css';

interface ITask {
    _id: string;
    title: string;
    category: string;
    type: 'regular' | 'spontaneous';
    isCompleted: boolean;
    completedDates: string[];
    date: string;
    endDate?: string;
}

interface DailyStats {
    name: string; // "Mon", "Tue"
    fullName: string; // "Monday", "Tuesday"
    fullDate: string; // "YYYY-MM-DD"
    total: number;
    completed: number;
    percentage: number | null;
}

interface TaskStat {
    id: string;
    title: string;
    completionRate: number;
}

export default function AnalyticsDashboard() {
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DailyStats[]>([]);
    const [taskStats, setTaskStats] = useState<TaskStat[]>([]);
    const [mostDone, setMostDone] = useState<TaskStat | null>(null);
    const [leastDone, setLeastDone] = useState<TaskStat | null>(null);

    useEffect(() => {
        setCurrentDate(new Date());
    }, []);

    useEffect(() => {
        if (currentDate) {
            fetchStats();
        }
    }, [currentDate]);

    // Calculate week start (Monday)
    const startOfCurrentWeek = currentDate ? startOfWeek(currentDate, { weekStartsOn: 1 }) : new Date();
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));
    const dateRangeStr = `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`;

    const handlePrevWeek = () => {
        if (currentDate) setCurrentDate(subDays(currentDate, 7));
    };

    const handleNextWeek = () => {
        if (currentDate) setCurrentDate(addDays(currentDate, 7));
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const start = format(weekDays[0], 'yyyy-MM-dd');
            const end = format(weekDays[6], 'yyyy-MM-dd');

            const res = await fetch(`/api/tasks?startDate=${start}&endDate=${end}`);
            if (res.ok) {
                const tasks: ITask[] = await res.json();
                processTasks(tasks);
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };

    const processTasks = (tasks: ITask[]) => {
        const regularTasks = tasks.filter(t => t.type === 'regular');
        const spontaneousTasks = tasks.filter(t => t.type === 'spontaneous');
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        // --- Weekly Graph Stats ---
        const newStats: DailyStats[] = weekDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            let dailyTotal = 0;
            let dailyCompleted = 0;

            // Count Spontaneous tasks for this day
            const daysSpontaneous = spontaneousTasks.filter(t => t.date === dateStr);
            dailyTotal += daysSpontaneous.length;
            dailyCompleted += daysSpontaneous.filter(t => t.isCompleted).length;

            // Count Regular tasks active on this day
            regularTasks.forEach(task => {
                const isStarted = task.date <= dateStr;
                const isEnded = task.endDate && task.endDate < dateStr;
                if (isStarted && !isEnded) {
                    dailyTotal++;
                    if (task.completedDates?.includes(dateStr)) {
                        dailyCompleted++;
                    }
                }
            });

            // If the day is in the future, return null for percentage to break the line
            // const percentage = dateStr > todayStr
            //     ? null
            //     : (dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0);
            const percentage = dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0;

            return {
                name: format(day, 'EEE'),
                fullName: format(day, 'EEEE'),
                fullDate: format(day, 'MMM d'),
                total: dailyTotal,
                completed: dailyCompleted,
                percentage
            };
        });
        setStats(newStats);

        // --- Detailed Task Completion Stats (Regular Only) ---
        const statsMap: TaskStat[] = regularTasks.map(task => {
            let possibleDays = 0;
            let completedCount = 0;

            weekDays.forEach(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isStarted = task.date <= dateStr;
                const isEnded = task.endDate && task.endDate < dateStr;

                if (isStarted && !isEnded) {
                    possibleDays++;
                    if (task.completedDates?.includes(dateStr)) {
                        completedCount++;
                    }
                }
            });

            const rate = possibleDays > 0 ? Math.round((completedCount / possibleDays) * 100) : 0;
            return {
                id: task._id,
                title: task.title,
                completionRate: rate
            };
        });

        // Filter out tasks that were not active at all during this week (rate 0 and possibleDays 0 edge case handled by map logic but let's be safe)
        // Actually showing 0% tasks is requested (Least Done).

        // Sort descending by completion rate
        statsMap.sort((a, b) => b.completionRate - a.completionRate);

        setTaskStats(statsMap);

        if (statsMap.length > 0) {
            setMostDone(statsMap[0]);
            // Find least done (from active tasks). If there are multiple 0s, take the last one.
            setLeastDone(statsMap[statsMap.length - 1]);
        } else {
            setMostDone(null);
            setLeastDone(null);
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as DailyStats;
            return (
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '10px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid var(--color-grey-200)'
                }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-primary-600)' }}>{data.fullName}</p>
                    <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        {data.completed}/{data.total} Tasks ({data.percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                <div className={styles.glassControl}>
                    <button onClick={handlePrevWeek} className={styles.navButton}>
                        <ChevronLeft size={20} />
                    </button>
                    <span className={styles.dateRangeText}>
                        {dateRangeStr}
                    </span>
                    <button onClick={handleNextWeek} className={styles.navButton}>
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className={styles.chartContainer}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Weekly Task Completion Rate</h3>

                    {loading ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                            Loading...
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={stats} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-grey-200)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--color-text-main)', fontSize: 14, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--color-text-main)', fontSize: 14, fontWeight: 600 }}
                                    domain={[0, 100]}
                                    ticks={[0, 20, 40, 60, 80, 100]}
                                    unit="%"
                                    dx={-10}
                                    width={45}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-grey-300)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Line
                                    type="monotone"
                                    dataKey="percentage"
                                    stroke="var(--color-primary-600)"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "var(--color-white)", stroke: "var(--color-primary-600)", strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: "var(--color-primary-600)", stroke: "var(--color-white)", strokeWidth: 2 }}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Task Completion Stats Module */}
                <div className={styles.statsSection}>
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statTitle} style={{ color: 'var(--color-success)' }}>Most Done</div>
                            <div className={styles.statValue}>
                                {mostDone ? mostDone.title : 'N/A'}
                            </div>
                            {mostDone && <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{mostDone.completionRate}% completion</div>}
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statTitle} style={{ color: 'var(--color-danger)' }}>Least Done</div>
                            <div className={styles.statValue}>
                                {leastDone ? leastDone.title : 'N/A'}
                            </div>
                            {leastDone && <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{leastDone.completionRate}% completion</div>}
                        </div>
                    </div>

                    <div className={styles.taskListContainer}>
                        <h4 className={styles.taskListHeader}>Regular Task Performance</h4>
                        {taskStats.length > 0 ? (
                            <div>
                                {taskStats.map(stat => (
                                    <div key={stat.id} className={styles.taskListItem}>
                                        <div className={styles.taskInfo}>
                                            <div className={styles.taskTitle}>{stat.title}</div>
                                        </div>
                                        <div className={styles.taskMeta}>
                                            <div className={styles.progressBar}>
                                                <div
                                                    className={`${styles.progressFill} ${stat.completionRate >= 66 ? styles.high : stat.completionRate >= 33 ? styles.medium : styles.low}`}
                                                    style={{ width: `${stat.completionRate}%` }}
                                                />
                                            </div>
                                            <div className={styles.percentage}>{stat.completionRate}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.noData}>No regular tasks found for this week.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
