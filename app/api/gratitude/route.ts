import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Gratitude from '@/models/Gratitude';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        await connectToDatabase();

        if (date) {
            const gratitude = await Gratitude.findOne({ date });
            return NextResponse.json(gratitude || { date, content: '' });
        } else if (startDate && endDate) {
            const gratitudes = await Gratitude.find({
                date: { $gte: startDate, $lte: endDate }
            });
            return NextResponse.json(gratitudes);
        } else {
            return NextResponse.json({ error: 'Date or Date Range required' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch gratitude' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date, content } = body;

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        await connectToDatabase();

        // Upsert gratitude for the date
        const gratitude = await Gratitude.findOneAndUpdate(
            { date },
            { content },
            { new: true, upsert: true }
        );

        return NextResponse.json(gratitude);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save gratitude' }, { status: 500 });
    }
}
