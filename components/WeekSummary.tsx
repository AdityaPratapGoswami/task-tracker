import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { ITask } from '@/models/Task';
import { IGratitude } from '@/models/Gratitude';
import { IJournal } from '@/models/Journal';
import { ChevronDown, X } from 'lucide-react';
import styles from './WeekSummary.module.css';

interface WeekSummaryProps {
    days: Date[];
    tasks: ITask[];
    gratitudes: IGratitude[];
    journals: IJournal[];
}

export default function WeekSummary({ days, tasks, gratitudes, journals }: WeekSummaryProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<{ title: string; content: string; date: string } | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedEntry(null);
            }
        };

        if (selectedEntry) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedEntry]);

    return (
        <div className={styles.container}>
            <div
                className={styles.title}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <ChevronDown
                        size={20}
                        style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.6s ease'
                        }}
                    />
                </div>
                <span className="text-heading">This week&apos;s Summary</span>
            </div>

            <div style={{
                maxHeight: isOpen ? '1000px' : '0',
                opacity: isOpen ? 1 : 0,
                overflow: 'hidden',
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Day</th>
                                <th>Points Earned</th>
                                <th>Gratitude Entry</th>
                                <th>Journal Entry</th>
                            </tr>
                        </thead>
                        <tbody>
                            {days.map(day => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const fullDate = format(day, 'EEEE, MMM d, yyyy');

                                // Filter data for this day
                                const dayTasks = tasks.filter(t => t.date === dateStr);
                                const totalPoints = dayTasks.reduce((sum, t) => sum + (t.points || 1), 0);
                                const completedPoints = dayTasks.reduce((sum, t) => t.isCompleted ? sum + (t.points || 1) : sum, 0);
                                const percentage = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

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
                                                {completedPoints}/{totalPoints} pts
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
                                        <td
                                            className={`${styles.textCell} ${gratitude?.content ? styles.clickableCell : ''}`}
                                            onClick={() => gratitude?.content && setSelectedEntry({ title: 'Gratitude Entry', content: gratitude.content, date: fullDate })}
                                        >
                                            {gratitude?.content ? (
                                                <div className={styles.textContent}>{gratitude.content}</div>
                                            ) : (
                                                <span className={styles.emptyText}>-</span>
                                            )}
                                        </td>
                                        <td
                                            className={`${styles.textCell} ${journal?.content ? styles.clickableCell : ''}`}
                                            onClick={() => journal?.content && setSelectedEntry({ title: 'Journal Entry', content: journal.content, date: fullDate })}
                                        >
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

            {
                selectedEntry && typeof document !== 'undefined' && createPortal(
                    <div className={styles.modalOverlay} onClick={() => setSelectedEntry(null)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <div>
                                    <h3 className={styles.modalTitle}>{selectedEntry.title}</h3>
                                    <span className={styles.modalDate}>{selectedEntry.date}</span>
                                </div>
                                <button className={styles.closeButton} onClick={() => setSelectedEntry(null)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                {selectedEntry.content}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div>
    );
}
