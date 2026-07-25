'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, subDays, format } from 'date-fns';
import QuickAddSpontaneous from './QuickAddSpontaneous';
import {
    MetricTask,
    dayKey,
    groupByCategory,
    isActiveOn,
    isDoneOn,
    pointsOf,
} from '@/lib/metrics';

// Deterministic per-day line — same day always shows the same one, so the
// page doesn't reshuffle on every render.
const QUOTES = [
    'Calm is the ultimate strength.',
    'Discipline is freedom in disguise.',
    'Small things, done daily, compound.',
    'The obstacle is the way.',
    'You do not rise to your goals; you fall to your systems.',
    'Attention is the rarest form of generosity.',
    'Begin again, as often as needed.',
];

export default function DayBoard() {
    const [date, setDate] = useState<Date | null>(null);
    const [tasks, setTasks] = useState<MetricTask[]>([]);
    const [gratitude, setGratitude] = useState('');
    const [journal, setJournal] = useState('');
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        setDate(new Date());
    }, []);

    const key = date ? dayKey(date) : null;

    const load = useCallback(async () => {
        if (!key) return;
        try {
            const [taskRes, gratRes, jourRes] = await Promise.all([
                fetch(`/api/tasks?startDate=${key}&endDate=${key}`),
                fetch(`/api/gratitude?date=${key}`),
                fetch(`/api/journal?date=${key}`),
            ]);
            if (taskRes.ok) setTasks(await taskRes.json());
            if (gratRes.ok) setGratitude((await gratRes.json()).content ?? '');
            if (jourRes.ok) setJournal((await jourRes.json()).content ?? '');
            setSavedAt(null);
        } catch (err) {
            console.error('Failed to load day', err);
        }
    }, [key]);

    useEffect(() => { load(); }, [load]);

    const active = useMemo(
        () => (key ? tasks.filter((t) => isActiveOn(t, key)) : []),
        [tasks, key]
    );

    const regular = useMemo(() => active.filter((t) => t.type === 'regular'), [active]);
    const spontaneous = useMemo(() => active.filter((t) => t.type === 'spontaneous'), [active]);
    const pillars = useMemo(() => groupByCategory(regular), [regular]);

    const possible = active.reduce((a, t) => a + pointsOf(t), 0);
    const earned = key
        ? active.reduce((a, t) => a + (isDoneOn(t, key) ? pointsOf(t) : 0), 0)
        : 0;
    const pct = possible > 0 ? Math.round((earned / possible) * 100) : 0;

    const toggle = async (task: MetricTask) => {
        if (!key) return;
        const next = !isDoneOn(task, key);

        setTasks((prev) =>
            prev.map((t) => {
                if (t._id !== task._id) return t;
                if (t.type === 'spontaneous') return { ...t, isCompleted: next };
                const dates = new Set(t.completedDates ?? []);
                if (next) dates.add(key);
                else dates.delete(key);
                return { ...t, completedDates: [...dates] };
            })
        );

        try {
            const body: Record<string, unknown> = { isCompleted: next };
            if (task.type === 'regular') body.toggleDate = key;
            await fetch(`/api/tasks/${task._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        } catch (err) {
            console.error('Failed to toggle task', err);
            load();
        }
    };

    // Spontaneous tasks are always dated to the real today, independent of
    // whichever day this board is currently showing — so this only shows up
    // in the list here when the viewed day is today.
    const handleSpontaneousCreated = (task: MetricTask) => {
        setTasks((prev) => [...prev, task]);
    };

    const saveEntry = async () => {
        if (!key) return;
        setSaving(true);
        try {
            await Promise.all([
                fetch('/api/gratitude', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: key, content: gratitude }),
                }),
                fetch('/api/journal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: key, content: journal }),
                }),
            ]);
            setSavedAt(format(new Date(), 'HH:mm'));
        } catch (err) {
            console.error('Failed to save entry', err);
        } finally {
            setSaving(false);
        }
    };

    if (!date || !key) {
        return (
            <section className="m-shell">
                <div className="m-kicker">Day view</div>
                <h1 className="m-title" style={{ marginTop: 10 }}>Loading…</h1>
            </section>
        );
    }

    const isToday = key === dayKey(new Date());
    const quote = QUOTES[date.getDate() % QUOTES.length];

    const renderTask = (task: MetricTask) => {
        const done = isDoneOn(task, key);
        return (
            <button className="m-taskrow" key={task._id} onClick={() => toggle(task)} aria-pressed={done}>
                <span className={`m-check ${done ? 'm-check-on' : ''}`}>{done ? '✓' : ''}</span>
                <span className={`m-tasklabel ${done ? 'm-tasklabel-done' : ''}`}>{task.title}</span>
                <span className="m-pts">{pointsOf(task)} PT</span>
            </button>
        );
    };

    return (
        <section className="m-shell">
            <div className="m-pagehead">
                <div>
                    <div className="m-kicker" style={{ marginBottom: 10 }}>
                        Day view{isToday ? ' · Today' : ''}
                    </div>
                    <h1 className="m-title">{format(date, 'EEEE, MMM d')}</h1>
                </div>
                <div className="m-actions">
                    <button className="m-btn m-btn-secondary" onClick={() => setDate(subDays(date, 1))} aria-label="Previous day">←</button>
                    <button className="m-btn m-btn-secondary" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">→</button>
                    <button className="m-btn m-btn-primary" onClick={() => setModalOpen(true)}>+ Add task</button>
                </div>
            </div>

            <QuickAddSpontaneous
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreated={handleSpontaneousCreated}
            />

            <div className="m-split">
                <div className="m-split-left">
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 26 }}>
                        <h2 className="m-h2">Today&apos;s tasks</h2>
                        <div style={{ fontSize: 13, color: 'var(--m-neutral-600)' }}>
                            {earned} of {possible} points
                        </div>
                    </div>

                    {pillars.length === 0 && spontaneous.length === 0 && (
                        <p className="m-empty">Nothing scheduled. Add a task to get going.</p>
                    )}

                    {pillars.map((pillar) => {
                        const doneCount = pillar.tasks.filter((t) => isDoneOn(t, key)).length;
                        return (
                            <div style={{ marginBottom: 30 }} key={pillar.name}>
                                <div className="m-group-head">
                                    <span className="m-pillar">{pillar.name}</span>
                                    <span style={{ fontSize: 12, color: 'var(--m-neutral-600)' }}>
                                        {doneCount} / {pillar.tasks.length}
                                    </span>
                                </div>
                                {pillar.tasks.map(renderTask)}
                            </div>
                        );
                    })}

                    {spontaneous.length > 0 && (
                        <div style={{ marginTop: 34 }}>
                            <div className="m-pillar" style={{ paddingBottom: 8, borderBottom: '2px solid var(--m-divider)' }}>
                                SPONTANEOUS
                            </div>
                            {spontaneous.map(renderTask)}
                        </div>
                    )}
                </div>

                <div className="m-split-right">
                    <div className="m-label">Progress</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, margin: '6px 0 18px' }}>
                        <div className="m-bigpct">{pct}%</div>
                        <div style={{ fontSize: 14, color: 'var(--m-neutral-600)', paddingBottom: 10 }}>
                            {Math.max(0, possible - earned)} points remaining
                        </div>
                    </div>
                    <div className="m-track" style={{ marginBottom: 44 }}>
                        <div className="m-fill" style={{ width: `${pct}%` }} />
                    </div>

                    <p className="m-quote">{quote}</p>

                    <div style={{ marginBottom: 32 }}>
                        <label className="m-label" htmlFor="m-gratitude" style={{ marginBottom: 10 }}>Gratitude</label>
                        <textarea
                            id="m-gratitude"
                            className="m-input"
                            rows={3}
                            placeholder="What are you grateful for today?"
                            value={gratitude}
                            onChange={(e) => setGratitude(e.target.value)}
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label className="m-label" htmlFor="m-journal" style={{ marginBottom: 10 }}>Journal</label>
                        <textarea
                            id="m-journal"
                            className="m-input"
                            rows={8}
                            placeholder="Reflect on your day…"
                            value={journal}
                            onChange={(e) => setJournal(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button className="m-btn m-btn-primary" onClick={saveEntry} disabled={saving}>
                            {saving ? 'Saving…' : 'Save entry'}
                        </button>
                        {savedAt && (
                            <span style={{ fontSize: 13, color: 'var(--m-neutral-500)' }}>
                                Last saved {savedAt}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
