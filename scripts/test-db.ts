import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
let MONGODB_URI = process.env.MONGODB_URI;

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
        const [key, value] = line.split('=');
        if (key && value && key.trim() === 'MONGODB_URI') {
            MONGODB_URI = value.trim();
            break;
        }
    }
}

if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing');
    process.exit(1);
}

console.log('Testing DB connection with URI:', MONGODB_URI.replace(/:([^:@]+)@/, ':****@')); // Mask password

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });
