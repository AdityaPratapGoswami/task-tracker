import mongoose, { Schema, Document, model } from 'mongoose';

export interface IJournal extends Document {
    userId: string;
    date: string;
    content: string;
}

const JournalSchema = new Schema<IJournal>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        date: { type: String, required: true, index: true },
        content: { type: String, default: '' },
    },
    { timestamps: true }
);

// Prevent re-compilation of model
if (mongoose.models.Journal && !mongoose.models.Journal.schema.paths.userId) {
    delete mongoose.models.Journal;
}
const Journal = mongoose.models.Journal || model<IJournal>('Journal', JournalSchema);

export default Journal;
