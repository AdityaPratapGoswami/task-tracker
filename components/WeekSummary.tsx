'use client';

import { format } from 'date-fns';
import { ITask } from '@/models/Task';
import { IGratitude } from '@/models/Gratitude';
import { IJournal } from '@/models/Journal';
import styles from './WeekSummary.module.css';

interface WeekSummaryProps {
    days: Date[];
    tasks: ITask[];
    gratitudes: IGratitude[];
    journals: IJournal[];
}

export default function WeekSummary({ days, tasks, gratitudes, journals }: WeekSummaryProps) {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>This week&apos;s Summary</h2>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Day</th>
                            <th>Tasks Done</th>
                            <th>Gratitude Entry</th>
                            <th>Journal Entry</th>
                        </tr>
                    </thead>
                    <tbody>
                        {days.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');

                            // Filter data for this day
                            const dayTasks = tasks.filter(t => t.date === dateStr);
                            const completedCount = dayTasks.filter(t => t.isCompleted).length;
                            const totalCount = dayTasks.length;
                            const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                            // Determine bar color matched to Day View logic
                            let barColor = '#EF4444'; // Red (< 33%)
                            if (percentage >= 33 && percentage <= 66) {
                                barColor = '#F59E0B'; // Yellow
                            } else if (percentage > 66) {
                                barColor = '#10B981'; // Green
                            }

                            const gratitude = gratitudes.find(g => g.date === dateStr);
                            const journal = journals.find(j => j.date === dateStr);

                            return (
                                <tr key={dateStr}>
                                    <td className={styles.dayCell}>
                                        <div className={styles.dayName}>{format(day, 'EEEE')}</div>
                                        <div className={styles.date}>{format(day, 'MMM d')}</div>
                                    </td>
                                    <td className={styles.tasksCell}>
                                        <div className={styles.progressText}>
                                            {completedCount}/{totalCount}
                                        </div>
                                        <div className={styles.progressBarBg}>
                                            <div
                                                className={styles.progressBarFill}
                                                style={{
                                                    width: `${percentage}%`,
                                                    backgroundColor: barColor
                                                }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className={styles.textCell}>
                                        {gratitude?.content ? (
                                            <div className={styles.textContent}>{gratitude.content}</div>
                                        ) : (
                                            <span className={styles.emptyText}>-</span>
                                        )}
                                    </td>
                                    <td className={styles.textCell}>
                                        {journal?.content ? (
                                            <div className={styles.textContent}>{journal.content}</div>
                                        ) : (
                                            <span className={styles.emptyText}>-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
