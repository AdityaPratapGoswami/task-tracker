'use client';

import { useState, useEffect } from 'react';
import styles from './AddTaskModal.module.css';
import { X } from 'lucide-react';

interface Category {
    _id: string;
    name: string;
}

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: { title: string; category: string; points: 1 | 2 | 3 }, id?: string) => Promise<void>;
    defaultCategory?: string;
    taskToEdit?: { _id: string; title: string; category: string; points: number } | null;
}

export default function AddTaskModal({ isOpen, onClose, onSave, defaultCategory, taskToEdit }: AddTaskModalProps) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(defaultCategory || '');
    const [points, setPoints] = useState<1 | 2 | 3>(1);
    const [newCategory, setNewCategory] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            if (taskToEdit) {
                setTitle(taskToEdit.title);
                setCategory(taskToEdit.category);
                // Ensure points is valid, default to 1 if not 1/2/3 (though it should be)
                const p = taskToEdit.points;
                setPoints((p === 1 || p === 2 || p === 3) ? p : 1);
            } else {
                setTitle('');
                setCategory(defaultCategory || '');
                setPoints(1);
            }
            setNewCategory('');
            setIsCreatingCategory(false);
        }
    }, [isOpen, defaultCategory, taskToEdit]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        setLoading(true);
        try {
            let finalCategory = category;

            if (isCreatingCategory && newCategory) {
                // Create new category first
                const res = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newCategory }),
                });
                if (res.ok) {
                    const created = await res.json();
                    finalCategory = created.name;
                }
            }

            if (!finalCategory) {
                alert('Please select or create a category');
                setLoading(false);
                return;
            }

            await onSave({ title, category: finalCategory, points }, taskToEdit?._id);
            onClose();
        } catch (error) {
            console.error('Failed to add task', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{taskToEdit ? 'Edit Task' : 'Add New Task'}</h2>
                    <button onClick={onClose} className={styles.btnIcon}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Task Title</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            autoFocus
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Category</label>
                        {!isCreatingCategory ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select
                                    className={styles.select}
                                    value={category}
                                    onChange={(e) => {
                                        if (e.target.value === 'new') {
                                            setIsCreatingCategory(true);
                                            setCategory('');
                                        } else {
                                            setCategory(e.target.value);
                                        }
                                    }}
                                    required
                                    disabled={!!defaultCategory}
                                >
                                    <option value="" disabled>Select a category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))}
                                    {!defaultCategory && <option value="new">+ Create New Category</option>}
                                </select>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="New Category Name"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className={`${styles.btn} ${styles.cancelBtn}`}
                                    onClick={() => setIsCreatingCategory(false)}
                                    style={{ whiteSpace: 'nowrap', height: 'auto' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Points</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {([1, 2, 3] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`${styles.btn} ${points === p ? styles.submitBtn : styles.cancelBtn}`}
                                    onClick={() => setPoints(p)}
                                    style={{ flex: 1 }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={`${styles.btn} ${styles.cancelBtn}`} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={`${styles.btn} ${styles.submitBtn}`} disabled={loading}>
                            {loading ? 'Saving...' : (taskToEdit ? 'Update Task' : 'Add Task')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
