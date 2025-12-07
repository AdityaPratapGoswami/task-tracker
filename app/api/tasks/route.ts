import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        await connectToDatabase();

        const query: any = {
            $or: [
                {
                    type: 'regular',
                    date: { $lte: endDate } // Only show regular tasks created on or before the end of the query range
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
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('POST /api/tasks body:', body);
        await connectToDatabase();
        console.log('Connected to DB, creating task...');

        const task = await Task.create(body);
        console.log('Task created:', task);
        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/tasks:', error);
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}
