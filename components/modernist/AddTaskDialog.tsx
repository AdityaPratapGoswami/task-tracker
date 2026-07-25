'use client';

import { useEffect, useRef, useState } from 'react';
import { Star, Zap } from 'lucide-react';

interface Category {
    _id: string;
    name: string;
}

interface TaskData {
    title: string;
    category: string;
    points: 1 | 2 | 3;
    isImportant: boolean;
    isUrgent: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: TaskData, id?: string) => Promise<void>;
    defaultCategory?: string;
    taskToEdit?: { _id: string; title: string; category: string; points: number; isImportant?: boolean; isUrgent?: boolean } | null;
}

/**
 * Modernist-styled stand-in for the legacy AddTaskModal.
 *
 * That component is still correct for the mobile screens it was built for,
 * but it's glassmorphic and rounded — the opposite of this system's flat,
 * zero-radius language — so it can't just be reused here the way
 * ConfirmDialog's shell was. Same field set and the same onSave/taskToEdit
 * contract, so ProfileBoard didn't need to change how it calls this.
 */
export default function AddTaskDialog({ isOpen, onClose, onSave, defaultCategory, taskToEdit }: Props) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(defaultCategory || '');
    const [points, setPoints] = useState<1 | 2 | 3>(1);
    const [isImportant, setIsImportant] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [creatingCategory, setCreatingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [saving, setSaving] = useState(false);
    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        (async () => {
            try {
                const res = await fetch('/api/categories');
                if (res.ok) setCategories(await res.json());
            } catch (err) {
                console.error('Failed to load categories', err);
            }
        })();

        if (taskToEdit) {
            setTitle(taskToEdit.title);
            setCategory(taskToEdit.category);
            const p = taskToEdit.points;
            setPoints(p === 1 || p === 2 || p === 3 ? p : 1);
            setIsImportant(taskToEdit.isImportant || false);
            setIsUrgent(taskToEdit.isUrgent || false);
        } else {
            setTitle('');
            setCategory(defaultCategory || '');
            setPoints(1);
            setIsImportant(false);
            setIsUrgent(false);
        }
        setCreatingCategory(false);
        setNewCategory('');

        const id = setTimeout(() => titleRef.current?.focus(), 0);
        return () => clearTimeout(id);
    }, [isOpen, defaultCategory, taskToEdit]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || saving) return;

        setSaving(true);
        try {
            let finalCategory = category;

            if (creatingCategory && newCategory.trim()) {
                const res = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newCategory.trim() }),
                });
                if (res.ok) finalCategory = (await res.json()).name;
            }

            if (!finalCategory) {
                setSaving(false);
                return;
            }

            await onSave({ title: title.trim(), category: finalCategory, points, isImportant, isUrgent }, taskToEdit?._id);
            onClose();
        } catch (err) {
            console.error('Failed to save task', err);
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
                padding: 16,
            }}
            onClick={onClose}
        >
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 460,
                    maxWidth: '100%',
                    background: 'var(--m-bg)',
                    border: '2px solid var(--m-divider)',
                    padding: 28,
                }}
            >
                <div className="m-label" style={{ marginBottom: 20 }}>
                    {taskToEdit ? 'Edit task' : 'Add task'}
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label className="m-label" htmlFor="m-task-title" style={{ marginBottom: 8 }}>Title</label>
                    <input
                        id="m-task-title"
                        ref={titleRef}
                        className="m-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What needs to be done?"
                        required
                    />
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label className="m-label" htmlFor="m-task-category" style={{ marginBottom: 8 }}>Category</label>
                    {!creatingCategory ? (
                        <select
                            id="m-task-category"
                            className="m-input"
                            value={category}
                            onChange={(e) => {
                                if (e.target.value === '__new__') {
                                    setCreatingCategory(true);
                                    setCategory('');
                                } else {
                                    setCategory(e.target.value);
                                }
                            }}
                            disabled={!!defaultCategory}
                            required
                        >
                            <option value="" disabled>Select a category</option>
                            {categories.map((c) => (
                                <option key={c._id} value={c.name}>{c.name}</option>
                            ))}
                            {!defaultCategory && <option value="__new__">+ Create new category</option>}
                        </select>
                    ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                className="m-input"
                                autoFocus
                                placeholder="New category name"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                            />
                            <button
                                type="button"
                                className="m-btn m-btn-secondary"
                                onClick={() => { setCreatingCategory(false); setNewCategory(''); }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: 20 }}>
                    <span className="m-label" style={{ marginBottom: 8 }}>Points</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {([1, 2, 3] as const).map((p) => (
                            <button
                                key={p}
                                type="button"
                                className={`m-btn ${points === p ? 'm-btn-primary' : 'm-btn-secondary'}`}
                                style={{ flex: 1, justifyContent: 'center' }}
                                onClick={() => setPoints(p)}
                                aria-pressed={points === p}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                    <button
                        type="button"
                        className={`m-btn ${isImportant ? 'm-btn-primary' : 'm-btn-secondary'}`}
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setIsImportant(!isImportant)}
                        aria-pressed={isImportant}
                    >
                        <Star size={14} fill={isImportant ? 'currentColor' : 'none'} />
                        Important
                    </button>
                    <button
                        type="button"
                        className={`m-btn ${isUrgent ? 'm-btn-primary' : 'm-btn-secondary'}`}
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setIsUrgent(!isUrgent)}
                        aria-pressed={isUrgent}
                    >
                        <Zap size={14} fill={isUrgent ? 'currentColor' : 'none'} />
                        Urgent
                    </button>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" className="m-btn m-btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="m-btn m-btn-primary" disabled={saving || !title.trim()}>
                        {saving ? 'Saving…' : taskToEdit ? 'Update task' : 'Add task'}
                    </button>
                </div>
            </form>
        </div>
    );
}
