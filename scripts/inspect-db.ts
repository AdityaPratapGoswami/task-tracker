import connectToDatabase from '../lib/db';
import mongoose from 'mongoose';
import Task from '../models/Task';
import Category from '../models/Category';
import Profile from '../models/Profile';
import Gratitude from '../models/Gratitude';

async function inspect() {
    try {
        const conn = await connectToDatabase();
        if (!conn) {
            console.log("Failed to connect");
            return;
        }

        console.log("Connected to MongoDB");
        console.log("Database Name:", conn.connection.db.databaseName);

        console.log("\n--- Collections & Counts ---");
        const collections = await conn.connection.db.listCollections().toArray();
        for (const col of collections) {
            const count = await conn.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);
        }

        console.log("\n--- Recent Gratitude Entries ---");
        const gratitudes = await Gratitude.find().sort({ createdAt: -1 }).limit(5);
        console.log(JSON.stringify(gratitudes, null, 2));

        console.log("\n--- Recent Tasks ---");
        const tasks = await Task.find().sort({ createdAt: -1 }).limit(3);
        console.log(JSON.stringify(tasks, null, 2));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
