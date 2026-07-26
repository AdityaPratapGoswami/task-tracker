import DayBoard from '@/components/modernist/DayBoard';
import { getSessionUserId, loadDay } from '@/lib/serverData';
import { dayKey } from '@/lib/metrics';

export default async function DayPage() {
    // Loading here rather than in the client means the data arrives with the
    // navigation payload instead of after more round trips.
    const userId = await getSessionUserId();
    const date = dayKey(new Date());
    const initialData = userId ? await loadDay(userId, date) : undefined;

    return <DayBoard initialDate={date} initialData={initialData} />;
}
