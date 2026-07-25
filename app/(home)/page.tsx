import { startOfWeek, addDays, subDays } from 'date-fns';
import WeekScreen from '@/components/modernist/WeekScreen';
import { getSessionUserId, loadTasksInRange, loadEntriesInRange } from '@/lib/serverData';
import { MetricTask, dayKey, isActiveOn, isDoneOn, WEEK_HISTORY_DAYS } from '@/lib/metrics';

/**
 * The legacy mobile week view expects one task object per day, with `date` and
 * `isCompleted` already resolved for that day. The desktop matrix derives that
 * itself, so it takes the documents untouched.
 */
function expandPerDay(tasks: MetricTask[], weekDays: Date[]): MetricTask[] {
    const expanded: MetricTask[] = [];

    for (const day of weekDays) {
        const date = dayKey(day);
        for (const task of tasks) {
            if (!isActiveOn(task, date)) continue;
            expanded.push({ ...task, date, isCompleted: isDoneOn(task, date) });
        }
    }

    return expanded;
}

export default async function Home() {
    const userId = await getSessionUserId();
    const now = new Date();
    const today = dayKey(now);

    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const weekStartKey = dayKey(weekDays[0]);
    const weekEndKey = dayKey(weekDays[6]);

    if (!userId) {
        return (
            <main>
                <WeekScreen initialDate={today} />
            </main>
        );
    }

    const [rawTasks, entries] = await Promise.all([
        loadTasksInRange(userId, dayKey(subDays(weekStart, WEEK_HISTORY_DAYS)), weekEndKey),
        loadEntriesInRange(userId, weekStartKey, weekEndKey),
    ]);

    return (
        <main>
            <WeekScreen
                initialDate={today}
                initialRawTasks={rawTasks}
                initialTasks={expandPerDay(rawTasks, weekDays)}
                initialGratitudes={entries.gratitudes}
                initialJournals={entries.journals}
            />
        </main>
    );
}
