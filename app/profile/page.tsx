import ProfileScreen from '@/components/modernist/ProfileScreen';
import { getSessionUserId, loadProfile } from '@/lib/serverData';
import { dayKey } from '@/lib/metrics';

export default async function ProfilePage() {
    const userId = await getSessionUserId();
    const initialData = userId ? await loadProfile(userId, dayKey(new Date())) : undefined;

    return <ProfileScreen initialData={initialData} />;
}
