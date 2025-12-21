import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITaskBase {
    userId: string; // Reference to User
    title: string;
    category: string;
    type: 'regular' | 'spontaneous'; // New field
    isCompleted: boolean; // For spontaneous tasks (and legacy)
    completedDates: string[]; // For regular tasks: list of YYYY-MM-DD
    date: string; // YYYY-MM-DD (Creation date for Regular, Due date for Spontaneous)
    endDate?: string; // YYYY-MM-DD (End date for Regular tasks, inclusive)
    points: 1 | 2 | 3; // Points for the task
    isImportant: boolean; // Eisenhower Matrix
    isUrgent: boolean; // Eisenhower Matrix
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
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        title: { type: String, required: true },
        category: { type: String, required: true },
        type: { type: String, enum: ['regular', 'spontaneous'], default: 'spontaneous', index: true },
        isCompleted: { type: Boolean, default: false },
        completedDates: { type: [String], default: [] },
        date: { type: String, required: true, index: true },
        endDate: { type: String },
        points: { type: Number, enum: [1, 2, 3], default: 1 },
        isImportant: { type: Boolean, default: false },
        isUrgent: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for optimization
TaskSchema.index({ userId: 1, type: 1, date: 1 });
TaskSchema.index({ userId: 1, type: 1, endDate: 1 });

// Prevent recompilation of model in development
// Fix for stale model in dev mode: check if schema has userId
if (mongoose.models.Task && (!mongoose.models.Task.schema.paths.userId || !mongoose.models.Task.schema.paths.points || !mongoose.models.Task.schema.paths.isImportant)) {
    console.log('Detected stale Task model (missing fields). Deleting from cache.');
    delete mongoose.models.Task;
}

const Task: Model<ITaskDocument> = mongoose.models.Task || mongoose.model<ITaskDocument>('Task', TaskSchema);

export default Task;
