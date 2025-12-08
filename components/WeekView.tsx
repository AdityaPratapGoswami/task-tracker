'use client';

import { useState, useEffect } from 'react';
import { startOfWeek, addDays, format, subDays, endOfWeek } from 'date-fns';
import Link from 'next/link';
import { ITask } from '@/models/Task';
import DayColumn from './DayColumn';
import AddTaskModal from './AddTaskModal';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './WeekView.module.css';
import { useAuth } from '@/context/AuthContext';

import WeekSummary from './WeekSummary';
import { IGratitude } from '@/models/Gratitude';
import { IJournal } from '@/models/Journal';

export default function WeekView() {
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [gratitudes, setGratitudes] = useState<IGratitude[]>([]);
    const [journals, setJournals] = useState<IJournal[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    // const { logout } = useAuth(); // Moved to ProfilePage
    // const { logout } = useAuth(); // Moved to ProfilePage

    useEffect(() => {
        setCurrentDate(new Date());
    }, []);

    // Calculate week days (Mon-Sun)
    const startOfCurrentWeek = currentDate ? startOfWeek(currentDate, { weekStartsOn: 1 }) : new Date();
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

    // Date Range String
    const dateRangeStr = `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')} `;

    const handlePrevWeek = () => {
        if (currentDate) {
            setCurrentDate(subDays(currentDate, 7));
        }
    };

    const handleNextWeek = () => {
        if (currentDate) {
            setCurrentDate(addDays(currentDate, 7));
        }
    };

    useEffect(() => {
        if (currentDate) {
            fetchTasks();
        }
    }, [currentDate]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const start = format(weekDays[0], 'yyyy-MM-dd');
            const end = format(weekDays[6], 'yyyy-MM-dd');

            // Fetch tasks, gratitudes, and journals in parallel
            const [tasksRes, gratitudesRes, journalsRes] = await Promise.all([
                fetch(`/api/tasks?startDate=${start}&endDate=${end}`),
                fetch(`/api/gratitude?startDate=${start}&endDate=${end}`),
                fetch(`/api/journal?startDate=${start}&endDate=${end}`)
            ]);

            if (tasksRes.ok) {
                const data: ITask[] = await tasksRes.json();

                // Process tasks to merge regular ones into each day
                const processedTasks: ITask[] = [];

                // Separate separate regular and spontaneous
                const regularTasks = data.filter(t => t.type === 'regular');
                const spontaneousTasks = data.filter(t => t.type === 'spontaneous'); // or !regular

                weekDays.forEach(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');

                    // Add spontaneous tasks for this day
                    const daysSpontaneous = spontaneousTasks.filter(t => t.date === dateStr);
                    processedTasks.push(...daysSpontaneous);

                    // Add regular tasks for this day (as virtual instances)
                    regularTasks.forEach(regTask => {
                        // Check if completed for this specific date
                        const isCompletedForDay = regTask.completedDates?.includes(dateStr) || false;

                        // Create a virtual task instance for rendering
                        processedTasks.push({
                            ...regTask,
                            date: dateStr, // Override date to match the column
                            isCompleted: isCompletedForDay // Override completion status
                        });
                    });
                });

                setTasks(processedTasks);
            }

            if (gratitudesRes.ok) {
                setGratitudes(await gratitudesRes.json());
            }

            if (journalsRes.ok) {
                setJournals(await journalsRes.json());
            }

        } catch (error) {
            console.error('Failed to fetch week data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = async (id: string, isCompleted: boolean, date?: string) => {
        // Optimistic update
        setTasks(prev => prev.map(t => {
            // For regular tasks, we need to match ID AND date to update specific instance
            if (t._id === id && (t.type === 'regular' ? t.date === date : true)) {
                return { ...t, isCompleted };
            }
            return t;
        }));

        try {
            const body: any = { isCompleted };

            // If we have a date (for regular tasks), send it
            // We need to find the task to check type, but we passed ID. 
            // The API expects toggleDate for regular tasks.
            if (date) {
                body.toggleDate = date;
            }

            await fetch(`/api/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        } catch (error) {
            console.error('Failed to toggle task', error);
            // Revert on failure
            fetchTasks();
        }
    };

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddTask = async (taskData: { title: string; category: string }) => {
        // Use the Monday of the currently viewed week
        const dateStr = format(weekDays[0], 'yyyy-MM-dd');

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...taskData,
                    date: dateStr,
                    isCompleted: false
                }),
            });

            if (res.ok) {
                fetchTasks();
            }
        } catch (error) {
            console.error('Failed to create task', error);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Weekly Tracker</h1>
                <div className={styles.actions}>
                    <Link href="/day" className="btn">
                        Day View
                    </Link>
                    <Link href="/profile" className="btn">
                        Profile
                    </Link>
                    <Link href="/analytics" className="btn">
                        Analytics
                    </Link>
                    <button className="btn" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} style={{ marginRight: '0.5rem' }} />
                        Add Task
                    </button>
                    {/* Logout moved to Profile page */}
                </div>
            </div>

            <AddTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddTask}
            />

            {!currentDate || loading ? (
                <div className={styles.calendarGrid}>
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className={styles.card} style={{ height: '300px', animation: 'pulse 1.5s infinite', background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ padding: '1rem', height: '100%' }}>
                                <div style={{ height: '24px', width: '40%', background: '#f1f5f9', borderRadius: '4px', marginBottom: '1rem' }}></div>
                                <div style={{ height: '16px', width: '80%', background: '#f1f5f9', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
                                <div style={{ height: '16px', width: '60%', background: '#f1f5f9', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-white)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid black', marginBottom: '1rem', width: 'fit-content' }}>
                        <button data-testid="prev-week-btn" onClick={handlePrevWeek} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                            <ChevronLeft size={20} color="var(--color-text-main)" />
                        </button>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-main)', minWidth: '140px', textAlign: 'center' }}>
                            {dateRangeStr}
                        </span>
                        <button data-testid="next-week-btn" onClick={handleNextWeek} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                            <ChevronRight size={20} color="var(--color-text-main)" />
                        </button>
                    </div>
                    <WeekSummary
                        days={weekDays}
                        tasks={tasks}
                        gratitudes={gratitudes}
                        journals={journals}
                    />


                    <div className={styles.calendarGrid} style={{ marginTop: '2rem' }}>
                        {weekDays.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const dayTasks = tasks.filter(t => t.date === dateStr);
                            return (
                                <DayColumn
                                    key={dateStr}
                                    date={day}
                                    tasks={dayTasks}
                                    onToggleTask={(id, isCompleted) => handleToggleTask(id, isCompleted, dateStr)}
                                />
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
