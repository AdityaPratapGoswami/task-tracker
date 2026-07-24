'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { startOfWeek, addDays, subDays, format } from 'date-fns';
import AddTaskModal from '../AddTaskModal';
import {
    MetricTask,
    dayKey,
    dayTotals,
    weekSummary,
    currentStreak,
    groupByCategory,
    isActiveOn,
    isDoneOn,
    pointsOf,
} from '@/lib/metrics';

// Streak needs history the visible week doesn't contain, so the fetch window
// reaches back eight weeks. One request covers both the grid and the streak.
const HISTORY_DAYS = 56;

interface Props {
    initialTasks?: MetricTask[];
}

export default function WeekBoard({ initialTasks = [] }: Props) {
    const [tasks, setTasks] = useState<MetricTask[]>(initialTasks);
    const [anchor, setAnchor] = useState<Date | null>(null);
    const [loading, setLoading] = useState(initialTasks.length === 0);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        setAnchor(new Date());
    }, []);

    // Must be memoised: a fresh Date each render would change the identity of
    // every dependent callback and effect, re-firing the fetch forever.
    const weekStart = useMemo(
        () => (anchor ? startOfWeek(anchor, { weekStartsOn: 1 }) : null),
        [anchor]
    );
    const weekDays = useMemo(
        () => (weekStart ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)) : []),
        [weekStart]
    );

    const today = dayKey(new Date());

    const fetchTasks = useCallback(async () => {
        if (!weekStart) return;
        setLoading(true);
        try {
            const start = dayKey(subDays(weekStart, HISTORY_DAYS));
            const end = dayKey(addDays(weekStart, 6));
            const res = await fetch(`/api/tasks?startDate=${start}&endDate=${end}`);
            if (res.ok) setTasks(await res.json());
        } catch (err) {
            console.error('Failed to load week', err);
        } finally {
            setLoading(false);
        }
    }, [weekStart]);

    useEffect(() => {
        if (weekStart) fetchTasks();
    }, [fetchTasks, weekStart]);

    const pillars = useMemo(() => {
        if (!weekDays.length) return [];
        // Only tasks that touch the visible week belong on the grid.
        const visible = tasks.filter((t) => weekDays.some((d) => isActiveOn(t, dayKey(d))));
        return groupByCategory(visible);
    }, [tasks, weekDays]);

    const totals = useMemo(
        () => (weekDays.length ? dayTotals(tasks, weekDays, today) : []),
        [tasks, weekDays, today]
    );

    const summary = useMemo(
        () => (totals.length ? weekSummary(totals, weekDays) : null),
        [totals, weekDays]
    );

    const streak = useMemo(
        () => (tasks.length ? currentStreak(tasks, new Date()) : 0),
        [tasks]
    );

    const toggle = async (task: MetricTask, date: string) => {
        const next = !isDoneOn(task, date);

        setTasks((prev) =>
            prev.map((t) => {
                if (t._id !== task._id) return t;
                if (t.type === 'spontaneous') return { ...t, isCompleted: next };
                const dates = new Set(t.completedDates ?? []);
                if (next) dates.add(date);
                else dates.delete(date);
                return { ...t, completedDates: [...dates] };
            })
        );

        try {
            const body: Record<string, unknown> = { isCompleted: next };
            if (task.type === 'regular') body.toggleDate = date;
            await fetch(`/api/tasks/${task._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        } catch (err) {
            console.error('Failed to toggle task', err);
            fetchTasks();
        }
    };

    const addTask = async (data: {
        title: string;
        category: string;
        points: 1 | 2 | 3;
        isImportant: boolean;
        isUrgent: boolean;
    }) => {
        const todayInView = weekDays.some((d) => dayKey(d) === today);
        const date = todayInView ? today : dayKey(weekDays[0]);

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, date, isCompleted: false }),
            });
            if (res.ok) {
                const saved: MetricTask = await res.json();
                setTasks((prev) => [...prev, saved]);
            }
        } catch (err) {
            console.error('Failed to create task', err);
        }
    };

    if (!anchor || !summary) {
        return (
            <section className="m-shell">
                <div className="m-kicker">Week view</div>
                <h1 className="m-title" style={{ marginTop: 10 }}>Loading…</h1>
            </section>
        );
    }

    const rangeLabel = `${format(weekDays[0], 'MMM d')} — ${format(weekDays[6], 'MMM d')}`;

    return (
        <section className="m-shell">
            <div className="m-pagehead">
                <div>
                    <div className="m-kicker" style={{ marginBottom: 10 }}>Week view</div>
                    <h1 className="m-title">{rangeLabel}</h1>
                </div>
                <div className="m-actions">
                    <button className="m-btn m-btn-secondary" onClick={() => setAnchor(subDays(anchor, 7))} aria-label="Previous week">←</button>
                    <button className="m-btn m-btn-secondary" onClick={() => setAnchor(new Date())}>Today</button>
                    <button className="m-btn m-btn-secondary" onClick={() => setAnchor(addDays(anchor, 7))} aria-label="Next week">→</button>
                    <button className="m-btn m-btn-primary" onClick={() => setModalOpen(true)}>+ Add task</button>
                </div>
            </div>

            <AddTaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={addTask} />

            <div className="m-stats">
                <div className="m-stat">
                    <div className="m-label">Points earned</div>
                    <div className="m-stat-value">
                        {summary.earned}<span className="m-muted"> / {summary.possible}</span>
                    </div>
                </div>
                <div className="m-stat">
                    <div className="m-label">Completion</div>
                    <div className="m-stat-value m-accent">{summary.pct}%</div>
                </div>
                <div className="m-stat">
                    <div className="m-label">Best day</div>
                    <div className="m-stat-value">{summary.bestDay ?? '—'}</div>
                </div>
                <div className="m-stat">
                    <div className="m-label">Streak</div>
                    <div className="m-stat-value">{streak} {streak === 1 ? 'day' : 'days'}</div>
                </div>
            </div>

            <div className="m-wgrid m-wgrid-head">
                <div className="m-label">Task</div>
                {weekDays.map((day) => {
                    const date = dayKey(day);
                    const color = date === today
                        ? 'var(--m-accent)'
                        : date > today ? 'var(--m-neutral-500)' : 'var(--m-text)';
                    return (
                        <div className="m-daycol" key={date}>
                            <div className="m-daycol-label" style={{ color }}>
                                {format(day, 'EEE').toUpperCase()}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--m-neutral-600)', marginTop: 2 }}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    );
                })}
                <div className="m-label" style={{ textAlign: 'right' }}>Done</div>
            </div>

            {pillars.length === 0 && !loading && (
                <p className="m-empty">No tasks this week yet. Add one to start the grid.</p>
            )}

            {pillars.map((pillar) => (
                <div key={pillar.name}>
                    <div className="m-wgrid" style={{ padding: '20px 0 10px' }}>
                        <div className="m-pillar">{pillar.name}</div>
                        <div className="m-pillar-rule" />
                    </div>

                    {pillar.tasks.map((task) => {
                        const cells = weekDays.map((day) => {
                            const date = dayKey(day);
                            return {
                                date,
                                active: isActiveOn(task, date),
                                done: isDoneOn(task, date),
                                future: date > today,
                            };
                        });
                        const possible = cells.filter((c) => c.active && !c.future).length;
                        const done = cells.filter((c) => c.done).length;
                        const scoreColor = possible > 0 && done === possible
                            ? 'var(--m-accent)'
                            : done === 0 ? 'var(--m-neutral-400)' : 'var(--m-text)';

                        return (
                            <div className="m-wgrid" style={{ padding: '7px 0' }} key={task._id}>
                                <div className="m-taskname" title={task.title}>{task.title}</div>
                                {cells.map((cell) => (
                                    <div className="m-cellwrap" key={cell.date}>
                                        <button
                                            className="m-cell"
                                            disabled={!cell.active}
                                            onClick={() => toggle(task, cell.date)}
                                            aria-label={`${task.title} on ${cell.date}`}
                                            aria-pressed={cell.done}
                                        >
                                            <span
                                                className={`m-cell-mark ${!cell.active
                                                    ? ''
                                                    : cell.done
                                                        ? 'm-cell-done'
                                                        : cell.future
                                                            ? 'm-cell-future'
                                                            : 'm-cell-todo'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                                <div className="m-score" style={{ color: scoreColor }}>
                                    {done}/{possible}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}

            {pillars.length > 0 && (
                <div className="m-wgrid m-total-row">
                    <div className="m-pillar" style={{ color: 'var(--m-text)' }}>Day total</div>
                    {totals.map((t) => (
                        <div className="m-daycol" key={t.date}>
                            <div
                                className="m-total-pts"
                                style={{ color: t.date === today ? 'var(--m-accent)' : t.isFuture ? 'var(--m-neutral-400)' : 'var(--m-text)' }}
                            >
                                {t.isFuture ? '—' : t.completed}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--m-neutral-500)' }}>
                                {t.isFuture ? '' : `${t.pct}%`}
                            </div>
                        </div>
                    ))}
                    <div className="m-total-pts" style={{ textAlign: 'right' }}>{summary.earned}</div>
                </div>
            )}
        </section>
    );
}
