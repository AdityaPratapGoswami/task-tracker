import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';
import Task from '@/models/Task';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { format, subDays } from 'date-fns';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const category = await Category.findOne({ _id: id, userId: payload.userId });
        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Tasks store their category as a plain name, not a reference, so the
        // cascade matches on that name rather than a foreign key.
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

        const archived = await Task.updateMany(
            { userId: payload.userId, category: category.name, type: 'regular' },
            { endDate: yesterday }
        );
        const removed = await Task.deleteMany({
            userId: payload.userId,
            category: category.name,
            type: 'spontaneous',
        });

        await Category.deleteOne({ _id: id, userId: payload.userId });

        return NextResponse.json({
            message: 'Category removed',
            archivedTasks: archived.modifiedCount,
            deletedTasks: removed.deletedCount,
        });
    } catch (error) {
        console.error('Error in DELETE /api/categories/[id]:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}
