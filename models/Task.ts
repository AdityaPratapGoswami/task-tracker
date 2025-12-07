import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITaskBase {
    title: string;
    category: string;
    type: 'regular' | 'spontaneous'; // New field
    isCompleted: boolean; // For spontaneous tasks (and legacy)
    completedDates: string[]; // For regular tasks: list of YYYY-MM-DD
    date: string; // YYYY-MM-DD (Creation date for Regular, Due date for Spontaneous)
}

export interface ITask extends ITaskBase {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITaskDocument extends ITaskBase, Document {
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        category: { type: String, required: true },
        type: { type: String, enum: ['regular', 'spontaneous'], default: 'spontaneous' },
        isCompleted: { type: Boolean, default: false },
        completedDates: { type: [String], default: [] },
        date: { type: String, required: true, index: true },
    },
    {
        timestamps: true,
    }
);

// Prevent recompilation of model in development
const Task: Model<ITaskDocument> = mongoose.models.Task || mongoose.model<ITaskDocument>('Task', TaskSchema);

export default Task;
