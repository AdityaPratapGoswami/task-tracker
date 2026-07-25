'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, differenceInCalendarDays } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import AddOKRModal from '../AddOKRModal';
import AddTaskModal from '../AddTaskModal';
import QuickAddSpontaneous from './QuickAddSpontaneous';
import ConfirmDialog from './ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { IOKR } from '@/types/okr';
import { MetricTask, dayKey, isActiveOn, pointsOf } from '@/lib/metrics';

interface Category {
    _id: string;
    name: string;
}

interface Pillar {
    name: string;
    categoryId?: string;
    tasks: MetricTask[];
}

/** Days left in the calendar quarter that `date` falls in. */
function quarterInfo(date: Date) {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const end = new Date(date.getFullYear(), quarter * 3, 0);
    return { quarter, daysRemaining: Math.max(0, differenceInCalendarDays(end, date)) };
}

export default function ProfileBoard() {
    const { user, logout } = useAuth();
    const [name, setName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [okrs, setOkrs] = useState<IOKR[]>([]);
    const [tasks, setTasks] = useState<MetricTask[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [okrModalOpen, setOkrModalOpen] = useState(false);
    const [okrToEdit, setOkrToEdit] = useState<IOKR | null>(null);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [defaultCategory, setDefaultCategory] = useState<string | undefined>();
    const [taskToEdit, setTaskToEdit] = useState<
        (MetricTask & { points: 1 | 2 | 3 }) | null
    >(null);
    const [addingCategory, setAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);
    const [spontaneousModalOpen, setSpontaneousModalOpen] = useState(false);
    const [pendingConfirm, setPendingConfirm] = useState<
        { type: 'task'; task: MetricTask } | { type: 'category'; pillar: Pillar } | null
    >(null);

    const today = dayKey(new Date());

    const load = useCallback(async () => {
        try {
            const [profileRes, okrRes, taskRes, categoryRes] = await Promise.all([
                fetch('/api/profile'),
                fetch('/api/okrs'),
                fetch(`/api/tasks?startDate=${today}&endDate=${today}`),
                fetch('/api/categories'),
            ]);
            if (profileRes.ok) {
                const p = await profileRes.json();
                if (p?.name) setName(p.name);
            }
            if (okrRes.ok) setOkrs(await okrRes.json());
            if (taskRes.ok) setTasks(await taskRes.json());
            if (categoryRes.ok) setCategories(await categoryRes.json());
        } catch (err) {
            console.error('Failed to load profile', err);
        }
    }, [today]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!name && user?.name) setName(user.name);
        // Only seeds the field before the profile record loads.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const regular = useMemo(
        () => tasks.filter((t) => t.type === 'regular' && isActiveOn(t, today)),
        [tasks, today]
    );
    const spontaneous = useMemo(
        () => tasks.filter((t) => t.type === 'spontaneous' && t.date === today),
        [tasks, today]
    );

    // Categories with zero tasks still need a row (so "+ Add task" has
    // somewhere to go), so this starts from the category list rather than
    // deriving groups from tasks alone.
    const pillars = useMemo<Pillar[]>(() => {
        const byName = new Map<string, Pillar>();
        for (const cat of categories) {
            byName.set(cat.name, { name: cat.name, categoryId: cat._id, tasks: [] });
        }
        for (const task of regular) {
            if (!byName.has(task.category)) {
                byName.set(task.category, { name: task.category, tasks: [] });
            }
            byName.get(task.category)!.tasks.push(task);
        }
        return [...byName.values()];
    }, [categories, regular]);

    const saveName = async () => {
        setSavingName(true);
        try {
            await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
        } catch (err) {
            console.error('Failed to save name', err);
        } finally {
            setSavingName(false);
        }
    };

    const saveOkr = async (
        okr: { objective: string; keyResults: { title: string; completed: boolean }[] },
        id?: string
    ) => {
        try {
            const res = await fetch(id ? `/api/okrs/${id}` : '/api/okrs', {
                method: id ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(okr),
            });
            if (res.ok) {
                const saved = await res.json();
                setOkrs((prev) => (id ? prev.map((o) => (o._id === id ? saved : o)) : [saved, ...prev]));
            }
        } catch (err) {
            console.error('Failed to save OKR', err);
        } finally {
            setOkrModalOpen(false);
            setOkrToEdit(null);
        }
    };

    const openAddTask = (category?: string) => {
        setTaskToEdit(null);
        setDefaultCategory(category);
        setTaskModalOpen(true);
    };

    const openEditTask = (task: MetricTask) => {
        // AddTaskModal requires `points` as a definite number; MetricTask
        // leaves it optional to mirror the API, so it's normalised here.
        setTaskToEdit({ ...task, points: pointsOf(task) });
        setDefaultCategory(undefined);
        setTaskModalOpen(true);
    };

    const saveTask = async (
        data: {
            title: string;
            category: string;
            points: 1 | 2 | 3;
            isImportant: boolean;
            isUrgent: boolean;
        },
        id?: string
    ) => {
        try {
            if (id) {
                await fetch(`/api/tasks/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            } else {
                await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...data, date: today, type: 'regular', isCompleted: false }),
                });
            }
            await load();
        } catch (err) {
            console.error('Failed to save task', err);
        }
    };

    // Regular tasks are archived (endDate set) rather than hard-deleted, so
    // history for already-completed days is preserved — same convention the
    // day board and mobile screen use. Both this and category removal are
    // destructive enough to confirm first, via the dialog rendered below
    // rather than window.confirm, which looks and reads like the browser
    // rather than the app.
    const deleteTask = (task: MetricTask) => {
        setPendingConfirm({ type: 'task', task });
    };

    const deleteCategory = (pillar: Pillar) => {
        if (!pillar.categoryId) return;
        setPendingConfirm({ type: 'category', pillar });
    };

    const runPendingConfirm = async () => {
        if (!pendingConfirm) return;
        try {
            if (pendingConfirm.type === 'task') {
                const { task } = pendingConfirm;
                await fetch(`/api/tasks/${task._id}?date=${today}`, { method: 'DELETE' });
                setTasks((prev) => prev.filter((t) => t._id !== task._id));
            } else {
                await fetch(`/api/categories/${pendingConfirm.pillar.categoryId}`, { method: 'DELETE' });
                await load();
            }
        } catch (err) {
            console.error('Failed to complete removal', err);
        } finally {
            setPendingConfirm(null);
        }
    };

    const addCategory = async () => {
        const name = newCategoryName.trim();
        if (!name) return;
        setSavingCategory(true);
        try {
            await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            setNewCategoryName('');
            setAddingCategory(false);
            await load();
        } catch (err) {
            console.error('Failed to add category', err);
        } finally {
            setSavingCategory(false);
        }
    };

    const { quarter, daysRemaining } = quarterInfo(new Date());

    return (
        <section className="m-shell">
            <div className="m-pagehead">
                <div>
                    <div className="m-kicker" style={{ marginBottom: 10 }}>Account</div>
                    <h1 className="m-title">{name || user?.name || 'Profile'}</h1>
                </div>
                <button className="m-btn m-btn-secondary" style={{ padding: '10px 20px', marginBottom: 6 }} onClick={logout}>
                    Log out
                </button>
            </div>

            <div style={{ borderTop: '2px solid var(--m-divider)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ padding: '32px 32px 32px 0' }}>
                    <label className="m-label" htmlFor="m-name" style={{ marginBottom: 10 }}>Name</label>
                    <input
                        id="m-name"
                        className="m-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={saveName}
                    />
                    <div style={{ fontSize: 12, color: 'var(--m-neutral-500)', marginTop: 8 }}>
                        {savingName ? 'Saving…' : 'Saved when you click away'}
                    </div>
                </div>
                <div style={{ padding: '32px 0 32px 32px', borderLeft: '2px solid var(--m-divider)' }}>
                    <label className="m-label" htmlFor="m-email" style={{ marginBottom: 10 }}>Email</label>
                    <input id="m-email" className="m-input" value={user?.email ?? ''} readOnly />
                </div>
            </div>

            <div style={{ borderTop: '2px solid var(--m-divider)', padding: '44px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h2 className="m-h2">Objectives &amp; key results</h2>
                    <button
                        className="m-btn m-btn-ghost"
                        onClick={() => { setOkrToEdit(null); setOkrModalOpen(true); }}
                    >
                        + Add OKR
                    </button>
                </div>
                <p style={{ fontSize: 14, color: 'var(--m-neutral-600)', margin: '0 0 28px' }}>
                    Quarter {quarter} · {daysRemaining} days remaining
                </p>

                {okrs.length === 0 && <p className="m-empty">No objectives yet.</p>}

                {okrs.map((okr, i) => {
                    const total = okr.keyResults.length;
                    const done = okr.keyResults.filter((kr) => kr.completed).length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                        <div className="m-okr" key={okr._id}>
                            <div>
                                <div className="m-label m-accent" style={{ marginBottom: 8 }}>
                                    Objective {String(i + 1).padStart(2, '0')}
                                </div>
                                <button
                                    className="m-okr-title"
                                    style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', color: 'var(--m-text)' }}
                                    onClick={() => { setOkrToEdit(okr); setOkrModalOpen(true); }}
                                >
                                    {okr.objective}
                                </button>
                                <div style={{ fontSize: 13, color: 'var(--m-neutral-600)', marginTop: 8 }}>
                                    {pct}% complete · {done} of {total} key results
                                </div>
                            </div>
                            <div>
                                {okr.keyResults.map((kr, k) => (
                                    <div className="m-kr" key={kr._id ?? k}>
                                        <div style={{ fontSize: 15 }}>{kr.title}</div>
                                        <div className="m-thin-track">
                                            <div
                                                style={{
                                                    height: '100%',
                                                    width: kr.completed ? '100%' : '0%',
                                                    background: kr.completed ? 'var(--m-accent)' : 'transparent',
                                                }}
                                            />
                                        </div>
                                        <div className="m-score">{kr.completed ? 'Done' : '—'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ borderTop: '2px solid var(--m-divider)', display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: 20 }}>
                <div style={{ padding: '40px 48px 40px 0' }}>
                    <h2 className="m-h2" style={{ marginBottom: 6 }}>Regular tasks</h2>
                    <p style={{ fontSize: 14, color: 'var(--m-neutral-600)', margin: '0 0 26px' }}>
                        These appear on your board every day.
                    </p>

                    {pillars.length === 0 && <p className="m-empty">No categories yet.</p>}

                    {pillars.map((pillar) => (
                        <div style={{ marginBottom: 26 }} key={pillar.name}>
                            <div className="m-group-head">
                                <span className="m-pillar">{pillar.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <button
                                        className="m-btn m-btn-ghost"
                                        style={{ fontSize: 12 }}
                                        onClick={() => openAddTask(pillar.name)}
                                    >
                                        + Add task
                                    </button>
                                    {pillar.categoryId && (
                                        <button
                                            className="m-btn m-btn-ghost"
                                            style={{ padding: 6 }}
                                            onClick={() => deleteCategory(pillar)}
                                            aria-label={`Remove ${pillar.name} category`}
                                            title="Remove category"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {pillar.tasks.length === 0 && (
                                <p className="m-empty" style={{ padding: '10px 0' }}>No tasks in this category yet.</p>
                            )}
                            {pillar.tasks.map((task) => (
                                <div className="m-listrow" key={task._id}>
                                    <span style={{ fontSize: 15 }}>{task.title}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <span className="m-pts">{pointsOf(task)} PT</span>
                                        <button
                                            className="m-btn m-btn-ghost"
                                            style={{ padding: 4 }}
                                            onClick={() => openEditTask(task)}
                                            aria-label={`Edit ${task.title}`}
                                            title="Edit task"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            className="m-btn m-btn-ghost"
                                            style={{ padding: 4 }}
                                            onClick={() => deleteTask(task)}
                                            aria-label={`Remove ${task.title}`}
                                            title="Remove task"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}

                    {addingCategory ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                className="m-input"
                                autoFocus
                                placeholder="Category name"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') addCategory();
                                    if (e.key === 'Escape') { setAddingCategory(false); setNewCategoryName(''); }
                                }}
                            />
                            <button className="m-btn m-btn-primary" onClick={addCategory} disabled={savingCategory}>
                                {savingCategory ? 'Adding…' : 'Add'}
                            </button>
                            <button
                                className="m-btn m-btn-secondary"
                                onClick={() => { setAddingCategory(false); setNewCategoryName(''); }}
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            className="m-btn m-btn-secondary m-btn-block"
                            onClick={() => setAddingCategory(true)}
                        >
                            + Add category
                        </button>
                    )}
                </div>

                <div style={{ padding: '40px 0 40px 48px', borderLeft: '2px solid var(--m-divider)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                        <h2 className="m-h2">Spontaneous tasks</h2>
                        <button className="m-btn m-btn-ghost" onClick={() => setSpontaneousModalOpen(true)}>
                            + Add spontaneous task
                        </button>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--m-neutral-600)', margin: '0 0 26px' }}>
                        One-offs for today, {format(new Date(), 'MMM d')}.
                    </p>
                    <div style={{ borderTop: '2px solid var(--m-divider)' }}>
                        {spontaneous.length === 0 && <p className="m-empty">Nothing one-off today.</p>}
                        {spontaneous.map((task) => (
                            <div className="m-listrow" key={task._id}>
                                <span style={{ fontSize: 15 }}>{task.title}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <span className="m-pts">
                                        {task.isUrgent ? 'URGENT' : task.isImportant ? 'IMPORTANT' : 'LATER'}
                                    </span>
                                    <button
                                        className="m-btn m-btn-ghost"
                                        style={{ padding: 4 }}
                                        onClick={() => openEditTask(task)}
                                        aria-label={`Edit ${task.title}`}
                                        title="Edit task"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        className="m-btn m-btn-ghost"
                                        style={{ padding: 4 }}
                                        onClick={() => deleteTask(task)}
                                        aria-label={`Remove ${task.title}`}
                                        title="Remove task"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <AddOKRModal
                isOpen={okrModalOpen}
                onClose={() => { setOkrModalOpen(false); setOkrToEdit(null); }}
                onSave={saveOkr}
                okrToEdit={okrToEdit}
            />
            <AddTaskModal
                isOpen={taskModalOpen}
                onClose={() => { setTaskModalOpen(false); setTaskToEdit(null); }}
                onSave={saveTask}
                defaultCategory={defaultCategory}
                taskToEdit={taskToEdit}
            />
            <QuickAddSpontaneous
                isOpen={spontaneousModalOpen}
                onClose={() => setSpontaneousModalOpen(false)}
                onCreated={(task) => setTasks((prev) => [...prev, task])}
            />
            <ConfirmDialog
                isOpen={!!pendingConfirm}
                title={pendingConfirm?.type === 'category' ? 'Remove category' : 'Remove task'}
                message={
                    pendingConfirm?.type === 'category'
                        ? pendingConfirm.pillar.tasks.length > 0
                            ? `Remove "${pendingConfirm.pillar.name}"? Its ${pendingConfirm.pillar.tasks.length} task${pendingConfirm.pillar.tasks.length === 1 ? '' : 's'} will be archived too.`
                            : `Remove "${pendingConfirm.pillar.name}"?`
                        : pendingConfirm?.type === 'task'
                            ? `Remove "${pendingConfirm.task.title}"?`
                            : ''
                }
                onConfirm={runPendingConfirm}
                onCancel={() => setPendingConfirm(null)}
            />
        </section>
    );
}
