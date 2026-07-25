import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { loadTasksInRange } from '@/lib/serverData';

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
        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
        }

        return NextResponse.json(await loadTasksInRange(payload.userId, startDate, endDate));
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
