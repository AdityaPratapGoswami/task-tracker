'use client';

import dynamic from 'next/dynamic';
import useIsDesktop from '@/lib/useIsDesktop';
import AnalyticsBoard from './AnalyticsBoard';
import AppLoader from '../AppLoader';
import { MetricTask } from '@/lib/metrics';

// AnalyticsDashboard pulls in recharts. The desktop board draws its chart with
// plain CSS, so gating the legacy screen behind a dynamic import keeps recharts
// out of the desktop bundle completely.
const AnalyticsDashboard = dynamic(() => import('../AnalyticsDashboard'), {
    ssr: false,
    loading: () => <AppLoader />,
});

interface Props {
    initialDate: string;
    initialTasks?: MetricTask[];
}

export default function AnalyticsScreen({ initialDate, initialTasks }: Props) {
    const isDesktop = useIsDesktop();

    if (isDesktop === null) return <AppLoader />;

    return isDesktop
        ? <AnalyticsBoard initialDate={initialDate} initialTasks={initialTasks} />
        : <AnalyticsDashboard />;
}
