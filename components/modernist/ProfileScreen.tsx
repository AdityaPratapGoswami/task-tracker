'use client';

import dynamic from 'next/dynamic';
import useIsDesktop from '@/lib/useIsDesktop';
import ProfileBoard from './ProfileBoard';
import AppLoader from '../AppLoader';
import type { ProfileData } from '@/lib/serverData';

const ProfileScreenMobile = dynamic(() => import('../legacy/ProfileScreenMobile'), {
    ssr: false,
    loading: () => <AppLoader />,
});

interface Props {
    initialData?: ProfileData;
}

export default function ProfileScreen({ initialData }: Props) {
    const isDesktop = useIsDesktop();

    if (isDesktop === null) return <AppLoader />;

    return isDesktop ? <ProfileBoard initialData={initialData} /> : <ProfileScreenMobile />;
}
