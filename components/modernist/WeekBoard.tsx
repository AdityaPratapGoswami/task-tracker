'use client';

import { useMemo, useState } from 'react';
import { startOfWeek, addDays, subDays, format, parseISO } from 'date-fns';
import QuickAddSpontaneous from './QuickAddSpontaneous';
import { useCachedJson, invalidateCache } from '@/lib/dataCache';
import useToday from '@/lib/useToday';
import {
    MetricTask,
    dayKey,
    dayTotals,
    weekSummary,
    currentStreak,
    groupByCategory,
    isActiveOn,
    isDoneOn,
    WEEK_HISTORY_DAYS,
} from '@/lib/metrics';

// Stable reference so an absent response doesn't invalidate every memo below.
const NO_TASKS: MetricTask[] = [];

interface Props {
    /** The server's idea of today, as YYYY-MM-DD. */
    initialDate: string;
    initialTasks?: MetricTask[];
}

export default function WeekBoard({ initialDate, initialTasks }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    // Null until the user navigates weeks, so the view tracks the real today.
    const [selected, setSelected] = useState<string | null>(null);

    const today = useToday(initialDate);
    const anchorKey = selected ?? today;
    const setAnchorKey = setSelected;

    const anchor = useMemo(() => parseISO(anchorKey), [anchorKey]);
    const weekStart = useMemo(() => startOfWeek(anchor, { weekStartsOn: 1 }), [anchor]);
    const weekDays = useMemo(
        () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
        [weekStart]
    );

    const url = `/api/tasks?startDate=${dayKey(subDays(weekStart, WEEK_HISTORY_DAYS))}&endDate=${dayKey(addDays(weekStart, 6))}`;
    const { data, isLoading, mutate } = useCachedJson<MetricTask[]>(
        url,
        anchorKey === initialDate ? initialTasks : undefined
    );
    const tasks = useMemo(() => data ?? NO_TASKS, [data]);

    // Spontaneous tasks have no pillar, so they're grouped separately below —
    // only regular tasks feed the category rows.
    const pillars = useMemo(() => {
        const visible = tasks.filter(
            (t) => t.type === 'regular' && weekDays.some((d) => isActiveOn(t, dayKey(d)))
        );
        return groupByCategory(visible);
    }, [tasks, weekDays]);

    const weekSpontaneous = useMemo(() => {
        const days = new Set(weekDays.map(dayKey));
        return tasks.filter((t) => t.type === 'spontaneous' && days.has(t.date));
    }, [tasks, weekDays]);

    const totals = useMemo(() => dayTotals(tasks, weekDays, today), [tasks, weekDays, today]);
    const summary = useMemo(() => weekSummary(totals, weekDays), [totals, weekDays]);
    const streak = useMemo(
        () => (tasks.length ? currentStreak(tasks, new Date()) : 0),
        [tasks]
    );

    const invalidateOtherViews = () => {
        invalidateCache((u) => u !== url && (u.startsWith('/api/tasks') || u.startsWith('/api/day')));
    };

    const toggle = async (task: MetricTask, date: string) => {
        const next = !isDoneOn(task, date);

        mutate(
            tasks.map((t) => {
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
            invalidateOtherViews();
        } catch (err) {
            console.error('Failed to toggle task', err);
        }
    };

    const handleSpontaneousCreated = (task: MetricTask) => {
        mutate([...tasks, task]);
        invalidateOtherViews();
    };

    const rangeLabel = `${format(weekDays[0], 'MMM d')} — ${format(weekDays[6], 'MMM d')}`;
    const dash = '—';

    return (
        <section className="m-shell">
            <div className="m-pagehead">
                <div>
                    <div className="m-kicker" style={{ marginBottom: 10 }}>Week view</div>
                    <h1 className="m-title">{rangeLabel}</h1>
                </div>
                <div className="m-actions">
                    <button className="m-btn m-btn-secondary" onClick={() => setAnchorKey(dayKey(subDays(anchor, 7)))} aria-label="Previous week">←</button>
                    <button className="m-btn m-btn-secondary" onClick={() => setAnchorKey(today)}>Today</button>
                    <button className="m-btn m-btn-secondary" onClick={() => setAnchorKey(dayKey(addDays(anchor, 7)))} aria-label="Next week">→</button>
                    <button className="m-btn m-btn-primary" onClick={() => setModalOpen(true)}>+ Add task</button>
                </div>
            </div>

            <QuickAddSpontaneous
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreated={handleSpontaneousCreated}
            />

            <div className="m-stats">
                <div className="m-stat">
                    <div className="m-label">Points earned</div>
                    <div className="m-stat-value">
                        {isLoading ? dash : (
                            <>{summary.earned}<span className="m-muted"> / {summary.possible}</span></>
                        )}
                    </div>
                </div>
                <div className="m-stat">
                    <div className="m-label">Completion</div>
                    <div className="m-stat-value m-accent">{isLoading ? dash : `${summary.pct}%`}</div>
                </div>
                <div className="m-stat">
                    <div className="m-label">Best day</div>
                    <div className="m-stat-value">{isLoading ? dash : summary.bestDay ?? dash}</div>
                </div>
                <div className="m-stat">
                    <div className="m-label">Streak</div>
                    <div className="m-stat-value">
                        {isLoading ? dash : `${streak} ${streak === 1 ? 'day' : 'days'}`}
                    </div>
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

            {/* Skeleton rows rather than "no tasks this week", which isn't a
                claim we can make until the data has arrived. */}
            {isLoading && [0, 1, 2, 3, 4].map((i) => (
                <div className="m-wgrid" style={{ padding: '7px 0' }} key={i}>
                    <div className="m-skel" style={{ height: 14, width: `${70 - i * 6}%` }} />
                    {weekDays.map((d) => (
                        <div className="m-cellwrap" key={dayKey(d)}>
                            <span className="m-skel" style={{ width: '100%', height: 22 }} />
                        </div>
                    ))}
                    <div className="m-skel" style={{ height: 14 }} />
                </div>
            ))}

            {!isLoading && pillars.length === 0 && weekSpontaneous.length === 0 && (
                <p className="m-empty">No tasks this week yet. Add one to start the grid.</p>
            )}

            {!isLoading && pillars.map((pillar) => (
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

            {!isLoading && weekSpontaneous.length > 0 && (
                <div>
                    <div className="m-wgrid" style={{ padding: '20px 0 10px' }}>
                        <div className="m-pillar">SPONTANEOUS</div>
                        <div className="m-pillar-rule" />
                    </div>

                    {weekSpontaneous.map((task) => (
                        <div className="m-wgrid" style={{ padding: '7px 0' }} key={task._id}>
                            <div className="m-taskname" title={task.title} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
                                {task.isOverdue && !isDoneOn(task, task.date) && (
                                    <span className="m-overdue-tag" style={{ flex: '0 0 auto' }}>OVERDUE</span>
                                )}
                            </div>
                            {weekDays.map((day) => {
                                const date = dayKey(day);
                                if (date !== task.date) {
                                    return <div className="m-cellwrap" key={date} />;
                                }
                                const done = isDoneOn(task, date);
                                return (
                                    <div className="m-cellwrap" key={date}>
                                        <button
                                            className="m-cell"
                                            onClick={() => toggle(task, date)}
                                            aria-label={`${task.title} on ${date}`}
                                            aria-pressed={done}
                                        >
                                            <span className={`m-cell-mark ${done ? 'm-cell-done' : 'm-cell-todo'}`} />
                                        </button>
                                    </div>
                                );
                            })}
                            <div className="m-score" style={{ color: isDoneOn(task, task.date) ? 'var(--m-accent)' : 'var(--m-neutral-400)' }}>
                                {isDoneOn(task, task.date) ? '1/1' : '0/1'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && (pillars.length > 0 || weekSpontaneous.length > 0) && (
                <div className="m-wgrid m-total-row">
                    <div className="m-pillar" style={{ color: 'var(--m-text)' }}>Day total</div>
                    {totals.map((t) => (
                        <div className="m-daycol" key={t.date}>
                            <div
                                className="m-total-pts"
                                style={{ color: t.date === today ? 'var(--m-accent)' : t.isFuture ? 'var(--m-neutral-400)' : 'var(--m-text)' }}
                            >
                                {t.isFuture ? dash : t.completed}
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
