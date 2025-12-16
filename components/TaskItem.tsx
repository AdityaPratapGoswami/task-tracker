'use client';

import { Check, Square } from 'lucide-react';
import { ITask } from '@/models/Task';
import clsx from 'clsx';
import styles from './TaskItem.module.css';

interface TaskItemProps {
    task: ITask;
    onToggle: (id: string, isCompleted: boolean) => void;
}

export default function TaskItem({ task, onToggle }: TaskItemProps) {
    return (
        <div
            className={clsx(styles.taskItem, task.isCompleted && styles.completed)}
            onClick={() => onToggle(task._id as string, !task.isCompleted)}
        >
            <div className={styles.icon}>
                {task.isCompleted ? <Check size={16} /> : <Square size={16} />}
            </div>
            <span className={`${styles.title} text-body`}>{task.title}</span>
        </div>
    );
}
