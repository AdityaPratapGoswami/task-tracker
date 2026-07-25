import DayScreen from '@/components/modernist/DayScreen';
import { getSessionUserId, loadDay } from '@/lib/serverData';
import { dayKey } from '@/lib/metrics';

export default async function DayPage() {
    // Loading here rather than in the client means the data arrives with the
    // navigation payload instead of after three more round trips.
    const userId = await getSessionUserId();
    const date = dayKey(new Date());
    const initialData = userId ? await loadDay(userId, date) : undefined;

    return <DayScreen initialDate={date} initialData={initialData} />;
}
