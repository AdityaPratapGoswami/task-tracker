'use client';

import dynamic from 'next/dynamic';
import useIsDesktop from '@/lib/useIsDesktop';
import ProfileBoard from '@/components/modernist/ProfileBoard';
import SkeletonCard from '@/components/SkeletonCard';

const ProfileScreenMobile = dynamic(() => import('@/components/legacy/ProfileScreenMobile'), {
    ssr: false,
    loading: () => <SkeletonCard />,
});

export default function ProfilePage() {
    const isDesktop = useIsDesktop();

    if (isDesktop === null) return <SkeletonCard />;
    return isDesktop ? <ProfileBoard /> : <ProfileScreenMobile />;
}
