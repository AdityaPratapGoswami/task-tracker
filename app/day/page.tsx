'use client';

import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ITask } from '@/models/Task';
import NavBar from '@/components/NavBar';
// import Link from 'next/link';
import DayColumn from '@/components/DayColumn';
import AddTaskModal from '@/components/AddTaskModal';
import { Plus, Save, User, ChevronLeft, ChevronRight } from 'lucide-react';
import DayViewContentSkeleton, { DayViewJournalSkeleton } from '@/components/DayViewContentSkeleton';
import styles from './page.module.css';

export default function DayView() {
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<ITask | null>(null);

    // Gratitude State
    const [gratitude, setGratitude] = useState('');
    const [gratitudeError, setGratitudeError] = useState('');
    const [isSavingGratitude, setIsSavingGratitude] = useState(false);

    // Journal State
    const [journal, setJournal] = useState('');
    const [isSavingJournal, setIsSavingJournal] = useState(false);

    console.log('Render: gratitude state:', gratitude);

    useEffect(() => {
        setCurrentDate(new Date());
    }, []);

    useEffect(() => {
        if (currentDate) {
            fetchTasks();
            fetchGratitude();
            fetchJournal();
        }
    }, [currentDate]);

    const handlePrevDay = () => {
        if (currentDate) {
            setCurrentDate(subDays(currentDate, 1));
        }
    };

    const handleNextDay = () => {
        if (currentDate) {
            setCurrentDate(addDays(currentDate, 1));
        }
    };

    const fetchTasks = async () => {
        if (!currentDate) return;
        setLoading(true);
        try {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const res = await fetch(`/api/tasks?startDate=${dateStr}&endDate=${dateStr}`);

            if (res.ok) {
                const data: ITask[] = await res.json();
                const processedTasks: ITask[] = [];
                const regularTasks = data.filter(t => t.type === 'regular');
                const spontaneousTasks = data.filter(t => t.type === 'spontaneous');

                const daysSpontaneous = spontaneousTasks.filter(t => t.date === dateStr);
                processedTasks.push(...daysSpontaneous);

                regularTasks.forEach(regTask => {
                    const isCompletedForDay = regTask.completedDates?.includes(dateStr) || false;
                    processedTasks.push({
                        ...regTask,
                        date: dateStr,
                        isCompleted: isCompletedForDay
                    });
                });

                setTasks(processedTasks);
            }
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGratitude = async () => {
        if (!currentDate) return;
        try {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const res = await fetch(`/api/gratitude?date=${dateStr}`);
            if (res.ok) {
                const data = await res.json();
                setGratitude(data.content || '');
            } else {
                setGratitude(''); // Reset if no data found/error (likely 404 for empty)
            }
        } catch (error) {
            console.error('Failed to fetch gratitude', error);
            setGratitude('');
        }
    };

    const saveGratitude = async () => {
        if (!currentDate) return;
        setIsSavingGratitude(true);
        try {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const res = await fetch('/api/gratitude', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateStr, content: gratitude }),
            });
            if (!res.ok) {
                const err = await res.json();
                console.error(`Save failed: ${err.error || res.statusText}`);
                setGratitudeError(`Save failed: ${err.error || res.statusText}`);
            } else {
                setGratitudeError('');
            }
        } catch (error: any) {
            console.error('Failed to save gratitude', error);
            setGratitudeError(`Exception: ${error.message}`);
        } finally {
            setIsSavingGratitude(false);
        }
    };

    const fetchJournal = async () => {
        if (!currentDate) return;
        try {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const res = await fetch(`/api/journal?date=${dateStr}`);
            if (res.ok) {
                const data = await res.json();
                setJournal(data.content || '');
            } else {
                setJournal('');
            }
        } catch (error) {
            console.error('Failed to fetch journal', error);
            setJournal('');
        }
    };

    const saveJournal = async () => {
        if (!currentDate) return;
        setIsSavingJournal(true);
        try {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            await fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateStr, content: journal }),
            });
        } catch (error) {
            console.error('Failed to save journal', error);
        } finally {
            setIsSavingJournal(false);
        }
    };

    const handleToggleTask = async (id: string, isCompleted: boolean) => {
        if (!currentDate) return;
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        setTasks(prev => prev.map(t => {
            if (t._id === id) {
                return { ...t, isCompleted };
            }
            return t;
        }));

        try {
            const body: any = { isCompleted };
            const task = tasks.find(t => t._id === id);
            if (task && task.type === 'regular') {
                body.toggleDate = dateStr;
            }

            await fetch(`/api/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        } catch (error) {
            console.error('Failed to toggle task', error);
            fetchTasks();
        }
    };

    const handleSaveTask = async (taskData: { title: string; category: string; points: 1 | 2 | 3 }, id?: string) => {
        if (!currentDate) return;
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        if (id) {
            // Edit Mode
            // Optimistic Update
            const originalTask = tasks.find(t => t._id === id);
            if (!originalTask) return;

            const updatedTask = { ...originalTask, ...taskData };
            setTasks(prev => prev.map(t => t._id === id ? updatedTask : t));

            try {
                const res = await fetch(`/api/tasks/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData),
                });

                if (res.ok) {
                    const saved = await res.json();
                    setTasks(prev => prev.map(t => t._id === id ? saved : t));
                } else {
                    // Revert
                    setTasks(prev => prev.map(t => t._id === id ? originalTask : t));
                }
            } catch (error) {
                console.error('Failed to update task', error);
                setTasks(prev => prev.map(t => t._id === id ? originalTask : t));
            }
        } else {
            // Add Mode
            // Optimistic Update
            const tempId = `temp-${Date.now()}`;
            const tempTask: any = {
                _id: tempId,
                title: taskData.title,
                category: taskData.category,
                points: taskData.points,
                type: 'spontaneous',
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
                    setTasks(prev => prev.map(t => t._id === tempId ? savedTask : t));
                } else {
                    setTasks(prev => prev.filter(t => t._id !== tempId));
                }
            } catch (error) {
                console.error('Failed to create task', error);
                setTasks(prev => prev.filter(t => t._id !== tempId));
            }
        }
        setTaskToEdit(null);
    };

    const handleEditTask = (task: ITask) => {
        setTaskToEdit(task);
        setIsModalOpen(true);
    };

    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>

                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1 className={styles.title}>Day View</h1>
                        <button
                            onClick={() => {
                                setTaskToEdit(null);
                                setIsModalOpen(true);
                            }}
                            className={styles.glassButton}
                            title="Add Task"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    {/* Navigation */}
                </div>

                {/* Date Navigator */}
                {currentDate && (
                    <div className={styles.navigatorContainer}>
                        <div className={styles.glassControl} style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
                            <span className={styles.dateRangeText}>
                                {format(currentDate, 'EEEE, MMM d, yyyy')}
                            </span>
                        </div>
                    </div>
                )}

                <AddTaskModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setTaskToEdit(null);
                    }}
                    onSave={handleSaveTask}
                    taskToEdit={taskToEdit}
                />

                {loading || !currentDate ? (
                    <>
                        <DayViewContentSkeleton />
                        <DayViewJournalSkeleton />
                    </>
                ) : (
                    <>
                        <div className={styles.dayGrid}>

                            {/* Left Column: Progress & Tasks */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {/* Progress Section */}
                                <div className={styles.progressSection}>
                                    {(() => {
                                        const total = tasks.length;
                                        const completed = tasks.filter(t => t.isCompleted).length;
                                        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

                                        let progressColor = '#EF4444'; // Red (< 33%)
                                        if (percentage >= 33 && percentage <= 66) {
                                            progressColor = '#F59E0B'; // Yellow
                                        } else if (percentage > 66) {
                                            progressColor = '#10B981'; // Green
                                        }

                                        return (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                    <div>
                                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>Today's Progress</h3>
                                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                                            {completed} of {total} tasks completed
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: progressColor }}>
                                                            {percentage}%
                                                        </div>
                                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                                            {total - completed} remaining
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ height: '10px', width: '100%', background: '#F3F4F6', borderRadius: '5px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${percentage}%`,
                                                        background: progressColor,
                                                        transition: 'width 0.5s ease',
                                                        borderRadius: '5px'
                                                    }}></div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                <DayColumn
                                    date={currentDate}
                                    tasks={tasks}
                                    onToggleTask={handleToggleTask}
                                    onEdit={handleEditTask}
                                    style={{ flex: 1 }}
                                />
                            </div>

                            {/* Right Column: Gratitude */}
                            <div className={styles.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Today's Gratitude</h3>
                                    <button
                                        onClick={saveGratitude}
                                        disabled={isSavingGratitude}
                                        className="btn"
                                        style={{
                                            opacity: isSavingGratitude ? 0.7 : 1,
                                            cursor: isSavingGratitude ? 'not-allowed' : 'pointer',
                                            gap: '0.5rem',
                                            padding: '0.5rem 1rem', // Match btn padding but explicit just in case
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' // Added shadow
                                        }}
                                    >
                                        <Save size={18} />
                                        Save
                                    </button>
                                </div>
                                <textarea
                                    value={gratitude}
                                    onChange={(e) => setGratitude(e.target.value)}
                                    placeholder="What are you grateful for today?..."
                                    style={{
                                        width: '100%',
                                        flex: 1, // Allow to grow
                                        minHeight: '300px',
                                        padding: '1rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        resize: 'none',
                                        fontSize: '1rem',
                                        lineHeight: '1.6',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        color: 'var(--color-text-main)',
                                        background: 'rgba(255, 255, 255, 0.5)' // Slightly translucent textarea
                                    }}
                                />
                                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                                    {isSavingGratitude ? 'Saving...' : 'Don\'t forget to save!'}
                                </div>
                                {gratitudeError && <div style={{ color: 'red', marginTop: '0.5rem' }}>{gratitudeError}</div>}
                            </div>
                        </div>

                        {/* Journal Section */}
                        <div className={styles.journalSection}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Daily Journal</h3>
                                <button
                                    onClick={saveJournal}
                                    disabled={isSavingJournal}
                                    className="btn"
                                    style={{
                                        opacity: isSavingJournal ? 0.7 : 1,
                                        cursor: isSavingJournal ? 'not-allowed' : 'pointer',
                                        gap: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' // Added shadow
                                    }}
                                >
                                    <Save size={18} />
                                    Save
                                </button>
                            </div>
                            <textarea
                                value={journal}
                                onChange={(e) => setJournal(e.target.value)}
                                placeholder="Reflect on your day..."
                                style={{
                                    width: '100%',
                                    minHeight: '200px',
                                    padding: '1rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem',
                                    resize: 'vertical',
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    color: 'var(--color-text-main)',
                                    background: 'rgba(255, 255, 255, 0.5)' // Slightly translucent textarea
                                }}
                            ></textarea>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                                {isSavingJournal ? 'Saving...' : 'Don\'t forget to save!'}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
