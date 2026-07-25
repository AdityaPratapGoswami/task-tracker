'use client';

import dynamic from 'next/dynamic';
import useIsDesktop from '@/lib/useIsDesktop';
import DayBoard from './DayBoard';
import AppLoader from '../AppLoader';
import type { DayData } from '@/lib/serverData';

const DayScreenMobile = dynamic(() => import('../legacy/DayScreenMobile'), {
    ssr: false,
    loading: () => <AppLoader />,
});

interface Props {
    initialDate: string;
    initialData?: DayData;
}

export default function DayScreen({ initialDate, initialData }: Props) {
    const isDesktop = useIsDesktop();

    // Only null while server-rendering and hydrating; a client-side tab switch
    // reads matchMedia synchronously, so this doesn't flash on navigation.
    if (isDesktop === null) return <AppLoader />;

    return isDesktop
        ? <DayBoard initialDate={initialDate} initialData={initialData} />
        : <DayScreenMobile />;
}
