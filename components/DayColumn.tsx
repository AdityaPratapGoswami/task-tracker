'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { format, isToday } from 'date-fns';
import { ITask } from '@/models/Task';
import styles from './DayColumn.module.css';
import clsx from 'clsx';
import TaskItem from './TaskItem';
import { ChevronDown } from 'lucide-react';

interface DayColumnProps {
    date: Date;
    tasks: ITask[];
    onToggleTask: (id: string, isCompleted: boolean) => void;
    onEdit: (task: ITask) => void;
    style?: React.CSSProperties;
}

interface CategoryStat {
    key: string;
    label: string;
    color: string;
    total: number;
    completed: number;
    hasTasks: boolean;
    tasks: ITask[];
}

// Categories to track
const TARGET_CATEGORIES = [
    { key: 'Health', label: 'Health', color: 'green' },
    { key: 'Relationships', label: 'Relationships', color: 'blue' },
    { key: 'Wealth', label: 'Wealth', color: 'yellow' }
];

// Memoized Category Section Component
const CategorySection = memo(({
    stat,
    isExpanded,
    onToggle,
    onToggleTask,
    onEdit
}: {
    stat: CategoryStat;
    isExpanded: boolean;
    onToggle: (key: string) => void;
    onToggleTask: (id: string, isCompleted: boolean) => void;
    onEdit: (task: ITask) => void;
}) => {
    return (
        <div className={clsx(styles.categoryBar, styles[stat.color])}>
            {/* Header is the clickable toggle */}
            <div
                onClick={() => onToggle(stat.key)}
                style={{ cursor: 'pointer' }}
            >
                <div className={styles.barHeader}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className={styles.barLabel}>{stat.label}</span>
                        <ChevronDown
                            size={16}
                            className={styles.toggleIcon}
                            style={{
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s ease',
                                marginLeft: '4px',
                                opacity: 0.6
                            }}
                        />
                    </div>
                    <span className={`${styles.barCount} text-meta`}>{stat.completed}/{stat.total}</span>
                </div>
                <div className={styles.progressTrack}>
                    <div
                        className={styles.progressBar}
                        style={{ width: `${stat.total > 0 ? (stat.completed / stat.total) * 100 : 0}%` }}
                    ></div>
                </div>
            </div>

            {/* Content Wrapper for Animation */}
            <div className={clsx(styles.taskListWrapper, isExpanded && styles.expanded)}>
                <div className={styles.taskListInner}>
                    <div className={styles.taskList}>
                        {stat.tasks.length > 0 ? (
                            stat.tasks.map(task => (
                                <TaskItem
                                    key={task._id as string}
                                    task={task}
                                    onToggle={onToggleTask}
                                    onEdit={onEdit}
                                />
                            ))
                        ) : (
                            <div className={styles.emptyTaskMsg}>No tasks yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

CategorySection.displayName = 'CategorySection';

export default function DayColumn({ date, tasks, onToggleTask, onEdit, style }: DayColumnProps) {
    const dayName = format(date, 'EEE');
    const dateStr = format(date, 'MMM d');
    const isCurrentDay = isToday(date);

    // State to track expanded categories by key
    const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

    const toggleCategory = useCallback((key: string) => {
        setExpandedCats(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    }, []);

    // Calculate progress for each target category
    const categoryStats = useMemo(() => TARGET_CATEGORIES.map(cat => {
        // Filter tasks that match this category (case-insensitive)
        const catTasks = tasks.filter(t => t.category.toLowerCase() === cat.key.toLowerCase());
        const total = catTasks.length;
        const completed = catTasks.filter(t => t.isCompleted).length;
        return {
            ...cat,
            total,
            completed,
            hasTasks: total > 0,
            tasks: catTasks // Keep reference to tasks for rendering
        };
    }), [tasks]);

    // Quotes for each day (Mon-Sun)
    const quotes = [
        "We become what we repeatedly choose.",
        "Peace begins the moment you stop arguing with reality.",
        "Nothing changes until your priorities do.",
        "Life expands for those who dare to question it.",
        "Calm is the ultimate strength.",
        "You are the architect of the meaning you seek.",
        "Discipline is freedom in disguise."
    ];

    // Get quote based on day of week (0 = Sun, 1 = Mon ... 6 = Sat)
    // Adjust logic to map correctly if week starts on Mon
    const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday...
    // Map: Mon=0, Tue=1, ... Sun=6
    const quoteIndex = dayIndex === 0 ? 6 : dayIndex - 1;

    return (
        <div className={clsx(styles.column, isCurrentDay && styles.today)} style={style}>
            <div className={styles.header}>
                <span className={`${styles.dayName} text-heading`}>{dayName}</span>
                <span className={`${styles.date} text-heading`}>{dateStr}</span>
            </div>

            <div className={styles.content}>
                {categoryStats.map(stat => (
                    <CategorySection
                        key={stat.key}
                        stat={stat}
                        isExpanded={!!expandedCats[stat.key]}
                        onToggle={toggleCategory}
                        onToggleTask={onToggleTask}
                        onEdit={onEdit}
                    />
                ))}

                <div className={`${styles.quote} text-caption`}>
                    {quotes[quoteIndex]}
                </div>
            </div>
        </div>
    );
}
