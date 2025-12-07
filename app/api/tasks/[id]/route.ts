import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        await connectToDatabase();

        let updateData = body;

        // If toggling a regular task for a specific date
        if (body.toggleDate) {
            const task = await Task.findById(id);
            if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

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

        const updatedTask = await Task.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json(updatedTask);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectToDatabase();

        const task = await Task.findByIdAndDelete(id);

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Task deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}
