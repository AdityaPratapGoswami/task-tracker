import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task, { ITaskDocument } from '@/models/Task';
import { format, subDays } from 'date-fns';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PATCH(
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
        const body = await request.json();
        await connectToDatabase();

        // Ensure user owns the task
        const task = await Task.findOne({ _id: id, userId: payload.userId });
        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        let updateData = body;

        // If toggling a regular task for a specific date
        if (body.toggleDate) {
            if (task.type === 'regular') {
                const date = body.toggleDate;
                const isCompleted = body.isCompleted;

                if (isCompleted) {
                    updateData = { $addToSet: { completedDates: date } };
                } else {
                    updateData = { $pull: { completedDates: date } };
                }
            }
        }

        const updatedTask = await Task.findOneAndUpdate(
            { _id: id, userId: payload.userId },
            updateData,
            { new: true }
        );

        return NextResponse.json(updatedTask);
    } catch (error) {
        console.error('Error in PATCH /api/tasks/[id]:', error);
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

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
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        await connectToDatabase();

        const task: ITaskDocument | null = await Task.findOne({ _id: id, userId: payload.userId });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // If it's a regular task and we have a context date, we "archive" it by setting an endDate
        if (task.type === 'regular' && dateParam) {
            // Set endDate to yesterday relative to the deletion date
            // This means it will stop appearing from 'dateParam' onwards
            const endDate = format(subDays(new Date(dateParam), 1), 'yyyy-MM-dd');

            const updatedTask = await Task.findOneAndUpdate(
                { _id: id, userId: payload.userId },
                { endDate },
                { new: true }
            );

            return NextResponse.json({ message: 'Task archived', task: updatedTask });
        }

        // For spontaneous tasks or if no date provided, hard delete
        await Task.findOneAndDelete({ _id: id, userId: payload.userId });

        return NextResponse.json({ message: 'Task deleted' });
    } catch (error) {
        console.error('Error in DELETE /api/tasks/[id]:', error);
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}
