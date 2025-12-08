
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

import Task from '../models/Task'; // Import directly if possible, or define schema inline
import User from '../models/User';

// Inline schemas to avoid connection issues with multiple models
const TaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    category: String,
    date: String,
    type: String,
}, { strict: false });

const UserSchema = new mongoose.Schema({
    email: String,
    name: String,
}, { strict: false });

const TaskModel = mongoose.models.Task || mongoose.model('Task', TaskSchema);
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

async function inspectDb() {
    try {
        await mongoose.connect(MONGODB_URI!);
        console.log('Connected to DB');

        const users = await UserModel.find({});
        console.log('Users:', users.map(u => ({ id: u._id, email: u.email, name: u.name })));

        const tasks = await TaskModel.find({});
        console.log(`Found ${tasks.length} tasks.`);
        tasks.forEach(t => {
            console.log(JSON.stringify(t));
        });

    } catch (error) {
        console.error('Error inspecting DB:', error);
    } finally {
        process.exit();
    }
}

inspectDb();
