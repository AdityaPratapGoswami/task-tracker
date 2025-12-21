'use client';

import { Check, Square, Pencil, Star, Zap } from 'lucide-react';
import { ITask } from '@/models/Task';
import clsx from 'clsx';
import styles from './TaskItem.module.css';

interface TaskItemProps {
    task: ITask;
    onToggle: (id: string, isCompleted: boolean) => void;
    onEdit: (task: ITask) => void;
}

export default function TaskItem({ task, onToggle, onEdit }: TaskItemProps) {
    return (
        <div
            className={clsx(styles.taskItem, task.isCompleted && styles.completed)}
            onClick={() => onToggle(task._id as string, !task.isCompleted)}
        >
            <div className={styles.icon}>
                {task.isCompleted ? <Check size={16} /> : <Square size={16} />}
            </div>
            <span className={`${styles.title} text-body`}>{task.title}</span>
            <div style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                {task.isUrgent && (
                    <Zap size={14} fill="#F97316" color="#F97316" />
                )}
                {task.isImportant && (
                    <Star size={14} fill="#F59E0B" color="#F59E0B" />
                )}
                <div style={{
                    fontSize: '0.75rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    color: 'var(--color-text-muted)',
                    fontWeight: 600
                }}>
                    {task.points || 1} pts
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                }}
                className={styles.editBtn}
                style={{
                    marginLeft: '8px',
                    padding: '4px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center'
                }}
                title="Edit Task"
            >
                <Pencil size={14} />
            </button>
        </div>
    );
}
