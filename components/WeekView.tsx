'use client';

import { useState, useEffect } from 'react';
import { startOfWeek, addDays, format, subDays, endOfWeek } from 'date-fns';
import NavBar from './NavBar';
// import Link from 'next/link'; // Removed Link as it is handled by NavBar
import { ITask } from '@/models/Task';
import DayColumn from './DayColumn';
import Logo from './Logo';
import AddTaskModal from './AddTaskModal';
import { Plus, ChevronLeft, ChevronRight, User } from 'lucide-react';
import styles from './WeekView.module.css';
import { useAuth } from '@/context/AuthContext';

import WeekSummary from './WeekSummary';
import { IGratitude } from '@/models/Gratitude';
import { IJournal } from '@/models/Journal';
import WeekViewSkeleton from './WeekViewSkeleton';

interface WeekViewProps {
    initialTasks?: ITask[];
    initialGratitudes?: IGratitude[];
    initialJournals?: IJournal[];
}

export default function WeekView({ initialTasks = [], initialGratitudes = [], initialJournals = [] }: WeekViewProps) {
    const [tasks, setTasks] = useState<ITask[]>(initialTasks);
    const [gratitudes, setGratitudes] = useState<IGratitude[]>(initialGratitudes);
    const [journals, setJournals] = useState<IJournal[]>(initialJournals);
    const [loading, setLoading] = useState(initialTasks.length === 0); // Only load if no initial data
    const [currentDate, setCurrentDate] = useState<Date | null>(null);

    // We need a ref to track if we've done the initial load to prevent re-fetching immediately
    // or to handle the case where we navigate back to "today"
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        // Hydration fix: set date on client
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
            // If it's the initial load and we have initial data, we might want to skip fetching
            // BUT, ensuring text matches current week computation is tricky without prop drilling the date.
            // For simplicity, if we have tasks and it is the initial load, we assume the server passed the right data for "today/this week".
            if (isInitialLoad && initialTasks.length > 0) {
                setIsInitialLoad(false);
                setLoading(false);
                return;
            }
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
        // Determine the date to use for the new task
        // If "Today" is within the currently viewed week, default to Today.
        // Otherwise (viewing past/future week), default to Monday of that week so it's visible.

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        // Check if today is in the current weekDays list
        const isTodayInView = weekDays.some(day => format(day, 'yyyy-MM-dd') === todayStr);

        // Default to Monday of the viewed week if today is not in view
        const dateStr = isTodayInView ? todayStr : format(weekDays[0], 'yyyy-MM-dd');

        // Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const tempTask: any = {
            _id: tempId,
            title: taskData.title,
            category: taskData.category,
            type: 'spontaneous', // Default type for new tasks from modal
            date: dateStr,
            isCompleted: false,
            userId: 'temp-user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedDates: []
        };

        setTasks(prev => [...prev, tempTask]);

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
                const savedTask = await res.json();
                // Replace temp task with real saved task
                setTasks(prev => prev.map(t => t._id === tempId ? savedTask : t));
            } else {
                // Remove temp task on error
                console.error('Failed to create task, rolling back');
                setTasks(prev => prev.filter(t => t._id !== tempId));
            }
        } catch (error) {
            console.error('Failed to create task', error);
            // Remove temp task on error
            setTasks(prev => prev.filter(t => t._id !== tempId));
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                <NavBar />
                <div className={styles.header} style={{ marginTop: '0', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1 className={styles.title}>Week View</h1>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'var(--color-white)',
                                padding: '0.5rem',
                                borderRadius: '50%', // Circular button
                                boxShadow: 'var(--shadow-sm)',
                                border: '1px solid black',
                                cursor: 'pointer',
                                color: 'var(--color-text-main)'
                            }}
                            title="Add Task"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                <AddTaskModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onAdd={handleAddTask}
                />

                {!currentDate || loading ? (
                    <WeekViewSkeleton />
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div className={styles.glassControl}>
                                <button data-testid="prev-week-btn" onClick={handlePrevWeek} className={styles.navButton}>
                                    <ChevronLeft size={20} />
                                </button>
                                <span className={styles.dateRangeText} style={{ textAlign: 'center' }}>
                                    {dateRangeStr}
                                </span>
                                <button data-testid="next-week-btn" onClick={handleNextWeek} className={styles.navButton}>
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                        {/* Desktop View: 3-Column Masonry */}
                        <div className={styles.desktopGrid} style={{ marginTop: '1rem' }}>
                            {[0, 1, 2].map(colIndex => (
                                <div key={colIndex} className={styles.masonryColumn}>
                                    {weekDays
                                        .filter((_, index) => index % 3 === colIndex)
                                        .map(day => {
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
                                        })
                                    }
                                </div>
                            ))}
                        </div>

                        {/* Mobile View: Chronological List */}
                        <div className={styles.mobileGrid} style={{ marginTop: '1rem' }}>
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

                        <div style={{ marginTop: '3rem' }}>
                            <WeekSummary
                                days={weekDays}
                                tasks={tasks}
                                gratitudes={gratitudes}
                                journals={journals}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
