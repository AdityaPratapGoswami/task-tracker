'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ITask } from '@/models/Task';
import TaskItem from './TaskItem';
import styles from './CategoryBlock.module.css';

interface CategoryBlockProps {
    category: string;
    tasks: ITask[];
    onToggleTask: (id: string, isCompleted: boolean) => void;
    onEdit: (task: ITask) => void;
}

// CATEGORY_COLORS removed for monochrome theme

export default function CategoryBlock({ category, tasks, onToggleTask, onEdit }: CategoryBlockProps) {
    const [isOpen, setIsOpen] = useState(false);
    // const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other; // Removed

    return (
        <div className={styles.container}>
            <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
                <span className={styles.toggleIcon}>
                    <ChevronDown
                        size={16}
                        style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.6s ease'
                        }}
                    />
                </span>
                <span className={styles.title}>{category}</span>
                <span className={styles.count}>{tasks.filter(t => t.isCompleted).length}/{tasks.length}</span>
            </div>

            <div style={{
                maxHeight: isOpen ? '1000px' : '0',
                opacity: isOpen ? 1 : 0,
                overflow: 'hidden',
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                <div className={styles.taskList}>
                    {tasks.map(task => (
                        <TaskItem key={task._id as string} task={task} onToggle={onToggleTask} onEdit={onEdit} />
                    ))}
                </div>
            </div>
        </div>
    );
}
