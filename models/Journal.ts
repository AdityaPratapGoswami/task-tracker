import mongoose, { Schema, Document, model } from 'mongoose';

export interface IJournal extends Document {
    date: string;
    content: string;
}

const JournalSchema = new Schema<IJournal>(
    {
        date: { type: String, required: true, index: true },
        content: { type: String, default: '' },
    },
    { timestamps: true }
);

// Prevent re-compilation of model
const Journal = mongoose.models.Journal || model<IJournal>('Journal', JournalSchema);

export default Journal;
