import { format } from 'date-fns';

/**
 * Shared task analytics.
 *
 * Every screen in the redesign reads the same numbers (week grid, day board,
 * analytics, profile), so the rules for "is this task active today" and "how
 * many points did it earn" live here once instead of being re-derived in each
 * component.
 */

export interface MetricTask {
    _id: string;
    title: string;
    category: string;
    type: 'regular' | 'spontaneous';
    isCompleted: boolean;
    completedDates?: string[];
    date: string;
    endDate?: string;
    points?: 1 | 2 | 3;
    isImportant?: boolean;
    isUrgent?: boolean;
}

export const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');

export const pointsOf = (t: MetricTask) => t.points || 1;

/** A regular task counts on a day once it has started and before it ends. */
export function isActiveOn(task: MetricTask, date: string): boolean {
    if (task.type === 'spontaneous') return task.date === date;
    if (task.date > date) return false;
    if (task.endDate && task.endDate < date) return false;
    return true;
}

export function isDoneOn(task: MetricTask, date: string): boolean {
    if (task.type === 'spontaneous') return task.date === date && task.isCompleted;
    return task.completedDates?.includes(date) ?? false;
}

export interface DayTotal {
    date: string;
    total: number;
    completed: number;
    pct: number;
    isFuture: boolean;
}

export function dayTotals(tasks: MetricTask[], days: Date[], today: string): DayTotal[] {
    return days.map((day) => {
        const date = dayKey(day);
        let total = 0;
        let completed = 0;

        for (const task of tasks) {
            if (!isActiveOn(task, date)) continue;
            const pts = pointsOf(task);
            total += pts;
            if (isDoneOn(task, date)) completed += pts;
        }

        return {
            date,
            total,
            completed,
            pct: total > 0 ? Math.round((completed / total) * 100) : 0,
            isFuture: date > today,
        };
    });
}

export interface WeekSummaryStats {
    earned: number;
    possible: number;
    pct: number;
    bestDay: string | null;
    streak: number;
}

/**
 * Points possible only counts elapsed days — crediting a user 0/65 on Monday
 * morning would make every week look like a failure until Sunday.
 */
export function weekSummary(totals: DayTotal[], days: Date[]): WeekSummaryStats {
    const elapsed = totals.filter((t) => !t.isFuture);
    const earned = elapsed.reduce((a, t) => a + t.completed, 0);
    const possible = elapsed.reduce((a, t) => a + t.total, 0);

    let bestDay: string | null = null;
    let bestPct = -1;
    elapsed.forEach((t, i) => {
        if (t.total > 0 && t.pct > bestPct) {
            bestPct = t.pct;
            bestDay = format(days[i], 'EEE');
        }
    });

    return {
        earned,
        possible,
        pct: possible > 0 ? Math.round((earned / possible) * 100) : 0,
        bestDay,
        streak: 0,
    };
}

/**
 * Consecutive days, counting back from today, on which at least one point was
 * earned. Today not being started yet doesn't break a run, so we begin the
 * walk at yesterday when today is still empty.
 */
export function currentStreak(tasks: MetricTask[], today: Date): number {
    const cursor = new Date(today);
    const earnedOn = (d: Date) => {
        const date = dayKey(d);
        return tasks.some((t) => isActiveOn(t, date) && isDoneOn(t, date));
    };

    if (!earnedOn(cursor)) cursor.setDate(cursor.getDate() - 1);

    let streak = 0;
    // A year is a generous ceiling and stops a data bug from looping forever.
    for (let i = 0; i < 366; i++) {
        if (!earnedOn(cursor)) break;
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

export interface TaskPerformance {
    id: string;
    title: string;
    completed: number;
    possible: number;
    pct: number;
}

export function taskPerformance(
    tasks: MetricTask[],
    days: Date[],
    today: string
): TaskPerformance[] {
    const rows = tasks.map((task) => {
        let possible = 0;
        let completed = 0;

        for (const day of days) {
            const date = dayKey(day);
            if (date > today) continue;
            if (!isActiveOn(task, date)) continue;
            possible++;
            if (isDoneOn(task, date)) completed++;
        }

        return {
            id: task._id,
            title: task.title,
            completed,
            possible,
            pct: possible > 0 ? Math.round((completed / possible) * 100) : 0,
        };
    });

    return rows.filter((r) => r.possible > 0).sort((a, b) => b.pct - a.pct);
}

export interface Pillar {
    name: string;
    tasks: MetricTask[];
}

/** Groups tasks by category, preserving first-seen order. */
export function groupByCategory(tasks: MetricTask[]): Pillar[] {
    const order: string[] = [];
    const map = new Map<string, MetricTask[]>();

    for (const task of tasks) {
        const key = task.category || 'Uncategorised';
        if (!map.has(key)) {
            map.set(key, []);
            order.push(key);
        }
        map.get(key)!.push(task);
    }

    return order.map((name) => ({ name, tasks: map.get(name)! }));
}

export interface Quadrant {
    key: string;
    label: string;
    completed: number;
    total: number;
    pct: number;
    count: number;
}

const QUADRANTS: { key: string; label: string; important: boolean; urgent: boolean }[] = [
    { key: 'important_urgent', label: 'Important & urgent', important: true, urgent: true },
    { key: 'important_not_urgent', label: 'Important & not urgent', important: true, urgent: false },
    { key: 'not_important_urgent', label: 'Not important & urgent', important: false, urgent: true },
    { key: 'not_important_not_urgent', label: 'Not important & not urgent', important: false, urgent: false },
];

/**
 * Eisenhower buckets measured in points. A recurring task contributes one
 * instance per elapsed day it was active, so a daily habit outweighs a
 * one-off — which is what makes the percentages comparable.
 */
export function eisenhower(tasks: MetricTask[], days: Date[], today: string): Quadrant[] {
    return QUADRANTS.map((q) => {
        let completed = 0;
        let total = 0;
        let count = 0;

        for (const task of tasks) {
            if ((task.isImportant || false) !== q.important) continue;
            if ((task.isUrgent || false) !== q.urgent) continue;

            for (const day of days) {
                const date = dayKey(day);
                if (date > today) continue;
                if (!isActiveOn(task, date)) continue;
                const pts = pointsOf(task);
                total += pts;
                count++;
                if (isDoneOn(task, date)) completed += pts;
            }
        }

        return {
            key: q.key,
            label: q.label,
            completed,
            total,
            pct: total > 0 ? Math.round((completed / total) * 100) : 0,
            count,
        };
    });
}

export function matchesQuadrant(task: MetricTask, key: string | null): boolean {
    if (!key) return true;
    const q = QUADRANTS.find((x) => x.key === key);
    if (!q) return true;
    return (task.isImportant || false) === q.important && (task.isUrgent || false) === q.urgent;
}
