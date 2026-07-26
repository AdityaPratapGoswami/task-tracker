import ProfileBoard from '@/components/modernist/ProfileBoard';
import { getSessionUserId, loadProfile } from '@/lib/serverData';
import { dayKey } from '@/lib/metrics';

export default async function ProfilePage() {
    const userId = await getSessionUserId();
    const initialData = userId ? await loadProfile(userId, dayKey(new Date())) : undefined;

    return <ProfileBoard initialData={initialData} />;
}
