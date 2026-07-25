'use client';

import dynamic from 'next/dynamic';
import useIsDesktop from '@/lib/useIsDesktop';
import WeekBoard from './WeekBoard';
import AppLoader from '../AppLoader';
import { MetricTask } from '@/lib/metrics';
import type { DatedEntry } from '@/lib/serverData';
import type { ITask } from '@/models/Task';
import type { IGratitude } from '@/models/Gratitude';
import type { IJournal } from '@/models/Journal';

const WeekView = dynamic(() => import('../WeekView'), {
    ssr: false,
    loading: () => <AppLoader />,
});

interface Props {
    initialDate: string;
    /** Task instances already expanded per day — what the legacy view expects. */
    initialTasks?: MetricTask[];
    /** Untouched task documents — what the matrix computes from. */
    initialRawTasks?: MetricTask[];
    initialGratitudes?: DatedEntry[];
    initialJournals?: DatedEntry[];
}

export default function WeekScreen({
    initialDate,
    initialTasks = [],
    initialRawTasks,
    initialGratitudes = [],
    initialJournals = [],
}: Props) {
    const isDesktop = useIsDesktop();

    if (isDesktop === null) return <AppLoader />;

    return isDesktop ? (
        <WeekBoard initialDate={initialDate} initialTasks={initialRawTasks} />
    ) : (
        /* The legacy view types these as Mongoose documents, but what actually
           crosses the boundary is serialised plain data — structurally fine for
           the fields it reads, so the casts narrow to its declared props. */
        <WeekView
            initialTasks={initialTasks as unknown as ITask[]}
            initialGratitudes={initialGratitudes as unknown as IGratitude[]}
            initialJournals={initialJournals as unknown as IJournal[]}
        />
    );
}
