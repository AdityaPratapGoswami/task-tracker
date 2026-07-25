import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { loadDay } from '@/lib/serverData';

/**
 * Everything the day board needs, in one request.
 *
 * The board previously called /api/tasks, /api/gratitude and /api/journal
 * separately. In production that's three serverless invocations, each paying
 * its own cold start and MongoDB handshake before doing a single small query.
 * The actual query logic lives in lib/serverData.ts's loadDay, shared with the
 * server-rendered /day page so the two never drift apart.
 */
export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const date = new URL(request.url).searchParams.get('date');
        if (!date) {
            return NextResponse.json({ error: 'date is required' }, { status: 400 });
        }

        return NextResponse.json(await loadDay(payload.userId, date));
    } catch (error) {
        console.error('Error in GET /api/day:', error);
        return NextResponse.json({ error: 'Failed to fetch day' }, { status: 500 });
    }
}
