import mongoose, { Schema, Document, model, ObjectId } from 'mongoose';

export interface IGratitude extends Document {
    userId: ObjectId | string;
    date: string;
    content: string;
}

const GratitudeSchema = new Schema<IGratitude>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        date: { type: String, required: true, index: true },
        content: { type: String, default: '' },
    },
    { timestamps: true }
);

// Compound index for optimization
GratitudeSchema.index({ userId: 1, date: 1 });

// Prevent re-compilation of model
if (mongoose.models.Gratitude && !mongoose.models.Gratitude.schema.paths.userId) {
    delete mongoose.models.Gratitude;
}
const Gratitude = mongoose.models.Gratitude || model<IGratitude>('Gratitude', GratitudeSchema);

export default Gratitude;
