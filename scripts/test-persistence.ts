
import mongoose from 'mongoose';
import { Schema, model } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Inline Schemas for testing
const GratitudeSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true },
    date: { type: String, required: true },
    content: { type: String, default: '' },
}, { timestamps: true });

const Gratitude = mongoose.models.Gratitude || model('Gratitude', GratitudeSchema);

const JournalSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true },
    date: { type: String, required: true },
    content: { type: String, default: '' },
}, { timestamps: true });

const Journal = mongoose.models.Journal || model('Journal', JournalSchema);

async function testPersistence() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not defined');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // rigorous test: create a dummy user ID
        const userId = new mongoose.Types.ObjectId();
        const date = '2025-01-01';
        const content = 'Test Content Persistence';

        // 1. Test Gratitude Save
        console.log('Testing Gratitude Save...');
        const grat = await Gratitude.findOneAndUpdate(
            { date, userId },
            { content, userId },
            { new: true, upsert: true }
        );
        console.log('Gratitude Saved:', grat);

        // 2. Test Gratitude Fetch
        console.log('Testing Gratitude Fetch...');
        const fetchedGrat = await Gratitude.findOne({ date, userId });
        console.log('Gratitude Fetched:', fetchedGrat);

        if (fetchedGrat?.content !== content) {
            console.error('FAIL: Gratitude content mismatch');
        } else {
            console.log('PASS: Gratitude persistence verified');
        }

        // 3. Test Journal Save
        console.log('Testing Journal Save...');
        const jour = await Journal.findOneAndUpdate(
            { date, userId },
            { content, userId },
            { new: true, upsert: true }
        );
        console.log('Journal Saved:', jour);

        // 4. Test Journal Fetch
        console.log('Testing Journal Fetch...');
        const fetchedJour = await Journal.findOne({ date, userId });
        console.log('Journal Fetched:', fetchedJour);

        if (fetchedJour?.content !== content) {
            console.error('FAIL: Journal content mismatch');
        } else {
            console.log('PASS: Journal persistence verified');
        }

        // Cleanup
        await Gratitude.deleteMany({ userId });
        await Journal.deleteMany({ userId });
        console.log('Cleanup complete');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testPersistence();
