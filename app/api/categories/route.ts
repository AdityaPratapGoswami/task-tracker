import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';

export async function GET() {
    try {
        console.log('Connecting to DB for categories...');
        await connectToDatabase();
        console.log('Connected. Fetching categories...');
        const categories = await Category.find({}).sort({ name: 1 });
        console.log('Fetched categories:', categories);
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error in GET /api/categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        await connectToDatabase();

        // Check if category already exists
        const existing = await Category.findOne({ name: { $regex: new RegExp(`^${body.name}$`, 'i') } });
        if (existing) {
            return NextResponse.json(existing, { status: 200 });
        }

        const category = await Category.create(body);
        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
