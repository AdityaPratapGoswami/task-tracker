'use client';

import dynamic from 'next/dynamic';
import useIsDesktop from '@/lib/useIsDesktop';
import ProfileBoard from '@/components/modernist/ProfileBoard';
import AppLoader from '@/components/AppLoader';

const ProfileScreenMobile = dynamic(() => import('@/components/legacy/ProfileScreenMobile'), {
    ssr: false,
    loading: () => <AppLoader />,
});

export default function ProfilePage() {
    const isDesktop = useIsDesktop();

    if (isDesktop === null) return <AppLoader />;
    return isDesktop ? <ProfileBoard /> : <ProfileScreenMobile />;
}
