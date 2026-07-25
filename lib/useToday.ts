'use client';

import { useSyncExternalStore } from 'react';
import { dayKey } from '@/lib/metrics';

// The clock never pushes updates, so there is nothing to subscribe to. A
// mounted board that stays open past midnight keeps its current date, which is
// what you want — the view shouldn't shift under you mid-session.
function subscribe() {
    return () => { };
}

function getSnapshot() {
    return dayKey(new Date());
}

/**
 * The viewer's calendar day, as YYYY-MM-DD.
 *
 * Server renders run in UTC, so for anyone east of it the server's "today" is
 * yesterday for part of every day. Passing the server's value as the hydration
 * snapshot keeps the first client render identical to the server HTML, then
 * the real local date takes over — without a setState-in-effect round trip.
 */
export default function useToday(serverToday: string): string {
    return useSyncExternalStore(subscribe, getSnapshot, () => serverToday);
}
