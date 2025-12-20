'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import sharedStyles from '@/components/WeekView.module.css'; // For background grid
import { ITask } from '@/models/Task';
import { User, Calendar, Zap, Trash2, Plus, ChevronDown, LogOut } from 'lucide-react';
import AddTaskModal from '@/components/AddTaskModal';
import { format } from 'date-fns';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
    const { user, logout, loading } = useAuth();
    const [regularTasks, setRegularTasks] = useState<ITask[]>([]);
    const [spontaneousTasks, setSpontaneousTasks] = useState<ITask[]>([]);
    const [isRegularModalOpen, setIsRegularModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>(''); // For adding tasks to specific category
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [isSpontaneousModalOpen, setIsSpontaneousModalOpen] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            // Fetch all tasks for now (simplification, ideally we filter regular and today's spontaneous)
            const today = format(new Date(), 'yyyy-MM-dd');
            const res = await fetch(`/api/tasks?startDate=${today}&endDate=${today}`);
            if (res.ok) {
                const data = await res.json();
                setRegularTasks(data.filter((t: ITask) => t.type === 'regular'));
                setSpontaneousTasks(data.filter((t: ITask) => t.type === 'spontaneous'));
            }
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        }
    };

    const handleAddRegularTask = async (taskData: { title: string; category: string }) => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...taskData,
                    type: 'regular',
                    date: today, // Creation date
                    isCompleted: false
                }),
            });
            if (res.ok) {
                fetchTasks();
            }
        } catch (error) {
            console.error('Failed to add regular task', error);
        }
    };

    const handleAddSpontaneousTask = async (taskData: { title: string; category: string }) => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...taskData,
                    type: 'spontaneous',
                    date: today,
                    isCompleted: false
                }),
            });
            if (res.ok) {
                fetchTasks();
            }
        } catch (error) {
            console.error('Failed to add spontaneous task', error);
        }
    };

    const handleDeleteTask = async (id: string) => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const res = await fetch(`/api/tasks/${id}?date=${today}`, { method: 'DELETE' });
            if (res.ok) {
                fetchTasks();
            }
        } catch (error) {
            console.error('Failed to delete task', error);
        }
    };

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    return (

        <div className={sharedStyles.container}>
            <div className={sharedStyles.contentWrapper}>

                <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className={styles.title}>My Profile</h1>
                    <div className={sharedStyles.actions}>
                        {/* Navigation links removed */}
                        <button onClick={logout} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>

                <div className={styles.profileCard}>
                    <div className={styles.sectionTitle}>
                        <User size={24} />
                        Profile Details
                    </div>
                    {loading ? (
                        <div style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Loading profile...</div>
                    ) : user ? (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Name</label>
                                <div className={styles.input} style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                                    {user.name}
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email</label>
                                <div className={styles.input} style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                                    {user.email}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>
                            Please <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>log in</Link> to view your profile.
                        </div>
                    )}

                </div>

                <div className={styles.grid}>
                    {/* Regular Tasks Section */}
                    <div className={styles.profileCard}>
                        <div className={styles.sectionTitle}>
                            <Calendar size={24} />
                            Regular Tasks
                        </div>
                        <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                            These tasks will appear on your dashboard everyday.
                        </p>

                        <div className={styles.taskList}>
                            {Object.entries(
                                regularTasks.reduce((acc, task) => {
                                    acc[task.category] = acc[task.category] || [];
                                    acc[task.category].push(task);
                                    return acc;
                                }, {} as Record<string, ITask[]>)
                            ).map(([category, tasks]) => {
                                const isExpanded = expandedCategories.has(category);
                                return (
                                    <div key={category} style={{ marginBottom: '1.5rem' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '0.5rem',
                                            borderBottom: '1px solid #e2e8f0',
                                            paddingBottom: '0.5rem',
                                            cursor: 'pointer'
                                        }}
                                            onClick={() => toggleCategory(category)}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <ChevronDown
                                                    size={20}
                                                    style={{
                                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.6s ease',
                                                        color: 'var(--color-text-muted)'
                                                    }}
                                                />
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)', margin: 0 }}>{category}</h3>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>({tasks.length})</span>
                                            </div>
                                            <button
                                                className="btn"
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', height: 'auto' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCategory(category);
                                                    setIsRegularModalOpen(true);
                                                }}
                                            >
                                                <Plus size={14} style={{ marginRight: '0.25rem' }} /> Add Task
                                            </button>
                                        </div>

                                        <div style={{
                                            maxHeight: isExpanded ? '1000px' : '0',
                                            opacity: isExpanded ? 1 : 0,
                                            overflow: 'hidden',
                                            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                            transformOrigin: 'top'
                                        }}>
                                            <div style={{ padding: '0.5rem 0' }}>
                                                {tasks.map(task => (
                                                    <div key={task._id} className={styles.taskItem} style={{ marginBottom: '0.5rem' }}>
                                                        <div className={styles.taskInfo}>
                                                            <span className={styles.taskTitle}>{task.title}</span>
                                                        </div>
                                                        <button className={styles.deleteBtn} onClick={() => handleDeleteTask(task._id)}>
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            className="btn"
                            style={{ marginTop: '0.5rem', width: '100%', border: '1px dashed #cbd5e1', background: 'transparent', color: 'var(--color-text-main)' }}
                            onClick={() => {
                                setSelectedCategory('');
                                setIsRegularModalOpen(true);
                            }}
                        >
                            <Plus size={18} style={{ marginRight: '0.5rem' }} />
                            Add New Category Group
                        </button>
                    </div>

                    {/* Spontaneous Tasks Section */}
                    <div className={styles.profileCard}>
                        <div className={styles.sectionTitle}>
                            <Zap size={24} />
                            Spontaneous Tasks
                        </div>
                        <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                            One-off tasks for today ({format(new Date(), 'MMM d')}).
                        </p>

                        <div className={styles.taskList}>
                            {spontaneousTasks.map(task => (
                                <div key={task._id} className={styles.taskItem}>
                                    <div className={styles.taskInfo}>
                                        <span className={styles.taskTitle}>{task.title}</span>
                                        <span className={styles.taskCategory}>{task.category}</span>
                                    </div>
                                    <button className={styles.deleteBtn} onClick={() => handleDeleteTask(task._id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn"
                            style={{ marginTop: '1rem', width: '100%', backgroundColor: 'var(--color-success)' }}
                            onClick={() => setIsSpontaneousModalOpen(true)}
                        >
                            <Plus size={18} style={{ marginRight: '0.5rem' }} />
                            Add Spontaneous Task
                        </button>
                    </div>
                </div>

                <AddTaskModal
                    isOpen={isRegularModalOpen}
                    onClose={() => setIsRegularModalOpen(false)}
                    onSave={handleAddRegularTask}
                    defaultCategory={selectedCategory}
                />

                <AddTaskModal
                    isOpen={isSpontaneousModalOpen}
                    onClose={() => setIsSpontaneousModalOpen(false)}
                    onSave={handleAddSpontaneousTask}
                />
            </div>
        </div>
    );
}
