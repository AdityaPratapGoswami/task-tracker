import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory {
    _id: string;
    userId: string;
    name: string;
    color?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICategoryDocument extends Document {
    userId: string;
    name: string;
    color?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true },
        color: { type: String },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure unique category names per user
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

// Prevent recompilation of model in development
const Category: Model<ICategoryDocument> = mongoose.models.Category || mongoose.model<ICategoryDocument>('Category', CategorySchema);

export default Category;
