import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Journal from '@/models/Journal';
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
        const date = searchParams.get('date');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        await connectToDatabase();

        if (date) {
            const journal = await Journal.findOne({ date, userId: payload.userId });
            return NextResponse.json(journal || { date, content: '' });
        } else if (startDate && endDate) {
            const journals = await Journal.find({
                userId: payload.userId,
                date: { $gte: startDate, $lte: endDate }
            });
            return NextResponse.json(journals);
        } else {
            return NextResponse.json({ error: 'Date or Date Range required' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch journal' }, { status: 500 });
    }
}

export async function POST(request: Request) {
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

        const body = await request.json();
        const { date, content } = body;

        // Ensure userId is treated as ObjectId
        const { Types } = await import('mongoose');
        const requestUserId = new Types.ObjectId(payload.userId as string);

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        await connectToDatabase();

        // Upsert journal for the date
        const journal = await Journal.findOneAndUpdate(
            { date, userId: requestUserId },
            { content, userId: requestUserId },
            { new: true, upsert: true }
        );

        return NextResponse.json(journal);
    } catch (error: any) {
        console.error('Actual error:', error);
        return NextResponse.json({ error: `Failed to save journal: ${error.message}` }, { status: 500 });
    }
}
