import { startOfWeek, addDays, subDays } from 'date-fns';
import WeekBoard from '@/components/modernist/WeekBoard';
import { getSessionUserId, loadTasksInRange } from '@/lib/serverData';
import { dayKey, WEEK_HISTORY_DAYS } from '@/lib/metrics';

export default async function Home() {
    const userId = await getSessionUserId();
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // The grid shows seven days but the streak counts back further, so the
    // window must match what WeekBoard requests on the client — otherwise its
    // cache misses on first paint.
    const initialTasks = userId
        ? await loadTasksInRange(
            userId,
            dayKey(subDays(weekStart, WEEK_HISTORY_DAYS)),
            dayKey(addDays(weekStart, 6))
        )
        : undefined;

    return <WeekBoard initialDate={dayKey(now)} initialTasks={initialTasks} />;
}
