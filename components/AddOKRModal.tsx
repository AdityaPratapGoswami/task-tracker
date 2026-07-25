'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import { IOKR } from '@/types/okr';
import styles from './AddOKRModal.module.css';

interface AddOKRModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (okr: { objective: string; keyResults: { title: string; completed: boolean }[] }, id?: string) => void;
    okrToEdit: IOKR | null;
}

export default function AddOKRModal({ isOpen, onClose, onSave, okrToEdit }: AddOKRModalProps) {
    const [objective, setObjective] = useState('');
    const [keyResults, setKeyResults] = useState<{ title: string; completed: boolean }[]>([]);

    useEffect(() => {
        if (okrToEdit) {
            setObjective(okrToEdit.objective);
            setKeyResults(okrToEdit.keyResults.map(kr => ({ title: kr.title, completed: kr.completed })));
        } else {
            setObjective('');
            setKeyResults([{ title: '', completed: false }]);
        }
    }, [okrToEdit, isOpen]);

    const handleKeyResultChange = (index: number, value: string) => {
        const newKeyResults = [...keyResults];
        newKeyResults[index].title = value;
        setKeyResults(newKeyResults);
    };

    const addKeyResult = () => {
        if (keyResults.length < 5) {
            setKeyResults([...keyResults, { title: '', completed: false }]);
        }
    };

    const removeKeyResult = (index: number) => {
        const newKeyResults = keyResults.filter((_, i) => i !== index);
        setKeyResults(newKeyResults);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ objective, keyResults: keyResults.filter(kr => kr.title.trim() !== '') }, okrToEdit?._id);
        onClose();
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen) return null;
    if (!mounted) return null;

    return createPortal(
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {okrToEdit ? 'Edit OKR' : 'Add OKR'}
                    </h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Objective (BHAG) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="text"
                                className={styles.input}
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                placeholder="e.g., Become the healthiest version of myself"
                                required
                                autoFocus
                            />
                        </div>
                        <p className={styles.helperText}>
                            Motivating, clear, and ambitious goal.
                        </p>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Key Results (Max 5)
                            <span style={{ marginLeft: 'auto', fontSize: '0.85rem', fontWeight: 400, color: '#94a3b8', float: 'right' }}>
                                {keyResults.length}/5
                            </span>
                        </label>
                        <div className={styles.keyResultList}>
                            {keyResults.map((kr, index) => (
                                <div key={index} className={styles.keyResultItem}>
                                    <input
                                        type="text"
                                        className={styles.keyResultInput}
                                        value={kr.title}
                                        onChange={(e) => handleKeyResultChange(index, e.target.value)}
                                        placeholder={`Key Result #${index + 1}`}
                                    />
                                    {keyResults.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeKeyResult(index)}
                                            className={styles.removeBtn}
                                            title="Remove Key Result"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {keyResults.length < 5 && (
                            <button
                                type="button"
                                onClick={addKeyResult}
                                className={styles.addBtn}
                            >
                                <Plus size={18} /> Add Key Result
                            </button>
                        )}
                    </div>

                    <div className={styles.actions}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`${styles.btn} ${styles.cancelBtn}`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`${styles.btn} ${styles.submitBtn}`}
                        >
                            Save OKR
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
