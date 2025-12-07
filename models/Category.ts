import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory {
    _id: string;
    name: string;
    color?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICategoryDocument extends Document {
    name: string;
    color?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        color: { type: String },
    },
    {
        timestamps: true,
    }
);

// Prevent recompilation of model in development
const Category: Model<ICategoryDocument> = mongoose.models.Category || mongoose.model<ICategoryDocument>('Category', CategorySchema);

export default Category;
