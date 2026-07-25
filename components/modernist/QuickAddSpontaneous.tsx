'use client';

import { useEffect, useRef, useState } from 'react';
import { dayKey, MetricTask } from '@/lib/metrics';

// The category tasks are grouped by is a display concept — spontaneous tasks
// have no pillar, but the Task schema still requires a category string, so
// this sentinel fills that field without ever being shown or grouped on.
const SPONTANEOUS_CATEGORY = 'SPONTANEOUS';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (task: MetricTask) => void;
}

/**
 * Quick-capture for one-off tasks: title only. Every other field is fixed by
 * the product rule for spontaneous tasks — urgent, not important, no
 * category, dated to the real today regardless of which day or week the
 * parent screen happens to be showing.
 */
export default function QuickAddSpontaneous({ isOpen, onClose, onCreated }: Props) {
    const [title, setTitle] = useState('');
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            // Focus after the element has actually mounted.
            const id = setTimeout(() => inputRef.current?.focus(), 0);
            return () => clearTimeout(id);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const submit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = title.trim();
        if (!trimmed || saving) return;

        setSaving(true);
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: trimmed,
                    category: SPONTANEOUS_CATEGORY,
                    type: 'spontaneous',
                    points: 1,
                    isImportant: false,
                    isUrgent: true,
                    date: dayKey(new Date()),
                    isCompleted: false,
                }),
            });
            if (res.ok) {
                const saved: MetricTask = await res.json();
                onCreated(saved);
                onClose();
            }
        } catch (err) {
            console.error('Failed to add spontaneous task', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                background: 'color-mix(in srgb, #201e1d 50%, transparent)',
                zIndex: 50,
            }}
            onClick={onClose}
        >
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 440,
                    maxWidth: '90vw',
                    background: 'var(--m-bg)',
                    border: '2px solid var(--m-divider)',
                    padding: 28,
                }}
            >
                <div className="m-label" style={{ marginBottom: 4 }}>Spontaneous task</div>
                <div style={{ fontSize: 13, color: 'var(--m-neutral-600)', marginBottom: 16 }}>
                    Urgent, no category, added for today.
                </div>
                <input
                    ref={inputRef}
                    className="m-input"
                    placeholder="What needs doing?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
                    <button type="button" className="m-btn m-btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="m-btn m-btn-primary" disabled={saving || !title.trim()}>
                        {saving ? 'Adding…' : 'Add task'}
                    </button>
                </div>
            </form>
        </div>
    );
}
