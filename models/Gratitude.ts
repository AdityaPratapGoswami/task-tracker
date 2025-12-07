import mongoose, { Schema, Document, model } from 'mongoose';

export interface IGratitude extends Document {
    date: string;
    content: string;
}

const GratitudeSchema = new Schema<IGratitude>(
    {
        date: { type: String, required: true, index: true },
        content: { type: String, default: '' },
    },
    { timestamps: true }
);

// Prevent re-compilation of model
const Gratitude = mongoose.models.Gratitude || model<IGratitude>('Gratitude', GratitudeSchema);

export default Gratitude;
