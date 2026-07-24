'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { startOfWeek, addDays, subDays, format } from 'date-fns';
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

export default function AnalyticsBoard() {
    const [anchor, setAnchor] = useState<Date | null>(null);
    const [tasks, setTasks] = useState<MetricTask[]>([]);
    const [quadrant, setQuadrant] = useState<string | null>(null);

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
    const prevDays = useMemo(
        () => (weekStart ? Array.from({ length: 7 }, (_, i) => addDays(subDays(weekStart, 7), i)) : []),
        [weekStart]
    );

    const today = dayKey(new Date());

    const load = useCallback(async () => {
        if (!weekStart) return;
        try {
            // One request spans both weeks so "vs. last week" costs no extra round trip.
            const start = dayKey(subDays(weekStart, 7));
            const end = dayKey(addDays(weekStart, 6));
            const res = await fetch(`/api/tasks?startDate=${start}&endDate=${end}`);
            if (res.ok) setTasks(await res.json());
        } catch (err) {
            console.error('Failed to load analytics', err);
        }
    }, [weekStart]);

    useEffect(() => { load(); }, [load]);

    const totals = useMemo(
        () => (weekDays.length ? dayTotals(tasks, weekDays, today) : []),
        [tasks, weekDays, today]
    );
    const summary = useMemo(
        () => (totals.length ? weekSummary(totals, weekDays) : null),
        [totals, weekDays]
    );
    const prevSummary = useMemo(
        () => (prevDays.length ? weekSummary(dayTotals(tasks, prevDays, today), prevDays) : null),
        [tasks, prevDays, today]
    );

    const perf = useMemo(() => {
        if (!weekDays.length) return [];
        const scoped = tasks.filter((t) => matchesQuadrant(t, quadrant));
        return taskPerformance(scoped, weekDays, today);
    }, [tasks, weekDays, today, quadrant]);

    const quads = useMemo(
        () => (weekDays.length ? eisenhower(tasks, weekDays, today) : []),
        [tasks, weekDays, today]
    );

    const strongestPillar = useMemo(() => {
        if (!weekDays.length) return null;
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

    if (!anchor || !summary) {
        return (
            <section className="m-shell">
                <div className="m-kicker">Analytics</div>
                <h1 className="m-title" style={{ marginTop: 10 }}>Loading…</h1>
            </section>
        );
    }

    const delta = prevSummary ? summary.pct - prevSummary.pct : 0;
    const mostDone = perf.length ? perf[0] : null;
    const leastDone = perf.length > 1 ? perf[perf.length - 1] : null;
    const rangeLabel = `${format(weekDays[0], 'MMM d')} — ${format(weekDays[6], 'MMM d')}`;

    return (
        <section className="m-shell">
            <div className="m-pagehead">
                <div>
                    <div className="m-kicker" style={{ marginBottom: 10 }}>Analytics</div>
                    <h1 className="m-title">{rangeLabel}</h1>
                </div>
                <div className="m-actions">
                    <button className="m-btn m-btn-secondary" onClick={() => setAnchor(subDays(anchor, 7))} aria-label="Previous week">←</button>
                    <button className="m-btn m-btn-secondary" onClick={() => setAnchor(addDays(anchor, 7))} aria-label="Next week">→</button>
                </div>
            </div>

            <div className="m-stats">
                <div className="m-stat">
                    <div className="m-label">Avg. completion</div>
                    <div className="m-stat-value m-accent">{summary.pct}%</div>
                </div>
                <div className="m-stat">
                    <div className="m-label">Points closed</div>
                    <div className="m-stat-value">{summary.earned}</div>
                </div>
                <div className="m-stat">
                    <div className="m-label">vs. last week</div>
                    <div className="m-stat-value">
                        {prevSummary && prevSummary.possible > 0
                            ? `${delta > 0 ? '+' : ''}${delta}%`
                            : '—'}
                    </div>
                </div>
                <div className="m-stat">
                    <div className="m-label">Strongest pillar</div>
                    <div className="m-stat-value">{strongestPillar?.name ?? '—'}</div>
                </div>
            </div>

            <div style={{ padding: '44px 0 0' }}>
                <h2 className="m-h2" style={{ marginBottom: 32 }}>Completion by day</h2>
                <div className="m-chart">
                    {totals.map((t, i) => {
                        const isToday = t.date === today;
                        const color = isToday ? 'var(--m-accent)' : t.isFuture ? 'var(--m-neutral-400)' : 'var(--m-text)';
                        return (
                            <div className="m-chart-col" key={t.date}>
                                <div className="m-chart-val" style={{ color }}>
                                    {t.isFuture ? '—' : `${t.pct}%`}
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
                        >
                            <div className="m-label" style={{ marginBottom: 12 }}>{q.label}</div>
                            <div className={`m-quad-value ${q.key === 'important_urgent' ? 'm-accent' : ''}`}>
                                {q.pct}%
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--m-neutral-600)', marginTop: 6 }}>
                                {q.completed} / {q.total} pts · {q.count} {q.count === 1 ? 'task' : 'tasks'}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid var(--m-divider)' }}>
                <div style={{ padding: '32px 32px 32px 0' }}>
                    <div className="m-label m-accent" style={{ marginBottom: 10 }}>Most done</div>
                    <div style={{ fontFamily: 'var(--m-heading)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em' }}>
                        {mostDone?.title ?? '—'}
                    </div>
                    {mostDone && (
                        <div style={{ fontSize: 13, color: 'var(--m-neutral-600)', marginTop: 4 }}>
                            {mostDone.completed} of {mostDone.possible} days · {mostDone.pct}%
                        </div>
                    )}
                </div>
                <div style={{ padding: 32, borderLeft: '2px solid var(--m-divider)' }}>
                    <div className="m-label" style={{ marginBottom: 10 }}>Least done</div>
                    <div style={{ fontFamily: 'var(--m-heading)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em' }}>
                        {leastDone?.title ?? '—'}
                    </div>
                    {leastDone && (
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
                    {perf.length === 0 && <p className="m-empty">No tasks for this selection.</p>}
                    {perf.map((t) => (
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
