'use client';

import { useMemo, useState } from 'react';
import { addDays, subDays, format, parseISO } from 'date-fns';
import QuickAddSpontaneous from './QuickAddSpontaneous';
import { useCachedJson, invalidateCache } from '@/lib/dataCache';
import useToday from '@/lib/useToday';
import type { DayData } from '@/lib/serverData';
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

// Stable reference so an absent response doesn't invalidate every memo below.
const NO_TASKS: MetricTask[] = [];

interface Props {
    /** The server's idea of today, as YYYY-MM-DD. */
    initialDate: string;
    /** Data for initialDate, loaded during the server render. */
    initialData?: DayData;
}

export default function DayBoard({ initialDate, initialData }: Props) {
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    // Null until the user navigates days, so the view tracks the real today.
    const [selected, setSelected] = useState<string | null>(null);

    const today = useToday(initialDate);
    const key = selected ?? today;
    const setKey = setSelected;

    /*
     * Drafts and the save stamp are tagged with the day they belong to, so
     * changing day discards them implicitly. Holding the day inside the state
     * avoids an effect whose only job is to reset other state.
     */
    const [draft, setDraft] = useState<{
        key: string;
        gratitude: string | null;
        journal: string | null;
        savedAt: string | null;
    }>({ key: initialDate, gratitude: null, journal: null, savedAt: null });

    const forThisDay = draft.key === key;
    const gratitudeDraft = forThisDay ? draft.gratitude : null;
    const journalDraft = forThisDay ? draft.journal : null;
    const savedAt = forThisDay ? draft.savedAt : null;

    const setGratitudeDraft = (value: string) =>
        setDraft((d) => ({ ...(d.key === key ? d : { key, gratitude: null, journal: null, savedAt: null }), key, gratitude: value }));
    const setJournalDraft = (value: string) =>
        setDraft((d) => ({ ...(d.key === key ? d : { key, gratitude: null, journal: null, savedAt: null }), key, journal: value }));

    const url = `/api/day?date=${key}`;
    const { data, isLoading, mutate } = useCachedJson<DayData>(
        url,
        key === initialDate ? initialData : undefined
    );

    const tasks = useMemo(() => data?.tasks ?? NO_TASKS, [data]);
    const gratitude = gratitudeDraft ?? data?.gratitude ?? '';
    const journal = journalDraft ?? data?.journal ?? '';

    const date = useMemo(() => parseISO(key), [key]);

    const active = useMemo(() => tasks.filter((t) => isActiveOn(t, key)), [tasks, key]);
    const regular = useMemo(() => active.filter((t) => t.type === 'regular'), [active]);
    const spontaneous = useMemo(() => active.filter((t) => t.type === 'spontaneous'), [active]);
    const pillars = useMemo(() => groupByCategory(regular), [regular]);

    const possible = active.reduce((a, t) => a + pointsOf(t), 0);
    const earned = active.reduce((a, t) => a + (isDoneOn(t, key) ? pointsOf(t) : 0), 0);
    const pct = possible > 0 ? Math.round((earned / possible) * 100) : 0;

    /** Writes tasks back to the cache so the change survives navigation. */
    const setTasks = (next: MetricTask[]) => {
        mutate({ tasks: next, gratitude: data?.gratitude ?? '', journal: data?.journal ?? '' });
    };

    // Any task write invalidates the week and analytics views, which read the
    // same underlying records through different keys.
    const invalidateOtherViews = () => {
        invalidateCache((u) => u !== url && (u.startsWith('/api/tasks') || u.startsWith('/api/day')));
    };

    const toggle = async (task: MetricTask) => {
        const next = !isDoneOn(task, key);

        setTasks(
            tasks.map((t) => {
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
            invalidateOtherViews();
        } catch (err) {
            console.error('Failed to toggle task', err);
        }
    };

    const handleSpontaneousCreated = (task: MetricTask) => {
        // Spontaneous tasks are always dated to the real today, so this only
        // belongs in the list when the board is showing today.
        if (task.date === key) setTasks([...tasks, task]);
        invalidateOtherViews();
    };

    const saveEntry = async () => {
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
            // Saved values become the cached truth, so the drafts can be
            // cleared and the entry survives navigating away and back.
            mutate({ tasks, gratitude, journal });
            setDraft({ key, gratitude: null, journal: null, savedAt: format(new Date(), 'HH:mm') });
        } catch (err) {
            console.error('Failed to save entry', err);
        } finally {
            setSaving(false);
        }
    };

    const isToday = key === today;
    const quote = QUOTES[date.getDate() % QUOTES.length];

    const renderTask = (task: MetricTask) => {
        const done = isDoneOn(task, key);
        return (
            <button className="m-taskrow" key={task._id} onClick={() => toggle(task)} aria-pressed={done}>
                <span className={`m-check ${done ? 'm-check-on' : ''}`}>{done ? '✓' : ''}</span>
                <span className={`m-tasklabel ${done ? 'm-tasklabel-done' : ''}`}>{task.title}</span>
                {task.isOverdue && !done && <span className="m-overdue-tag">OVERDUE</span>}
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
                    <button className="m-btn m-btn-secondary" onClick={() => setKey(dayKey(subDays(date, 1)))} aria-label="Previous day">←</button>
                    <button className="m-btn m-btn-secondary" onClick={() => setKey(dayKey(addDays(date, 1)))} aria-label="Next day">→</button>
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
                            {isLoading ? '—' : `${earned} of ${possible} points`}
                        </div>
                    </div>

                    {/* Skeletons rather than "Nothing scheduled" — an empty state
                        is a claim, and it isn't true until the data has landed. */}
                    {isLoading && (
                        <div>
                            {[0, 1, 2, 3].map((i) => (
                                <div className="m-taskrow" key={i} style={{ cursor: 'default' }}>
                                    <span className="m-skel" style={{ width: 22, height: 22, flex: '0 0 22px' }} />
                                    <span className="m-skel" style={{ height: 14, flex: 1, maxWidth: `${70 - i * 8}%` }} />
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && pillars.length === 0 && spontaneous.length === 0 && (
                        <p className="m-empty">Nothing scheduled. Add a task to get going.</p>
                    )}

                    {!isLoading && pillars.map((pillar) => {
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

                    {!isLoading && spontaneous.length > 0 && (
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
                        <div className="m-bigpct">{isLoading ? '—' : `${pct}%`}</div>
                        <div style={{ fontSize: 14, color: 'var(--m-neutral-600)', paddingBottom: 10 }}>
                            {isLoading ? '' : `${Math.max(0, possible - earned)} points remaining`}
                        </div>
                    </div>
                    <div className="m-track" style={{ marginBottom: 44 }}>
                        <div className="m-fill" style={{ width: isLoading ? '0%' : `${pct}%` }} />
                    </div>

                    <p className="m-quote">{quote}</p>

                    <div style={{ marginBottom: 32 }}>
                        <label className="m-label" htmlFor="m-gratitude" style={{ marginBottom: 10 }}>Gratitude</label>
                        <textarea
                            id="m-gratitude"
                            className="m-input"
                            rows={3}
                            // While loading there is no way to know whether this
                            // day has an entry, so don't imply it's empty.
                            placeholder={isLoading ? 'Loading…' : 'What are you grateful for today?'}
                            disabled={isLoading}
                            value={gratitude}
                            onChange={(e) => setGratitudeDraft(e.target.value)}
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label className="m-label" htmlFor="m-journal" style={{ marginBottom: 10 }}>Journal</label>
                        <textarea
                            id="m-journal"
                            className="m-input"
                            rows={8}
                            placeholder={isLoading ? 'Loading…' : 'Reflect on your day…'}
                            disabled={isLoading}
                            value={journal}
                            onChange={(e) => setJournalDraft(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button className="m-btn m-btn-primary" onClick={saveEntry} disabled={saving || isLoading}>
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
