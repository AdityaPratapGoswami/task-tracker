import { startOfWeek, addDays, subDays } from 'date-fns';
import AnalyticsBoard from '@/components/modernist/AnalyticsBoard';
import { getSessionUserId, loadTasksInRange } from '@/lib/serverData';
import { dayKey } from '@/lib/metrics';

export default async function AnalyticsPage() {
    const userId = await getSessionUserId();
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Covers the shown week plus the previous one, which is what the board
    // needs for its "vs. last week" figure.
    const initialTasks = userId
        ? await loadTasksInRange(
            userId,
            dayKey(subDays(weekStart, 7)),
            dayKey(addDays(weekStart, 6))
        )
        : undefined;

    return <AnalyticsBoard initialDate={dayKey(now)} initialTasks={initialTasks} />;
}
