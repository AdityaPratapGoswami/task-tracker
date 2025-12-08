import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';

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

        await connectToDatabase();

        const stats = await Task.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(payload.userId)
                }
            },
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
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
