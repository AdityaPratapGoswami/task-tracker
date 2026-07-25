'use client';

import dynamic from 'next/dynamic';
import useIsDesktop from '@/lib/useIsDesktop';
import DayBoard from '@/components/modernist/DayBoard';
import AppLoader from '@/components/AppLoader';

// The legacy mobile screen is only ever needed below 1024px, so it stays out
// of the desktop bundle entirely.
const DayScreenMobile = dynamic(() => import('@/components/legacy/DayScreenMobile'), {
    ssr: false,
    loading: () => <AppLoader />,
});

export default function DayPage() {
    const isDesktop = useIsDesktop();

    if (isDesktop === null) return <AppLoader />;
    return isDesktop ? <DayBoard /> : <DayScreenMobile />;
}
