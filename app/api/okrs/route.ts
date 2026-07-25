import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import OKR from '@/models/OKR';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
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

        const okrs = await OKR.find({ userId: payload.userId }).sort({ createdAt: -1 });
        return NextResponse.json(okrs);
    } catch (error) {
        console.error('Error in GET /api/okrs:', error);
        return NextResponse.json({ error: 'Failed to fetch OKRs' }, { status: 500 });
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
        await connectToDatabase();

        const okr = await OKR.create({ ...body, userId: payload.userId });
        return NextResponse.json(okr, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/okrs:', error);
        return NextResponse.json({ error: 'Failed to create OKR' }, { status: 500 });
    }
}
