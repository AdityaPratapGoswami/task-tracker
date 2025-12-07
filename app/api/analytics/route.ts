import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';

export async function GET(request: Request) {
    try {
        await connectToDatabase();

        const stats = await Task.aggregate([
            {
                $group: {
                    _id: '$date',
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
