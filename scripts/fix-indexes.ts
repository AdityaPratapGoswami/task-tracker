
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// We need to define the schema locally to ensure we interact with the right collection
const CategorySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true },
        color: { type: String },
    },
    {
        timestamps: true,
    }
);

// Prevent recompilation of model
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

async function fixIndexes() {
    try {
        await mongoose.connect(MONGODB_URI!);
        console.log('Connected to DB');

        console.log('Dropping indexes for Category collection...');
        await Category.collection.dropIndexes();
        console.log('Indexes dropped successfully');

    } catch (error) {
        console.error('Error dropping indexes:', error);
    } finally {
        process.exit();
    }
}

fixIndexes();
