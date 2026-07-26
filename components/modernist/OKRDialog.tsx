'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { IOKR } from '@/types/okr';

const MAX_KEY_RESULTS = 5;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (
        okr: { objective: string; keyResults: { title: string; completed: boolean }[] },
        id?: string
    ) => void;
    okrToEdit: IOKR | null;
}

/**
 * Modernist replacement for the old AddOKRModal.
 *
 * Same props and same onSave shape as the component it replaces, so the only
 * change at the call site is the import. Uses the shared overlay/panel shell
 * from QuickAddSpontaneous and ConfirmDialog rather than a portal — nothing in
 * the app clips it, so the portal was unnecessary indirection.
 */
export default function OKRDialog({ isOpen, onClose, onSave, okrToEdit }: Props) {
    const [objective, setObjective] = useState('');
    const [keyResults, setKeyResults] = useState<{ title: string; completed: boolean }[]>([]);
    const objectiveRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        if (okrToEdit) {
            setObjective(okrToEdit.objective);
            setKeyResults(okrToEdit.keyResults.map((kr) => ({ title: kr.title, completed: kr.completed })));
        } else {
            setObjective('');
            setKeyResults([{ title: '', completed: false }]);
        }

        const id = setTimeout(() => objectiveRef.current?.focus(), 0);
        return () => clearTimeout(id);
    }, [isOpen, okrToEdit]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const setKeyResultTitle = (index: number, title: string) => {
        setKeyResults((prev) => prev.map((kr, i) => (i === index ? { ...kr, title } : kr)));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!objective.trim()) return;
        onSave(
            {
                objective: objective.trim(),
                keyResults: keyResults.filter((kr) => kr.title.trim() !== ''),
            },
            okrToEdit?._id
        );
        onClose();
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
                    width: 480,
                    maxWidth: '100%',
                    background: 'var(--m-bg)',
                    border: '2px solid var(--m-divider)',
                    padding: 28,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
            >
                <div className="m-label" style={{ marginBottom: 20 }}>
                    {okrToEdit ? 'Edit objective' : 'Add objective'}
                </div>

                <div style={{ marginBottom: 22 }}>
                    <label className="m-label" htmlFor="m-okr-objective" style={{ marginBottom: 8 }}>
                        Objective
                    </label>
                    <input
                        id="m-okr-objective"
                        ref={objectiveRef}
                        className="m-input"
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        placeholder="Become the healthiest version of myself"
                        required
                    />
                    <div style={{ fontSize: 12, color: 'var(--m-neutral-500)', marginTop: 8 }}>
                        Motivating, clear and ambitious.
                    </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span className="m-label">Key results</span>
                        <span className="m-pts">{keyResults.length} / {MAX_KEY_RESULTS}</span>
                    </div>

                    {keyResults.map((kr, index) => (
                        <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <input
                                className="m-input"
                                value={kr.title}
                                onChange={(e) => setKeyResultTitle(index, e.target.value)}
                                placeholder={`Key result ${index + 1}`}
                                aria-label={`Key result ${index + 1}`}
                            />
                            {keyResults.length > 1 && (
                                <button
                                    type="button"
                                    className="m-btn m-btn-ghost"
                                    style={{ padding: 8, flex: '0 0 auto' }}
                                    onClick={() => setKeyResults((prev) => prev.filter((_, i) => i !== index))}
                                    aria-label={`Remove key result ${index + 1}`}
                                    title="Remove key result"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}

                    {keyResults.length < MAX_KEY_RESULTS && (
                        <button
                            type="button"
                            className="m-btn m-btn-ghost"
                            onClick={() => setKeyResults((prev) => [...prev, { title: '', completed: false }])}
                        >
                            <Plus size={14} /> Add key result
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" className="m-btn m-btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="m-btn m-btn-primary" disabled={!objective.trim()}>
                        {okrToEdit ? 'Update objective' : 'Save objective'}
                    </button>
                </div>
            </form>
        </div>
    );
}
