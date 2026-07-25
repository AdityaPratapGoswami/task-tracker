'use client';

import dynamic from 'next/dynamic';
import useIsDesktop from '@/lib/useIsDesktop';
import WeekBoard from './WeekBoard';
import AppLoader from '../AppLoader';
import { MetricTask } from '@/lib/metrics';
import { ITask } from '@/models/Task';
import { IGratitude } from '@/models/Gratitude';
import { IJournal } from '@/models/Journal';

const WeekView = dynamic(() => import('../WeekView'), {
    ssr: false,
    loading: () => <AppLoader />,
});

interface Props {
    /** Task instances already expanded per day — what the legacy view expects. */
    initialTasks: ITask[];
    /** Untouched task documents — what the matrix computes from. */
    initialRawTasks: MetricTask[];
    initialGratitudes: IGratitude[];
    initialJournals: IJournal[];
}

export default function WeekScreen({
    initialTasks,
    initialRawTasks,
    initialGratitudes,
    initialJournals,
}: Props) {
    const isDesktop = useIsDesktop();

    if (isDesktop === null) return <AppLoader />;

    return isDesktop ? (
        <WeekBoard initialTasks={initialRawTasks} />
    ) : (
        <WeekView
            initialTasks={initialTasks}
            initialGratitudes={initialGratitudes}
            initialJournals={initialJournals}
        />
    );
}
