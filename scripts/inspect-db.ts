import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';

async function inspect() {
    const { default: connectToDatabase } = await import('../lib/db');
    const { default: Task } = await import('../models/Task');
    const { default: Category } = await import('../models/Category');
    const { default: Profile } = await import('../models/Profile');
    const { default: Gratitude } = await import('../models/Gratitude');
    const { default: Journal } = await import('../models/Journal');

    try {
        const conn = await connectToDatabase();
        if (!conn || !conn.connection.db) {
            console.log("Failed to connect or No Database found");
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
