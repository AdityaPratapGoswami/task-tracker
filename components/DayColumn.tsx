'use client';

import { format, isToday } from 'date-fns';
import { ITask } from '@/models/Task';
import CategoryBlock from './CategoryBlock';
import styles from './DayColumn.module.css';
import clsx from 'clsx';

interface DayColumnProps {
    date: Date;
    tasks: ITask[];
    onToggleTask: (id: string, isCompleted: boolean) => void;
    style?: React.CSSProperties;
}

export default function DayColumn({ date, tasks, onToggleTask, style }: DayColumnProps) {
    const dayName = format(date, 'EEE');
    const dateStr = format(date, 'MMM d');
    const isCurrentDay = isToday(date);

    // Group tasks by category
    const tasksByCategory: Record<string, ITask[]> = {};
    tasks.forEach(task => {
        if (!tasksByCategory[task.category]) {
            tasksByCategory[task.category] = [];
        }
        tasksByCategory[task.category].push(task);
    });

    const categories = Object.keys(tasksByCategory).sort();

    return (
        <div className={clsx(styles.column, isCurrentDay && styles.today)} style={style}>
            <div className={styles.header}>
                <span className={styles.dayName}>{dayName}</span>
                <span className={styles.date}>{dateStr}</span>
            </div>

            <div className={styles.content}>
                {categories.length > 0 ? (
                    categories.map(category => (
                        <CategoryBlock
                            key={category}
                            category={category}
                            tasks={tasksByCategory[category]}
                            onToggleTask={onToggleTask}
                        />
                    ))
                ) : (
                    <div className={styles.emptyState}>No tasks</div>
                )}
            </div>
        </div>
    );
}
