import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import OKR from '@/models/OKR';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

        const { id } = await params;
        const body = await request.json();
        await connectToDatabase();

        const okr = await OKR.findOneAndUpdate(
            { _id: id, userId: payload.userId },
            body,
            { new: true, runValidators: true }
        );

        if (!okr) {
            return NextResponse.json({ message: 'OKR not found' }, { status: 404 });
        }

        return NextResponse.json(okr);
    } catch (error) {
        console.error('Error in PUT /api/okrs/[id]:', error);
        return NextResponse.json({ error: 'Failed to update OKR' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

        const { id } = await params;
        await connectToDatabase();

        const okr = await OKR.findOneAndDelete({ _id: id, userId: payload.userId });

        if (!okr) {
            return NextResponse.json({ message: 'OKR not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'OKR deleted' });
    } catch (error) {
        console.error('Error in DELETE /api/okrs/[id]:', error);
        return NextResponse.json({ error: 'Failed to delete OKR' }, { status: 500 });
    }
}
