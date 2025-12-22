'use client';

import { useState, useEffect, useMemo } from 'react';
import { startOfWeek, addDays, format, subDays, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
// import Link from 'next/link';
import NavBar from '@/components/NavBar';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import ImportantUrgentMatrix from './ImportantUrgentMatrix';
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
    points?: 1 | 2 | 3;
    isImportant?: boolean; // Added
    isUrgent?: boolean; // Added
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
    isImportant?: boolean;
    isUrgent?: boolean;
}

export default function AnalyticsDashboard() {
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DailyStats[]>([]);
    const [taskStats, setTaskStats] = useState<TaskStat[]>([]);
    const [mostDone, setMostDone] = useState<TaskStat | null>(null);
    const [leastDone, setLeastDone] = useState<TaskStat | null>(null);
    const [isListExpanded, setIsListExpanded] = useState(true);
    const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);
    const [allFetchedTasks, setAllFetchedTasks] = useState<ITask[]>([]);

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
                setAllFetchedTasks(tasks);
                processTasks(tasks);
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };



    // Prepare data for the Matrix
    // We want to pass ALL tasks that are relevant to this week to the matrix
    // Relevant = Spontaneous tasks in this week OR Regular tasks active in this week
    const matrixTasks = allFetchedTasks.map(task => {
        // Calculate dynamic "isCompleted" for the matrix visualization
        // For regular tasks, if they completed it AT LEAST ONCE this week, count as completed?
        // OR better: The matrix asks for "Completion Rate of POINTS".
        // The Plan says: "In each quadrant, calculate and display the completion rate of points."
        // So for a regular task worth 3 points, if it was done 2 out of 7 days, is that "completed"?
        // No, that's partial.

        // HOWEVER, the 2x2 matrix usually bucketizes TASKS.
        // If we want "Completion Rate of Points", we calculate coordinates based on (Total Points / Completed Points).
        // My previous matrix logic sums up points of "completed" tasks.
        // For a recurring task, it's not binary "completed" or "not".
        // BUT, the `ImportantUrgentMatrix` I wrote expects a boolean `isCompleted`.

        // COMPROMISE for Regular Tasks in Matrix:
        // A regular task is "completed" for the purpose of the Matrix if it was completed TODAY (if today is in view) 
        // OR if it has > 50% completion rate this week?
        // OR, maybe we should treat each "instance" of a regular task as a task?
        // That might be too complex for now.

        // SIMPLEST INTERPRETATION:
        // Identify if the task was completed *at all* during this week? 
        // Or better: Let's use the average completion.
        // IF a task is regular, `points` in the matrix = Total Potential Points for the week.
        // `completed` points = Actual Completed Points.
        // `ImportantUrgentMatrix` logic sums `points` if `isCompleted` is true.
        // This is binary.

        // Let's ADJUST `ImportantUrgentMatrix` logic slightly effectively by pre-calculating?
        // No, `ImportantUrgentMatrix` does: `if (task.isCompleted) q.completed += task.points`.

        // We can synthesize "Task Instances" for the matrix to get accurate Point completion.
        // E.g. for a Regular Task that spans 7 days, we create 7 items?
        // That effectively weights it correctly.

        // Let's attempt that: Flatten tasks into daily instances for the Matrix calculation?
        // That ensures "Completion Rate of Points" is accurate.
        return null;
    }).filter(Boolean);


    const processedMatrixTasks = useMemo(() => {
        const instances: any[] = [];
        const startStr = format(weekDays[0], 'yyyy-MM-dd');
        const endStr = format(weekDays[6], 'yyyy-MM-dd');

        allFetchedTasks.forEach(task => {
            if (task.type === 'spontaneous') {
                // Spontaneous tasks are single instances
                // Only include if date is in range (fetched tasks should already be filtered but double check)
                if (task.date >= startStr && task.date <= endStr) {
                    instances.push({
                        id: task._id,
                        title: task.title,
                        isImportant: task.isImportant || false,
                        isUrgent: task.isUrgent || false,
                        points: task.points || 1,
                        isCompleted: task.isCompleted
                    });
                }
            } else {
                // Regular tasks - generate an instance for each active day in the week
                weekDays.forEach(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isStarted = task.date <= dateStr;
                    const isEnded = task.endDate && task.endDate < dateStr;

                    if (isStarted && !isEnded) {
                        const isDone = task.completedDates?.includes(dateStr) || false;
                        instances.push({
                            id: `${task._id}-${dateStr}`, // Unique ID for React keys if needed, though Matrix doesn't list them
                            title: task.title, // Parent title
                            taskId: task._id, // Keep ref to parent
                            isImportant: task.isImportant || false,
                            isUrgent: task.isUrgent || false,
                            points: task.points || 1,
                            isCompleted: isDone
                        });
                    }
                });
            }
        });
        return instances;
    }, [allFetchedTasks, weekDays]); // Re-calculate when tasks or week (unlikely) changes


    const processTasks = (tasks: ITask[]) => {
        const regularTasks = tasks.filter(t => t.type === 'regular');
        const spontaneousTasks = tasks.filter(t => t.type === 'spontaneous');
        // const todayStr = format(new Date(), 'yyyy-MM-dd'); // Unused

        // --- Weekly Graph Stats ---
        const newStats: DailyStats[] = weekDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            let dailyTotal = 0;
            let dailyCompleted = 0;

            // Count Spontaneous tasks for this day
            const daysSpontaneous = spontaneousTasks.filter(t => t.date === dateStr);
            dailyTotal += daysSpontaneous.reduce((sum, t) => sum + (t.points || 1), 0);
            dailyCompleted += daysSpontaneous.filter(t => t.isCompleted).reduce((sum, t) => sum + (t.points || 1), 0);

            // Count Regular tasks active on this day
            regularTasks.forEach(task => {
                const isStarted = task.date <= dateStr;
                const isEnded = task.endDate && task.endDate < dateStr;
                if (isStarted && !isEnded) {
                    const points = task.points || 1;
                    dailyTotal += points;
                    if (task.completedDates?.includes(dateStr)) {
                        dailyCompleted += points;
                    }
                }
            });

            // If the day is in the future, return null for percentage to break the line
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
        // Originally this only showed Regular tasks. 
        // Modified Requirement: "Filter all tasks... drill down into the underlying task list".
        // So the list should probably show ALL tasks if we filter by matrix?
        // But the existing list says "Regular Task Performance".
        // Let's keep the existing list logic for "Default" view, but if a Quadrant is selected, show ALL matching tasks (Regular + Spontaneous).

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
                completionRate: rate,
                // Add these for fitlering
                isImportant: task.isImportant,
                isUrgent: task.isUrgent
            };
        });

        // Sort descending by completion rate
        statsMap.sort((a, b) => b.completionRate - a.completionRate);

        setTaskStats(statsMap);

        if (statsMap.length > 0) {
            setMostDone(statsMap[0]);
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
                        {data.completed}/{data.total} Points ({data.percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    // --- Filter Logic for List ---
    const filteredTaskStats = useMemo(() => {
        if (!selectedQuadrant) return taskStats;

        // When a quadrant is selected, what should we show?
        // The original list only shows "Regular" tasks with completion rates.
        // If I click "Important & Urgent", I expect to see tasks in that bucket.
        // Should I show Spontaneous tasks too? 
        // The user request says "drill down into the underlying task list".
        // The current list structure (`TaskStat`) has `completionRate` which makes sense for Regular tasks.
        // For Spontaneous tasks, `completionRate` is either 0 or 100% (done or not).
        // Let's Include Spontaneous tasks in the filtered view for completeness?
        // Or stick to Regular tasks to match the UI that shows a progress bar?

        // Let's stick to Regular tasks for now to maintain UI consistency for the progress bars, 
        // as `taskStats` is derived from `regularTasks`.
        // If the user wants to see Spontaneous tasks, we might need a different UI for them.
        // But for now, filtering the existing list is the safest bet to avoid UI regressions.

        return taskStats.filter(stat => {
            const isImp = stat.isImportant || false;
            const isUrg = stat.isUrgent || false;

            if (selectedQuadrant === 'important_urgent') return isImp && isUrg;
            if (selectedQuadrant === 'important_not_urgent') return isImp && !isUrg;
            if (selectedQuadrant === 'not_important_urgent') return !isImp && isUrg;
            if (selectedQuadrant === 'not_important_not_urgent') return !isImp && !isUrg;
            return true;
        });

    }, [taskStats, selectedQuadrant]);


    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>


                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', marginTop: '1rem' }}>
                    {/* Back button removed as navigation is in NavBar */}

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
                </div>

                <div className={styles.chartContainer}>
                    <h3 className={styles.sectionTitle}>Weekly Task Completion Rate</h3>

                    {loading ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                            Loading...
                        </div>
                    ) : (
                        <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
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
                        </div>
                    )}
                </div>

                {/* Important / Urgent Matrix */}
                {!loading && (
                    <ImportantUrgentMatrix
                        processedTasks={processedMatrixTasks}
                        onQuadrantSelect={setSelectedQuadrant}
                        selectedQuadrant={selectedQuadrant}
                    />
                )}

                {/* Task Completion Stats Module */}
                <div className={styles.statsSection}>
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statTitle} style={{ color: 'var(--color-success)' }}>Most Done</div>
                            <div className={styles.statValue}>
                                {mostDone ? mostDone.title : 'N/A'}
                            </div>
                            {mostDone && <div className="text-meta" style={{ color: 'var(--color-text-muted)' }}>{mostDone.completionRate}% completion</div>}
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statTitle} style={{ color: 'var(--color-danger)' }}>Least Done</div>
                            <div className={styles.statValue}>
                                {leastDone ? leastDone.title : 'N/A'}
                            </div>
                            {leastDone && <div className="text-meta" style={{ color: 'var(--color-text-muted)' }}>{leastDone.completionRate}% completion</div>}
                        </div>
                    </div>

                    <div className={styles.taskListContainer}>
                        <div className={styles.taskListHeader} onClick={() => setIsListExpanded(!isListExpanded)} style={{ cursor: 'pointer' }}>
                            <span className={styles.sectionTitle} style={{ margin: 0 }}>
                                {selectedQuadrant ? 'Filtered Tasks' : 'Regular Task Performance'}
                            </span>
                            <ChevronDown
                                size={20}
                                style={{
                                    transform: isListExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.6s ease'
                                }}
                            />
                        </div>

                        <div style={{
                            maxHeight: isListExpanded ? '2000px' : '0',
                            opacity: isListExpanded ? 1 : 0,
                            overflow: 'hidden',
                            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>
                            <div style={{ paddingTop: '2rem' }}>
                                {filteredTaskStats.length > 0 ? (
                                    <div>
                                        {filteredTaskStats.map((stat: any) => (
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
                                    <div className={styles.noData}>No tasks found for this selection.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
