import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Profile from '@/models/Profile';

export async function GET() {
    try {
        await connectToDatabase();
        // Since it's a single-user app, find the first profile or return empty
        const profile = await Profile.findOne({});
        return NextResponse.json(profile || { name: '' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        await connectToDatabase();

        // Update existing or create new. upsert: true ensures single document.
        const profile = await Profile.findOneAndUpdate(
            {},
            { name: body.name },
            { new: true, upsert: true }
        );

        return NextResponse.json(profile);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
