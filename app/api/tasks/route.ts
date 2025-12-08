import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

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

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        await connectToDatabase();

        const query: any = {
            userId: payload.userId,
            $or: [
                {
                    type: 'regular',
                    date: { $lte: endDate }, // Only show regular tasks created on or before the end of the query range
                    $or: [
                        { endDate: { $exists: false } },
                        { endDate: { $gte: startDate } }
                    ]
                },
                {
                    type: 'spontaneous',
                    date: { $gte: startDate, $lte: endDate }
                }
            ]
        };

        if (startDate && endDate) {
            // Logic handled in $or above
        } else if (startDate) {
            query.$or[1].date = startDate;
        }

        const tasks = await Task.find(query).sort({ createdAt: 1 });
        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Error in GET /api/tasks:', error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        console.log('Task Schema Paths:', Object.keys(Task.schema.paths));

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        await connectToDatabase();

        const task = await Task.create({ ...body, userId: payload.userId });
        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/tasks:', error);
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}
