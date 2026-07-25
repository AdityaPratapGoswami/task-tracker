'use client';

import { useMemo, useState } from 'react';
import { startOfWeek, addDays, subDays, format, parseISO } from 'date-fns';
import { useCachedJson } from '@/lib/dataCache';
import useToday from '@/lib/useToday';
import {
    MetricTask,
    dayKey,
    dayTotals,
    weekSummary,
    taskPerformance,
    eisenhower,
    groupByCategory,
    matchesQuadrant,
    isActiveOn,
    isDoneOn,
    pointsOf,
} from '@/lib/metrics';

const CHART_HEIGHT = 230;

// Stable reference so an absent response doesn't invalidate every memo below.
const NO_TASKS: MetricTask[] = [];

interface Props {
    /** The server's idea of today, as YYYY-MM-DD. */
    initialDate: string;
    /** Tasks spanning the shown week plus the one before it. */
    initialTasks?: MetricTask[];
}

export default function AnalyticsBoard({ initialDate, initialTasks }: Props) {
    const [quadrant, setQuadrant] = useState<string | null>(null);
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
    const prevDays = useMemo(
        () => Array.from({ length: 7 }, (_, i) => addDays(subDays(weekStart, 7), i)),
        [weekStart]
    );

    // One range spans both weeks so "vs. last week" costs no extra round trip.
    const url = `/api/tasks?startDate=${dayKey(subDays(weekStart, 7))}&endDate=${dayKey(addDays(weekStart, 6))}`;
    const { data, isLoading } = useCachedJson<MetricTask[]>(
        url,
        anchorKey === initialDate ? initialTasks : undefined
    );
    const tasks = useMemo(() => data ?? NO_TASKS, [data]);

    const totals = useMemo(() => dayTotals(tasks, weekDays, today), [tasks, weekDays, today]);
    const summary = useMemo(() => weekSummary(totals, weekDays), [totals, weekDays]);
    const prevSummary = useMemo(
        () => weekSummary(dayTotals(tasks, prevDays, today), prevDays),
        [tasks, prevDays, today]
    );

    const perf = useMemo(() => {
        const scoped = tasks.filter((t) => matchesQuadrant(t, quadrant));
        return taskPerformance(scoped, weekDays, today);
    }, [tasks, weekDays, today, quadrant]);

    const quads = useMemo(() => eisenhower(tasks, weekDays, today), [tasks, weekDays, today]);

    const strongestPillar = useMemo(() => {
        const visible = tasks.filter((t) => weekDays.some((d) => isActiveOn(t, dayKey(d))));
        const groups = groupByCategory(visible);
        let best: { name: string; pct: number } | null = null;

        for (const g of groups) {
            let total = 0;
            let done = 0;
            for (const task of g.tasks) {
                for (const day of weekDays) {
                    const date = dayKey(day);
                    if (date > today || !isActiveOn(task, date)) continue;
                    total += pointsOf(task);
                    if (isDoneOn(task, date)) done += pointsOf(task);
                }
            }
            if (total === 0) continue;
            const pct = Math.round((done / total) * 100);
            if (!best || pct > best.pct) best = { name: g.name, pct };
        }
        return best;
    }, [tasks, weekDays, today]);

    const delta = summary.pct - prevSummary.pct;
    const mostDone = perf.length ? perf[0] : null;
    const leastDone = perf.length > 1 ? perf[perf.length - 1] : null;
    const rangeLabel = `${format(weekDays[0], 'MMM d')} — ${format(weekDays[6], 'MMM d')}`;

    /** Placeholder until the numbers are real — a 0% would read as a fact. */
    const dash = '—';

    return (
        <section className="m-shell">
            <div className="m-pagehead">
                <div>
                    <div className="m-kicker" style={{ marginBottom: 10 }}>Analytics</div>
                    <h1 className="m-title">{rangeLabel}</h1>
                </div>
                <div className="m-actions">
                    <button className="m-btn m-btn-secondary" onClick={() => setAnchorKey(dayKey(subDays(anchor, 7)))} aria-label="Previous week">←</button>
                    <button className="m-btn m-btn-secondary" onClick={() => setAnchorKey(dayKey(addDays(anchor, 7)))} aria-label="Next week">→</button>
                </div>
            </div>

            <div className="m-stats">
                <div className="m-stat">
                    <div className="m-label">Avg. completion</div>
                    <div className="m-stat-value m-accent">{isLoading ? dash : `${summary.pct}%`}</div>
                </div>
                <div className="m-stat">
                    <div className="m-label">Points closed</div>
                    <div className="m-stat-value">{isLoading ? dash : summary.earned}</div>
                </div>
                <div className="m-stat">
                    <div className="m-label">vs. last week</div>
                    <div className="m-stat-value">
                        {isLoading || prevSummary.possible === 0
                            ? dash
                            : `${delta > 0 ? '+' : ''}${delta}%`}
                    </div>
                </div>
                <div className="m-stat">
                    <div className="m-label">Strongest pillar</div>
                    <div className="m-stat-value">{isLoading ? dash : strongestPillar?.name ?? dash}</div>
                </div>
            </div>

            <div style={{ padding: '44px 0 0' }}>
                <h2 className="m-h2" style={{ marginBottom: 32 }}>Completion by day</h2>
                <div className="m-chart">
                    {(isLoading ? weekDays.map(() => null) : totals).map((t, i) => {
                        if (!t) {
                            return (
                                <div className="m-chart-col" key={i}>
                                    <div className="m-skel" style={{ height: 12, width: 28, marginBottom: 8 }} />
                                    <div className="m-skel" style={{ height: 40 + i * 12 }} />
                                </div>
                            );
                        }
                        const isToday = t.date === today;
                        const color = isToday ? 'var(--m-accent)' : t.isFuture ? 'var(--m-neutral-400)' : 'var(--m-text)';
                        return (
                            <div className="m-chart-col" key={t.date}>
                                <div className="m-chart-val" style={{ color }}>
                                    {t.isFuture ? dash : `${t.pct}%`}
                                </div>
                                <div
                                    style={{
                                        height: Math.max(2, Math.round((t.isFuture ? 0 : t.pct) / 100 * CHART_HEIGHT)),
                                        background: isToday ? 'var(--m-accent)' : 'var(--m-neutral-300)',
                                        borderTop: `2px solid ${color}`,
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
                <div className="m-chart-axis">
                    {weekDays.map((d) => (
                        <div key={dayKey(d)} style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--m-neutral-600)' }}>
                            {format(d, 'EEE')}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ padding: '56px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h2 className="m-h2">Eisenhower matrix</h2>
                    {quadrant && (
                        <button className="m-btn m-btn-ghost" onClick={() => setQuadrant(null)}>
                            Clear filter
                        </button>
                    )}
                </div>
                <div className="m-quads">
                    {quads.map((q) => (
                        <button
                            key={q.key}
                            className={`m-quad ${quadrant === q.key ? 'm-quad-on' : ''}`}
                            onClick={() => setQuadrant(quadrant === q.key ? null : q.key)}
                            aria-pressed={quadrant === q.key}
                            disabled={isLoading}
                        >
                            <div className="m-label" style={{ marginBottom: 12 }}>{q.label}</div>
                            <div className={`m-quad-value ${q.key === 'important_urgent' ? 'm-accent' : ''}`}>
                                {isLoading ? dash : `${q.pct}%`}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--m-neutral-600)', marginTop: 6 }}>
                                {isLoading
                                    ? ' '
                                    : `${q.completed} / ${q.total} pts · ${q.count} ${q.count === 1 ? 'task' : 'tasks'}`}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid var(--m-divider)' }}>
                <div style={{ padding: '32px 32px 32px 0' }}>
                    <div className="m-label m-accent" style={{ marginBottom: 10 }}>Most done</div>
                    <div style={{ fontFamily: 'var(--m-heading)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em' }}>
                        {isLoading ? dash : mostDone?.title ?? dash}
                    </div>
                    {!isLoading && mostDone && (
                        <div style={{ fontSize: 13, color: 'var(--m-neutral-600)', marginTop: 4 }}>
                            {mostDone.completed} of {mostDone.possible} days · {mostDone.pct}%
                        </div>
                    )}
                </div>
                <div style={{ padding: 32, borderLeft: '2px solid var(--m-divider)' }}>
                    <div className="m-label" style={{ marginBottom: 10 }}>Least done</div>
                    <div style={{ fontFamily: 'var(--m-heading)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em' }}>
                        {isLoading ? dash : leastDone?.title ?? dash}
                    </div>
                    {!isLoading && leastDone && (
                        <div style={{ fontSize: 13, color: 'var(--m-neutral-600)', marginTop: 4 }}>
                            {leastDone.completed} of {leastDone.possible} days · {leastDone.pct}%
                        </div>
                    )}
                </div>
            </div>

            <div style={{ padding: '56px 0 0' }}>
                <h2 className="m-h2" style={{ marginBottom: 20 }}>
                    {quadrant ? 'Filtered tasks' : 'Task performance'}
                </h2>
                <div style={{ borderTop: '2px solid var(--m-divider)' }}>
                    {isLoading && [0, 1, 2, 3, 4].map((i) => (
                        <div className="m-perf-row" key={i}>
                            <div className="m-skel" style={{ height: 14, width: `${75 - i * 7}%` }} />
                            <div className="m-skel" style={{ height: 8 }} />
                            <div className="m-skel" style={{ height: 14 }} />
                        </div>
                    ))}
                    {!isLoading && perf.length === 0 && <p className="m-empty">No tasks for this selection.</p>}
                    {!isLoading && perf.map((t) => (
                        <div className="m-perf-row" key={t.id}>
                            <div style={{ fontSize: 15 }}>{t.title}</div>
                            <div className="m-thin-track">
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${Math.max(1, t.pct)}%`,
                                        background: t.pct === 100 ? 'var(--m-accent)' : 'var(--m-text)',
                                    }}
                                />
                            </div>
                            <div className="m-score">{t.pct}%</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
