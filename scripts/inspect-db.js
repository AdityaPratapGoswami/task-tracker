const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function inspect() {
    // Manually parse .env.local
    let uri = process.env.MONGODB_URI;
    if (!uri) {
        try {
            const envPath = path.resolve(process.cwd(), '.env.local');
            const envFile = fs.readFileSync(envPath, 'utf8');
            const match = envFile.match(/MONGODB_URI=(.+)/);
            if (match && match[1]) {
                uri = match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if any
            }
        } catch (e) {
            console.error("Could not read .env.local:", e.message);
        }
    }

    if (!uri) {
        console.error("MONGODB_URI not found");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const dbName = mongoose.connection.db.databaseName;
        console.log("Database Name:", dbName);

        console.log("\n--- Collections ---");
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
