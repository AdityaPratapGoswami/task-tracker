import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import Gratitude from '@/models/Gratitude';
import Journal from '@/models/Journal';
import Category from '@/models/Category';
import Profile from '@/models/Profile';
import OKR from '@/models/OKR';
import { MetricTask, dayKey } from '@/lib/metrics';
import { IOKR } from '@/types/okr';

/**
 * Server-side data loading for the screens.
 *
 * Fetching on the server means the data arrives with the navigation payload
 * instead of after three more client round trips, which is what made tab
 * switches feel slow in production. Each loader shares one database
 * connection and runs its queries concurrently.
 */

export async function getSessionUserId(): Promise<string | null> {
    const store = await cookies();
    const token = store.get('token')?.value;
    if (!token) return null;
    return verifyToken(token)?.userId ?? null;
}

/**
 * Mongo documents carry ObjectIds and Dates, neither of which can cross the
 * server/client boundary. Round-tripping through JSON flattens both (ObjectId
 * and Date each define toJSON) without hand-writing a mapper per model.
 */
function plain<T>(value: unknown): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Rolls incomplete spontaneous tasks forward onto today, tagging them overdue.
 *
 * There's no cron in this app (Vercel serverless has no persistent background
 * process), so this runs lazily at the top of every loader that could surface
 * today's tasks — whichever screen you open first on a new day is what
 * performs the roll. It's a single indexed updateMany, a no-op once nothing
 * matches, so calling it from multiple loaders costs nothing extra beyond the
 * first call per day.
 *
 * Rolling repeats every time this runs while a task stays incomplete, so a
 * task ignored for three days still ends up on today, not stuck on day one.
 */
async function rolloverOverdueSpontaneousTasks(userId: string, today: string): Promise<void> {
    await Task.updateMany(
        { userId, type: 'spontaneous', isCompleted: false, date: { $lt: today } },
        { $set: { date: today, isOverdue: true } }
    );
}

/** Matches the query /api/tasks uses, so both paths return the same set. */
function taskRangeQuery(userId: string, startDate: string, endDate: string) {
    return {
        userId,
        $or: [
            {
                type: 'regular',
                date: { $lte: endDate },
                $or: [{ endDate: { $exists: false } }, { endDate: { $gte: startDate } }],
            },
            { type: 'spontaneous', date: { $gte: startDate, $lte: endDate } },
        ],
    };
}

export async function loadTasksInRange(
    userId: string,
    startDate: string,
    endDate: string
): Promise<MetricTask[]> {
    await connectToDatabase();
    await rolloverOverdueSpontaneousTasks(userId, dayKey(new Date()));
    const tasks = await Task.find(taskRangeQuery(userId, startDate, endDate))
        .sort({ createdAt: 1 })
        .lean();
    return plain<MetricTask[]>(tasks);
}

export interface DatedEntry {
    _id: string;
    date: string;
    content: string;
}

/** Gratitude and journal entries across a range — used by the week view. */
export async function loadEntriesInRange(
    userId: string,
    startDate: string,
    endDate: string
): Promise<{ gratitudes: DatedEntry[]; journals: DatedEntry[] }> {
    await connectToDatabase();
    const range = { userId, date: { $gte: startDate, $lte: endDate } };

    const [gratitudes, journals] = await Promise.all([
        Gratitude.find(range).lean(),
        Journal.find(range).lean(),
    ]);

    return {
        gratitudes: plain<DatedEntry[]>(gratitudes),
        journals: plain<DatedEntry[]>(journals),
    };
}

export interface DayData {
    tasks: MetricTask[];
    gratitude: string;
    journal: string;
}

export async function loadDay(userId: string, date: string): Promise<DayData> {
    await connectToDatabase();
    // Rolled relative to the real today, not `date` — viewing a past day
    // shouldn't roll anything, and viewing today should always catch up.
    await rolloverOverdueSpontaneousTasks(userId, dayKey(new Date()));

    const [tasks, gratitude, journal] = await Promise.all([
        Task.find({
            userId,
            $or: [
                {
                    type: 'regular',
                    date: { $lte: date },
                    $or: [{ endDate: { $exists: false } }, { endDate: { $gte: date } }],
                },
                { type: 'spontaneous', date },
            ],
        }).sort({ createdAt: 1 }).lean(),
        Gratitude.findOne({ userId, date }).lean(),
        Journal.findOne({ userId, date }).lean(),
    ]);

    return {
        tasks: plain<MetricTask[]>(tasks),
        gratitude: gratitude?.content ?? '',
        journal: journal?.content ?? '',
    };
}

export interface ProfileData {
    name: string;
    okrs: IOKR[];
    tasks: MetricTask[];
    categories: { _id: string; name: string }[];
}

export async function loadProfile(userId: string, today: string): Promise<ProfileData> {
    await connectToDatabase();
    await rolloverOverdueSpontaneousTasks(userId, today);

    const [profile, okrs, tasks, categories] = await Promise.all([
        Profile.findOne({ userId }).lean(),
        OKR.find({ userId }).sort({ createdAt: -1 }).lean(),
        Task.find({
            userId,
            $or: [
                {
                    type: 'regular',
                    date: { $lte: today },
                    $or: [{ endDate: { $exists: false } }, { endDate: { $gte: today } }],
                },
                { type: 'spontaneous', date: today },
            ],
        }).sort({ createdAt: 1 }).lean(),
        Category.find({ userId }).sort({ name: 1 }).lean(),
    ]);

    return {
        name: profile?.name ?? '',
        okrs: plain<IOKR[]>(okrs),
        tasks: plain<MetricTask[]>(tasks),
        categories: plain<{ _id: string; name: string }[]>(categories),
    };
}
