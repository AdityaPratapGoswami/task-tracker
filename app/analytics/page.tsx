'use client';

import dynamic from 'next/dynamic';
import useIsDesktop from '@/lib/useIsDesktop';
import AnalyticsBoard from '@/components/modernist/AnalyticsBoard';
import SkeletonCard from '@/components/SkeletonCard';

// AnalyticsDashboard pulls in recharts. The desktop board draws its chart with
// plain CSS, so gating the legacy screen behind a dynamic import keeps recharts
// out of the desktop bundle completely.
const AnalyticsDashboard = dynamic(() => import('@/components/AnalyticsDashboard'), {
    ssr: false,
    loading: () => <SkeletonCard />,
});

export default function AnalyticsPage() {
    const isDesktop = useIsDesktop();

    if (isDesktop === null) return <SkeletonCard />;
    return isDesktop ? <AnalyticsBoard /> : <AnalyticsDashboard />;
}
